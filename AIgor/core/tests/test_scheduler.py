import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from unittest.mock import patch, MagicMock


def test_generate_briefing_saves_file(tmp_path):
    with patch("core.agents.outlook.get_calendar_today", return_value=[]), \
         patch("core.agents.outlook.get_unread_urgent", return_value=[]), \
         patch("core.agents.outlook.get_open_threads", return_value=[]), \
         patch("core.agents.summarizer.summarize_briefing", return_value="# Briefing — 2026-04-30\n\nNada hoy."), \
         patch("plyer.notification.notify"):

        from core.scheduler import generate_briefing
        filepath = generate_briefing(briefings_dir=tmp_path)

    assert filepath.exists()
    content = filepath.read_text(encoding="utf-8")
    assert "Briefing" in content
