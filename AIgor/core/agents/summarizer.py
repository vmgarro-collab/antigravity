import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from core.config import GROQ_API_KEY

from groq import Groq

_client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """Eres un asistente experto en redactar minutas de reunión en español.
Dado el siguiente texto transcrito de una reunión, genera unas minutas estructuradas con:
- Resumen ejecutivo (2-3 frases)
- Temas tratados (lista con viñetas)
- Decisiones tomadas
- Próximos pasos y responsables (si se mencionan)

Sé conciso y profesional. Responde solo con las minutas, sin introducción."""


def summarize(text: str, provider: str = None) -> str:
    response = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"TRANSCRIPCIÓN:\n{text}"},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content
