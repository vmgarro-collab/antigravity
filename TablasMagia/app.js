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
