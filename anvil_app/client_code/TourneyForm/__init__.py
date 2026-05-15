from ._anvil_designer import TourneyFormTemplate
from anvil import *
import anvil.server


class TourneyForm(TourneyFormTemplate):
    """Tournament mode: methods compete in elimination rounds."""

    def __init__(self, **properties):
        self.init_components(**properties)
        self._populate_dropdowns()

    def _populate_dropdowns(self):
        try:
            models = anvil.server.call("get_model_choices")
            self.tourney_model_dd.items = [(k, k) for k in models]
        except Exception:
            self.tourney_model_dd.items = [
                ("Alibaba (Qwen) / Qwen3-4B", "Alibaba (Qwen) / Qwen3-4B"),
            ]

        try:
            sources = anvil.server.call("get_dataset_sources")
            self.tourney_dataset_dd.items = [(s, s) for s in sources]
        except Exception:
            self.tourney_dataset_dd.items = [("builtin (512 pairs)", "builtin (512 pairs)")]

    def _get_selected_methods(self):
        methods = []
        for attr_name in dir(self):
            if attr_name.startswith("tcb_"):
                cb = getattr(self, attr_name)
                if cb.checked:
                    methods.append(cb.text)
        return methods

    def tourney_btn_click(self, **event_args):
        model = self.tourney_model_dd.selected_value
        methods = self._get_selected_methods()
        dataset = self.tourney_dataset_dd.selected_value
        quant = self.tourney_quant_dd.selected_value

        if not model:
            self.tourney_status.text = "Select a model."
            return
        if len(methods) < 3:
            self.tourney_status.text = "Select at least 3 methods."
            return

        self.tourney_status.text = "Tournament in progress..."
        self.tourney_btn.enabled = False

        try:
            result = anvil.server.call(
                "run_tourney",
                model_choice=model,
                methods=methods,
                dataset_source=dataset,
                quantization=quant,
            )
            self.tourney_status.text = result.get("status", "Complete")
            self.tourney_bracket.text = result.get("bracket", "")
            self.tourney_log.text = result.get("log", "")
        except Exception as e:
            self.tourney_status.text = f"Error: {e}"
        finally:
            self.tourney_btn.enabled = True
