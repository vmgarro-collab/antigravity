import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from unittest.mock import MagicMock, patch


def test_summarize_briefing_calls_groq():
    mock_response = MagicMock()
    mock_response.choices[0].message.content = "# Briefing — 2026-04-30\n\n## Tu día\nNo hay reuniones."

    with patch("core.agents.summarizer._client") as mock_client:
        mock_client.chat.completions.create.return_value = mock_response

        from core.agents.summarizer import summarize_briefing
        result = summarize_briefing("Reuniones: ninguna. Correos: 0.")

    assert "Briefing" in result
    assert isinstance(result, str)
