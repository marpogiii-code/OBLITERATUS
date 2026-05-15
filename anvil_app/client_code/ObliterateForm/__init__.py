from ._anvil_designer import ObliterateFormTemplate
from anvil import *
import anvil.server


# Liberation methods available in the pipeline
METHODS = {
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


class ObliterateForm(ObliterateFormTemplate):
    """Obliterate tab: select a model, method, and settings, then run abliteration."""

    def __init__(self, **properties):
        self.init_components(**properties)
        self._populate_dropdowns()
        self._apply_method_defaults("advanced (recommended)")

    def _populate_dropdowns(self):
        try:
            models = anvil.server.call("get_model_choices")
            self.model_dd.items = [(k, k) for k in models]
            if models:
                self.model_dd.selected_value = list(models.keys())[0]
        except Exception:
            self.model_dd.items = [
                ("Alibaba (Qwen) / Qwen3-4B", "Alibaba (Qwen) / Qwen3-4B"),
            ]

        self.method_dd.items = [(k, k) for k in METHODS]
        self.method_dd.selected_value = "advanced (recommended)"

        self.volume_dd.items = [(k, k) for k in PROMPT_VOLUMES]
        self.volume_dd.selected_value = "33 (fast)"

        try:
            sources = anvil.server.call("get_dataset_sources")
            self.dataset_dd.items = [(s, s) for s in sources]
            if sources:
                self.dataset_dd.selected_value = sources[0]
        except Exception:
            self.dataset_dd.items = [("builtin (512 pairs)", "builtin (512 pairs)")]

    def _apply_method_defaults(self, method_display):
        try:
            defaults = anvil.server.call("get_preset_defaults", method_display)
        except Exception:
            defaults = {
                "n_directions": 4, "direction_method": "svd",
                "regularization": 0.3, "refinement_passes": 2,
                "norm_preserve": True, "project_biases": False,
                "use_chat_template": False, "use_whitened_svd": False,
                "true_iterative_refinement": False,
                "activation_steering": False,
            }

        self.adv_n_directions.text = str(defaults.get("n_directions", 4))
        self.adv_direction_method.selected_value = defaults.get("direction_method", "svd")
        self.adv_regularization.text = str(defaults.get("regularization", 0.3))
        self.adv_refinement_passes.text = str(defaults.get("refinement_passes", 2))
        self.adv_norm_preserve.checked = defaults.get("norm_preserve", True)
        self.adv_project_biases.checked = defaults.get("project_biases", False)
        self.adv_use_chat_template.checked = defaults.get("use_chat_template", False)
        self.adv_use_whitened_svd.checked = defaults.get("use_whitened_svd", False)
        self.adv_true_iterative.checked = defaults.get("true_iterative_refinement", False)
        self.adv_activation_steering.checked = defaults.get("activation_steering", False)

    def model_dd_change(self, **event_args):
        pass

    def method_dd_change(self, **event_args):
        self._apply_method_defaults(self.method_dd.selected_value)

    def dataset_dd_change(self, **event_args):
        try:
            info = anvil.server.call("get_dataset_info", self.dataset_dd.selected_value)
            self.dataset_info.text = info
        except Exception:
            self.dataset_info.text = ""

    def obliterate_btn_click(self, **event_args):
        model_choice = self.model_dd.selected_value
        method_choice = self.method_dd.selected_value
        if not model_choice or not method_choice:
            self.status_label.text = "Please select a model and method."
            return

        method_key = METHODS.get(method_choice, "advanced")
        volume_key = self.volume_dd.selected_value or "33 (fast)"
        volume = PROMPT_VOLUMES.get(volume_key, 33)
        dataset = self.dataset_dd.selected_value or "builtin (512 pairs)"

        custom_harmful = self.custom_harmful_tb.text.strip()
        custom_harmless = self.custom_harmless_tb.text.strip()

        advanced_settings = {
            "n_directions": int(self.adv_n_directions.text or 4),
            "direction_method": self.adv_direction_method.selected_value,
            "regularization": float(self.adv_regularization.text or 0.3),
            "refinement_passes": int(self.adv_refinement_passes.text or 2),
            "norm_preserve": self.adv_norm_preserve.checked,
            "project_biases": self.adv_project_biases.checked,
            "use_chat_template": self.adv_use_chat_template.checked,
            "use_whitened_svd": self.adv_use_whitened_svd.checked,
            "true_iterative_refinement": self.adv_true_iterative.checked,
            "activation_steering": self.adv_activation_steering.checked,
        }

        self.status_label.text = "Obliterating... this may take several minutes."
        self.obliterate_btn.enabled = False
        self.log_box.text = ""

        try:
            result = anvil.server.call(
                "obliterate_model",
                model_choice=model_choice,
                method_key=method_key,
                volume=volume,
                dataset_source=dataset,
                custom_harmful=custom_harmful,
                custom_harmless=custom_harmless,
                advanced_settings=advanced_settings,
            )
            self.status_label.text = result.get("status", "Complete")
            self.log_box.text = result.get("log", "")
            self.results_label.text = result.get("metrics", "")
        except Exception as e:
            self.status_label.text = f"Error: {e}"
        finally:
            self.obliterate_btn.enabled = True
