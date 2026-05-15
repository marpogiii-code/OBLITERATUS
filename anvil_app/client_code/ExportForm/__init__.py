from ._anvil_designer import ExportFormTemplate
from anvil import *
import anvil.server


class ExportForm(ExportFormTemplate):
    """Export tab: download artifacts from the last obliteration run."""

    def __init__(self, **properties):
        self.init_components(**properties)

    def export_btn_click(self, **event_args):
        self.export_status.text = "Preparing artifacts..."
        self.export_btn.enabled = False

        try:
            media = anvil.server.call("export_artifacts")
            if media:
                download(media)
                self.export_status.text = "Download started."
            else:
                self.export_status.text = "No artifacts available. Run an obliteration first."
        except Exception as e:
            self.export_status.text = f"Error: {e}"
        finally:
            self.export_btn.enabled = True
