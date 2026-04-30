import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from unittest.mock import MagicMock, patch
from datetime import datetime

def _make_mail_item(subject="Asunto test", sender="test@example.com",
                    sender_name="Test User", unread=True, body="Cuerpo del correo de prueba"):
    item = MagicMock()
    item.EntryID = "AAA111"
    item.Subject = subject
    item.SenderEmailAddress = sender
    item.SenderName = sender_name
    item.ReceivedTime = datetime(2026, 4, 30, 10, 0, 0)
    item.UnRead = unread
    item.Body = body
    item.Attachments.Count = 0
    return item


def test_get_emails_returns_list():
    mock_item = _make_mail_item()
    mock_items = MagicMock()
    mock_items.__iter__ = MagicMock(return_value=iter([mock_item]))
    mock_folder = MagicMock()
    mock_folder.Items = mock_items
    mock_ns = MagicMock()
    mock_ns.GetDefaultFolder.return_value = mock_folder

    with patch("win32com.client.Dispatch") as mock_dispatch:
        mock_dispatch.return_value.GetNamespace.return_value = mock_ns
        from core.agents.outlook import get_emails
        result = get_emails(limit=10)

    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0]["subject"] == "Asunto test"
    assert result[0]["sender"] == "Test User"
    assert result[0]["is_read"] == False


def test_get_emails_filters_by_sender():
    items = [
        _make_mail_item(sender="user@example.com"),
        _make_mail_item(sender="other@example.com"),
    ]
    mock_items = MagicMock()
    mock_items.__iter__ = MagicMock(return_value=iter(items))
    mock_folder = MagicMock()
    mock_folder.Items = mock_items
    mock_ns = MagicMock()
    mock_ns.GetDefaultFolder.return_value = mock_folder

    with patch("win32com.client.Dispatch") as mock_dispatch:
        mock_dispatch.return_value.GetNamespace.return_value = mock_ns
        from core.agents.outlook import get_emails
        result = get_emails(sender="victor", limit=10)

    assert len(result) == 1
    assert "victor" in result[0]["sender_email"]
