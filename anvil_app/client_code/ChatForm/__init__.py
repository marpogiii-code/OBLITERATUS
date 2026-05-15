from ._anvil_designer import ChatFormTemplate
from anvil import *
import anvil.server


class ChatForm(ChatFormTemplate):
    """Chat with an obliterated model via the Uplink backend."""

    def __init__(self, **properties):
        self.init_components(**properties)
        self._history = []
        self._refresh_session_models()

    def _refresh_session_models(self):
        try:
            models = anvil.server.call("get_session_models")
            self.session_model_dd.items = [(m, m) for m in models]
            if models:
                self.session_model_dd.selected_value = models[0]
                self.chat_status.text = f"Model loaded: {models[0]}"
        except Exception:
            self.chat_status.text = "No obliterated models available. Obliterate a model first."

    def session_model_dd_change(self, **event_args):
        label = self.session_model_dd.selected_value
        if not label:
            return
        try:
            self.chat_status.text = f"Loading {label}..."
            anvil.server.call("load_session_model", label)
            self.chat_status.text = f"Model loaded: {label}"
        except Exception as e:
            self.chat_status.text = f"Error loading model: {e}"

    def _add_chat_message(self, role, text):
        role_style = "chat-msg-user" if role == "user" else "chat-msg-assistant"
        prefix = "You" if role == "user" else "Model"
        lbl = Label(text=f"{prefix}: {text}", role=role_style)
        self.chat_history_panel.add_component(lbl)

    def send_btn_click(self, **event_args):
        message = self.chat_input.text
        if not message or not message.strip():
            return

        self.chat_input.text = ""
        self._add_chat_message("user", message)
        self._history.append({"role": "user", "content": message})

        self.send_btn.enabled = False
        self.chat_status.text = "Generating..."

        try:
            response = anvil.server.call(
                "chat_respond",
                message=message,
                history=self._history,
                system_prompt=self.system_prompt.text,
                temperature=float(self.temperature.text or 0.7),
                top_p=float(self.top_p.text or 0.9),
                max_tokens=int(self.max_tokens.text or 512),
                repetition_penalty=float(self.repetition_penalty.text or 1.0),
                context_length=int(self.context_length.text or 2048),
            )
            self._history.append({"role": "assistant", "content": response})
            self._add_chat_message("assistant", response)
            self.chat_status.text = "Ready"
        except Exception as e:
            self.chat_status.text = f"Error: {e}"
        finally:
            self.send_btn.enabled = True

    def clear_btn_click(self, **event_args):
        self._history = []
        self.chat_history_panel.clear()
        self.chat_status.text = "Chat cleared."
