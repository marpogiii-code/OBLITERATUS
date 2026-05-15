from ._anvil_designer import StrengthSweepFormTemplate
from anvil import *
import anvil.server


METHODS = {
    "adaptive (telemetry-recommended)": "adaptive",
    "advanced (recommended)": "advanced",
    "basic (fast, single direction)": "basic",
    "aggressive (maximum removal)": "aggressive",
    "spectral cascade (frequency-selective)": "spectral_cascade",
    "informed (analysis-guided auto-config)": "informed",
}

PROMPT_VOLUMES = {
    "33 (fast)": 33,
    "66 (better signal)": 66,
    "99 (classic)": 99,
    "256 (balanced)": 256,
}


class StrengthSweepForm(StrengthSweepFormTemplate):
    """Strength sweep: dose-response curve for abliteration."""

    def __init__(self, **properties):
        self.init_components(**properties)
        self._populate_dropdowns()

    def _populate_dropdowns(self):
        try:
            models = anvil.server.call("get_model_choices")
            self.sweep_model_dd.items = [(k, k) for k in models]
        except Exception:
            self.sweep_model_dd.items = [
                ("Alibaba (Qwen) / Qwen2.5-0.5B Instruct", "Alibaba (Qwen) / Qwen2.5-0.5B Instruct"),
            ]

        self.sweep_method_dd.items = [(k, k) for k in METHODS]
        self.sweep_method_dd.selected_value = "advanced (recommended)"

        self.sweep_volume_dd.items = [(k, k) for k in PROMPT_VOLUMES]
        self.sweep_volume_dd.selected_value = "33 (fast)"

        try:
            sources = anvil.server.call("get_dataset_sources")
            self.sweep_dataset_dd.items = [(s, s) for s in sources]
        except Exception:
            self.sweep_dataset_dd.items = [("builtin (512 pairs)", "builtin (512 pairs)")]

    def sweep_btn_click(self, **event_args):
        model = self.sweep_model_dd.selected_value
        method = self.sweep_method_dd.selected_value
        if not model or not method:
            self.sweep_status.text = "Select a model and method."
            return

        method_key = METHODS.get(method, "advanced")
        volume_key = self.sweep_volume_dd.selected_value or "33 (fast)"
        volume = PROMPT_VOLUMES.get(volume_key, 33)
        dataset = self.sweep_dataset_dd.selected_value
        steps = int(self.sweep_steps.text or 6)

        self.sweep_status.text = "Running sweep..."
        self.sweep_btn.enabled = False

        try:
            result = anvil.server.call(
                "run_strength_sweep",
                model_choice=model,
                method_key=method_key,
                volume=volume,
                dataset_source=dataset,
                steps=steps,
            )
            self.sweep_status.text = result.get("status", "Complete")
            self.sweep_results.text = result.get("results", "")
            self.sweep_log.text = result.get("log", "")
            plot_media = result.get("plot")
            if plot_media:
                self.sweep_plot.source = plot_media
                self.sweep_plot.visible = True
        except Exception as e:
            self.sweep_status.text = f"Error: {e}"
        finally:
            self.sweep_btn.enabled = True
