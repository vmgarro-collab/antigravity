import sys
import os
import json
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from agents.outlook import get_calendar_today, get_unread_urgent, get_open_threads
from agents.summarizer import summarize_briefing

BRIEFINGS_DIR = Path.home() / "OneDrive - Accenture" / "Todos" / "AntiGravity" / "AIgor" / "briefings"


def generate_briefing(briefings_dir: Path = None) -> Path:
    briefings_dir = briefings_dir or BRIEFINGS_DIR
    briefings_dir.mkdir(parents=True, exist_ok=True)

    meetings = get_calendar_today()
    urgent = get_unread_urgent(hours_back=24)
    threads = get_open_threads(days_back=7, limit=10)

    context_parts = []
    if meetings:
        context_parts.append("## REUNIONES HOY\n" + json.dumps(meetings, ensure_ascii=False, default=str, indent=2))
    else:
        context_parts.append("## REUNIONES HOY\nNinguna.")

    if urgent:
        context_parts.append("## CORREOS URGENTES SIN LEER (últimas 24h)\n" + json.dumps(urgent, ensure_ascii=False, default=str, indent=2))
    else:
        context_parts.append("## CORREOS URGENTES SIN LEER\nNinguno.")

    if threads:
        context_parts.append("## HILOS ABIERTOS (últimos 7 días)\n" + json.dumps(threads, ensure_ascii=False, default=str, indent=2))
    else:
        context_parts.append("## HILOS ABIERTOS\nNinguno.")

    context = "\n\n".join(context_parts)
    briefing_md = summarize_briefing(context)

    today = datetime.now().strftime("%Y-%m-%d")
    filepath = briefings_dir / f"briefing_{today}.md"
    filepath.write_text(briefing_md, encoding="utf-8")

    try:
        from plyer import notification
        notification.notify(
            title="AIgor — Briefing listo",
            message=f"Tu briefing del {today} está disponible.",
            app_name="AIgor",
            timeout=10,
        )
    except Exception:
        pass

    return filepath


def start_scheduler():
    from apscheduler.schedulers.background import BackgroundScheduler
    scheduler = BackgroundScheduler()
    scheduler.add_job(generate_briefing, "cron", hour=9, minute=0, id="briefing_diario")
    scheduler.start()
    return scheduler
