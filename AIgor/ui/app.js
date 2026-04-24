const API = 'http://localhost:8765';
const CHUNK_SECONDS = 8;

// --- State ---
const State = { IDLE: 'idle', RECORDING: 'recording', RESULTS: 'results', SUMMARIZING: 'summarizing', MINUTAS: 'minutas' };
let currentState = State.IDLE;
let mediaRecorder = null;
let audioCtx = null;
let analyser = null;
let animId = null;
let timerInterval = null;
let secondsElapsed = 0;
let fullTranscript = '';
let chunkInterval = null;
let currentChunkChunks = [];

// --- DOM ---
const views = {
  idle: document.getElementById('view-idle'),
  recording: document.getElementById('view-recording'),
  results: document.getElementById('view-results'),
  summarizing: document.getElementById('view-summarizing'),
  minutas: document.getElementById('view-minutas'),
};
const liveTranscript = document.getElementById('live-transcript');
const fullTranscriptEl = document.getElementById('full-transcript');
const minutasContent = document.getElementById('minutas-content');
const timerEl = document.getElementById('timer');
const canvas = document.getElementById('visualizer');
const ctx2d = canvas.getContext('2d');

function showView(name) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  views[name].classList.add('active');
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
  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);
  function draw() {
    animId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(data);
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    ctx2d.fillStyle = 'rgba(0,0,0,0)';
    const bw = canvas.width / data.length;
    data.forEach((v, i) => {
      const h = (v / 255) * canvas.height;
      const grad = ctx2d.createLinearGradient(0, canvas.height - h, 0, canvas.height);
      grad.addColorStop(0, '#7c3aed');
      grad.addColorStop(1, '#06b6d4');
      ctx2d.fillStyle = grad;
      ctx2d.fillRect(i * bw, canvas.height - h, bw - 1, h);
    });
  }
  draw();
}

function stopVisualizer() {
  cancelAnimationFrame(animId);
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
}

// --- Chunk recording & transcription ---
function startChunkRecorder(stream) {
  currentChunkChunks = [];

  function recordChunk() {
    currentChunkChunks = [];
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mr.ondataavailable = e => { if (e.data.size > 0) currentChunkChunks.push(e.data); };
    mr.onstop = async () => {
      const blob = new Blob(currentChunkChunks, { type: 'audio/webm' });
      const wav = await convertToWav(blob);
      await sendChunk(wav);
    };
    mr.start();
    mediaRecorder = mr;
  }

  recordChunk();
  chunkInterval = setInterval(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      recordChunk();
    }
  }, CHUNK_SECONDS * 1000);
}

function stopChunkRecorder() {
  clearInterval(chunkInterval);
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
}

async function convertToWav(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const tmpCtx = new AudioContext();
  const decoded = await tmpCtx.decodeAudioData(arrayBuffer);
  tmpCtx.close();

  const sampleRate = decoded.sampleRate;
  const length = decoded.length;
  const pcm = new Int16Array(length);
  const chData = decoded.getChannelData(0);
  for (let i = 0; i < length; i++) {
    pcm[i] = Math.max(-32768, Math.min(32767, Math.round(chData[i] * 32767)));
  }

  const wavBuf = new ArrayBuffer(44 + pcm.byteLength);
  const view = new DataView(wavBuf);
  const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, pcm.byteLength, true);
  new Int16Array(wavBuf, 44).set(pcm);

  return new Blob([wavBuf], { type: 'audio/wav' });
}

async function sendChunk(wavBlob) {
  try {
    const form = new FormData();
    form.append('audio', wavBlob, 'chunk.wav');
    const res = await fetch(`${API}/transcribe`, { method: 'POST', body: form });
    if (!res.ok) return;
    const { text } = await res.json();
    if (text && text.trim()) {
      fullTranscript += (fullTranscript ? ' ' : '') + text.trim();
      liveTranscript.textContent = fullTranscript;
      liveTranscript.classList.remove('empty');
      liveTranscript.scrollTop = liveTranscript.scrollHeight;
    }
  } catch (e) {
    console.error('Error transcribiendo chunk:', e);
  }
}

// --- Recording flow ---
async function startRecording() {
  fullTranscript = '';
  liveTranscript.textContent = 'Transcripción en tiempo real...';
  liveTranscript.classList.add('empty');
  showView(State.RECORDING);

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  startVisualizer(stream);
  startTimer();
  startChunkRecorder(stream);
}

async function stopRecording() {
  stopTimer();
  stopVisualizer();
  stopChunkRecorder();
  showView(State.RESULTS);
  fullTranscriptEl.textContent = fullTranscript || '(Sin transcripción)';
}

// --- Summarize ---
async function generateMinutas() {
  showView(State.SUMMARIZING);
  try {
    const res = await fetch(`${API}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: fullTranscript }),
    });
    const { result } = await res.json();
    minutasContent.innerHTML = marked.parse(result);
    showView(State.MINUTAS);
  } catch (e) {
    alert('Error generando minutas: ' + e.message);
    showView(State.RESULTS);
  }
}

// --- Reset ---
function resetToIdle() {
  fullTranscript = '';
  liveTranscript.textContent = 'Transcripción en tiempo real...';
  liveTranscript.classList.add('empty');
  fullTranscriptEl.textContent = '';
  minutasContent.innerHTML = '';
  showView(State.IDLE);
}

// --- Copy ---
function copyMinutas() {
  const text = minutasContent.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copy');
    const orig = btn.textContent;
    btn.textContent = '✓ Copiado';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
}

// --- Event listeners ---
document.getElementById('btn-start').addEventListener('click', startRecording);
document.getElementById('btn-stop').addEventListener('click', stopRecording);
document.getElementById('btn-summarize').addEventListener('click', generateMinutas);
document.getElementById('btn-copy').addEventListener('click', copyMinutas);
document.getElementById('btn-new-1').addEventListener('click', resetToIdle);
document.getElementById('btn-new-2').addEventListener('click', resetToIdle);
