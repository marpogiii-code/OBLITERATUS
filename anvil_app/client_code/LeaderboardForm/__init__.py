from ._anvil_designer import LeaderboardFormTemplate
from anvil import *
import anvil.server


class LeaderboardForm(LeaderboardFormTemplate):
    """Community leaderboard showing aggregated benchmark results."""

    def __init__(self, **properties):
        self.init_components(**properties)
        self._load_leaderboard()

    def _load_leaderboard(self):
        try:
            result = anvil.server.call("get_leaderboard")
            self.leaderboard_table.text = result.get("table", "No data yet.")
            self.leaderboard_summary.text = result.get("summary", "")
        except Exception as e:
            self.leaderboard_table.text = f"Could not load leaderboard: {e}"

    def refresh_btn_click(self, **event_args):
        self.leaderboard_table.text = "Loading..."
        self._load_leaderboard()
