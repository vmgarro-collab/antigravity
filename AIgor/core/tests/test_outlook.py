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


def test_get_thread_includes_sent():
    """get_thread should search both Inbox and Sent."""
    inbox_item = _make_mail_item(subject="Thread test")
    inbox_item.ConversationID = "CONV123"
    inbox_item.EntryID = "INBOX001"

    sent_item = _make_mail_item(subject="Re: Thread test", sender="me@example.com")
    sent_item.ConversationID = "CONV123"
    sent_item.EntryID = "SENT001"

    def mock_get_default_folder(folder_id):
        folder = MagicMock()
        if folder_id == 6:
            folder.Items.__iter__ = MagicMock(return_value=iter([inbox_item]))
        else:
            folder.Items.__iter__ = MagicMock(return_value=iter([sent_item]))
        return folder

    mock_ns = MagicMock()
    mock_ns.GetItemFromID.return_value = inbox_item
    mock_ns.GetDefaultFolder.side_effect = mock_get_default_folder

    with patch("win32com.client.Dispatch") as mock_dispatch:
        mock_dispatch.return_value.GetNamespace.return_value = mock_ns
        from core.agents.outlook import get_thread
        result = get_thread("INBOX001")

    assert len(result) == 2


def test_save_draft_creates_new_mail():
    mock_mail = MagicMock()
    mock_outlook = MagicMock()
    mock_outlook.CreateItem.return_value = mock_mail
    mock_mail.EntryID = "DRAFT001"

    with patch("win32com.client.Dispatch", return_value=mock_outlook):
        from core.agents.outlook import save_draft
        result = save_draft("to@test.com", "Test subject", "Test body")

    mock_mail.Save.assert_called_once()
    assert result == "DRAFT001"


def test_get_emails_subject_filter():
    items = [
        _make_mail_item(subject="NOVA project update"),
        _make_mail_item(subject="Team lunch invitation"),
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
        result = get_emails(subject_contains="nova", limit=10)

    assert len(result) == 1
    assert "NOVA" in result[0]["subject"]
