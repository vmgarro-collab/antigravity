# Transcript Speakers, Date Header & AI Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir cabecera de fecha/hablantes al transcript, diarización automática con LLaMA, y reescribir los 3 prompts de IA con estructura fija y formato visual mejorado.

**Architecture:** Todo en `Recorder/app.js` — (1) nueva función `diarizeTranscript` que llama a LLaMA tras Whisper, (2) función `renderTranscript` que genera cabecera + texto con speakers, (3) prompts de `triggerAiAction` reescritos con contexto de reunión. CSS mínimo en `styles.css`.

**Tech Stack:** Vanilla JS, Groq LLaMA 3.3-70b (ya en uso), CSS variables existentes.

---

## Mapa de archivos

| Archivo | Cambios |
|---------|---------|
| `Recorder/app.js` | `diarizeTranscript()`, `renderTranscript()`, prompts reescritos, `rec.speakers` |
| `Recorder/styles.css` | `.transcript-header`, `.mindmap-root`, `.mindmap-center`, tabla de tareas |

---

## Task 1: CSS para cabecera de transcript y mapa mental

**Archivos:**
- Modificar: `Recorder/styles.css` — al final del archivo

- [ ] **Step 1: Añadir estilos al final de `styles.css`**

Abre `Recorder/styles.css` y añade al final:

```css
/* Transcript header (fecha, duración, hablantes) */
.transcript-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    border-bottom: 1px solid var(--border-subtle);
    background: rgba(255, 255, 255, 0.02);
}

.th-date {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
}

.th-meta {
    font-size: 0.8rem;
    color: var(--accent-color);
    letter-spacing: 0.3px;
}

/* Mapa mental */
.mindmap-root {
    list-style: none;
    padding: 0;
    margin: 0;
}

.mindmap-root li {
    padding: 6px 0 6px 16px;
    border-left: 2px solid var(--border-subtle);
    margin: 4px 0;
    font-size: 0.95rem;
    color: #e2e2e2;
}

.mindmap-center {
    border-left: 3px solid var(--accent-color) !important;
    color: var(--accent-color) !important;
    font-weight: 700;
    font-size: 1rem !important;
    padding-left: 12px !important;
}

.mindmap-root ul {
    list-style: none;
    padding-left: 20px;
    margin: 4px 0;
}

.mindmap-root ul li {
    border-left: 2px solid rgba(121, 40, 202, 0.4);
    color: var(--text-secondary);
    font-size: 0.9rem;
}

/* Tabla de tareas */
.ai-result-content table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    margin-top: 8px;
}

.ai-result-content th {
    text-align: left;
    padding: 8px 12px;
    background: rgba(121, 40, 202, 0.15);
    color: var(--accent-color);
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--border-subtle);
}

.ai-result-content td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-subtle);
    color: #e2e2e2;
    vertical-align: top;
}

.ai-result-content tr:last-child td {
    border-bottom: none;
}
```

- [ ] **Step 2: Verificar en browser**

Abre `http://localhost:8000/Recorder/index.html` con DevTools abierto (F12). En la consola ejecuta:
```js
// Verificar que las clases existen en el CSS
const sheet = [...document.styleSheets].find(s => s.href && s.href.includes('styles'));
const rules = [...sheet.cssRules].map(r => r.selectorText);
console.assert(rules.includes('.transcript-header'), 'transcript-header ✓');
console.assert(rules.includes('.mindmap-root'), 'mindmap-root ✓');
```
Esperado: sin errores de aserción.

- [ ] **Step 3: Commit**

```bash
git add Recorder/styles.css
git commit -m "feat: CSS for transcript header, mindmap and tasks table"
```

---

## Task 2: Función `renderTranscript` con cabecera y speakers

**Archivos:**
- Modificar: `Recorder/app.js` — añadir función después de `updateMetaInfo` (línea ~38)

**Contexto:** Esta función reemplaza todos los `transcriptContent.innerHTML = escapeHtml(rawTranscriptText).replace(/\n/g, '<br>')` que hay en el código. Hay exactamente 2 ocurrencias: en `performRealTranscription` (línea ~442) y en `preloadRecording` (línea ~610).

- [ ] **Step 1: Añadir `renderTranscript` en la sección HELPERS**

En `app.js`, justo después de la función `updateMetaInfo` (que termina en la línea ~38), añade:

```js
function renderTranscript(rec, text) {
    if (!transcriptContent) return;

    // Cabecera de fecha, duración y hablantes
    const date = rec && rec.id ? new Date(rec.id).toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }) : '';
    const time = rec && rec.id ? new Date(rec.id).toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit'
    }) : '';
    const dur  = rec && rec.duration ? formatTime(rec.duration) + ' min' : '—';
    const spk  = rec && rec.speakers  ? rec.speakers + ' hablante' + (rec.speakers !== 1 ? 's' : '') : '';

    const headerHtml = (date || dur) ? `
        <div class="transcript-header">
            <span class="th-date">${escapeHtml(date)}${time ? ' · ' + time : ''}</span>
            <span class="th-meta">${dur}${spk ? ' · ' + spk : ''}</span>
        </div>` : '';

    // Cuerpo: "Hablante N: texto" → span.speaker + texto
    const bodyHtml = escapeHtml(text)
        .replace(/\n/g, '<br>')
        .replace(/(Hablante\s+\d+):/g, '<span class="speaker">$1:</span>');

    transcriptContent.innerHTML = headerHtml + '<div style="padding:24px">' + bodyHtml + '</div>';
}
```

- [ ] **Step 2: Reemplazar las 2 ocurrencias existentes de renderizado**

**Ocurrencia 1** — en `performRealTranscription`, dentro del `setTimeout` (línea ~442):
```js
// ANTES:
transcriptContent.innerHTML = escapeHtml(rawTranscriptText).replace(/\n/g, '<br>');

// DESPUÉS:
const recForRender = await getRecordingById(currentRecordingId).catch(() => null);
renderTranscript(recForRender, rawTranscriptText);
```

**Ocurrencia 2** — en `preloadRecording` (línea ~610):
```js
// ANTES:
transcriptContent.innerHTML = escapeHtml(rawTranscriptText).replace(/\n/g, '<br>');

// DESPUÉS:
renderTranscript(rec, rawTranscriptText);
```

- [ ] **Step 3: Verificar en browser**

En la consola del browser:
```js
// Simular llamada con rec falso y texto con speaker
const fakeRec = { id: Date.now(), duration: 125, speakers: 2 };
renderTranscript(fakeRec, 'Hablante 1: Buenos días a todos.\nHablante 2: Empecemos con el orden del día.');
// Debe mostrar cabecera con fecha + "02:05 min · 2 hablantes"
// y "Hablante 1:" y "Hablante 2:" en color accent
console.assert(transcriptContent.querySelector('.transcript-header'), 'header ✓');
console.assert(transcriptContent.querySelectorAll('.speaker').length === 2, 'speakers ✓');
```

- [ ] **Step 4: Commit**

```bash
git add Recorder/app.js
git commit -m "feat: renderTranscript with date header and speaker highlighting"
```

---

## Task 3: Función `diarizeTranscript` — diarización con LLaMA

**Archivos:**
- Modificar: `Recorder/app.js` — añadir función antes de `performRealTranscription`

**Contexto:** Esta función toma el texto plano de Whisper, lo manda a LLaMA con un prompt específico, y devuelve el texto reformateado con "Hablante N:" + el número de hablantes detectados. Si falla, devuelve el texto original con `speakers: 0`.

- [ ] **Step 1: Añadir `diarizeTranscript` antes de `performRealTranscription`**

En `app.js`, justo antes de `async function performRealTranscription(blob)` (línea ~369), añade:

```js
async function diarizeTranscript(text, apiKey) {
    if (!text || text.trim().length < 20) return { text, speakers: 0 };

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: "Eres un experto en análisis de conversaciones. Analiza el siguiente transcript e identifica cambios de hablante basándote en cambios de tema, tono y contexto conversacional. Reformatea el texto añadiendo 'Hablante N:' al inicio de cada intervención (N = número entero empezando en 1). Mantén el texto original exacto, solo añade las etiquetas. Si el texto parece ser de una sola persona, añade 'Hablante 1:' al inicio. Responde ÚNICAMENTE con el transcript reformateado, sin explicaciones ni texto adicional."
                    },
                    { role: "user", content: text }
                ],
                temperature: 0.1,
                max_tokens: 4096
            })
        });

        if (!response.ok) throw new Error('Diarization API error: ' + response.status);

        const data = await response.json();
        const diarized = data.choices[0].message.content
            .replace(/```/g, '').trim();

        // Contar hablantes únicos detectados
        const speakerMatches = diarized.match(/Hablante\s+(\d+):/g) || [];
        const uniqueSpeakers = new Set(speakerMatches.map(m => m.match(/\d+/)[0])).size;

        return { text: diarized, speakers: uniqueSpeakers };
    } catch(e) {
        console.warn('Diarization failed, using raw transcript:', e.message);
        return { text, speakers: 0 };
    }
}
```

- [ ] **Step 2: Integrar `diarizeTranscript` en `performRealTranscription`**

Dentro de `performRealTranscription`, localiza el bloque del Paso 3 (línea ~413). Actualmente:

```js
// Paso 3: Procesando resultado
activateStep(3);
progressBar.style.width = '85%';

const result = await response.json();
rawTranscriptText = result.text || "No se detectó voz.";

// Persistir transcript en IndexedDB
if (currentRecordingId) {
    try {
        const rec = await getRecordingById(currentRecordingId);
        if (rec) {
            rec.transcript = rawTranscriptText;
            await updateRecording(rec);
        }
    } catch(e) { console.warn("Error persistiendo transcripción:", e); }
}
```

Reemplaza TODO ese bloque por:

```js
// Paso 3: Diarizando y procesando resultado
activateStep(3);
progressBar.style.width = '85%';

const result = await response.json();
const rawText = result.text || "No se detectó voz.";

// Diarizar con LLaMA (añade "Hablante N:")
const { text: diarizedText, speakers } = await diarizeTranscript(rawText, apiKey);
rawTranscriptText = diarizedText;

// Persistir transcript + speakers en IndexedDB
if (currentRecordingId) {
    try {
        const rec = await getRecordingById(currentRecordingId);
        if (rec) {
            rec.transcript = rawTranscriptText;
            rec.speakers   = speakers;
            await updateRecording(rec);
        }
    } catch(e) { console.warn("Error persistiendo transcripción:", e); }
}
```

- [ ] **Step 3: Añadir `speakers` al objeto `rec` al crear la grabación**

En el stop handler del MediaRecorder, localiza el objeto `rec` (tiene campos `id`, `title`, `dateLabel`, `duration`, `audioBlob`, `audioUrl`, `mimeType`). Añade `speakers: 0`:

```js
const rec = {
    id:        now.getTime(),
    title:     'Grabación ' + now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    dateLabel: now.toLocaleDateString(),
    duration:  secondsRecorded,
    speakers:  0,               // <-- nueva línea
    audioBlob: rawBlob,
    audioUrl:  audioUrl,
    mimeType:  rawBlob.type
};
```

- [ ] **Step 4: Verificar en browser (consola)**

```js
// Test con texto corto (debe devolver sin diarizar por la guarda length < 20)
const fakeKey = getGroqApiKey();
if (fakeKey) {
    diarizeTranscript('Hola.', fakeKey).then(r => {
        console.assert(r.speakers === 0, 'texto corto → speakers 0 ✓');
        console.assert(r.text === 'Hola.', 'texto corto → sin cambios ✓');
    });
}
```

- [ ] **Step 5: Commit**

```bash
git add Recorder/app.js
git commit -m "feat: diarizeTranscript via LLaMA with speaker count"
```

---

## Task 4: Reescribir prompts de IA con contexto de reunión

**Archivos:**
- Modificar: `Recorder/app.js` — función `triggerAiAction` (línea ~453)

**Contexto:** Los 3 prompts actuales son genéricos. Los nuevos: (1) reciben contexto de fecha/duración/hablantes, (2) tienen estructura de output fija, (3) usan HTML que se beneficia del CSS añadido en Task 1.

- [ ] **Step 1: Añadir función helper `buildMeetingContext`**

Justo antes de `async function triggerAiAction`, añade:

```js
function buildMeetingContext() {
    // Obtiene contexto de la grabación actual para enriquecer los prompts
    const metaEl = document.getElementById('meta-info');
    const metaText = metaEl ? metaEl.textContent : '';
    return metaText && metaText !== '—' ? `[Reunión: ${metaText}]\n` : '';
}
```

- [ ] **Step 2: Reemplazar los 3 system prompts en `triggerAiAction`**

Localiza el bloque (línea ~468):
```js
let systemPrompt = "";
if (type === 'summary') {
    systemPrompt = "...";
} else if (type === 'tasks') {
    systemPrompt = "...";
} else if (type === 'mindmap') {
    systemPrompt = "...";
}
```

Reemplázalo completamente por:

```js
let systemPrompt = "";
if (type === 'summary') {
    systemPrompt = `Eres un asistente ejecutivo de reuniones. Genera un resumen estructurado en HTML usando EXACTAMENTE estas 4 secciones con <h4>:
1. <h4>Contexto</h4> — 1-2 frases sobre el propósito de la reunión
2. <h4>Puntos Clave</h4> — <ul> con los temas más importantes tratados
3. <h4>Decisiones Tomadas</h4> — <ul> con decisiones concretas; si no hay, escribe <p>No se tomaron decisiones formales.</p>
4. <h4>Próximos Pasos</h4> — <ul> con acciones acordadas; si no hay, escribe <p>Sin próximos pasos identificados.</p>
Sé específico y usa información real del transcript. Responde SOLO el HTML, en español.`;
} else if (type === 'tasks') {
    systemPrompt = `Eres un gestor de proyectos. Extrae todas las tareas del transcript (explícitas e implícitas). Genera una tabla HTML con esta estructura exacta:
<table><thead><tr><th>Tarea</th><th>Responsable</th><th>Prioridad</th></tr></thead><tbody>
[una <tr> por tarea con <td> para cada columna]
</tbody></table>
Reglas: Responsable = nombre mencionado en el transcript o "Sin asignar". Prioridad = "Alta" (urgente/esta semana), "Media" (próximo sprint), "Baja" (cuando se pueda). Si no hay tareas escribe <p>No se identificaron tareas en esta reunión.</p>. Responde SOLO el HTML, en español.`;
} else if (type === 'mindmap') {
    systemPrompt = `Eres un analista de contenido. Identifica el tema central de la reunión y los 4-6 conceptos principales con sus sub-ideas. Genera un mapa mental en HTML con esta estructura exacta:
<ul class="mindmap-root">
  <li class="mindmap-center">[TEMA CENTRAL DE LA REUNIÓN]</li>
  <li>[Concepto 1]
    <ul><li>[sub-idea]</li><li>[sub-idea]</li></ul>
  </li>
  [más conceptos...]
</ul>
Usa información real del transcript. Responde SOLO el HTML, en español.`;
}
```

- [ ] **Step 3: Añadir contexto de reunión al mensaje del usuario**

Localiza (línea ~487):
```js
{ role: "user", content: `Transcripción: ${rawTranscriptText}` }
```

Reemplaza por:
```js
{ role: "user", content: `${buildMeetingContext()}Transcripción: ${rawTranscriptText}` }
```

- [ ] **Step 4: Verificar en browser**

1. Carga una grabación con transcripción
2. Haz click en "Resumen Ejecutivo" — el resultado debe tener 4 `<h4>` visibles
3. Haz click en "Extraer Tareas" — debe aparecer una tabla con columnas Tarea/Responsable/Prioridad
4. Haz click en "Crear Mapa Mental" — debe aparecer una lista anidada con estilos (no ASCII)

En consola:
```js
console.assert(typeof buildMeetingContext === 'function', 'buildMeetingContext ✓');
const ctx = buildMeetingContext();
console.log('Meeting context:', ctx); // Debe mostrar el texto de meta-info o ""
```

- [ ] **Step 5: Commit**

```bash
git add Recorder/app.js
git commit -m "feat: rewrite AI prompts with meeting context, structured output and mindmap HTML"
```

---

## Checklist de cobertura spec

| Requisito spec | Task |
|----------------|------|
| Cabecera fecha/hora en transcript | Task 2 |
| Cabecera duración en transcript | Task 2 |
| Cabecera nº hablantes en transcript | Task 2 |
| `rec.speakers` en IndexedDB | Task 3 |
| Diarización con LLaMA | Task 3 |
| Fallback si diarización falla | Task 3 (try/catch en `diarizeTranscript`) |
| Speakers renderizados con `.speaker` class | Task 2 (`renderTranscript`) |
| Contexto fecha/duración en prompts IA | Task 4 |
| Resumen con 4 secciones fijas | Task 4 |
| Tareas con tabla HTML | Task 4 |
| Mapa mental con `<ul class="mindmap-root">` | Task 4 |
| CSS cabecera transcript | Task 1 |
| CSS mindmap | Task 1 |
| CSS tabla tareas | Task 1 |
