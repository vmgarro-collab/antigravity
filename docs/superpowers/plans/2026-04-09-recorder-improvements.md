# Recorder (NeuroScribe) — Review & Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir todos los bugs, vulnerabilidades XSS y UX rota identificados en la revisión del Recorder (NeuroScribe).

**Architecture:** Vanilla JS sin build system. Todos los cambios son en `Recorder/app.js`, `Recorder/index.html` y `Recorder/styles.css`. Sin framework de tests — verificación manual en browser + `console.assert`. Los scripts se cargan al final del `<body>`, orden importa.

**Tech Stack:** Vanilla JS ES2020, IndexedDB (db.js), Lucide Icons (CDN), FileSaver.js (CDN), jsPDF (CDN a añadir), Groq API (Whisper + LLaMA).

---

## Mapa de archivos

| Archivo | Cambios |
|---------|---------|
| `Recorder/index.html` | Añadir jsPDF CDN, fix IDs del modal, quitar `onclick=""` inline, añadir `id="btn-new-recording"` al botón |
| `Recorder/app.js` | Fix XSS, fix progreso, fix modal, fix selector, añadir copy/duration/PDF |
| `Recorder/styles.css` | Sin cambios (todos los estilos necesarios ya existen) |

---

## Task 1: Sanitizar XSS en transcripción y resultado de IA

**Archivos:**
- Modificar: `Recorder/app.js:381` y `Recorder/app.js:441`

**Contexto:** `transcriptContent.innerHTML` y `aiResultContent.innerHTML` reciben texto externo sin sanitizar. El transcript usa `replace('\n','<br>')` que es seguro solo si el texto no tiene HTML. El resultado de IA acepta HTML de Groq (intencionado) pero sin ninguna restricción.

- [ ] **Step 1: Añadir función de sanitización segura en `app.js` justo después de `getGroqApiKey`**

Abre `Recorder/app.js`. Después de la línea `function setGroqApiKey(key) { ... }` (línea ~91), añade:

```js
// Escapa texto plano para inserción segura en innerHTML
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Sanitiza HTML generado por IA: permite solo tags seguros
function sanitizeAiHtml(html) {
    const allowed = /^(h[1-6]|p|ul|ol|li|strong|em|br|pre|span|div|b|i)$/i;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('*').forEach(el => {
        if (!allowed.test(el.tagName)) {
            el.replaceWith(document.createTextNode(el.textContent));
        }
        // Eliminar todos los atributos excepto class y style
        [...el.attributes].forEach(attr => {
            if (!['class', 'style'].includes(attr.name)) el.removeAttribute(attr.name);
        });
    });
    return tmp.innerHTML;
}
```

- [ ] **Step 2: Aplicar `escapeHtml` al transcript en `performRealTranscription`**

Busca la línea (aprox. 381):
```js
transcriptContent.innerHTML = rawTranscriptText.replace(/\n/g, '<br>');
```
Reemplázala por:
```js
transcriptContent.innerHTML = escapeHtml(rawTranscriptText).replace(/\n/g, '<br>');
```

- [ ] **Step 3: Aplicar `escapeHtml` al transcript en `preloadRecording`**

Busca (aprox. línea 548):
```js
transcriptContent.innerHTML = rawTranscriptText.replace(/\n/g, '<br>');
```
Reemplázala por:
```js
transcriptContent.innerHTML = escapeHtml(rawTranscriptText).replace(/\n/g, '<br>');
```

- [ ] **Step 4: Aplicar `sanitizeAiHtml` al resultado de IA en `triggerAiAction`**

Busca (aprox. línea 441):
```js
aiResultContent.innerHTML = cleanContent;
```
Reemplázala por:
```js
aiResultContent.innerHTML = sanitizeAiHtml(cleanContent);
```

- [ ] **Step 5: Verificar en browser**

1. Abre `http://localhost:8000/Recorder/index.html`
2. En la consola ejecuta:
```js
// Simular transcript con HTML malicioso
rawTranscriptText = '<img src=x onerror="alert(1)"> Hola <script>alert(2)</script>';
transcriptContent.innerHTML = escapeHtml(rawTranscriptText).replace(/\n/g, '<br>');
console.assert(!transcriptContent.innerHTML.includes('<img'), 'XSS bloqueado en transcript ✓');
console.assert(!transcriptContent.innerHTML.includes('<script'), 'Script bloqueado ✓');
console.log('innerHTML resultado:', transcriptContent.innerHTML);
// Debe mostrar texto escapado, sin ejecutar ningún alert
```

- [ ] **Step 6: Commit**

```bash
git add Recorder/app.js
git commit -m "fix: sanitize XSS in transcript and AI result injection"
```

---

## Task 2: Corregir el orden y completado de los pasos de progreso

**Archivos:**
- Modificar: `Recorder/app.js:307-389`

**Contexto:** Los 4 pasos de la vista de transcripción nunca se marcan como `done` (solo el 3), y los pasos 1 y 2 se activan juntos antes del fetch. El flujo correcto es: paso 0 (activo desde `stopRecordingAndTranscribe`) → paso 1 al preparar FormData → paso 2 al lanzar fetch → paso 3 al parsear respuesta → todos marked done en secuencia.

- [ ] **Step 1: Reemplazar el cuerpo de `performRealTranscription` con el flujo corregido**

Localiza la función `async function performRealTranscription(blob)` (aprox. línea 320) y reemplaza **todo su contenido** por:

```js
async function performRealTranscription(blob) {
    let apiKey = getGroqApiKey();
    if (!apiKey) {
        if (!askForGroqApiKey()) {
            switchView(State.RESULTS);
            rawTranscriptText = "No se pudo transcribir: Falta API Key.";
            transcriptContent.innerHTML = escapeHtml(rawTranscriptText);
            return;
        }
        apiKey = getGroqApiKey();
    }

    try {
        // Paso 0 ya activo desde stopRecordingAndTranscribe — marcarlo done
        finishStep(0);

        // Paso 1: Preparando FormData
        activateStep(1);
        progressBar.style.width = '20%';

        const formData = new FormData();
        formData.append("file", blob, "audio.webm");
        formData.append("model", "whisper-large-v3-turbo");
        formData.append("language", "es");

        finishStep(1);

        // Paso 2: Enviando a Groq
        activateStep(2);
        progressBar.style.width = '50%';

        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}` },
            body: formData
        });

        if (!response.ok) {
            const errDetails = await response.text();
            throw new Error(`Error de Groq API: ${response.status} ${errDetails}`);
        }

        finishStep(2);

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

        finishStep(3);
        progressBar.style.width = '100%';

        setTimeout(() => {
            switchView(State.RESULTS);
            transcriptContent.innerHTML = escapeHtml(rawTranscriptText).replace(/\n/g, '<br>');
        }, 500);

    } catch (err) {
        console.error("Transcription error:", err);
        alert("Hubo un error al transcribir: " + err.message);
        switchView(State.RESULTS);
        transcriptContent.innerHTML = "Error en la transcripción: " + escapeHtml(err.message);
    }
}
```

- [ ] **Step 2: Verificar visualmente**

1. Graba 3 segundos de audio y detén.
2. Observa la pantalla de transcripción: cada paso debe aparecer con spinner, luego cambiar a checkmark verde en secuencia antes de avanzar al siguiente.
3. La barra de progreso debe avanzar: 0% → 20% → 50% → 85% → 100%.

- [ ] **Step 3: Commit**

```bash
git add Recorder/app.js
git commit -m "fix: progress steps now complete in correct sequence with finish markers"
```

---

## Task 3: Cablear el modal de configuración y eliminar globals de `window`

**Archivos:**
- Modificar: `Recorder/index.html:41` y `Recorder/app.js:49-69, 94-116, 660-671`

**Contexto:** El modal `#settings-modal` tiene HTML completo pero cero JS. El botón settings llama `onclick="askForGroqApiKey()"` (prompt nativo). Las funciones `askForGroqApiKey`, `saveDirectApiKey` y `reTranscribeCurrent` están en `window` solo por los `onclick=""` inline del HTML. Hay que: (a) quitar los `onclick=""` del HTML, (b) cablear con `addEventListener`, (c) hacer que el botón settings abra el modal real.

- [ ] **Step 1: Limpiar `onclick` del HTML y añadir IDs necesarios**

En `Recorder/index.html`:

**Cambio 1** — botón settings (línea ~41), eliminar `onclick`:
```html
<!-- ANTES -->
<button id="btn-settings-modal" onclick="askForGroqApiKey()" class="settings-btn" title="Configuración Groq">

<!-- DESPUÉS -->
<button id="btn-settings-modal" class="settings-btn" title="Configuración Groq">
```

**Cambio 2** — botón "Guardar Clave" del direct-api-box (línea ~59):
```html
<!-- ANTES -->
<button onclick="saveDirectApiKey()" class="btn-save-api">Guardar Clave</button>

<!-- DESPUÉS -->
<button id="btn-save-direct-api" class="btn-save-api">Guardar Clave</button>
```

**Cambio 3** — botón "Nueva Grabación" en sidebar (línea ~24), añadir ID:
```html
<!-- ANTES -->
<button class="menu-item active">

<!-- DESPUÉS -->
<button id="btn-new-recording" class="menu-item active">
```

**Cambio 4** — añadir input al modal para pre-llenado (línea ~204, el input ya existe con id `groq-api-key`, verificar que esté ahí).

- [ ] **Step 2: Actualizar referencias DOM en `app.js`**

En la sección `--- DOM REFERENCES ---` (línea ~48), reemplaza la línea de `btnNewRecording`:
```js
// ANTES
const btnNewRecording= document.querySelector('.menu-item.active');

// DESPUÉS
const btnNewRecording = document.getElementById('btn-new-recording');
```

Añade al final del bloque de referencias:
```js
const btnSaveDirectApi  = document.getElementById('btn-save-direct-api');
const settingsModal     = document.getElementById('settings-modal');
const modalApiKeyInput  = document.getElementById('groq-api-key');
const btnCloseSettings  = document.getElementById('btn-close-settings');
const btnSaveSettings   = document.getElementById('btn-save-settings');
```

- [ ] **Step 3: Convertir funciones globales a locales**

En `app.js`, reemplaza:
```js
window.askForGroqApiKey = function() {
```
por:
```js
function askForGroqApiKey() {
```

Reemplaza:
```js
window.saveDirectApiKey = function() {
```
por:
```js
function saveDirectApiKey() {
```

Reemplaza:
```js
window.reTranscribeCurrent = async function() {
```
por:
```js
async function reTranscribeCurrent() {
```

- [ ] **Step 4: Añadir listeners para el modal y los botones**

Al final de `app.js`, antes del último `}`, añade el siguiente bloque (después de los listeners de exportar audio):

```js
// --- SETTINGS MODAL ---
function openSettingsModal() {
    const key = getGroqApiKey();
    if (modalApiKeyInput) modalApiKeyInput.value = key || '';
    if (settingsModal) settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    if (settingsModal) settingsModal.classList.add('hidden');
}

document.getElementById('btn-settings-modal')
    .addEventListener('click', openSettingsModal);

if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettingsModal);

if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
        const key = modalApiKeyInput ? modalApiKeyInput.value.trim() : '';
        if (key) {
            setGroqApiKey(key);
            const directInput = document.getElementById('direct-api-key');
            if (directInput) directInput.value = key;
            closeSettingsModal();
            alert('¡Clave guardada con éxito!');
        } else {
            alert('Por favor, pega una clave válida (gsk_...).');
        }
    });
}

if (btnSaveDirectApi) {
    btnSaveDirectApi.addEventListener('click', saveDirectApiKey);
}

// Cerrar modal al hacer click fuera
if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettingsModal();
    });
}
```

- [ ] **Step 5: Verificar en browser**

1. Abre la app. Haz click en el ícono ⚙️ del sidebar.
2. Debe abrirse el modal glassmorphism (no el `prompt()` nativo).
3. Escribe una clave y haz click "Guardar Configuración" → modal se cierra, clave pre-llenada en el input directo.
4. Haz click fuera del modal → debe cerrarse.
5. En consola: `console.assert(typeof window.askForGroqApiKey === 'undefined', 'No es global ✓')`.

- [ ] **Step 6: Commit**

```bash
git add Recorder/app.js Recorder/index.html
git commit -m "fix: wire settings modal, remove window globals, fix fragile selector"
```

---

## Task 4: Meta-info dinámica y guardar duración

**Archivos:**
- Modificar: `Recorder/app.js:224-232` (objeto `rec`), `Recorder/app.js:535-537` (preloadRecording)
- Modificar: `Recorder/index.html:125` (p.meta-info)

**Contexto:** La línea `"15 de Abril, 2026 • 24 mins • 3 Participantes identificados"` es texto estático. `secondsRecorded` ya existe pero no se guarda en IndexedDB ni se muestra. Hay que: guardar `duration` en el objeto grabado, y actualizar el `<p class="meta-info">` al cargar resultados.

- [ ] **Step 1: Cambiar `<p class="meta-info">` a elemento actualizable**

En `Recorder/index.html`, reemplaza (línea ~125):
```html
<p class="meta-info">15 de Abril, 2026 • 24 mins • 3 Participantes identificados</p>
```
por:
```html
<p class="meta-info" id="meta-info">—</p>
```

- [ ] **Step 2: Añadir referencia DOM en `app.js`**

En el bloque de referencias, añade:
```js
const metaInfo = document.getElementById('meta-info');
```

- [ ] **Step 3: Guardar `duration` al crear la grabación**

En `app.js`, dentro del evento `mediaRecorder.addEventListener('stop', async () => { ... })`, en el objeto `rec` (aprox. línea 224), añade el campo `duration`:

```js
const rec = {
    id:        now.getTime(),
    title:     'Grabación ' + now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    dateLabel: now.toLocaleDateString(),
    duration:  secondsRecorded,          // <-- añadir esta línea
    audioBlob: rawBlob,
    audioUrl:  audioUrl,
    mimeType:  rawBlob.type
};
```

- [ ] **Step 4: Añadir función helper para formatear meta-info**

En `app.js`, junto a `formatTime`, añade:

```js
function updateMetaInfo(rec) {
    if (!metaInfo) return;
    const date = rec.id ? new Date(rec.id).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric'
    }) : '—';
    const dur = rec.duration ? formatTime(rec.duration) : '—';
    metaInfo.textContent = `${date} • ${dur} min`;
}
```

- [ ] **Step 5: Llamar `updateMetaInfo` al mostrar resultados**

En `performRealTranscription`, justo antes del `setTimeout` que llama a `switchView(State.RESULTS)`:
```js
// Añadir antes del setTimeout:
try {
    const rec = await getRecordingById(currentRecordingId);
    if (rec) updateMetaInfo(rec);
} catch(e) {}

setTimeout(() => { ... }, 500);
```

En `preloadRecording`, justo después de `switchView(State.RESULTS)`:
```js
switchView(State.RESULTS);
updateMetaInfo(rec);  // <-- añadir
```

- [ ] **Step 6: Verificar**

1. Graba 10 segundos y detén. En la vista de resultados, la meta-info debe mostrar la fecha de hoy y `00:10 min` (aprox.).
2. Navega a una grabación del historial → meta-info muestra su fecha y duración.

- [ ] **Step 7: Commit**

```bash
git add Recorder/app.js Recorder/index.html
git commit -m "feat: show dynamic meta-info with real date and duration"
```

---

## Task 5: Implementar botón "Copiar al portapapeles"

**Archivos:**
- Modificar: `Recorder/app.js` (añadir listener)
- No se toca HTML (el botón ya existe con clase `btn-icon` dentro de `#ai-result-panel`)

**Contexto:** El botón de copiar en el panel de resultados de IA existe en el HTML (línea 174) pero sin `id` y sin listener. Hay que añadir un ID y el listener.

- [ ] **Step 1: Añadir `id` al botón de copiar en HTML**

En `Recorder/index.html`, busca (línea ~174):
```html
<button class="btn-icon" title="Copiar al portapapeles"><i data-lucide="copy"></i></button>
```
Reemplaza por:
```html
<button id="btn-copy-ai" class="btn-icon" title="Copiar al portapapeles"><i data-lucide="copy"></i></button>
```

- [ ] **Step 2: Añadir referencia y listener en `app.js`**

En el bloque de referencias DOM:
```js
const btnCopyAi = document.getElementById('btn-copy-ai');
```

Al final de `app.js` (en la sección de listeners), añade:
```js
if (btnCopyAi) {
    btnCopyAi.addEventListener('click', async () => {
        const text = aiResultContent ? aiResultContent.innerText : '';
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            const icon = btnCopyAi.querySelector('i') || btnCopyAi.querySelector('svg');
            if (icon) {
                icon.setAttribute('data-lucide', 'check');
                lucide.createIcons();
                setTimeout(() => {
                    icon.setAttribute('data-lucide', 'copy');
                    lucide.createIcons();
                }, 1500);
            }
        } catch(e) {
            // Fallback para file:// donde clipboard API puede estar bloqueada
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
    });
}
```

- [ ] **Step 3: Verificar**

1. Genera un resumen de IA con cualquier grabación.
2. Haz click en el ícono de copiar → el ícono debe cambiar a ✓ por 1.5 segundos.
3. Pega en un editor de texto → debe contener el texto del resumen.

- [ ] **Step 4: Commit**

```bash
git add Recorder/app.js Recorder/index.html
git commit -m "feat: implement copy-to-clipboard for AI result panel"
```

---

## Task 6: Implementar exportación real a PDF con jsPDF

**Archivos:**
- Modificar: `Recorder/index.html` (añadir jsPDF CDN)
- Modificar: `Recorder/app.js:684-690` (handler de export PDF)

**Contexto:** El botón PDF actualmente muestra un `alert` y descarga un `.txt`. jsPDF es una librería CDN que permite generar PDFs reales en el browser sin servidor.

- [ ] **Step 1: Añadir jsPDF al HTML**

En `Recorder/index.html`, justo antes de `<script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/...">` (línea ~213), añade:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

- [ ] **Step 2: Reemplazar el handler de export PDF en `app.js`**

Localiza el bloque (aprox. línea 684):
```js
if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => {
        alert('La exportación a PDF requiere un servidor. Por ahora se descarga como TXT.');
        const text = transcriptContent ? transcriptContent.innerText : '';
        downloadBlob(new Blob([text], {type:'text/plain'}), 'Reunion-NeuroScribe.txt');
    });
}
```

Reemplázalo por:
```js
if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => {
        const text = transcriptContent ? transcriptContent.innerText : '';
        if (!text.trim()) {
            alert('No hay transcripción para exportar.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });

        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const maxWidth = pageWidth - margin * 2;
        const lineHeight = 7;
        let y = margin;

        // Título
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Transcripción — NeuroScribe', margin, y);
        y += lineHeight * 1.5;

        // Fecha
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(new Date().toLocaleDateString('es-ES', { dateStyle: 'long' }), margin, y);
        y += lineHeight * 1.5;

        // Línea separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += lineHeight;

        // Contenido
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach(line => {
            if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += lineHeight;
        });

        doc.save('Reunion-NeuroScribe.pdf');
    });
}
```

- [ ] **Step 3: Verificar**

1. Carga una grabación con transcripción.
2. Haz click en "PDF".
3. Debe descargarse `Reunion-NeuroScribe.pdf` — ábrelo y verifica que muestra la transcripción con título y fecha correctos.
4. En consola: no deben aparecer errores.

- [ ] **Step 4: Commit**

```bash
git add Recorder/app.js Recorder/index.html
git commit -m "feat: implement real PDF export using jsPDF CDN"
```

---

## Task 7: Limpiar AudioContext y MediaStream en errores

**Archivos:**
- Modificar: `Recorder/app.js:169-267` (función `startRecording`)

**Contexto:** El `audioCtx` se crea pero sus nodos fuente (`source`, `analyser`) nunca se desconectan al parar la grabación. Acumulan memoria si el usuario graba múltiples veces. Además, si ocurre un error después de obtener el stream pero antes de iniciar mediaRecorder, el micrófono queda activo.

- [ ] **Step 1: Añadir `currentSource` como variable de módulo**

Al inicio de `app.js`, en la sección `// Web Audio (visualizer only)`, añade:
```js
let currentSource = null;  // Para poder desconectar al parar
```

- [ ] **Step 2: Guardar referencia al source node en `startRecording`**

En `startRecording`, reemplaza:
```js
const source = audioCtx.createMediaStreamSource(stream);
analyser = audioCtx.createAnalyser();
analyser.fftSize = 64;
source.connect(analyser);
```
por:
```js
currentSource = audioCtx.createMediaStreamSource(stream);
analyser = audioCtx.createAnalyser();
analyser.fftSize = 64;
currentSource.connect(analyser);
```

- [ ] **Step 3: Desconectar nodes en el evento `stop` del MediaRecorder**

Dentro del callback `mediaRecorder.addEventListener('stop', async () => { ... })`, justo después de `stream.getTracks().forEach(t => t.stop())`:
```js
// Limpiar nodos de Web Audio
if (currentSource) { currentSource.disconnect(); currentSource = null; }
if (analyser) { analyser.disconnect(); analyser = null; }
```

- [ ] **Step 4: Asegurar limpieza en el catch de `startRecording`**

El bloque `catch(err)` al final de `startRecording` ya llama a `alert`. Añade antes:
```js
} catch(err) {
    // Limpiar stream si se obtuvo antes del error
    if (currentSource) { currentSource.disconnect(); currentSource = null; }
    console.error('Mic error:', err);
    alert('No se pudo acceder al micrófono. Comprueba los permisos del navegador.');
}
```

- [ ] **Step 5: Verificar**

1. Graba y para 3 veces seguidas.
2. Abre DevTools → Memory → Take heap snapshot.
3. Busca `AudioBufferSourceNode` — no debe haber instancias acumuladas.
4. El micrófono (indicador del OS) debe apagarse inmediatamente al parar.

- [ ] **Step 6: Commit**

```bash
git add Recorder/app.js
git commit -m "fix: disconnect Web Audio nodes on stop to prevent memory leak"
```

---

## Checklist de cobertura final

| Mejora | Task |
|--------|------|
| XSS transcript | Task 1 |
| XSS resultado IA | Task 1 |
| Pasos de progreso incompletos | Task 2 |
| Orden activación pasos | Task 2 |
| Modal settings no cableado | Task 3 |
| Selector frágil `btnNewRecording` | Task 3 |
| Globals en `window` | Task 3 |
| Meta-info estática | Task 4 |
| Duración no guardada | Task 4 |
| Botón copiar sin función | Task 5 |
| PDF exporta como TXT | Task 6 |
| Memory leak AudioContext | Task 7 |
