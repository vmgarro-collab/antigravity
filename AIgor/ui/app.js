const API = 'http://localhost:8765';

// --- State ---
const State = { IDLE: 'idle', RECORDING: 'recording', TRANSCRIBING: 'transcribing', RESULTS: 'results', SUMMARIZING: 'summarizing', MINUTAS: 'minutas' };
let currentState = State.IDLE;
let mediaRecorder = null;
let audioChunks = [];
let audioCtx = null;
let analyser = null;
let animId = null;
let timerInterval = null;
let secondsElapsed = 0;
let fullTranscript = '';

// --- DOM ---
const views = {
  idle: document.getElementById('view-idle'),
  recording: document.getElementById('view-recording'),
  transcribing: document.getElementById('view-transcribing'),
  results: document.getElementById('view-results'),
  summarizing: document.getElementById('view-summarizing'),
  minutas: document.getElementById('view-minutas'),
};
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

// --- WAV conversion ---
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

// --- Recording flow ---
async function startRecording() {
  audioChunks = [];
  fullTranscript = '';
  showView(State.RECORDING);

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  startVisualizer(stream);
  startTimer();

  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm', audioBitsPerSecond: 128000 });
  mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
  mediaRecorder.onstop = async () => {
    stopVisualizer();
    showView(State.TRANSCRIBING);
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    const wav = await convertToWav(blob);
    await transcribeFullAudio(wav);
  };
  mediaRecorder.start();
}

function stopRecording() {
  stopTimer();
  mediaRecorder.stop();
}

// --- Transcribe full audio ---
async function transcribeFullAudio(wavBlob) {
  try {
    const form = new FormData();
    form.append('audio', wavBlob, 'recording.wav');
    const res = await fetch(`${API}/transcribe`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const { text } = await res.json();
    fullTranscript = text || '(Sin transcripción)';
    fullTranscriptEl.textContent = fullTranscript;
    showView(State.RESULTS);
    await generateMinutas();
  } catch (e) {
    alert('Error transcribiendo: ' + e.message);
    showView(State.IDLE);
  }
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
    const { result, saved_to } = await res.json();
    minutasContent.innerHTML = marked.parse(result);
    const savedEl = document.getElementById('saved-path');
    if (savedEl) savedEl.textContent = saved_to || '';
    showView(State.MINUTAS);
  } catch (e) {
    alert('Error generando minutas: ' + e.message);
    showView(State.RESULTS);
  }
}

// --- Reset ---
function resetToIdle() {
  audioChunks = [];
  fullTranscript = '';
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
document.getElementById('btn-copy').addEventListener('click', copyMinutas);
document.getElementById('btn-new-1').addEventListener('click', resetToIdle);
document.getElementById('btn-new-2').addEventListener('click', resetToIdle);
