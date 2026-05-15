from ._anvil_designer import MainFormTemplate
from anvil import *
import anvil.server


class MainForm(MainFormTemplate):
    """Main application form with tabbed navigation.

    Each tab loads a sub-form into the content_panel. The GPU-heavy
    computation runs via Anvil Uplink on the user's local machine.
    """

    def __init__(self, **properties):
        self.init_components(**properties)
        self._current_tab = None
        self._load_tab("obliterate")
        self._refresh_vram()

    def _refresh_vram(self):
        try:
            info = anvil.server.call("get_vram_info")
            self.vram_display.text = info
        except Exception:
            self.vram_display.text = "GPU status: connect Uplink to monitor VRAM"

    def _load_tab(self, tab_name):
        if self._current_tab == tab_name:
            return
        self._current_tab = tab_name
        self.content_panel.clear()

        if tab_name == "obliterate":
            from ..ObliterateForm import ObliterateForm
            self.content_panel.add_component(ObliterateForm())
        elif tab_name == "benchmark":
            from ..BenchmarkForm import BenchmarkForm
            self.content_panel.add_component(BenchmarkForm())
        elif tab_name == "chat":
            from ..ChatForm import ChatForm
            self.content_panel.add_component(ChatForm())
        elif tab_name == "ab_compare":
            from ..ABCompareForm import ABCompareForm
            self.content_panel.add_component(ABCompareForm())
        elif tab_name == "sweep":
            from ..StrengthSweepForm import StrengthSweepForm
            self.content_panel.add_component(StrengthSweepForm())
        elif tab_name == "tourney":
            from ..TourneyForm import TourneyForm
            self.content_panel.add_component(TourneyForm())
        elif tab_name == "export":
            from ..ExportForm import ExportForm
            self.content_panel.add_component(ExportForm())
        elif tab_name == "push_hub":
            from ..PushToHubForm import PushToHubForm
            self.content_panel.add_component(PushToHubForm())
        elif tab_name == "leaderboard":
            from ..LeaderboardForm import LeaderboardForm
            self.content_panel.add_component(LeaderboardForm())

        self._refresh_vram()

    # -- Tab button click handlers --

    def btn_obliterate_click(self, **event_args):
        self._load_tab("obliterate")

    def btn_benchmark_click(self, **event_args):
        self._load_tab("benchmark")

    def btn_chat_click(self, **event_args):
        self._load_tab("chat")

    def btn_ab_compare_click(self, **event_args):
        self._load_tab("ab_compare")

    def btn_sweep_click(self, **event_args):
        self._load_tab("sweep")

    def btn_tourney_click(self, **event_args):
        self._load_tab("tourney")

    def btn_export_click(self, **event_args):
        self._load_tab("export")

    def btn_push_hub_click(self, **event_args):
        self._load_tab("push_hub")

    def btn_leaderboard_click(self, **event_args):
        self._load_tab("leaderboard")
