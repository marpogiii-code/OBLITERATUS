"""OBLITERATUS Anvil Server Module.

Thin coordination layer between the Anvil client forms and the Uplink
backend running on the user's GPU machine. All GPU-heavy functions are
registered via the Uplink and called through ``anvil.server.call()``.

This server module provides fallback responses for when the Uplink is
not connected (so the UI remains functional in a degraded state) and
handles any Anvil-specific data operations (e.g. Data Tables).
"""

import anvil.server


# ── Model choices (cached on first call) ─────────────────────────────

_MODEL_CHOICES_CACHE = None


@anvil.server.callable
def get_model_choices():
    """Return display_name -> hf_id mapping of available models.

    Delegated to the Uplink backend (which imports obliteratus.presets).
    Falls back to a curated subset if the Uplink is not connected.
    """
    global _MODEL_CHOICES_CACHE
    if _MODEL_CHOICES_CACHE is not None:
        return _MODEL_CHOICES_CACHE
    try:
        result = anvil.server.call("uplink_get_model_choices")
        _MODEL_CHOICES_CACHE = result
        return result
    except Exception:
        return {
            "Alibaba (Qwen) / Qwen3-4B": "Qwen/Qwen3-4B",
            "Alibaba (Qwen) / Qwen2.5-0.5B Instruct": "Qwen/Qwen2.5-0.5B-Instruct",
            "Meta (LLaMA) / Llama-3.1-8B-Instruct": "meta-llama/Llama-3.1-8B-Instruct",
            "Google / Gemma-2-2B-IT": "google/gemma-2-2b-it",
            "Microsoft / Phi-3-mini-4k-instruct": "microsoft/Phi-3-mini-4k-instruct",
            "Mistral / Mistral-7B-Instruct-v0.3": "mistralai/Mistral-7B-Instruct-v0.3",
        }


@anvil.server.callable
def get_dataset_sources():
    """Return list of dataset source labels."""
    try:
        return anvil.server.call("uplink_get_dataset_sources")
    except Exception:
        return ["builtin (512 pairs)"]


@anvil.server.callable
def get_dataset_info(source_label):
    """Return description for a dataset source."""
    try:
        return anvil.server.call("uplink_get_dataset_info", source_label)
    except Exception:
        return ""


@anvil.server.callable
def get_preset_defaults(method_display):
    """Return default settings for a given method preset."""
    try:
        return anvil.server.call("uplink_get_preset_defaults", method_display)
    except Exception:
        return {
            "n_directions": 4, "direction_method": "svd",
            "regularization": 0.3, "refinement_passes": 2,
            "norm_preserve": True, "project_biases": False,
            "use_chat_template": False, "use_whitened_svd": False,
            "true_iterative_refinement": False,
            "activation_steering": False,
        }


# ── Session model management ────────────────────────────────────────

@anvil.server.callable
def get_session_models():
    """Return list of obliterated model labels from the current session."""
    try:
        return anvil.server.call("uplink_get_session_models")
    except Exception:
        return []


@anvil.server.callable
def load_session_model(label):
    """Load a cached session model for chat."""
    return anvil.server.call("uplink_load_session_model", label)


# ── GPU operations (delegated to Uplink) ────────────────────────────

@anvil.server.callable
def obliterate_model(model_choice, method_key, volume, dataset_source,
                     custom_harmful="", custom_harmless="",
                     advanced_settings=None):
    """Run the abliteration pipeline on the Uplink backend."""
    return anvil.server.call(
        "uplink_obliterate",
        model_choice=model_choice,
        method_key=method_key,
        volume=volume,
        dataset_source=dataset_source,
        custom_harmful=custom_harmful,
        custom_harmless=custom_harmless,
        advanced_settings=advanced_settings or {},
    )


@anvil.server.callable
def chat_respond(message, history, system_prompt, temperature,
                 top_p, max_tokens, repetition_penalty, context_length):
    """Generate a chat response from the obliterated model."""
    return anvil.server.call(
        "uplink_chat_respond",
        message=message,
        history=history,
        system_prompt=system_prompt,
        temperature=temperature,
        top_p=top_p,
        max_tokens=max_tokens,
        repetition_penalty=repetition_penalty,
        context_length=context_length,
    )


@anvil.server.callable
def ab_chat_respond(message, session_label, history_left, history_right,
                    system_prompt, temperature, top_p, max_tokens,
                    repetition_penalty):
    """Generate A/B comparison responses (original vs abliterated)."""
    return anvil.server.call(
        "uplink_ab_chat_respond",
        message=message,
        session_label=session_label,
        history_left=history_left,
        history_right=history_right,
        system_prompt=system_prompt,
        temperature=temperature,
        top_p=top_p,
        max_tokens=max_tokens,
        repetition_penalty=repetition_penalty,
    )


@anvil.server.callable
def run_benchmark(mode, model_choice, methods, volume, dataset_source):
    """Run a benchmark (multi-method or multi-model)."""
    return anvil.server.call(
        "uplink_run_benchmark",
        mode=mode,
        model_choice=model_choice,
        methods=methods,
        volume=volume,
        dataset_source=dataset_source,
    )


@anvil.server.callable
def run_strength_sweep(model_choice, method_key, volume, dataset_source, steps):
    """Run a regularization strength sweep."""
    return anvil.server.call(
        "uplink_run_strength_sweep",
        model_choice=model_choice,
        method_key=method_key,
        volume=volume,
        dataset_source=dataset_source,
        steps=steps,
    )


@anvil.server.callable
def run_tourney(model_choice, methods, dataset_source, quantization):
    """Run a tournament between methods."""
    return anvil.server.call(
        "uplink_run_tourney",
        model_choice=model_choice,
        methods=methods,
        dataset_source=dataset_source,
        quantization=quantization,
    )


@anvil.server.callable
def export_artifacts():
    """Export obliteration artifacts as a downloadable ZIP."""
    return anvil.server.call("uplink_export_artifacts")


@anvil.server.callable
def push_to_hub(session_label, repo_id, token, refine_enabled,
                refine_reg, refine_passes):
    """Push an obliterated model to HuggingFace Hub."""
    return anvil.server.call(
        "uplink_push_to_hub",
        session_label=session_label,
        repo_id=repo_id,
        token=token,
        refine_enabled=refine_enabled,
        refine_reg=refine_reg,
        refine_passes=refine_passes,
    )


@anvil.server.callable
def get_hub_session_info(label):
    """Get session info for Hub push."""
    try:
        return anvil.server.call("uplink_get_hub_session_info", label)
    except Exception:
        return {"info": "", "repo_id": ""}


@anvil.server.callable
def get_leaderboard():
    """Load community leaderboard data."""
    try:
        return anvil.server.call("uplink_get_leaderboard")
    except Exception:
        return {"table": "Leaderboard unavailable (Uplink not connected).", "summary": ""}


@anvil.server.callable
def get_vram_info():
    """Get current GPU VRAM usage."""
    try:
        return anvil.server.call("uplink_get_vram_info")
    except Exception:
        return "GPU: Uplink not connected"
