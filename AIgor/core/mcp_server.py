import sys
import os
import json

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("AIgor")


@mcp.tool()
def list_emails(folder: str = "Inbox", limit: int = 20,
                sender: str = "", subject_contains: str = "") -> str:
    """Lista correos de Outlook. folder puede ser 'Inbox' o 'Sent'. Devuelve JSON."""
    from core.agents.outlook import get_emails
    results = get_emails(
        folder=folder, limit=limit,
        sender=sender or None,
        subject_contains=subject_contains or None,
    )
    return json.dumps(results, ensure_ascii=False, default=str, indent=2)


@mcp.tool()
def get_email_thread(entry_id: str) -> str:
    """Devuelve el hilo completo de un correo dado su EntryID. Devuelve JSON."""
    from core.agents.outlook import get_thread
    results = get_thread(entry_id)
    return json.dumps(results, ensure_ascii=False, default=str, indent=2)


@mcp.tool()
def draft_reply(to: str, subject: str, body: str, reply_to_id: str = "") -> str:
    """Redacta un correo y lo guarda en Drafts de Outlook. Devuelve el EntryID del borrador."""
    from core.agents.outlook import save_draft
    entry_id = save_draft(
        to=to, subject=subject, body=body,
        reply_to_id=reply_to_id or None,
    )
    return f"Borrador guardado en Drafts. EntryID: {entry_id}"


@mcp.tool()
def get_calendar_today() -> str:
    """Devuelve las reuniones de hoy con asistentes y contexto. Devuelve JSON."""
    from core.agents.outlook import get_calendar_today as _get
    results = _get()
    return json.dumps(results, ensure_ascii=False, default=str, indent=2)


@mcp.tool()
def get_calendar_week() -> str:
    """Devuelve las reuniones de los próximos 7 días. Devuelve JSON."""
    from core.agents.outlook import get_calendar_week as _get
    results = _get()
    return json.dumps(results, ensure_ascii=False, default=str, indent=2)


@mcp.tool()
def search_emails(query: str, days_back: int = 30) -> str:
    """Busca correos por texto en asunto o remitente. Devuelve JSON."""
    from core.agents.outlook import get_emails
    results = get_emails(subject_contains=query, limit=20)
    return json.dumps(results, ensure_ascii=False, default=str, indent=2)


@mcp.tool()
def get_today_briefing() -> str:
    """Genera el briefing del día: reuniones + correos urgentes + hilos abiertos."""
    from core.scheduler import generate_briefing
    filepath = generate_briefing()
    return filepath.read_text(encoding="utf-8")


if __name__ == "__main__":
    mcp.run()
