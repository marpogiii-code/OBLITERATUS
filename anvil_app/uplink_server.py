#!/usr/bin/env python3
"""OBLITERATUS Anvil Uplink Server.

Run this script on your GPU machine to connect the OBLITERATUS backend
to your Anvil.work web app. It exposes the core pipeline functions as
``@anvil.server.callable`` endpoints that the Anvil app can invoke.

Usage:
    # 1. Install dependencies (same as OBLITERATUS)
    pip install -e ".[spaces]"
    pip install anvil-uplink

    # 2. Get your Uplink key from Anvil:
    #    Settings -> Uplink -> Enable Server Uplink -> copy the key

    # 3. Run this script with your Uplink key:
    python uplink_server.py YOUR_UPLINK_KEY

    # Or set as environment variable:
    export ANVIL_UPLINK_KEY="server_XXXXXXXXXXXX"
    python uplink_server.py
"""

from __future__ import annotations

import gc
import io
import json
import os
import sys
import tempfile
import threading
import time
import zipfile
from datetime import datetime
from pathlib import Path

import anvil.media
import anvil.server

# ── OBLITERATUS imports ──────────────────────────────────────────────
# Ensure the parent directory is on the path so we can import obliteratus
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

import torch
from obliteratus import device as dev
from obliteratus.presets import list_all_presets
from obliteratus.abliterate import AbliterationPipeline, METHODS as PIPELINE_METHODS
from obliteratus.prompts import (
    DATASET_SOURCES,
    get_source_choices,
    get_source_key_from_label,
    load_dataset_source,
)
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer

# ── Provider names (same as app.py) ──────────────────────────────────
_PROVIDER_NAMES = {
    "01-ai": "01.AI",
    "Qwen": "Alibaba (Qwen)",
    "allenai": "Allen AI",
    "apple": "Apple",
    "CohereForAI": "Cohere",
    "databricks": "Databricks",
    "deepseek-ai": "DeepSeek",
    "EleutherAI": "EleutherAI",
    "google": "Google",
    "distilbert": "HuggingFace",
    "HuggingFaceTB": "HuggingFace",
    "ibm-granite": "IBM",
    "TinyLlama": "Meta (LLaMA)",
    "meta-llama": "Meta (LLaMA)",
    "microsoft": "Microsoft",
    "MiniMaxAI": "MiniMax",
    "mistralai": "Mistral",
    "moonshotai": "Moonshot",
    "nvidia": "NVIDIA",
    "openai": "OpenAI",
    "openai-community": "OpenAI",
    "openbmb": "OpenBMB",
    "internlm": "Shanghai AI Lab",
    "stabilityai": "Stability AI",
    "stepfun-ai": "StepFun",
    "tiiuae": "TII (Falcon)",
    "THUDM": "Zhipu AI (GLM)",
    "zai-org": "Zhipu AI (GLM)",
    "huihui-ai": "Community",
    "cognitivecomputations": "Community",
    "NousResearch": "Community",
    "mlabonne": "Community",
    "Orenguteng": "Community",
    "WhiteRabbitNeo": "Community",
}

# ── Method display mapping ───────────────────────────────────────────
METHODS_DISPLAY = {
    "adaptive (telemetry-recommended)": "adaptive",
    "advanced (recommended)": "advanced",
    "basic (fast, single direction)": "basic",
    "aggressive (maximum removal)": "aggressive",
    "spectral cascade (frequency-selective)": "spectral_cascade",
    "informed (analysis-guided auto-config)": "informed",
    "surgical (precision MoE-aware)": "surgical",
    "optimized (bayesian auto-tuned)": "optimized",
    "inverted (semantic refusal inversion)": "inverted",
    "nuclear (maximum force combo)": "nuclear",
    "failspy (FailSpy/abliterator baseline)": "failspy",
    "gabliteration (Gulmez 2026 baseline)": "gabliteration",
    "heretic (p-e-w 2025-2026 baseline)": "heretic",
    "rdo (Wollschlager ICML 2025 baseline)": "rdo",
}

PROMPT_VOLUMES = {
    "33 (fast)": 33,
    "66 (better signal)": 66,
    "99 (classic)": 99,
    "256 (balanced)": 256,
    "512 (built-in max)": 512,
    "all (use entire dataset)": -1,
}

# ── Global state ─────────────────────────────────────────────────────
_state = {
    "model": None,
    "tokenizer": None,
    "model_name": None,
    "method": None,
    "status": "idle",
    "log": [],
    "steering": None,
    "output_dir": None,
}
_lock = threading.Lock()
_session_models: dict[str, dict] = {}
_last_obliterated_label = ""
_obliterate_counter = 0


def _load_model_to_device(pretrained_path, **kwargs):
    """Load a causal LM onto the best available device."""
    load_kwargs = {}
    for k in ("torch_dtype", "trust_remote_code", "quantization_config",
              "offload_folder", "low_cpu_mem_usage", "token"):
        if k in kwargs and kwargs[k] is not None:
            load_kwargs[k] = kwargs[k]

    if dev.supports_device_map_auto():
        load_kwargs["device_map"] = "auto"

    model = AutoModelForCausalLM.from_pretrained(pretrained_path, **load_kwargs)

    if not dev.supports_device_map_auto():
        model = model.to(dev.get_device())

    return model


def _clear_gpu():
    """Release GPU memory."""
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


# ── Callable: Model Choices ──────────────────────────────────────────

@anvil.server.callable("uplink_get_model_choices")
def get_model_choices():
    presets = list_all_presets()
    groups: dict[str, list] = {}
    for p in presets:
        org = p.hf_id.split("/")[0] if "/" in p.hf_id else ""
        provider = _PROVIDER_NAMES.get(org, org)
        groups.setdefault(provider, []).append((p.name, p.hf_id, p.gated))

    models = {}
    for provider in sorted(groups.keys()):
        for name, hf_id, gated in groups[provider]:
            tag = " \U0001f512" if gated else ""
            display = f"{provider} / {name}{tag}"
            models[display] = hf_id
    return models


@anvil.server.callable("uplink_get_dataset_sources")
def get_dataset_sources_uplink():
    return get_source_choices()


@anvil.server.callable("uplink_get_dataset_info")
def get_dataset_info(source_label):
    key = get_source_key_from_label(source_label)
    src = DATASET_SOURCES.get(key)
    return src.description if src else ""


@anvil.server.callable("uplink_get_preset_defaults")
def get_preset_defaults(method_display):
    method_key = METHODS_DISPLAY.get(method_display, "advanced")
    cfg = PIPELINE_METHODS.get(method_key, PIPELINE_METHODS.get("advanced", {}))
    return {
        "n_directions": cfg.get("n_directions", 4),
        "direction_method": cfg.get("direction_method", "svd"),
        "regularization": cfg.get("regularization", 0.3),
        "refinement_passes": cfg.get("refinement_passes", 2),
        "norm_preserve": cfg.get("norm_preserve", True),
        "project_biases": cfg.get("project_biases", False),
        "use_chat_template": cfg.get("use_chat_template", False),
        "use_whitened_svd": cfg.get("use_whitened_svd", False),
        "true_iterative_refinement": cfg.get("true_iterative_refinement", False),
        "activation_steering": cfg.get("activation_steering", False),
    }


# ── Callable: Session Models ────────────────────────────────────────

@anvil.server.callable("uplink_get_session_models")
def get_session_models():
    return list(_session_models.keys())


@anvil.server.callable("uplink_load_session_model")
def load_session_model(label):
    global _state
    if label not in _session_models:
        raise ValueError(f"Unknown session model: {label}")

    meta = _session_models[label]
    output_dir = meta.get("output_dir")
    if not output_dir or not Path(output_dir).exists():
        raise ValueError(f"Checkpoint not found for {label}")

    with _lock:
        _clear_gpu()
        _state["model"] = _load_model_to_device(
            output_dir,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,
        )
        _state["tokenizer"] = AutoTokenizer.from_pretrained(output_dir)
        _state["model_name"] = label
        _state["output_dir"] = output_dir
        _state["status"] = "ready"

    return {"status": f"Loaded {label}"}


# ── Callable: Obliterate ─────────────────────────────────────────────

@anvil.server.callable("uplink_obliterate")
def obliterate(model_choice, method_key, volume, dataset_source,
               custom_harmful="", custom_harmless="", advanced_settings=None):
    global _state, _last_obliterated_label, _obliterate_counter

    advanced_settings = advanced_settings or {}

    # Resolve model ID
    models = get_model_choices()
    model_id = models.get(model_choice, model_choice)

    # Resolve dataset
    dataset_key = get_source_key_from_label(dataset_source) if dataset_source else "builtin"

    log_lines = []

    def on_log(msg):
        log_lines.append(msg)

    with _lock:
        _state["status"] = "obliterating"
        _state["log"] = []

    _clear_gpu()

    _obliterate_counter += 1
    output_dir = f"/tmp/obliterated_{_obliterate_counter}"

    try:
        # Load dataset
        harmful_prompts, harmless_prompts = [], []
        if custom_harmful:
            harmful_prompts = [l.strip() for l in custom_harmful.split("\n") if l.strip()]
            harmless_prompts = [l.strip() for l in custom_harmless.split("\n") if l.strip()] if custom_harmless else []
        else:
            ds = load_dataset_source(dataset_key)
            harmful_prompts = ds.get("harmful", [])
            harmless_prompts = ds.get("harmless", [])

        if volume > 0:
            harmful_prompts = harmful_prompts[:volume]
            harmless_prompts = harmless_prompts[:volume]

        on_log(f"Model: {model_id}")
        on_log(f"Method: {method_key}")
        on_log(f"Prompts: {len(harmful_prompts)} harmful, {len(harmless_prompts)} harmless")

        # Build pipeline config
        pipeline_config = {
            "model_id": model_id,
            "method": method_key,
            "harmful_prompts": harmful_prompts,
            "harmless_prompts": harmless_prompts,
            "output_dir": output_dir,
            **advanced_settings,
        }

        start_time = time.time()
        pipeline = AbliterationPipeline(**pipeline_config)
        pipeline.run(on_log=on_log)
        elapsed = time.time() - start_time

        on_log(f"Completed in {elapsed:.1f}s")

        # Save model
        pipeline.save(output_dir)
        on_log(f"Saved to {output_dir}")

        label = f"{model_choice} [{method_key}]"
        _session_models[label] = {
            "model_id": model_id,
            "model_choice": model_choice,
            "method": method_key,
            "dataset_key": dataset_key,
            "output_dir": output_dir,
        }
        _last_obliterated_label = label

        with _lock:
            _state["status"] = "ready"
            _state["model_name"] = model_choice
            _state["method"] = method_key
            _state["output_dir"] = output_dir
            _state["model"] = pipeline.model
            _state["tokenizer"] = pipeline.tokenizer

        metrics = ""
        if hasattr(pipeline, "results") and pipeline.results:
            r = pipeline.results
            metrics = (
                f"Refusal rate: {r.get('refusal_rate', 'N/A')}\n"
                f"Perplexity: {r.get('perplexity', 'N/A')}\n"
                f"Coherence: {r.get('coherence', 'N/A')}"
            )

        return {
            "status": f"Obliteration complete ({elapsed:.1f}s)",
            "log": "\n".join(log_lines),
            "metrics": metrics,
            "label": label,
        }

    except Exception as e:
        with _lock:
            _state["status"] = "idle"
        raise


# ── Callable: Chat ───────────────────────────────────────────────────

@anvil.server.callable("uplink_chat_respond")
def chat_respond(message, history, system_prompt, temperature,
                 top_p, max_tokens, repetition_penalty, context_length):
    model = _state.get("model")
    tokenizer = _state.get("tokenizer")

    if model is None or tokenizer is None:
        output_dir = _state.get("output_dir")
        if output_dir and Path(output_dir).exists():
            model = _load_model_to_device(output_dir, torch_dtype=torch.float16)
            tokenizer = AutoTokenizer.from_pretrained(output_dir)
            with _lock:
                _state["model"] = model
                _state["tokenizer"] = tokenizer
        else:
            raise ValueError("No model loaded. Obliterate a model first.")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    for h in history:
        messages.append(h)

    if hasattr(tokenizer, "apply_chat_template"):
        input_text = tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
    else:
        input_text = "\n".join(
            f"{m['role']}: {m['content']}" for m in messages
        ) + "\nassistant:"

    inputs = tokenizer(input_text, return_tensors="pt", truncation=True,
                       max_length=context_length)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            temperature=max(temperature, 0.01),
            top_p=top_p,
            repetition_penalty=repetition_penalty,
            do_sample=temperature > 0,
        )

    generated = outputs[0][inputs["input_ids"].shape[1]:]
    response = tokenizer.decode(generated, skip_special_tokens=True)
    return response


# ── Callable: A/B Compare ───────────────────────────────────────────

@anvil.server.callable("uplink_ab_chat_respond")
def ab_chat_respond(message, session_label, history_left, history_right,
                    system_prompt, temperature, top_p, max_tokens,
                    repetition_penalty):
    if session_label not in _session_models:
        raise ValueError(f"Unknown model: {session_label}")

    meta = _session_models[session_label]
    model_id = meta.get("model_id", "")
    output_dir = meta.get("output_dir", "")

    # Generate abliterated response
    abliterated_resp = chat_respond(
        message=message,
        history=history_right,
        system_prompt=system_prompt,
        temperature=temperature,
        top_p=top_p,
        max_tokens=max_tokens,
        repetition_penalty=repetition_penalty,
        context_length=2048,
    )

    # Generate original response (load original model temporarily)
    original_resp = ""
    try:
        orig_model = _load_model_to_device(model_id, torch_dtype=torch.float16)
        orig_tokenizer = AutoTokenizer.from_pretrained(model_id)

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        for h in history_left:
            messages.append(h)

        if hasattr(orig_tokenizer, "apply_chat_template"):
            input_text = orig_tokenizer.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
        else:
            input_text = "\n".join(
                f"{m['role']}: {m['content']}" for m in messages
            ) + "\nassistant:"

        inputs = orig_tokenizer(input_text, return_tensors="pt", truncation=True,
                                max_length=2048)
        inputs = {k: v.to(orig_model.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = orig_model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=max(temperature, 0.01),
                top_p=top_p,
                repetition_penalty=repetition_penalty,
                do_sample=temperature > 0,
            )
        generated = outputs[0][inputs["input_ids"].shape[1]:]
        original_resp = orig_tokenizer.decode(generated, skip_special_tokens=True)

        del orig_model, orig_tokenizer
        _clear_gpu()
    except Exception as e:
        original_resp = f"Error loading original model: {e}"

    return {"original": original_resp, "abliterated": abliterated_resp}


# ── Callable: Benchmark ─────────────────────────────────────────────

@anvil.server.callable("uplink_run_benchmark")
def run_benchmark(mode, model_choice, methods, volume, dataset_source):
    models_map = get_model_choices()
    model_id = models_map.get(model_choice, model_choice)
    dataset_key = get_source_key_from_label(dataset_source) if dataset_source else "builtin"

    log_lines = []
    results = []

    ds = load_dataset_source(dataset_key)
    harmful = ds.get("harmful", [])[:volume] if volume > 0 else ds.get("harmful", [])
    harmless = ds.get("harmless", [])[:volume] if volume > 0 else ds.get("harmless", [])

    for method_key in methods:
        log_lines.append(f"\n--- Benchmarking: {method_key} ---")
        _clear_gpu()

        try:
            output_dir = tempfile.mkdtemp(prefix=f"bench_{method_key}_")
            start = time.time()

            pipeline = AbliterationPipeline(
                model_id=model_id,
                method=method_key,
                harmful_prompts=harmful,
                harmless_prompts=harmless,
                output_dir=output_dir,
            )
            pipeline.run(on_log=lambda msg: log_lines.append(msg))
            elapsed = time.time() - start

            r = pipeline.results if hasattr(pipeline, "results") else {}
            results.append({
                "method": method_key,
                "refusal_rate": r.get("refusal_rate", "N/A"),
                "perplexity": r.get("perplexity", "N/A"),
                "coherence": r.get("coherence", "N/A"),
                "elapsed": f"{elapsed:.1f}s",
            })

            # Register in session models
            label = f"{model_choice} [{method_key}] (bench)"
            _session_models[label] = {
                "model_id": model_id,
                "method": method_key,
                "output_dir": output_dir,
            }

            log_lines.append(f"  Completed in {elapsed:.1f}s")
            del pipeline
        except Exception as e:
            log_lines.append(f"  Error: {e}")
            results.append({"method": method_key, "error": str(e)})

    # Format results table
    table_lines = ["Method | Refusal | PPL | Coherence | Time",
                   "-------|---------|-----|-----------|-----"]
    for r in results:
        if "error" in r:
            table_lines.append(f"{r['method']} | ERROR: {r['error']}")
        else:
            table_lines.append(
                f"{r['method']} | {r['refusal_rate']} | {r['perplexity']} | "
                f"{r['coherence']} | {r['elapsed']}"
            )

    return {
        "status": f"Benchmark complete ({len(results)} methods)",
        "results": "\n".join(table_lines),
        "log": "\n".join(log_lines),
    }


# ── Callable: Strength Sweep ────────────────────────────────────────

@anvil.server.callable("uplink_run_strength_sweep")
def run_strength_sweep(model_choice, method_key, volume, dataset_source, steps):
    models_map = get_model_choices()
    model_id = models_map.get(model_choice, model_choice)
    dataset_key = get_source_key_from_label(dataset_source) if dataset_source else "builtin"

    log_lines = []
    results = []

    ds = load_dataset_source(dataset_key)
    harmful = ds.get("harmful", [])[:volume] if volume > 0 else ds.get("harmful", [])
    harmless = ds.get("harmless", [])[:volume] if volume > 0 else ds.get("harmless", [])

    reg_values = [i / (steps - 1) for i in range(steps)]

    for reg in reg_values:
        log_lines.append(f"\n--- Regularization: {reg:.2f} ---")
        _clear_gpu()

        try:
            output_dir = tempfile.mkdtemp(prefix=f"sweep_{reg:.2f}_")
            pipeline = AbliterationPipeline(
                model_id=model_id,
                method=method_key,
                harmful_prompts=harmful,
                harmless_prompts=harmless,
                output_dir=output_dir,
                regularization=reg,
            )
            pipeline.run(on_log=lambda msg: log_lines.append(msg))

            r = pipeline.results if hasattr(pipeline, "results") else {}
            results.append({
                "regularization": f"{reg:.2f}",
                "refusal_rate": r.get("refusal_rate", "N/A"),
                "perplexity": r.get("perplexity", "N/A"),
            })
            del pipeline
        except Exception as e:
            log_lines.append(f"  Error: {e}")
            results.append({"regularization": f"{reg:.2f}", "error": str(e)})

    table_lines = ["Reg | Refusal | PPL", "----|---------|----"]
    for r in results:
        if "error" in r:
            table_lines.append(f"{r['regularization']} | ERROR")
        else:
            table_lines.append(f"{r['regularization']} | {r['refusal_rate']} | {r['perplexity']}")

    return {
        "status": f"Sweep complete ({len(results)} points)",
        "results": "\n".join(table_lines),
        "log": "\n".join(log_lines),
    }


# ── Callable: Tourney ────────────────────────────────────────────────

@anvil.server.callable("uplink_run_tourney")
def run_tourney(model_choice, methods, dataset_source, quantization):
    from obliteratus.tourney import TourneyRunner

    models_map = get_model_choices()
    model_id = models_map.get(model_choice, model_choice)
    dataset_key = get_source_key_from_label(dataset_source) if dataset_source else "builtin"

    log_lines = []

    def on_log(msg):
        log_lines.append(msg)

    runner = TourneyRunner(
        model_id=model_id,
        methods=methods,
        dataset_key=dataset_key,
        quantization=quantization if quantization != "none" else None,
        on_log=on_log,
    )
    result = runner.run()

    bracket_text = ""
    if hasattr(result, "bracket"):
        bracket_text = str(result.bracket)
    elif isinstance(result, dict):
        bracket_text = json.dumps(result, indent=2, default=str)

    return {
        "status": "Tournament complete",
        "bracket": bracket_text,
        "log": "\n".join(log_lines),
    }


# ── Callable: Export ─────────────────────────────────────────────────

@anvil.server.callable("uplink_export_artifacts")
def export_artifacts():
    output_dir = _state.get("output_dir")
    if not output_dir or not Path(output_dir).exists():
        return None

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        base = Path(output_dir)
        for fpath in base.rglob("*"):
            if fpath.is_file():
                arcname = fpath.relative_to(base)
                zf.write(fpath, arcname)

    buf.seek(0)
    return anvil.media.from_file(buf, content_type="application/zip",
                                  name="obliteratus_artifacts.zip")


# ── Callable: Push to Hub ────────────────────────────────────────────

@anvil.server.callable("uplink_push_to_hub")
def push_to_hub(session_label, repo_id, token, refine_enabled,
                refine_reg, refine_passes):
    if session_label not in _session_models:
        raise ValueError(f"Unknown model: {session_label}")

    meta = _session_models[session_label]
    output_dir = meta.get("output_dir")
    if not output_dir or not Path(output_dir).exists():
        raise ValueError("Checkpoint not found")

    model = AutoModelForCausalLM.from_pretrained(output_dir, torch_dtype=torch.float16)
    tokenizer = AutoTokenizer.from_pretrained(output_dir)

    push_token = token or os.environ.get("HF_TOKEN") or os.environ.get("HF_PUSH_TOKEN")
    if not push_token:
        raise ValueError("No HuggingFace token provided (pass one or set HF_TOKEN env var)")

    model.push_to_hub(repo_id, token=push_token)
    tokenizer.push_to_hub(repo_id, token=push_token)

    link = f"https://huggingface.co/{repo_id}"

    del model, tokenizer
    _clear_gpu()

    return {
        "status": f"Pushed to {repo_id}",
        "link": link,
    }


# ── Callable: Hub Session Info ───────────────────────────────────────

@anvil.server.callable("uplink_get_hub_session_info")
def get_hub_session_info(label):
    if label not in _session_models:
        return {"info": "Unknown model", "repo_id": ""}

    meta = _session_models[label]
    model_id = meta.get("model_id", "unknown")
    method = meta.get("method", "unknown")
    info = f"Model: {model_id}\nMethod: {method}"

    # Auto-generate repo ID
    short_name = model_id.split("/")[-1] if "/" in model_id else model_id
    repo_id = f"{short_name}-OBLITERATED"

    return {"info": info, "repo_id": repo_id}


# ── Callable: Leaderboard ───────────────────────────────────────────

@anvil.server.callable("uplink_get_leaderboard")
def get_leaderboard():
    try:
        from obliteratus.telemetry import get_leaderboard_data, is_telemetry_enabled
        if not is_telemetry_enabled():
            return {"table": "Telemetry is disabled.", "summary": ""}

        data = get_leaderboard_data()
        if not data:
            return {"table": "No benchmark results yet.", "summary": ""}

        lines = ["Rank | Model | Method | Runs | Best Refusal | Avg PPL",
                 "-----|-------|--------|------|-------------|--------"]
        for i, row in enumerate(data[:50]):
            refusal = f"{row['best_refusal']:.0%}" if row.get("best_refusal") is not None else "-"
            ppl = f"{row['best_perplexity']:.2f}" if row.get("best_perplexity") is not None else "-"
            lines.append(f"{i+1} | {row['model']} | {row['method']} | {row['runs']} | {refusal} | {ppl}")

        total_runs = sum(r["runs"] for r in data)
        unique_models = len(set(r.get("model_id", "") for r in data))
        summary = f"{total_runs} total runs across {unique_models} unique models"

        return {"table": "\n".join(lines), "summary": summary}
    except Exception as e:
        return {"table": f"Error loading leaderboard: {e}", "summary": ""}


# ── Callable: VRAM Info ──────────────────────────────────────────────

@anvil.server.callable("uplink_get_vram_info")
def get_vram_info():
    if torch.cuda.is_available():
        for i in range(torch.cuda.device_count()):
            props = torch.cuda.get_device_properties(i)
            total = props.total_mem / (1024 ** 3)
            used = torch.cuda.memory_allocated(i) / (1024 ** 3)
            free = total - used
            name = props.name
            return f"GPU {i}: {name} | {used:.1f}/{total:.1f} GB used | {free:.1f} GB free"
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "GPU: Apple MPS (VRAM shared with system)"
    return "GPU: CPU only (no GPU detected)"


# ── Main ─────────────────────────────────────────────────────────────

def main():
    uplink_key = None

    if len(sys.argv) > 1:
        uplink_key = sys.argv[1]
    else:
        uplink_key = os.environ.get("ANVIL_UPLINK_KEY")

    if not uplink_key:
        print("Usage: python uplink_server.py <UPLINK_KEY>")
        print("   Or: export ANVIL_UPLINK_KEY=server_XXXX && python uplink_server.py")
        print()
        print("Get your Uplink key from Anvil:")
        print("  1. Open your app in Anvil")
        print("  2. Settings -> Uplink -> Enable Server Uplink")
        print("  3. Copy the key and pass it here")
        sys.exit(1)

    print("=" * 60)
    print("  OBLITERATUS - Anvil Uplink Server")
    print("=" * 60)
    print()
    print(f"  Device: {dev.get_device()}")
    print(f"  VRAM:   {get_vram_info()}")
    print()
    print("  Connecting to Anvil...")

    anvil.server.connect(uplink_key)
    print("  Connected! Waiting for requests...")
    print()
    print("  Press Ctrl+C to stop.")
    print()

    anvil.server.wait_forever()


if __name__ == "__main__":
    main()
