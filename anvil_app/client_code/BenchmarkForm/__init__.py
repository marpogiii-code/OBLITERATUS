from ._anvil_designer import BenchmarkFormTemplate
from anvil import *
import anvil.server


PROMPT_VOLUMES = {
    "33 (fast)": 33,
    "66 (better signal)": 66,
    "99 (classic)": 99,
    "256 (balanced)": 256,
    "512 (built-in max)": 512,
    "all (use entire dataset)": -1,
}


class BenchmarkForm(BenchmarkFormTemplate):
    """Benchmark tab: run multi-method or multi-model abliteration benchmarks."""

    def __init__(self, **properties):
        self.init_components(**properties)
        self._mode = "multi_method"
        self._populate_dropdowns()

    def _populate_dropdowns(self):
        try:
            models = anvil.server.call("get_model_choices")
            self.bench_model_dd.items = [(k, k) for k in models]
        except Exception:
            self.bench_model_dd.items = [
                ("Alibaba (Qwen) / Qwen3-4B", "Alibaba (Qwen) / Qwen3-4B"),
            ]

        self.bench_volume_dd.items = [(k, k) for k in PROMPT_VOLUMES]
        self.bench_volume_dd.selected_value = "33 (fast)"

        try:
            sources = anvil.server.call("get_dataset_sources")
            self.bench_dataset_dd.items = [(s, s) for s in sources]
        except Exception:
            self.bench_dataset_dd.items = [("builtin (512 pairs)", "builtin (512 pairs)")]

    def btn_multi_method_click(self, **event_args):
        self._mode = "multi_method"
        self.bench_status.text = "Mode: Multi-Method benchmark"

    def btn_multi_model_click(self, **event_args):
        self._mode = "multi_model"
        self.bench_status.text = "Mode: Multi-Model benchmark"

    def _get_selected_methods(self):
        methods = []
        if self.cb_advanced.checked:
            methods.append("advanced")
        if self.cb_basic.checked:
            methods.append("basic")
        if self.cb_aggressive.checked:
            methods.append("aggressive")
        if self.cb_spectral.checked:
            methods.append("spectral_cascade")
        if self.cb_informed.checked:
            methods.append("informed")
        if self.cb_surgical.checked:
            methods.append("surgical")
        return methods

    def run_bench_btn_click(self, **event_args):
        model = self.bench_model_dd.selected_value
        methods = self._get_selected_methods()
        volume_key = self.bench_volume_dd.selected_value or "33 (fast)"
        volume = PROMPT_VOLUMES.get(volume_key, 33)
        dataset = self.bench_dataset_dd.selected_value

        if not model:
            self.bench_status.text = "Please select a model."
            return
        if not methods:
            self.bench_status.text = "Please select at least one method."
            return

        self.bench_status.text = "Running benchmark..."
        self.run_bench_btn.enabled = False
        self.bench_log.text = ""

        try:
            result = anvil.server.call(
                "run_benchmark",
                mode=self._mode,
                model_choice=model,
                methods=methods,
                volume=volume,
                dataset_source=dataset,
            )
            self.bench_status.text = result.get("status", "Complete")
            self.bench_results.text = result.get("results", "")
            self.bench_log.text = result.get("log", "")
        except Exception as e:
            self.bench_status.text = f"Error: {e}"
        finally:
            self.run_bench_btn.enabled = True
