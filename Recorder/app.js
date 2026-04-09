// Initialize Lucide Icons
lucide.createIcons();

// --- STATE MANAGEMENT ---
const State = {
    IDLE: 'idle',
    RECORDING: 'recording',
    TRANSCRIBING: 'transcribing',
    RESULTS: 'results'
};

let currentState = State.IDLE;
let recordingTimer = null;
let secondsRecorded = 0;

// Audio
let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;   // always a WAV blob
let audioUrl = null;    // object URL for the WAV blob

// Web Audio (visualizer only)
let audioCtx = null;
let analyser = null;
let currentSource = null;  // Para desconectar al parar
let dataArray = null;
let animationId = null;
let currentRecordingId = null; // Store ID for persistence updates

// --- HELPERS ---
function updateMetaInfo(rec) {
    if (!metaInfo) return;
    const date = rec.id ? new Date(rec.id).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric'
    }) : '—';
    const dur = rec.duration ? formatTime(rec.duration) : '—';
    metaInfo.textContent = `${date} • ${dur} min`;
}

function renderTranscript(rec, text) {
    if (!transcriptContent) return;

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
            <span class="th-date">${escapeHtml(date)}${time ? ' · ' + escapeHtml(time) : ''}</span>
            <span class="th-meta">${dur}${spk ? ' · ' + spk : ''}</span>
        </div>` : '';

    const bodyHtml = escapeHtml(text)
        .replace(/\n/g, '<br>')
        .replace(/(Hablante\s+\d+):/g, '<span class="speaker">$1:</span>');

    transcriptContent.innerHTML = headerHtml + '<div style="padding:24px">' + bodyHtml + '</div>';
}

function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    return m + ':' + (s % 60).toString().padStart(2, '0');
}

function switchView(newState) {
    currentState = newState;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const viewMap = {
        [State.IDLE]:        'view-recorder',
        [State.RECORDING]:   'view-recorder',
        [State.TRANSCRIBING]:'view-transcribing',
        [State.RESULTS]:     'view-results'
    };
    const el = document.getElementById(viewMap[newState]);
    if (el) el.classList.add('active');
}

// --- DOM REFERENCES ---
const btnRecord      = document.getElementById('btn-record');
const btnStop        = document.getElementById('btn-stop');
const recorderRing   = document.getElementById('recorder-ring');
const statusText     = document.getElementById('status-text');
const timerDisplay   = document.getElementById('recording-timer');
const visualizer     = document.getElementById('audio-visualizer');
const recorderActions= document.getElementById('recorder-actions');
const progressSteps  = document.querySelectorAll('.step');
const progressBar    = document.getElementById('progress-bar');
const transcriptContent = document.getElementById('transcript-content');
const aiResultPanel  = document.getElementById('ai-result-panel');
const aiResultTitle  = document.getElementById('ai-result-title');
const aiResultContent= document.getElementById('ai-result-content');
const btnCopyAi      = document.getElementById('btn-copy-ai');
const btnExportPdf   = document.getElementById('btn-export-pdf');
const btnExportTxt   = document.getElementById('btn-export-txt');
const btnExportAudio = document.getElementById('btn-export-audio');
const btnAiSummary   = document.getElementById('btn-ai-summary');
const btnAiTasks     = document.getElementById('btn-ai-tasks');
const btnAiMindmap   = document.getElementById('btn-ai-mindmap');
const historyMenu    = document.getElementById('history-menu');
const btnNewRecording = document.getElementById('btn-new-recording');
const btnSaveDirectApi  = document.getElementById('btn-save-direct-api');
const settingsModal     = document.getElementById('settings-modal');
const modalApiKeyInput  = document.getElementById('groq-api-key');
const btnCloseSettings  = document.getElementById('btn-close-settings');
const btnSaveSettings   = document.getElementById('btn-save-settings');
const metaInfo          = document.getElementById('meta-info');

// --- GLOBAL AI STATE ---
let rawTranscriptText = ""; // Store actual transcript

let groqApiKeyMemory = ""; // Fallback for file://

function getGroqApiKey() {
    try {
        return localStorage.getItem('groq_api_key') || groqApiKeyMemory;
    } catch (e) {
        return groqApiKeyMemory;
    }
}

function setGroqApiKey(key) {
    groqApiKeyMemory = key;
    try {
        localStorage.setItem('groq_api_key', key);
    } catch (e) {
        console.warn("localStorage bloqueado por file://, usando memoria temporal.");
    }
}

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
            return;
        }
        // Eliminar todos los atributos excepto class y style
        [...el.attributes].forEach(attr => {
            if (!['class', 'style'].includes(attr.name)) el.removeAttribute(attr.name);
        });
    });
    return tmp.innerHTML;
}

// Bypass all DOM / Modal issues using a robust native browser prompt.
function askForGroqApiKey() {
    console.log("askForGroqApiKey called");
    const current = getGroqApiKey();
    const key = prompt("Para transcribir y usar la IA, pega aquí tu API Key de Groq (empieza por gsk_...):\n\nEs gratis en console.groq.com", current);
    if (key !== null && key.trim() !== '') {
        setGroqApiKey(key.trim());
        const directInput = document.getElementById('direct-api-key');
        if (directInput) directInput.value = key.trim();
        alert("Clave guardada en memoria. ¡Listo para grabar!");
        return true;
    }
    return false;
}

function saveDirectApiKey() {
    const input = document.getElementById('direct-api-key');
    if (input && input.value.trim()) {
        setGroqApiKey(input.value.trim());
        alert("¡Clave guardada con éxito!");
    } else {
        alert("Por favor, pega una clave válida.");
    }
}


// Convert Blob to base64 data URL (works from file:// unlike blob: URLs)
function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// --- WAV ENCODER ---
async function blobToWav(inputBlob) {
    const arrayBuffer = await inputBlob.arrayBuffer();
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

    const sr  = decoded.sampleRate;
    const pcm = decoded.getChannelData(0); // mono

    const dataLen = pcm.length * 2;
    const buf     = new ArrayBuffer(44 + dataLen);
    const view    = new DataView(buf);

    const str = (offset, s) => { for(let i=0;i<s.length;i++) view.setUint8(offset+i, s.charCodeAt(i)); };
    str(0, 'RIFF');
    view.setUint32(4,  36 + dataLen, true);
    str(8, 'WAVE');
    str(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1,  true);   // PCM
    view.setUint16(22, 1,  true);   // mono
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * 2, true);
    view.setUint16(32, 2,  true);
    view.setUint16(34, 16, true);
    str(36, 'data');
    view.setUint32(40, dataLen, true);

    let off = 44;
    for (let i = 0; i < pcm.length; i++, off += 2) {
        const s = Math.max(-1, Math.min(1, pcm[i]));
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([buf], { type: 'audio/wav' });
}

// --- RECORDING ---
async function startRecording() {
    if (currentState !== State.IDLE) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Visualizer setup
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!audioCtx) audioCtx = new AC();
        if (audioCtx.state === 'suspended') await audioCtx.resume();

        currentSource = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        currentSource.connect(analyser);
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        // MediaRecorder — collect a chunk every 100ms so stop() has data
        // Optimization: 24kbps is perfect for speech and keeps files tiny for hours
        audioChunks = [];
        const options = { mimeType: 'audio/webm;codecs=opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'audio/ogg;codecs=opus';
        }

        mediaRecorder = new MediaRecorder(stream, {
            ...options,
            audioBitsPerSecond: 24000 
        });

        mediaRecorder.addEventListener('dataavailable', e => {
            if (e.data && e.data.size > 0) audioChunks.push(e.data);
        });

        mediaRecorder.addEventListener('stop', async () => {
            // Stop mic hardware
            stream.getTracks().forEach(t => t.stop());
            // Limpiar nodos de Web Audio
            if (currentSource) { currentSource.disconnect(); currentSource = null; }
            if (analyser) { analyser.disconnect(); analyser = null; }

            // Build raw blob (COMPRESSED)
            const rawBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
            console.log('Raw compressed recording:', rawBlob.type, (rawBlob.size/1024).toFixed(1) + 'KB');

            // Use data URL for local playback (browsers play WebM/Ogg fine)
            audioUrl = await blobToDataUrl(rawBlob);
            audioBlob = rawBlob; // We store the compressed one by default now
            
            console.log('Audio URL ready for playback');

            // Inject player
            const container = document.getElementById('real-audio-container');
            if (container) {
                container.innerHTML = `<audio id="rec-player" controls src="${audioUrl}" class="real-audio"></audio>`;
            }

            // Persist to IndexedDB
            const now = new Date();
            const rec = {
                id:        now.getTime(),
                title:     'Grabación ' + now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
                dateLabel: now.toLocaleDateString(),
                duration:  secondsRecorded,
                audioBlob: rawBlob, // Persist compressed for transcription
                audioUrl:  audioUrl,
                mimeType:  rawBlob.type
            };
            try {
                currentRecordingId = rec.id;
                await saveRecording(rec);
                await loadHistory();
            } catch(e) {
                console.error('DB save error:', e);
            }

            // TRIGGER GROQ TRANSCRIPTION NOW!
            await performRealTranscription(rawBlob);
        });

        // Start with 100ms timeslice for reliable chunks
        mediaRecorder.start(100);

        currentState = State.RECORDING;
        recorderRing.classList.add('recording');
        statusText.innerText = 'Grabando audio...';
        timerDisplay.classList.remove('hidden');
        visualizer.classList.remove('hidden');
        recorderActions.classList.remove('hidden');
        drawVisualizer();

        secondsRecorded = 0;
        timerDisplay.innerText = '00:00';
        recordingTimer = setInterval(() => {
            secondsRecorded++;
            timerDisplay.innerText = formatTime(secondsRecorded);
        }, 1000);

    } catch(err) {
        if (currentSource) { currentSource.disconnect(); currentSource = null; }
        console.error('Mic error:', err);
        alert('No se pudo acceder al micrófono. Comprueba los permisos del navegador.');
    }
}

function drawVisualizer() {
    if (currentState !== State.RECORDING) return;
    animationId = requestAnimationFrame(drawVisualizer);
    if (!analyser || !dataArray) return;
    analyser.getByteFrequencyData(dataArray);
    const bars = visualizer.querySelectorAll('.bar');
    for (let i = 0; i < bars.length; i++) {
        const idx = Math.floor((i / bars.length) * (dataArray.length / 2));
        const pct = Math.max(10, (dataArray[idx] / 255) * 100);
        bars[i].style.height = pct + '%';
    }
}

function stopRecordingAndTranscribe() {
    clearInterval(recordingTimer);
    if (animationId) cancelAnimationFrame(animationId);

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop(); // triggers 'stop' event which builds the WAV
    }

    switchView(State.TRANSCRIBING);
    // Transcription UI state setup (processing starts in mediaRecorder 'stop' event)
    progressSteps.forEach(s => { s.classList.remove('active','done'); setStepIcon(s,'circle',false); });
    progressBar.style.width = '0%';
    activateStep(0); // "Procesando audio"
}

// --- TRANSCRIPTION SIMULATION ---
function setStepIcon(step, icon, spin) {
    const existing = step.querySelector('i') || step.querySelector('svg');
    const newI = document.createElement('i');
    newI.setAttribute('data-lucide', icon);
    if (spin) newI.classList.add('spin');
    if (existing) existing.replaceWith(newI);
    lucide.createIcons();
}

function activateStep(i) {
    if (i >= progressSteps.length) return;
    progressSteps[i].classList.add('active');
    setStepIcon(progressSteps[i], 'loader-2', true);
}

function finishStep(i) {
    if (i >= progressSteps.length) return;
    progressSteps[i].classList.remove('active');
    progressSteps[i].classList.add('done');
    setStepIcon(progressSteps[i], 'check-circle-2', false);
}

async function performRealTranscription(blob) {
    let apiKey = getGroqApiKey();
    if (!apiKey) {
        if (!askForGroqApiKey()) {
            switchView(State.RESULTS);
            rawTranscriptText = "No se pudo transcribir: Falta API Key.";
            renderTranscript(null, rawTranscriptText);
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

        // Actualizar meta-info con datos de la grabación actual
        try {
            const recForMeta = await getRecordingById(currentRecordingId);
            if (recForMeta) updateMetaInfo(recForMeta);
        } catch(e) {}

        setTimeout(async () => {
            switchView(State.RESULTS);
            const recForRender = await getRecordingById(currentRecordingId).catch(() => null);
            renderTranscript(recForRender, rawTranscriptText);
        }, 500);

    } catch (err) {
        console.error("Transcription error:", err);
        alert("Hubo un error al transcribir: " + err.message);
        switchView(State.RESULTS);
        transcriptContent.innerHTML = "Error en la transcripción: " + escapeHtml(err.message);
    }
}

// --- AI ACTIONS (GROQ LLAMA) ---
async function triggerAiAction(type, title) {
    if (!aiResultPanel) return;
    
    let apiKey = getGroqApiKey();
    if (!apiKey) {
        if (!askForGroqApiKey()) return;
        apiKey = getGroqApiKey();
    }

    aiResultPanel.classList.remove('hidden');
    aiResultTitle.innerText = title;
    aiResultContent.innerHTML = `<div class="loader-container"><i data-lucide="loader-2" class="spin"></i> Procesando con Groq LLaMA...</div>`;
    lucide.createIcons();

    let systemPrompt = "";
    if (type === 'summary') {
        systemPrompt = "Eres un asistente de reuniones. Con la transcripción, genera un resumen ejecutivo directo y claro en HTML (usa <h4>, <p>, <ul>). Responde SOLO el HTML, nada más y en español.";
    } else if (type === 'tasks') {
        systemPrompt = "Eres un gestor de proyectos. Extrae todas las tareas implícitas o explícitas y responsables. Genera HTML (usa <h4>, <ul>). Responde SOLO HTML en español.";
    } else if (type === 'mindmap') {
        systemPrompt = "Eres un analista lógico. Representa los conceptos clave en un árbol de texto ASCII dentro de un bloque <pre>. Responde SOLO el bloque <pre> HTML en español.";
    }

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
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Transcripción: ${rawTranscriptText}` }
                ],
                temperature: 0.2
            })
        });

        if (!response.ok) throw new Error("Fallo en la API de Chat Groq");

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Remove markdown formatting if Llama decides to add it inside its response
        const cleanContent = content.replace(/```html/g, '').replace(/```/g, '');

        aiResultContent.innerHTML = sanitizeAiHtml(cleanContent);
    } catch(err) {
        console.error("AI Generation error:", err);
        aiResultContent.innerHTML = `<div style="color:var(--error-color)">Error al generar IA: ${escapeHtml(err.message)}</div>`;
    }
}

// --- HISTORY (IndexedDB) ---
async function loadHistory() {
    if (!historyMenu) return;
    historyMenu.innerHTML = '';
    let records = [];
    try { records = await getAllRecordings(); } catch(e) { console.error(e); return; }

    records.forEach(rec => {
        const container = document.createElement('div');
        container.className = 'history-item-container';
        
        // Main button for selection
        const btn = document.createElement('button');
        btn.className = 'menu-item';
        btn.innerHTML = `<i data-lucide="file-audio"></i> <span class="rec-title">${rec.title}</span> <span class="badge" style="font-size:0.6rem;">${rec.dateLabel}</span>`;
        btn.onclick = () => preloadRecording(rec, btn);
        
        // Actions container
        const actions = document.createElement('div');
        actions.className = 'item-actions';
        
        // Rename button
        const btnRename = document.createElement('button');
        btnRename.className = 'btn-action';
        btnRename.title = 'Renombrar';
        btnRename.innerHTML = `<i data-lucide="pencil"></i>`;
        btnRename.onclick = (e) => {
            e.stopPropagation();
            renameRecordingUI(rec);
        };
        
        // Delete button
        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-action delete';
        btnDelete.title = 'Borrar';
        btnDelete.innerHTML = `<i data-lucide="trash-2"></i>`;
        btnDelete.onclick = (e) => {
            e.stopPropagation();
            deleteRecordingUI(rec.id);
        };
        
        actions.appendChild(btnRename);
        actions.appendChild(btnDelete);
        
        container.appendChild(btn);
        container.appendChild(actions);
        historyMenu.appendChild(container);
    });
    lucide.createIcons();
}

async function renameRecordingUI(rec) {
    const newTitle = prompt("Nuevo nombre para la reunión:", rec.title);
    if (newTitle !== null && newTitle.trim() !== "" && newTitle !== rec.title) {
        rec.title = newTitle.trim();
        try {
            await updateRecording(rec);
            await loadHistory();
        } catch(e) {
            alert("Error al renombrar.");
        }
    }
}

async function deleteRecordingUI(id) {
    if (confirm("¿Estás seguro de que quieres borrar esta grabación permanentemente?")) {
        try {
            await deleteRecording(id);
            if (currentRecordingId === id) {
                switchView(State.IDLE);
                currentRecordingId = null;
            }
            await loadHistory();
        } catch(e) {
            alert("Error al borrar.");
        }
    }
}

async function preloadRecording(rec, btnEl) {
    if (!rec) return;
    
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    currentRecordingId = rec.id;
    audioBlob = rec.audioBlob;
    audioUrl = rec.audioUrl || await blobToDataUrl(rec.audioBlob);

    switchView(State.RESULTS);
    updateMetaInfo(rec);

    // Inject player (Browsers handle WebM/Ogg natively)
    const container = document.getElementById('real-audio-container');
    if (container) {
        container.innerHTML = `<audio id="rec-player" controls src="${audioUrl}" class="real-audio"></audio>`;
    }
    
    // Show saved transcript or fallback
    if (rec.transcript) {
        rawTranscriptText = rec.transcript;
        renderTranscript(rec, rawTranscriptText);
    } else {
        rawTranscriptText = "";
        transcriptContent.innerHTML = `
            <div style="text-align:center; padding: 40px; color: var(--text-secondary);">
                <i data-lucide="alert-circle" style="width:48px; height:48px; margin-bottom:16px;"></i>
                <p>Esta grabación no tiene transcripción guardada.</p>
                <button class="btn-primary" style="margin: 20px auto;" onclick="reTranscribeCurrent()">
                    <i data-lucide="refresh-cw"></i> Transcribir ahora
                </button>
            </div>
        `;
        lucide.createIcons();
    }
    
    if (aiResultPanel) aiResultPanel.classList.add('hidden');
}

async function reTranscribeCurrent() {
    if (!currentRecordingId) return;
    try {
        const rec = await getRecordingById(currentRecordingId);
        if (rec && rec.audioBlob) {
            switchView(State.TRANSCRIBING);
            // Reset UI for transcription
            progressSteps.forEach(s => { s.classList.remove('active','done'); setStepIcon(s,'circle',false); });
            progressBar.style.width = '0%';
            activateStep(0);
            // Send the raw compressed blob to Groq
            await performRealTranscription(rec.audioBlob);
        }
    } catch(e) {
        console.error(e);
        alert("No se pudo recuperar el audio para transcribir.");
    }
}
// Exponer para onclick inline en preloadRecording (innerHTML no puede usar funciones locales directamente)
window.reTranscribeCurrent = reTranscribeCurrent;

// --- EXPORT ---
// Uses the native OS "Save As" dialog — works from file:// with no name issues
async function downloadBlob(blob, filename) {
    // 1. File System Access API: native Save As dialog (Chrome 86+, Edge 86+)
    if (window.showSaveFilePicker) {
        try {
            const ext = filename.split('.').pop().toLowerCase();
            const mimeMap = { wav: 'audio/wav', txt: 'text/plain', pdf: 'application/pdf' };
            const mime = mimeMap[ext] || 'application/octet-stream';
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{ description: filename, accept: { [mime]: ['.' + ext] } }]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch(err) {
            if (err.name === 'AbortError') return; // user cancelled — do nothing
            console.warn('showSaveFilePicker failed, falling back:', err);
        }
    }
    // 2. FileSaver.js fallback
    if (typeof saveAs === 'function') {
        saveAs(blob, filename);
        return;
    }
    // 3. Last resort: data URL
    const dataUrl = await blobToDataUrl(blob);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// --- DB INIT: run immediately (scripts are at end of body so DOM is already ready) ---
(async function init() {
    console.group('NeuroScribe Init');
    console.log('DOM ready, initialising DB...');
    try {
        await initDB();
        console.log('IndexedDB OK');
        await loadHistory();
        console.log('History loaded');
        
        // Pre-fill direct API key if exists
        const key = getGroqApiKey();
        const directInput = document.getElementById('direct-api-key');
        if (key && directInput) {
            directInput.value = key;
        }
    } catch(e) {
        console.warn('IndexedDB unavailable (file:// restriction?):', e.message || e);
    }
    console.log('Buttons found:', {
        record:       !!btnRecord,
        stop:         !!btnStop,
        exportAudio:  !!btnExportAudio,
        aiSummary:    !!btnAiSummary,
        aiTasks:      !!btnAiTasks,
        aiMindmap:    !!btnAiMindmap
    });
    console.groupEnd();
})();

btnRecord.addEventListener('click', () => {
    if (currentState === State.IDLE) startRecording();
});

btnStop.addEventListener('click', () => {
    if (currentState === State.RECORDING) stopRecordingAndTranscribe();
});

if (btnNewRecording) {
    btnNewRecording.addEventListener('click', () => {
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        btnNewRecording.classList.add('active');
        switchView(State.IDLE);
        recorderRing.classList.remove('recording');
        timerDisplay.classList.add('hidden');
        visualizer.classList.add('hidden');
        recorderActions.classList.add('hidden');
        statusText.innerText = 'Listo para empezar';
    });
}

if (btnAiSummary)  btnAiSummary.addEventListener('click',  () => triggerAiAction('summary',  'Resumen Ejecutivo'));
if (btnAiTasks)    btnAiTasks.addEventListener('click',    () => triggerAiAction('tasks',    'Tareas Extraídas'));
if (btnAiMindmap)  btnAiMindmap.addEventListener('click',  () => triggerAiAction('mindmap',  'Mapa Mental'));

if (btnExportTxt) {
    btnExportTxt.addEventListener('click', () => {
        const text = transcriptContent ? transcriptContent.innerText : '';
        downloadBlob(new Blob([text], {type:'text/plain'}), 'Reunion-NeuroScribe.txt');
    });
}

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

if (btnExportAudio) {
    btnExportAudio.addEventListener('click', async () => {
        if (!audioBlob) {
            alert('No hay ninguna grabación cargada. Graba o selecciona una reunión primero.');
            return;
        }

        // If it's already a WAV (old logic), download directly
        if (audioBlob.type === 'audio/wav') {
            downloadBlob(audioBlob, 'Audio-NeuroScribe.wav');
            return;
        }

        // If it's compressed (new logic), convert to WAV for the user
        const oldText = btnExportAudio.innerHTML;
        btnExportAudio.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Convirtiendo a WAV...`;
        lucide.createIcons();

        try {
            const wav = await blobToWav(audioBlob);
            downloadBlob(wav, 'Audio-NeuroScribe.wav');
        } catch(e) {
            console.error("WAV conversion error:", e);
            // Fallback: download as is
            downloadBlob(audioBlob, 'Audio-NeuroScribe.webm');
        } finally {
            btnExportAudio.innerHTML = oldText;
            lucide.createIcons();
        }
    });
}

// --- SETTINGS MODAL ---
function openSettingsModal() {
    const key = getGroqApiKey();
    if (modalApiKeyInput) modalApiKeyInput.value = key || '';
    if (settingsModal) settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    if (settingsModal) settingsModal.classList.add('hidden');
}

const btnSettingsModal = document.getElementById('btn-settings-modal');
if (btnSettingsModal) btnSettingsModal.addEventListener('click', openSettingsModal);

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

// --- COPY AI RESULT ---
if (btnCopyAi) {
    btnCopyAi.addEventListener('click', async () => {
        const text = aiResultContent ? aiResultContent.innerText : '';
        if (!text.trim()) return;
        try {
            await navigator.clipboard.writeText(text);
        } catch(e) {
            // Fallback para file:// donde clipboard API puede estar bloqueada
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        // Feedback visual: cambiar icono a check por 1.5s
        const iconEl = btnCopyAi.querySelector('[data-lucide]');
        if (iconEl) {
            iconEl.setAttribute('data-lucide', 'check');
            lucide.createIcons();
            setTimeout(() => {
                iconEl.setAttribute('data-lucide', 'copy');
                lucide.createIcons();
            }, 1500);
        }
    });
}
