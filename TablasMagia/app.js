// === Estado global ===
let currentScreen = 'home'

// Datos persistentes (cargados de localStorage al inicio)
let starsData = {}       // { "1": 2, "7": 3, ... }
let trophies = []        // ["principiante", "maestra"]
let streak = { date: '', count: 0 }
let weakness = {}        // { "7x8": { attempts, errors }, ... }

// Estado de sesión de juego (se reinicia por partida)
let quizQuestions = []
let quizIndex = 0
let quizScore = 0
let quizAnswers = []     // { correct, timeMs }
let quizTimer = null
let quizStartTime = 0

let islaTable = 0
let islaQuestions = []
let islaIndex = 0
let islaAnswers = []
let islaIsRetoFinal = false

let entrenaQuestions = []
let entrenaIndex = 0
let entrenaSnapshotBefore = {}  // tasa de error antes de la sesión

// Entrada del usuario (teclado numérico acumulado)
let currentInput = ''
let activeMode = ''  // 'quiz' | 'isla' | 'entrena'

// === Inicialización ===
function init() {
  loadFromStorage()
  updateStreak()
  renderHome()
  registerServiceWorker()
}

function loadFromStorage() {
  try {
    starsData  = JSON.parse(localStorage.getItem('tm_stars'))    || {}
    trophies   = JSON.parse(localStorage.getItem('tm_trophies')) || []
    streak     = JSON.parse(localStorage.getItem('tm_streak'))   || { date: '', count: 0 }
    weakness   = JSON.parse(localStorage.getItem('tm_weakness')) || {}
  } catch {
    starsData = {}; trophies = []; streak = { date: '', count: 0 }; weakness = {}
  }
}

function saveToStorage() {
  localStorage.setItem('tm_stars',    JSON.stringify(starsData))
  localStorage.setItem('tm_trophies', JSON.stringify(trophies))
  localStorage.setItem('tm_streak',   JSON.stringify(streak))
  localStorage.setItem('tm_weakness', JSON.stringify(weakness))
}

// === Navegación ===
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  const target = document.getElementById('screen-' + id)
  if (target) {
    currentScreen = id
    target.classList.add('active')
    target.scrollTop = 0
  }
}

function goHome() {
  if (quizTimer) { clearInterval(quizTimer); quizTimer = null }
  activeMode = ''
  renderHome()
  showScreen('home')
}

// === Teclado físico ===
document.addEventListener('keydown', e => {
  if (!activeMode) return
  if (e.key >= '0' && e.key <= '9') appendDigit(e.key)
  else if (e.key === 'Backspace') deleteDigit()
  else if (e.key === 'Enter') submitAnswer()
})

// === Service Worker ===
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  }
}

// Arrancar al cargar
window.addEventListener('load', init)

// === Home ===
function renderHome() {
  const totalStars = Object.values(starsData).reduce((s, v) => s + v, 0)

  // Barra de progreso
  document.getElementById('stars-total').textContent = totalStars
  document.getElementById('stars-bar').style.width = (totalStars / 30 * 100) + '%'

  // Racha
  document.getElementById('streak-count').textContent = streak.count

  // Trofeos
  ;['principiante', 'maestra', 'leyenda'].forEach(t => {
    const el = document.getElementById('trophy-' + t)
    if (trophies.includes(t)) {
      el.classList.remove('locked')
      el.classList.add('unlocked')
    }
  })
}

function updateStreak() {
  const today = new Date().toISOString().slice(0, 10)
  if (streak.date === today) return  // ya jugó hoy

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (streak.date === yesterday) {
    streak.count++
  } else if (streak.date !== today) {
    streak.count = streak.date ? streak.count : 0
  }
}

function incrementStreak() {
  const today = new Date().toISOString().slice(0, 10)
  if (streak.date === today) return
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  streak.count = (streak.date === yesterday) ? streak.count + 1 : 1
  streak.date = today
  saveToStorage()
}

// === Numpad ===
function buildNumpad(containerId) {
  const container = document.getElementById(containerId)
  container.innerHTML = ''
  // Layout: 1 2 3 / 4 5 6 / 7 8 9 / ← 0 ✓
  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓']
  keys.forEach(k => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'numpad-btn'
    btn.textContent = k
    if (k === '⌫') btn.classList.add('btn-clear')
    if (k === '✓') btn.classList.add('btn-ok')
    btn.addEventListener('click', () => {
      if (k === '⌫') deleteDigit()
      else if (k === '✓') submitAnswer()
      else appendDigit(k)
    })
    container.appendChild(btn)
  })
}

function appendDigit(digit) {
  if (currentInput.length >= 3) return  // máximo 3 dígitos (1×1=1 … 10×10=100)
  currentInput += digit
  updateInputDisplay()
}

function deleteDigit() {
  currentInput = currentInput.slice(0, -1)
  updateInputDisplay()
}

function updateInputDisplay() {
  const idMap = { quiz: 'quiz-question', isla: 'isla-question', entrena: 'entrena-question' }
  const el = document.getElementById(idMap[activeMode])
  if (!el) return
  const base = el.dataset.base || el.textContent.split('=')[0] + '='
  el.dataset.base = base
  el.textContent = base + (currentInput ? ' ' + currentInput : ' ?')
}

// === Algoritmo adaptativo ===
function recordAnswer(a, b, correct, timeMs) {
  const key = `${Math.min(a,b)}x${Math.max(a,b)}`
  const entry = weakness[key] || { attempts: 0, errors: 0 }
  entry.attempts++
  if (!correct) entry.errors++
  weakness[key] = entry
  saveToStorage()
}

function errorRate(key) {
  const e = weakness[key]
  if (!e || e.attempts === 0) return 0
  return e.errors / e.attempts
}

// === Generadores de preguntas ===
function allMultiplications() {
  const pairs = []
  for (let a = 1; a <= 10; a++)
    for (let b = 1; b <= 10; b++)
      pairs.push([a, b])
  return pairs
}

function randomQuestions(count) {
  const all = allMultiplications()
  return shuffle(all).slice(0, count).map(([a, b]) => ({ a, b, answer: a * b }))
}

function tableQuestions(table, count) {
  const pairs = []
  for (let b = 1; b <= 10; b++) pairs.push([table, b])
  return shuffle(pairs).slice(0, count).map(([a, b]) => ({ a, b, answer: a * b }))
}

function weaknessQuestions(count) {
  const withHistory = Object.entries(weakness)
    .filter(([_, v]) => v.attempts >= 2)
    .sort((a, b) => errorRate(b[0]) - errorRate(a[0]))
    .map(([key]) => {
      const [a, b] = key.split('x').map(Number)
      return { a, b, answer: a * b }
    })

  let questions = withHistory.slice(0, count)

  // Rellenar con tablas 6-9 si no hay suficientes
  if (questions.length < 5) {
    const hard = []
    for (let a = 6; a <= 9; a++)
      for (let b = 6; b <= 9; b++)
        hard.push({ a, b, answer: a * b })
    const fill = shuffle(hard).slice(0, count - questions.length)
    questions = [...questions, ...fill]
  }

  return questions.slice(0, count)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// === Quiz Rápido ===
const QUIZ_TOTAL = 20
const QUIZ_TIME  = 10   // segundos por pregunta
const QUIZ_BONUS_THRESHOLD = 4  // segundos para bonus

function startQuiz() {
  quizQuestions = randomQuestions(QUIZ_TOTAL)
  quizIndex = 0
  quizScore = 0
  quizAnswers = []
  activeMode = 'quiz'
  buildNumpad('quiz-numpad')
  showScreen('quiz')
  renderQuizQuestion()
}

function renderQuizQuestion() {
  if (quizIndex >= quizQuestions.length) {
    finishQuiz()
    return
  }
  currentInput = ''
  const q = quizQuestions[quizIndex]
  const qEl = document.getElementById('quiz-question')
  qEl.dataset.base = `${q.a} × ${q.b} =`
  qEl.textContent = `${q.a} × ${q.b} = ?`

  document.getElementById('quiz-q-num').textContent = quizIndex + 1
  document.getElementById('quiz-score').textContent = quizScore

  hideFeedback('quiz-feedback')
  startTimer()
}

function startTimer() {
  if (quizTimer) clearInterval(quizTimer)
  quizStartTime = Date.now()
  const fillEl = document.getElementById('timer-fill')
  fillEl.style.width = '100%'
  fillEl.classList.remove('urgent')

  quizTimer = setInterval(() => {
    const elapsed = (Date.now() - quizStartTime) / 1000
    const pct = Math.max(0, 1 - elapsed / QUIZ_TIME)
    fillEl.style.width = (pct * 100) + '%'
    if (pct < 0.3) fillEl.classList.add('urgent')
    if (pct <= 0) {
      clearInterval(quizTimer)
      quizTimer = null
      handleQuizAnswer(false, QUIZ_TIME * 1000)
    }
  }, 100)
}

function submitAnswer() {
  if (!activeMode) return
  if (activeMode === 'quiz')    handleQuizAnswer(null, null)
  if (activeMode === 'isla')    handleIslaAnswer()
  if (activeMode === 'entrena') handleEntrenaAnswer()
}

function handleQuizAnswer(forceCorrect, forceTime) {
  if (quizTimer) { clearInterval(quizTimer); quizTimer = null }
  const q = quizQuestions[quizIndex]
  const timeMs = forceTime !== null ? forceTime : (Date.now() - quizStartTime)
  const userAnswer = forceCorrect !== null ? (forceCorrect ? q.answer : -1) : parseInt(currentInput, 10)
  const correct = userAnswer === q.answer

  recordAnswer(q.a, q.b, correct, timeMs)
  quizAnswers.push({ correct, timeMs })

  if (correct) {
    const bonus = (timeMs / 1000) < QUIZ_BONUS_THRESHOLD ? 5 : 0
    quizScore += 10 + bonus
    showFeedback('quiz-feedback', true, '✓')
  } else {
    showFeedback('quiz-feedback', false, `✗  ${q.answer}`)
    shakeCard('quiz-question-card')
  }

  currentInput = ''
  setTimeout(() => {
    if (activeMode !== 'quiz') return
    quizIndex++
    renderQuizQuestion()
  }, 900)
}

function finishQuiz() {
  activeMode = ''
  incrementStreak()
  checkTrophies()

  const correct = quizAnswers.filter(a => a.correct).length
  const accuracy = Math.round(correct / QUIZ_TOTAL * 100)
  const avgTime  = (quizAnswers.reduce((s, a) => s + a.timeMs, 0) / QUIZ_TOTAL / 1000).toFixed(1)

  document.getElementById('results-score').textContent    = quizScore
  document.getElementById('results-correct').textContent  = correct
  document.getElementById('results-accuracy').textContent = accuracy + '%'
  document.getElementById('results-avg-time').textContent = avgTime + 's'

  showScreen('quiz-results')
}

// === Feedback helpers ===
function showFeedback(id, correct, text) {
  const el = document.getElementById(id)
  el.textContent = text
  el.className = 'feedback-overlay ' + (correct ? 'correct' : 'incorrect')
}
function hideFeedback(id) {
  const el = document.getElementById(id)
  el.className = 'feedback-overlay'
  el.textContent = ''
}
function shakeCard(id) {
  const el = document.getElementById(id)
  el.classList.remove('anim-shake')
  void el.offsetWidth  // reflow para reiniciar animación
  el.classList.add('anim-shake')
  setTimeout(() => el.classList.remove('anim-shake'), 500)
}
