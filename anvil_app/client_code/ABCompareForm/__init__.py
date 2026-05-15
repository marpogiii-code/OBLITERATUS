from ._anvil_designer import ABCompareFormTemplate
from anvil import *
import anvil.server


class ABCompareForm(ABCompareFormTemplate):
    """A/B comparison: send the same prompt to original and abliterated models."""

    def __init__(self, **properties):
        self.init_components(**properties)
        self._history_left = []
        self._history_right = []
        self._refresh_session_models()

    def _refresh_session_models(self):
        try:
            models = anvil.server.call("get_session_models")
            self.ab_session_dd.items = [(m, m) for m in models]
            if models:
                self.ab_session_dd.selected_value = models[0]
        except Exception:
            self.ab_status.text = "No obliterated models available."

    def ab_session_dd_change(self, **event_args):
        label = self.ab_session_dd.selected_value
        if label:
            self.ab_status.text = f"Selected: {label}"

    def _add_message(self, panel, role, text):
        role_style = "chat-msg-user" if role == "user" else "chat-msg-assistant"
        prefix = "You" if role == "user" else "Model"
        lbl = Label(text=f"{prefix}: {text}", role=role_style)
        panel.add_component(lbl)

    def ab_send_btn_click(self, **event_args):
        message = self.ab_input.text
        if not message or not message.strip():
            return

        label = self.ab_session_dd.selected_value
        if not label:
            self.ab_status.text = "Select a model first."
            return

        self.ab_input.text = ""
        self._add_message(self.left_chat_panel, "user", message)
        self._add_message(self.right_chat_panel, "user", message)

        self._history_left.append({"role": "user", "content": message})
        self._history_right.append({"role": "user", "content": message})

        self.ab_send_btn.enabled = False
        self.ab_status.text = "Generating responses from both models..."

        try:
            result = anvil.server.call(
                "ab_chat_respond",
                message=message,
                session_label=label,
                history_left=self._history_left,
                history_right=self._history_right,
                system_prompt=self.ab_system_prompt.text,
                temperature=float(self.ab_temp.text or 0.7),
                top_p=float(self.ab_top_p.text or 0.9),
                max_tokens=int(self.ab_max_tokens.text or 256),
                repetition_penalty=float(self.ab_rep_penalty.text or 1.0),
            )
            left_resp = result.get("original", "")
            right_resp = result.get("abliterated", "")

            self._history_left.append({"role": "assistant", "content": left_resp})
            self._history_right.append({"role": "assistant", "content": right_resp})

            self._add_message(self.left_chat_panel, "assistant", left_resp)
            self._add_message(self.right_chat_panel, "assistant", right_resp)
            self.ab_status.text = "Ready"
        except Exception as e:
            self.ab_status.text = f"Error: {e}"
        finally:
            self.ab_send_btn.enabled = True
