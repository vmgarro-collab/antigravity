import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from core.config import GROQ_API_KEY

from groq import Groq

_client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """Eres un asistente que genera actas de reunión profesionales en español, con el estilo conciso y estructurado que se utiliza en proyectos de consultoría (ServiceNow, Coty, NOVA).

A continuación recibirás una transcripción de una reunión con timestamps y separación por speakers. Genera un acta de reunión detallada en formato Markdown que siga EXACTAMENTE esta estructura:

---
titulo: "<título conciso>"
fecha: "<YYYY-MM-DD>"
hora: "<HH:MM si se infiere>"
proyecto: "<NOVA / Coty / Accenture interno / etc., si se infiere>"
---

# <Título de la Reunión>

**Fecha y hora:** <fecha y hora>

## Asistentes

- **<Nombre>** — <rol o afiliación si se infiere>
- ...

## Agenda y discusión

### 1. <Punto de agenda>
<Resumen conciso de la discusión y decisiones tomadas en este punto.>

## Decisiones tomadas

- <Decisión 1>

## Tareas a realizar

| # | Tarea | Responsable | Fecha límite |
|---|-------|-------------|--------------|
| 1 | <Descripción> | <Nombre> | <Fecha o "Sin fecha"> |

## Próximos pasos

- <Siguiente acción>

## Otras notas

<Información relevante o "Ninguna.">

## Riesgos y bloqueos

<Si se mencionaron o "Ninguno identificado en esta sesión.">

## Reglas estrictas

1. Precisión: refleja con fidelidad lo discutido. No inventes nombres, fechas, decisiones ni tareas.
2. Concisión: cada punto de agenda en 2-5 líneas. Las tareas en una línea.
3. Claridad: lenguaje directo, frases cortas.
4. Objetividad: tono neutral, sin interpretaciones subjetivas.
5. Identificación de speakers: si vienen como "SPEAKER_00", intenta inferir nombres reales por contexto. Si no es posible, usa "Speaker 1", "Speaker 2".
6. Tareas: solo incluye tareas explícitamente acordadas. Sin responsable → "Por asignar". Sin fecha → "Sin fecha".
7. Contexto: si reconoces nombres como Magdalena/Magda, Shanté, Felipe, Pilar, Bernat, Siegfried, Swarnadeep, Brecht, úsalos. Siglas ITSM, HRSD, SSC, SAV1-SAV4, Now Assist → úsalas tal cual.
8. Idioma: la minuta SIEMPRE en español aunque la reunión haya sido en inglés.
9. Sin preámbulos: empieza directamente con el frontmatter ---. No añadas frases tipo "Aquí tienes el acta"."""


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
