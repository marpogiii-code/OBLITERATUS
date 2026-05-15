from ._anvil_designer import PushToHubFormTemplate
from anvil import *
import anvil.server


class PushToHubForm(PushToHubFormTemplate):
    """Push obliterated models to HuggingFace Hub."""

    def __init__(self, **properties):
        self.init_components(**properties)
        self._refresh_session_models()

    def _refresh_session_models(self):
        try:
            models = anvil.server.call("get_session_models")
            self.push_session_dd.items = [(m, m) for m in models]
        except Exception:
            pass

    def push_refresh_btn_click(self, **event_args):
        self._refresh_session_models()

    def push_session_dd_change(self, **event_args):
        label = self.push_session_dd.selected_value
        if not label:
            return
        try:
            info = anvil.server.call("get_hub_session_info", label)
            self.push_model_info.text = info.get("info", "")
            self.push_repo_id.text = info.get("repo_id", "")
        except Exception:
            pass

    def push_btn_click(self, **event_args):
        label = self.push_session_dd.selected_value
        repo_id = self.push_repo_id.text
        token = self.push_token.text
        refine_enabled = self.push_refine_enabled.checked
        refine_reg = float(self.push_refine_reg.text or 0.1)
        refine_passes = int(self.push_refine_passes.text or 0)

        if not label:
            self.push_status.text = "Select a model first."
            return
        if not repo_id:
            self.push_status.text = "Enter a Hub repo ID."
            return

        self.push_status.text = "Pushing to Hub..."
        self.push_btn.enabled = False

        try:
            result = anvil.server.call(
                "push_to_hub",
                session_label=label,
                repo_id=repo_id,
                token=token or None,
                refine_enabled=refine_enabled,
                refine_reg=refine_reg,
                refine_passes=refine_passes,
            )
            self.push_status.text = result.get("status", "Pushed successfully")
            self.push_link.text = result.get("link", "")
        except Exception as e:
            self.push_status.text = f"Error: {e}"
        finally:
            self.push_btn.enabled = True
