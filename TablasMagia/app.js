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
