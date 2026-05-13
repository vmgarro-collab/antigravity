from datetime import datetime, timedelta
import time

import pythoncom
import win32com.client

_OL_INBOX = 6
_OL_SENT = 5
_OL_CALENDAR = 9
_OL_MAIL_ITEM = 0

_cat_colors_cache: dict | None = None
_calendar_cache: dict = {}  # key → {"ts": float, "data": list}
_CALENDAR_TTL = 300         # seconds


def _get_ns():
    pythoncom.CoInitialize()
    return win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")


def _mail_to_dict(item, full_body: bool = False) -> dict:
    body_text = item.Body or ""
    return {
        "id": item.EntryID,
        "subject": item.Subject or "(sin asunto)",
        "sender": item.SenderName or "",
        "sender_email": item.SenderEmailAddress or "",
        "date": str(item.ReceivedTime),
        "body_preview": body_text[:300],
        "body": body_text if full_body else "",
        "is_read": not item.UnRead,
        "has_attachments": item.Attachments.Count > 0,
    }


# OlCategoryColor → CSS color
_OL_COLOR_MAP = {
    1:  "#e74c3c",  # Red
    2:  "#e67e22",  # Orange
    3:  "#f0a070",  # Peach
    4:  "#f1c40f",  # Yellow
    5:  "#27ae60",  # Green
    6:  "#1abc9c",  # Teal
    7:  "#7f8c3a",  # Olive
    8:  "#3498db",  # Blue
    9:  "#9b59b6",  # Purple
    10: "#8e2020",  # Maroon
    15: "#222222",  # Black
}


def _get_category_colors(ns) -> dict:
    global _cat_colors_cache
    if _cat_colors_cache is not None:
        return _cat_colors_cache
    result = {}
    try:
        cats = ns.Categories
        for i in range(1, cats.Count + 1):
            cat = cats.Item(i)
            css = _OL_COLOR_MAP.get(cat.Color, "#3b82f6")
            result[cat.Name.lower()] = css
    except Exception:
        pass
    _cat_colors_cache = result
    return result


def _appt_to_dict(item, cat_colors: dict = None) -> dict:
    attendees = []
    for r in item.Recipients:
        attendees.append(r.Address)

    def to_local_iso(pywint_dt):
        try:
            # pywintypes datetime from Outlook COM is already local time — treat as naive
            dt = datetime(pywint_dt.year, pywint_dt.month, pywint_dt.day,
                          pywint_dt.hour, pywint_dt.minute, pywint_dt.second)
            return dt.isoformat()
        except Exception:
            return str(pywint_dt)

    color = "#3b82f6"  # default blue
    if cat_colors:
        try:
            first_cat = (item.Categories or "").split(",")[0].strip().lower()
            if first_cat:
                color = cat_colors.get(first_cat, "#3b82f6")
        except Exception:
            pass

    return {
        "id": item.EntryID,
        "subject": item.Subject or "(sin asunto)",
        "start": to_local_iso(item.Start),
        "end": to_local_iso(item.End),
        "attendees": attendees,
        "location": item.Location or "",
        "body_preview": (item.Body or "")[:300],
        "color": color,
        "categories": item.Categories or "",
    }



def get_emails(folder: str = "Inbox", limit: int = 20,
               sender: str = None, subject_contains: str = None) -> list:
    ns = _get_ns()
    folder_id = _OL_INBOX if folder.lower() in ("inbox", "bandeja de entrada") else _OL_SENT
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
    thread = [_mail_to_dict(item, full_body=True)]
    try:
        conv_id = item.ConversationID
        for folder_id in (_OL_INBOX, _OL_SENT):
            folder = ns.GetDefaultFolder(folder_id)
            for msg in folder.Items:
                try:
                    if msg.ConversationID == conv_id and msg.EntryID != entry_id:
                        thread.append(_mail_to_dict(msg, full_body=True))
                        if len(thread) >= 20:
                            break
                except Exception:
                    continue
        thread.sort(key=lambda x: x["date"])
    except Exception:
        pass
    return thread


def save_draft(to: str, subject: str, body: str, reply_to_id: str = None) -> str:
    pythoncom.CoInitialize()
    outlook = win32com.client.Dispatch("Outlook.Application")
    if reply_to_id:
        ns = outlook.GetNamespace("MAPI")
        original = ns.GetItemFromID(reply_to_id)
        mail = original.Reply()
        mail.Body = body + "\n\n" + mail.Body
    else:
        mail = outlook.CreateItem(_OL_MAIL_ITEM)
        mail.To = to
        mail.Subject = subject
        mail.Body = body
    mail.Save()
    return mail.EntryID


def _calendar_items_in_range(ns, start_dt, end_dt, cache_key: str = "") -> list:
    if cache_key:
        entry = _calendar_cache.get(cache_key)
        if entry and (time.monotonic() - entry["ts"]) < _CALENDAR_TTL:
            return entry["data"]

    cat_colors = _get_category_colors(ns)
    calendar = ns.GetDefaultFolder(_OL_CALENDAR)
    items = calendar.Items
    items.IncludeRecurrences = True
    items.Sort("[Start]")
    results = []
    for item in items:
        try:
            item_start = item.Start
            if not hasattr(item_start, 'year'):
                continue
            naive = datetime(item_start.year, item_start.month, item_start.day,
                             item_start.hour, item_start.minute)
            if naive >= end_dt:
                break
            if naive >= start_dt:
                results.append(_appt_to_dict(item, cat_colors))
        except Exception:
            continue

    if cache_key:
        _calendar_cache[cache_key] = {"ts": time.monotonic(), "data": results}
    return results


def get_calendar_today() -> list:
    ns = _get_ns()
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    return _calendar_items_in_range(ns, today, tomorrow, cache_key="today")


def get_calendar_week() -> list:
    ns = _get_ns()
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = today + timedelta(days=7)
    return _calendar_items_in_range(ns, today, week_end, cache_key="week")


def get_unread_urgent(hours_back: int = 24) -> list:
    ns = _get_ns()
    inbox = ns.GetDefaultFolder(_OL_INBOX)
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
    sent = ns.GetDefaultFolder(_OL_SENT)
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
