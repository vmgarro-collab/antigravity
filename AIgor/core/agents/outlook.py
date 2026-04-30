import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import win32com.client


def _get_ns():
    return win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")


def _mail_to_dict(item) -> dict:
    return {
        "id": item.EntryID,
        "subject": item.Subject or "(sin asunto)",
        "sender": item.SenderName or "",
        "sender_email": item.SenderEmailAddress or "",
        "date": str(item.ReceivedTime),
        "body_preview": (item.Body or "")[:300],
        "is_read": not item.UnRead,
        "has_attachments": item.Attachments.Count > 0,
    }


def _appt_to_dict(item) -> dict:
    attendees = []
    for r in item.Recipients:
        attendees.append(r.Address)
    return {
        "id": item.EntryID,
        "subject": item.Subject or "(sin asunto)",
        "start": str(item.Start),
        "end": str(item.End),
        "attendees": attendees,
        "location": item.Location or "",
        "body_preview": (item.Body or "")[:300],
    }


def get_emails(folder: str = "Inbox", limit: int = 20,
               sender: str = None, subject_contains: str = None) -> list:
    ns = _get_ns()
    folder_id = 6 if folder.lower() in ("inbox", "bandeja de entrada") else 5
    mapi_folder = ns.GetDefaultFolder(folder_id)
    items = mapi_folder.Items
    items.Sort("[ReceivedTime]", True)
    results = []
    for item in items:
        if len(results) >= limit:
            break
        try:
            if sender and sender.lower() not in (item.SenderEmailAddress or "").lower():
                continue
            if subject_contains and subject_contains.lower() not in (item.Subject or "").lower():
                continue
            results.append(_mail_to_dict(item))
        except Exception:
            continue
    return results


def get_thread(entry_id: str) -> list:
    ns = _get_ns()
    item = ns.GetItemFromID(entry_id)
    thread = [_mail_to_dict(item)]
    try:
        conv_id = item.ConversationID
        inbox = ns.GetDefaultFolder(6)
        items = inbox.Items
        for msg in items:
            try:
                if msg.ConversationID == conv_id and msg.EntryID != entry_id:
                    thread.append(_mail_to_dict(msg))
                    if len(thread) >= 20:
                        break
            except Exception:
                continue
        thread.sort(key=lambda x: x["date"])
    except Exception:
        pass
    return thread


def save_draft(to: str, subject: str, body: str, reply_to_id: str = None) -> str:
    outlook = win32com.client.Dispatch("Outlook.Application")
    if reply_to_id:
        ns = outlook.GetNamespace("MAPI")
        original = ns.GetItemFromID(reply_to_id)
        mail = original.Reply()
        mail.Body = body + "\n\n" + "--- Mensaje original ---\n" + mail.Body
    else:
        mail = outlook.CreateItem(0)
        mail.To = to
        mail.Subject = subject
        mail.Body = body
    mail.Save()
    return mail.EntryID


def get_calendar_today() -> list:
    ns = _get_ns()
    calendar = ns.GetDefaultFolder(9)
    items = calendar.Items
    items.IncludeRecurrences = True
    items.Sort("[Start]")
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    restriction = (
        f"[Start] >= '{today.strftime('%m/%d/%Y')}' AND "
        f"[Start] < '{tomorrow.strftime('%m/%d/%Y')}'"
    )
    restricted = items.Restrict(restriction)
    results = []
    for item in restricted:
        try:
            results.append(_appt_to_dict(item))
        except Exception:
            continue
    return results


def get_calendar_week() -> list:
    ns = _get_ns()
    calendar = ns.GetDefaultFolder(9)
    items = calendar.Items
    items.IncludeRecurrences = True
    items.Sort("[Start]")
    today = datetime.now().date()
    week_end = today + timedelta(days=7)
    restriction = (
        f"[Start] >= '{today.strftime('%m/%d/%Y')}' AND "
        f"[Start] < '{week_end.strftime('%m/%d/%Y')}'"
    )
    restricted = items.Restrict(restriction)
    results = []
    for item in restricted:
        try:
            results.append(_appt_to_dict(item))
        except Exception:
            continue
    return results


def get_unread_urgent(hours_back: int = 24) -> list:
    ns = _get_ns()
    inbox = ns.GetDefaultFolder(6)
    items = inbox.Items
    items.Sort("[ReceivedTime]", True)
    cutoff = datetime.now() - timedelta(hours=hours_back)
    results = []
    for item in items:
        try:
            if item.UnRead and item.ReceivedTime >= cutoff:
                results.append(_mail_to_dict(item))
                if len(results) >= 10:
                    break
        except Exception:
            continue
    return results


def get_open_threads(days_back: int = 7, limit: int = 10) -> list:
    ns = _get_ns()
    sent = ns.GetDefaultFolder(5)
    items = sent.Items
    items.Sort("[SentOn]", True)
    cutoff = datetime.now() - timedelta(days=days_back)
    results = []
    seen_subjects = set()
    for item in items:
        try:
            if item.SentOn < cutoff:
                break
            subj = (item.Subject or "").lower().replace("re: ", "").replace("fw: ", "")
            if subj not in seen_subjects:
                seen_subjects.add(subj)
                results.append(_mail_to_dict(item))
                if len(results) >= limit:
                    break
        except Exception:
            continue
    return results
