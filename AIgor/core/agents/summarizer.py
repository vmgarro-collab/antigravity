import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from core.config import GEMINI_API_KEY, LLM_PROVIDER

SYSTEM_PROMPT = """Eres un asistente experto en redactar minutas de reunión en español.
Dado el siguiente texto transcrito de una reunión, genera unas minutas estructuradas con:
- Resumen ejecutivo (2-3 frases)
- Temas tratados (lista con viñetas)
- Decisiones tomadas
- Próximos pasos y responsables (si se mencionan)

Sé conciso y profesional. Responde solo con las minutas, sin introducción."""


def summarize(text: str, provider: str = None) -> str:
    provider = provider or LLM_PROVIDER
    if provider == "gemini":
        return _summarize_gemini(text)
    raise ValueError(f"Provider no soportado: {provider}")


def _summarize_gemini(text: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(f"{SYSTEM_PROMPT}\n\nTRANSCRIPCIÓN:\n{text}")
    return response.text
