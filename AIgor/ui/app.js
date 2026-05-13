const API = 'http://localhost:8765';

// --- State ---
const State = { IDLE: 'idle', RECORDING: 'recording', DETAIL: 'detail' };
let currentState = State.IDLE;
let mediaRecorder = null;
let audioChunks = [];
let audioCtx = null;
let analyser = null;
let animId = null;
let timerInterval = null;
let secondsElapsed = 0;
let activeRecId = null;

// --- DOM ---
const timerEl    = document.getElementById('timer');
const canvas     = document.getElementById('visualizer');
const ctx2d      = canvas.getContext('2d');

function showView(name) {
  document.querySelectorAll('.rec-panel').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name)?.classList.add('active');
  currentState = name;
}

// --- Timer ---
function startTimer() {
  secondsElapsed = 0;
  timerEl.textContent = '00:00';
  timerInterval = setInterval(() => {
    secondsElapsed++;
    const m = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const s = String(secondsElapsed % 60).padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
  }, 1000);
}
function stopTimer() { clearInterval(timerInterval); }

// --- Visualizer ---
function startVisualizer(stream) {
  audioCtx = new AudioContext();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  audioCtx.createMediaStreamSource(stream).connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);
  function draw() {
    animId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(data);
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    const bw = canvas.width / data.length;
    data.forEach((v, i) => {
      const h = (v / 255) * canvas.height;
      const g = ctx2d.createLinearGradient(0, canvas.height - h, 0, canvas.height);
      g.addColorStop(0, '#7c3aed'); g.addColorStop(1, '#06b6d4');
      ctx2d.fillStyle = g;
      ctx2d.fillRect(i * bw, canvas.height - h, bw - 1, h);
    });
  }
  draw();
}
function stopVisualizer() {
  cancelAnimationFrame(animId);
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
}

// --- WAV conversion ---
async function convertToWav(blob) {
  const buf = await blob.arrayBuffer();
  const tmp = new AudioContext();
  const decoded = await tmp.decodeAudioData(buf);
  tmp.close();
  const sr = decoded.sampleRate, len = decoded.length;
  const pcm = new Int16Array(len);
  const ch = decoded.getChannelData(0);
  for (let i = 0; i < len; i++) pcm[i] = Math.max(-32768, Math.min(32767, Math.round(ch[i] * 32767)));
  const wavBuf = new ArrayBuffer(44 + pcm.byteLength);
  const view = new DataView(wavBuf);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  ws(0,'RIFF'); view.setUint32(4,36+pcm.byteLength,true); ws(8,'WAVE'); ws(12,'fmt ');
  view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
  view.setUint32(24,sr,true); view.setUint32(28,sr*2,true);
  view.setUint16(32,2,true); view.setUint16(34,16,true); ws(36,'data');
  view.setUint32(40,pcm.byteLength,true); new Int16Array(wavBuf,44).set(pcm);
  return new Blob([wavBuf], { type: 'audio/wav' });
}

function blobToDataUrl(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

// --- Recording ---
async function startRecording() {
  audioChunks = [];
  showView('recording');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  startVisualizer(stream);
  startTimer();
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm', audioBitsPerSecond: 24000 });
  mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
  mediaRecorder.onstop = async () => {
    stream.getTracks().forEach(t => t.stop());
    stopVisualizer();
    await saveAndShow();
  };
  mediaRecorder.start(100);
}

function stopRecording() {
  stopTimer();
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
}

// --- Save immediately + show player, auto-process ---
async function saveAndShow() {
  const rawBlob = new Blob(audioChunks, { type: 'audio/webm' });
  const audioUrl = await blobToDataUrl(rawBlob);
  const id = Date.now();
  const now = new Date(id);
  const datePrefix = now.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const title = datePrefix;

  const rec = {
    id, title,
    date: id,
    duration: secondsElapsed,
    audioBlob: rawBlob,
    audioUrl,
    mimeType: rawBlob.type,
    status: 'pending',
    transcript: null,
    minutas: null,
    savedTo: null,
    audioSavedTo: null,
  };

  await recDbSave(rec);
  activeRecId = id;
  await loadHistory();
  openRecording(id);
  // Save WAV only — transcription happens when user clicks "Generar minutas"
  saveWavOnly(id, rawBlob);
}

async function saveWavOnly(id, rawBlob) {
  try {
    const recs = await recDbGetAll();
    const rec = recs.find(r => r.id === id);
    const stem = rec ? recFileStem(rec) : `grabacion_${id}`;
    const wav = await convertToWav(rawBlob);
    const form = new FormData();
    form.append('audio', wav, 'audio.wav');
    form.append('name', stem);
    const res = await fetch(`${API}/recording/save-wav`, { method: 'POST', body: form });
    if (res.ok) {
      rec.audioSavedTo = (await res.json()).saved_to;
      rec.status = 'saved';
      await recDbSave(rec);
      await loadHistory();
    }
  } catch (e) {
    console.warn('[saveWavOnly]', e);
  }
}

// --- Build filename stem from recording ---
function recFileStem(rec) {
  const d = new Date(rec.date);
  const pad = n => String(n).padStart(2, '0');
  const datePart = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
  const desc = rec.description ? '_' + rec.description.replace(/\s+/g, '_').replace(/[^\w\-]/g, '') : '';
  return `${datePart}${desc}`;
}

// --- Auto-process: transcribe + save audio + generate minutas ---
async function processInBackground(id, rawBlob) {
  const isActive = () => activeRecId === id;
  const minutasEl = () => document.getElementById('detail-minutas');
  const statusEl = () => document.getElementById('detail-status');
  const transcriptEl = () => document.getElementById('detail-transcript');

  try {
    await updateStatus(id, 'processing');
    await loadHistory();

    // Phase 1: Convert + save WAV + transcribe
    const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    let transcribeSecs = 0;
    let transcribeTimer = null;
    if (isActive()) {
      minutasEl().innerHTML = `<div class="rec-processing"><div class="mini-spinner"></div><span> 🎙 Transcribiendo… 00:00</span></div>`;
      statusEl().textContent = '🔄 Transcribiendo';
      transcribeTimer = setInterval(() => {
        transcribeSecs++;
        if (isActive()) {
          const sp = minutasEl().querySelector('.rec-processing span');
          if (sp) sp.textContent = ` 🎙 Transcribiendo… ${fmtTime(transcribeSecs)}`;
        }
      }, 1000);
    }

    const recs = await recDbGetAll();
    const rec = recs.find(r => r.id === id);
    const stem = rec ? recFileStem(rec) : `grabacion_${id}`;

    const wav = await convertToWav(rawBlob);

    // Save audio
    const wavForm = new FormData();
    wavForm.append('audio', wav, 'audio.wav');
    wavForm.append('name', stem);
    const wavRes = await fetch(`${API}/recording/save-wav`, { method: 'POST', body: wavForm });
    const audioSavedTo = wavRes.ok ? (await wavRes.json()).saved_to : '';

    // Transcribe
    const tForm = new FormData();
    tForm.append('audio', wav, 'recording.wav');
    const tRes = await fetch(`${API}/transcribe`, { method: 'POST', body: tForm });
    clearInterval(transcribeTimer);
    if (!tRes.ok) throw new Error(await tRes.text());
    const { text } = await tRes.json();

    // Show transcript
    if (isActive() && transcriptEl()) transcriptEl().value = text;

    // Phase 2: Streaming summarization
    await streamMinutas(id, text, stem, audioSavedTo);

  } catch (e) {
    await updateStatus(id, 'error');
    await loadHistory();
    if (isActive()) openRecording(id);
    console.error('[background]', e);
  }
}

// --- Stream minutas from text, save file ---
async function streamMinutas(id, text, stem, audioSavedTo) {
  const isActive = () => activeRecId === id;
  const minutasEl = () => document.getElementById('detail-minutas');
  const statusEl = () => document.getElementById('detail-status');

  if (isActive()) {
    minutasEl().innerHTML = '';
    const pre = document.createElement('pre');
    pre.className = 'streaming-pre';
    minutasEl().appendChild(pre);
    statusEl().textContent = '🔄 Generando minutas…';
  }

  let fullText = '';
  let savedTo = '';

  const streamRes = await fetch(`${API}/summarize/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, name: stem }),
  });
  if (!streamRes.ok) throw new Error(await streamRes.text());

  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = JSON.parse(line.slice(6));
      if (data.delta) {
        fullText += data.delta;
        if (isActive()) {
          const pre = minutasEl().querySelector('pre.streaming-pre');
          if (pre) pre.textContent = fullText;
        }
      }
      if (data.done) {
        savedTo = data.saved_to || '';
        if (isActive()) minutasEl().innerHTML = marked.parse(fullText);
      }
      if (data.error) throw new Error(data.error);
    }
  }

  // Extract title from minutas
  const titleLine = fullText.split('\n').find(l => /^#{1,2}\s/.test(l)) || '';
  const newTitle = titleLine.replace(/^#+\s*/, '').trim().substring(0, 60) || 'Grabación';

  // Persist
  const recs = await recDbGetAll();
  const rec = recs.find(r => r.id === id);
  if (rec) {
    rec.transcript = text;
    rec.minutas = fullText;
    rec.savedTo = savedTo;
    if (audioSavedTo) rec.audioSavedTo = audioSavedTo;
    rec.title = newTitle;
    rec.status = 'done';
    await recDbSave(rec);
  }

  if (isActive()) statusEl().textContent = '';
  await loadHistory();
}

async function updateStatus(id, status) {
  const recs = await recDbGetAll();
  const rec = recs.find(r => r.id === id);
  if (rec) { rec.status = status; await recDbSave(rec); }
}

// --- Sidebar history ---
function escR(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const STATUS_ICON = { pending: '⏳', processing: '🔄', done: '✓', error: '⚠' };

async function loadHistory() {
  const listEl = document.getElementById('rec-list');
  try {
    const recs = await recDbGetAll();
    if (!recs.length) {
      listEl.innerHTML = '<div class="rec-list-empty">Sin grabaciones</div>';
      return;
    }
    listEl.innerHTML = recs.map(r => {
      const dateStr = new Date(r.date).toLocaleString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
      const icon = STATUS_ICON[r.status] || '⏳';
      const isActive = r.id === activeRecId;
      return `
        <div class="rec-item ${isActive ? 'active' : ''}" data-id="${r.id}">
          <div class="rec-item-main" onclick="openRecording(${r.id})">
            <div class="rec-item-title">${escR(r.title)}</div>
            <div class="rec-item-meta">${icon} ${dateStr}</div>
          </div>
          <div class="rec-item-actions">
            <button class="rec-action-btn" title="Abrir en Claude" onclick="launchClaudeRec(${r.id}, event)">⬡</button>
            <button class="rec-action-btn" title="Renombrar" onclick="renameRec(${r.id}, event)">✏</button>
            <button class="rec-action-btn danger" title="Borrar" onclick="deleteRec(${r.id}, event)">🗑</button>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    listEl.innerHTML = '<div class="rec-list-empty">Error</div>';
  }
}

async function openRecording(id) {
  activeRecId = id;
  document.querySelectorAll('.rec-item').forEach(el => el.classList.toggle('active', Number(el.dataset.id) === id));

  const recs = await recDbGetAll();
  const rec = recs.find(r => r.id === id);
  if (!rec) return;

  // Player
  document.getElementById('detail-player').innerHTML =
    `<audio controls src="${rec.audioUrl}" style="width:100%;border-radius:8px"></audio>`;

  document.getElementById('detail-title').textContent = rec.title;
  document.getElementById('detail-date').textContent = new Date(rec.date).toLocaleString('es-ES', { dateStyle:'medium', timeStyle:'short' });

  const minutasEl = document.getElementById('detail-minutas');
  const transcriptEl = document.getElementById('detail-transcript');

  if (rec.status === 'done') {
    minutasEl.innerHTML = marked.parse(rec.minutas || '');
    transcriptEl.value = rec.transcript || '';
    document.getElementById('detail-status').textContent = '';
  } else if (rec.status === 'processing') {
    minutasEl.innerHTML = '<div class="rec-processing"><div class="mini-spinner"></div><span> Procesando…</span></div>';
    transcriptEl.value = '';
    document.getElementById('detail-status').textContent = '🔄 Procesando';
  } else if (rec.status === 'error') {
    minutasEl.innerHTML = '<p style="color:#ef4444">Error al procesar. <button class="btn btn-ghost btn-sm" onclick="retryRec(' + id + ')">Reintentar</button></p>';
    transcriptEl.value = rec.transcript || '';
    document.getElementById('detail-status').textContent = '⚠ Error';
  } else {
    minutasEl.innerHTML = '<p style="color:var(--text-muted)">Procesando…</p>';
    transcriptEl.value = '';
    document.getElementById('detail-status').textContent = '⏳';
  }

  showView('detail');
}

window.openRecording = openRecording;

async function renameRec(id, e) {
  e.stopPropagation();
  const recs = await recDbGetAll();
  const rec = recs.find(r => r.id === id);
  if (!rec) return;

  // Date prefix is always preserved — only ask for the description
  const datePrefix = new Date(rec.date).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const currentDesc = rec.description || '';
  const desc = prompt(`Descripción (la fecha ${datePrefix} se conserva):`, currentDesc);
  if (desc === null) return;
  const newDesc = desc.trim();
  const newTitle = newDesc ? `${datePrefix} — ${newDesc}` : datePrefix;

  // Rename files on disk if they exist
  if (rec.savedTo || rec.audioSavedTo) {
    try {
      const res = await fetch(`${API}/recording/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minutas_path: rec.savedTo || '',
          audio_path: rec.audioSavedTo || '',
          new_name: newTitle,
        }),
      });
      if (res.ok) {
        const { minutas_path, audio_path } = await res.json();
        if (minutas_path) rec.savedTo = minutas_path;
        if (audio_path) rec.audioSavedTo = audio_path;
      }
    } catch (err) {
      console.warn('Rename files failed:', err);
    }
  }

  rec.title = newTitle;
  rec.description = newDesc;
  await recDbSave(rec);
  await loadHistory();
  if (activeRecId === id) document.getElementById('detail-title').textContent = newTitle;
}
window.renameRec = renameRec;

async function deleteRec(id, e) {
  e.stopPropagation();
  if (!confirm('¿Borrar esta grabación?')) return;
  await recDbDelete(id);
  if (activeRecId === id) { activeRecId = null; showView('idle'); }
  await loadHistory();
}
window.deleteRec = deleteRec;

async function retryRec(id) {
  const recs = await recDbGetAll();
  const rec = recs.find(r => r.id === id);
  if (rec && rec.audioBlob) processInBackground(id, rec.audioBlob);
}
window.retryRec = retryRec;

let _pendingClaudePrompt = '';

async function launchClaudeRec(id, e) {
  e.stopPropagation();
  const recs = await recDbGetAll();
  const rec = recs.find(r => r.id === id);
  if (!rec) return;

  const dateStr = new Date(rec.date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
  let p = `Tengo la transcripción de una reunión del ${dateStr}:\n\nTítulo: ${rec.title}\n\n`;
  if (rec.minutas) p += `## Minutas\n${rec.minutas}\n\n`;
  if (rec.transcript) p += `## Transcripción completa\n${rec.transcript}`;
  _pendingClaudePrompt = p;

  // Position popover fixed near the button
  const popover = document.getElementById('rec-claude-popover');
  const btn = e.target.closest('button') || e.target;
  const rect = btn.getBoundingClientRect();
  popover.style.top = `${rect.bottom + 6}px`;
  popover.style.left = `${rect.left}px`;
  popover.style.display = popover.style.display === 'none' ? 'flex' : 'none';
}
window.launchClaudeRec = launchClaudeRec;

async function confirmClaudeRec(projectId) {
  document.getElementById('rec-claude-popover').style.display = 'none';
  await navigator.clipboard.writeText(_pendingClaudePrompt);
  const url = projectId
    ? `claude://claude.ai/project/${projectId}`
    : `claude://claude.ai/new?q=${encodeURIComponent(_pendingClaudePrompt)}`;
  window.open(url, '_blank');
}
window.confirmClaudeRec = confirmClaudeRec;

// Close popover on outside click
document.addEventListener('click', e => {
  const pop = document.getElementById('rec-claude-popover');
  if (!pop) return;
  if (pop.contains(e.target)) return;
  if (e.target.closest && e.target.closest('[onclick*="launchClaudeRec"]')) return;
  pop.style.display = 'none';
});

// --- Event listeners ---
document.getElementById('btn-start').addEventListener('click', startRecording);
document.getElementById('btn-stop').addEventListener('click', stopRecording);
document.getElementById('btn-download-wav').addEventListener('click', async () => {
  const btn = document.getElementById('btn-download-wav');
  if (!activeRecId) return;
  btn.textContent = '⏳ Convirtiendo…';
  btn.disabled = true;
  try {
    const recs = await recDbGetAll();
    const rec = recs.find(r => r.id === activeRecId);
    if (!rec?.audioBlob) throw new Error('Sin audio en memoria');
    const wav = await convertToWav(rec.audioBlob);

    // Save to minutas folder
    const form = new FormData();
    form.append('audio', wav, 'audio.wav');
    form.append('name', recFileStem(rec));
    const res = await fetch(`${API}/recording/save-wav`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(await res.text());
    rec.audioSavedTo = (await res.json()).saved_to;
    await recDbSave(rec);

    await navigator.clipboard.writeText(rec.audioSavedTo);
    btn.textContent = '✓ Guardado — ruta copiada';
    setTimeout(() => { btn.textContent = '⬇ Guardar audio'; btn.disabled = false; }, 2500);
  } catch (e) {
    alert('Error: ' + e.message);
    btn.textContent = '⬇ Descargar audio';
    btn.disabled = false;
  }
});

document.getElementById('btn-generate-minutas').addEventListener('click', async () => {
  const btn = document.getElementById('btn-generate-minutas');
  if (!activeRecId) return;
  const transcriptText = document.getElementById('detail-transcript').value.trim();
  if (!transcriptText) {
    // No transcript yet — need to run full process
    const recs = await recDbGetAll();
    const rec = recs.find(r => r.id === activeRecId);
    if (!rec?.audioBlob) { alert('Sin audio ni transcripción disponibles'); return; }
    btn.textContent = '⏳ Procesando…';
    btn.disabled = true;
    try {
      await processInBackground(activeRecId, rec.audioBlob);
    } catch (e) { alert('Error: ' + e.message); }
    btn.textContent = '📝 Generar minutas';
    btn.disabled = false;
    return;
  }
  // Use whatever is in the transcript box (manual paste or existing)
  btn.textContent = '⏳ Generando…';
  btn.disabled = true;
  try {
    const recs = await recDbGetAll();
    const rec = recs.find(r => r.id === activeRecId);
    const stem = rec ? recFileStem(rec) : `grabacion_${activeRecId}`;
    await streamMinutas(activeRecId, transcriptText, stem, rec?.audioSavedTo || '');
  } catch (e) { alert('Error: ' + e.message); }
  btn.textContent = '📝 Generar minutas';
  btn.disabled = false;
});

document.getElementById('btn-open-word').addEventListener('click', async () => {
  const btn = document.getElementById('btn-open-word');
  if (!activeRecId) return;
  // Save WAV first if not saved
  try {
    const recs = await recDbGetAll();
    const rec = recs.find(r => r.id === activeRecId);
    if (rec?.audioBlob && !rec.audioSavedTo) {
      btn.textContent = '⏳ Guardando audio…';
      const wav = await convertToWav(rec.audioBlob);
      const form = new FormData();
      form.append('audio', wav, 'audio.wav');
      form.append('name', recFileStem(rec));
      const res = await fetch(`${API}/recording/save-wav`, { method: 'POST', body: form });
      if (res.ok) { rec.audioSavedTo = (await res.json()).saved_to; await recDbSave(rec); }
    }
    if (rec?.audioSavedTo) {
      await navigator.clipboard.writeText(rec.audioSavedTo);
      btn.textContent = '📋 Ruta copiada';
    }
  } catch (e) { console.warn(e); }
  window.open('https://word.new', '_blank');
  setTimeout(() => { btn.textContent = '📄 Abrir en Word'; }, 3000);
});

document.getElementById('btn-claude-detail').addEventListener('click', (e) => {
  if (activeRecId) launchClaudeRec(activeRecId, e);
});

document.getElementById('btn-new-recording').addEventListener('click', () => {
  activeRecId = null;
  document.querySelectorAll('.rec-item').forEach(el => el.classList.remove('active'));
  showView('idle');
});

// ── Sidebar navigation ──
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('module-' + btn.dataset.module).classList.add('active');
    if (btn.dataset.module === 'calendar') loadMeetingsToday();
    if (btn.dataset.module === 'mail') loadEmails();
    if (btn.dataset.module === 'dashboard') initDashboardModule();
    if (btn.dataset.module === 'vault') initVaultModule();
  });
});

// --- Init ---
recDbInit().then(loadHistory).catch(console.error);
