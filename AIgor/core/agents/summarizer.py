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


EMAIL_REPLY_PROMPT = """Eres AIgor, asistente de Víctor. Redacta el cuerpo de una respuesta de correo profesional en español.

Reglas:
- Solo el cuerpo del mensaje, sin asunto, sin "Estimado/a", sin firma
- Tono profesional y directo, como lo escribiría Víctor
- Máximo 150 palabras
- Sin preámbulos: empieza directamente con el contenido"""


def generate_email_reply(thread_context: str) -> str:
    response = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": EMAIL_REPLY_PROMPT},
            {"role": "user", "content": f"HILO DE CORREO:\n{thread_context}"},
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content


BRIEFING_PROMPT = """Eres AIgor, asistente personal de Víctor. Genera un briefing diario conciso en español.

Estructura EXACTA:

# Briefing — {fecha}

## Tu día
<lista de reuniones con hora, asistentes clave, y una línea de contexto por reunión>

## Correos urgentes sin leer
<máximo 5, con remitente, asunto y una línea de resumen>

## Hilos abiertos que necesitan atención
<máximo 5, con remitente, asunto y estado>

## Resumen ejecutivo
<3-4 frases: qué es prioritario hoy, qué está pendiente, qué hay que decidir>

Reglas: solo hechos de la información proporcionada. No inventes. Conciso. Sin preámbulos."""


def summarize_briefing(context: str) -> str:
    from datetime import date
    prompt = BRIEFING_PROMPT.replace("{fecha}", date.today().isoformat())
    response = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"DATOS DEL DÍA:\n{context}"},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content
