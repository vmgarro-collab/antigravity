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
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {})
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
const QUIZ_TOTAL = 12
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

// === Aventura — Mapa ===
const BOSS_TABLES = [6, 7, 8, 9]

function showAventura() {
  renderIslandMap()
  showScreen('aventura')
}

function renderIslandMap() {
  const map = document.getElementById('island-map')
  map.innerHTML = ''

  for (let t = 1; t <= 10; t++) {
    const stars = starsData[t] || 0
    const unlocked = t === 1 || (starsData[t - 1] || 0) >= 1
    const isBoss = BOSS_TABLES.includes(t)

    const card = document.createElement('div')
    card.className = 'island-card' + (unlocked ? ' unlocked' : ' locked') + (isBoss ? ' boss' : '')
    card.id = 'island-' + t

    card.innerHTML = `
      ${isBoss ? '<span class="island-boss-badge">⚡ RETO</span>' : ''}
      <div class="island-num">${t}</div>
      <div class="island-label">Tabla del ${t}</div>
      <div class="island-stars">${starsToEmoji(stars)}</div>
    `

    if (unlocked) {
      card.addEventListener('click', () => startIsla(t))
    }

    map.appendChild(card)
  }
}

function starsToEmoji(count) {
  return '⭐'.repeat(count) + '☆'.repeat(3 - count)
}

// === Aventura — Gameplay de isla ===
const ISLA_TOTAL       = 15
const ISLA_RETO_TOTAL  = 5
const ISLA_TIME        = 10   // segundos
const ISLA_RETO_TIME   = 6    // segundos para reto final
const ISLA_ACC_THRESH  = 0.8  // >80% para 2+ estrellas
const ISLA_TIME_THRESH = 6    // <6s medio para 3 estrellas

let islaTimerInterval = null
let islaQuestionStartTime = 0
let islaCurrentTime = ISLA_TIME

function startIsla(table) {
  islaTable = table
  islaIsRetoFinal = false
  islaQuestions = tableQuestions(table, ISLA_TOTAL)
  islaIndex = 0
  islaAnswers = []
  activeMode = 'isla'
  islaCurrentTime = ISLA_TIME
  buildNumpad('isla-numpad')
  document.getElementById('isla-title').textContent = `Tabla del ${table}`
  showScreen('isla')
  renderIslaQuestion()
}

function startRetoFinal() {
  islaIsRetoFinal = true
  islaQuestions = tableQuestions(islaTable, ISLA_RETO_TOTAL)
  islaIndex = 0
  islaAnswers = []
  islaCurrentTime = ISLA_RETO_TIME
  activeMode = 'isla'
  buildNumpad('isla-numpad')
  document.getElementById('isla-title').textContent = `⚡ Reto del ${islaTable}`
  showScreen('isla')
  renderIslaQuestion()
}

function renderIslaQuestion() {
  if (islaIndex >= islaQuestions.length) {
    finishIsla()
    return
  }
  currentInput = ''
  const total = islaIsRetoFinal ? ISLA_RETO_TOTAL : ISLA_TOTAL
  const q = islaQuestions[islaIndex]
  const qEl = document.getElementById('isla-question')
  qEl.dataset.base = `${q.a} × ${q.b} =`
  qEl.textContent  = `${q.a} × ${q.b} = ?`

  document.getElementById('isla-progress').textContent = `${islaIndex + 1}/${total}`
  hideFeedback('isla-feedback')
  startIslaTimer()
}

function startIslaTimer() {
  if (islaTimerInterval) clearInterval(islaTimerInterval)
  islaQuestionStartTime = Date.now()
  const timeLimit = islaCurrentTime
  islaTimerInterval = setInterval(() => {
    const elapsed = (Date.now() - islaQuestionStartTime) / 1000
    if (elapsed >= timeLimit) {
      clearInterval(islaTimerInterval)
      islaTimerInterval = null
      handleIslaAnswer(true)
    }
  }, 200)
}

function handleIslaAnswer(timeout) {
  if (islaTimerInterval) { clearInterval(islaTimerInterval); islaTimerInterval = null }
  const q = islaQuestions[islaIndex]
  const timeMs = Date.now() - islaQuestionStartTime
  const timeLimit = islaCurrentTime
  const userAnswer = timeout ? -1 : parseInt(currentInput, 10)
  const correct = userAnswer === q.answer

  recordAnswer(q.a, q.b, correct, timeMs)
  islaAnswers.push({ correct, timeMs: Math.min(timeMs, timeLimit * 1000) })

  if (correct) {
    showFeedback('isla-feedback', true, '✓')
  } else {
    showFeedback('isla-feedback', false, `✗  ${q.answer}`)
    shakeCard('isla-question-card')
  }

  currentInput = ''
  setTimeout(() => {
    if (activeMode !== 'isla') return
    islaIndex++
    renderIslaQuestion()
  }, 900)
}

function finishIsla() {
  activeMode = ''
  const correct = islaAnswers.filter(a => a.correct).length
  const total   = islaAnswers.length
  const accuracy = correct / total
  const avgTime  = islaAnswers.reduce((s, a) => s + a.timeMs, 0) / total / 1000

  let stars = 0
  if (total > 0)                                                       stars = 1
  if (accuracy > ISLA_ACC_THRESH)                                      stars = 2
  if (accuracy > ISLA_ACC_THRESH && avgTime < ISLA_TIME_THRESH)        stars = 3

  if (!islaIsRetoFinal) {
    const prev = starsData[islaTable] || 0
    if (stars > prev) {
      const wasLocked = prev === 0 && islaTable < 10
      starsData[islaTable] = stars
      saveToStorage()
      if (wasLocked) {
        setTimeout(() => revealIsland(islaTable + 1), 500)
      }
    }
    checkTrophies()
    incrementStreak()
  }

  document.getElementById('isla-stars-earned').textContent   = starsToEmoji(islaIsRetoFinal ? 3 : stars)
  document.getElementById('isla-results-correct').textContent = correct
  document.getElementById('isla-results-accuracy').textContent = Math.round(accuracy * 100) + '%'
  document.getElementById('isla-results-avg-time').textContent = avgTime.toFixed(1) + 's'

  const btnReto = document.getElementById('btn-reto-final')
  const showReto = !islaIsRetoFinal && BOSS_TABLES.includes(islaTable) && stars >= 1
  btnReto.style.display = showReto ? 'block' : 'none'

  showScreen('isla-results')
}

function revealIsland(table) {
  showAventura()
  setTimeout(() => {
    const card = document.getElementById('island-' + table)
    if (card) {
      card.classList.remove('locked')
      card.classList.add('unlocked', 'anim-reveal')
    }
  }, 300)
}

// === Entrena Débiles ===
const ENTRENA_TOTAL = 15

function startEntrenamiento() {
  const questions = weaknessQuestions(ENTRENA_TOTAL)

  if (questions.length === 0) {
    alert('¡Juega primero al Quiz o a la Aventura para que pueda aprender cuáles son tus puntos débiles!')
    return
  }

  entrenaSnapshotBefore = {}
  Object.entries(weakness).forEach(([k, v]) => {
    entrenaSnapshotBefore[k] = v.attempts > 0 ? v.errors / v.attempts : 0
  })

  entrenaQuestions = questions
  entrenaIndex = 0
  activeMode = 'entrena'
  buildNumpad('entrena-numpad')
  showScreen('entrena')
  renderEntrenaQuestion()
}

function renderEntrenaQuestion() {
  if (entrenaIndex >= entrenaQuestions.length) {
    finishEntrena()
    return
  }
  currentInput = ''
  const q = entrenaQuestions[entrenaIndex]
  const qEl = document.getElementById('entrena-question')
  qEl.dataset.base = `${q.a} × ${q.b} =`
  qEl.textContent  = `${q.a} × ${q.b} = ?`

  document.getElementById('entrena-progress').textContent = `${entrenaIndex + 1}/${ENTRENA_TOTAL}`
  hideFeedback('entrena-feedback')
}

function handleEntrenaAnswer() {
  const q = entrenaQuestions[entrenaIndex]
  const timeMs = 5000
  const userAnswer = parseInt(currentInput, 10)
  const correct = userAnswer === q.answer

  recordAnswer(q.a, q.b, correct, timeMs)

  if (correct) {
    showFeedback('entrena-feedback', true, '✓')
  } else {
    showFeedback('entrena-feedback', false, `✗  ${q.answer}`)
    shakeCard('entrena-question-card')
  }

  currentInput = ''
  setTimeout(() => {
    if (activeMode !== 'entrena') return
    entrenaIndex++
    renderEntrenaQuestion()
  }, 900)
}

function finishEntrena() {
  activeMode = ''
  incrementStreak()

  const list = document.getElementById('weakness-list')
  list.innerHTML = ''

  entrenaQuestions.forEach(q => {
    const key = `${Math.min(q.a,q.b)}x${Math.max(q.a,q.b)}`
    const before = entrenaSnapshotBefore[key] || 0
    const after  = errorRate(key)
    const improved = after < before - 0.05

    const item = document.createElement('div')
    item.className = 'weakness-item'
    item.innerHTML = `
      <span class="weakness-key">${q.a} × ${q.b} = ${q.answer}</span>
      <span class="${improved ? 'weakness-improvement' : 'weakness-same'}">
        ${improved ? '↑ Mejorando' : '→ Sigue practicando'}
      </span>
    `
    list.appendChild(item)
  })

  // Eliminar duplicados visuales
  const seen = new Set()
  list.querySelectorAll('.weakness-item').forEach(item => {
    const key = item.querySelector('.weakness-key').textContent.trim()
    if (seen.has(key)) item.remove()
    else seen.add(key)
  })

  showScreen('entrena-results')
}

// === Trofeos ===
const TROPHY_THRESHOLDS = {
  principiante: 5,
  maestra: 15,
  leyenda: 30
}
const TROPHY_ICONS = {
  principiante: '🏅',
  maestra: '🥈',
  leyenda: '🏆'
}
const TROPHY_NAMES = {
  principiante: '¡Principiante!',
  maestra: '¡Maestra!',
  leyenda: '¡Leyenda!'
}

function checkTrophies() {
  const totalStars = Object.values(starsData).reduce((s, v) => s + v, 0)
  let newTrophy = null

  Object.entries(TROPHY_THRESHOLDS).forEach(([name, threshold]) => {
    if (totalStars >= threshold && !trophies.includes(name)) {
      trophies.push(name)
      newTrophy = name
    }
  })

  saveToStorage()
  renderHome()

  if (newTrophy) showTrophyCelebration(newTrophy)
}

function showTrophyCelebration(name) {
  const overlay = document.getElementById('trophy-overlay')
  document.getElementById('trophy-icon').textContent    = TROPHY_ICONS[name]
  document.getElementById('trophy-title').textContent   = '¡Trofeo desbloqueado!'
  document.getElementById('trophy-subtitle').textContent = TROPHY_NAMES[name]

  const container = document.getElementById('particles')
  container.innerHTML = ''
  const colors = ['#ff2d78', '#00dfd8', '#ffd700', '#00e676', '#ffffff']
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div')
    p.className = 'particle'
    const angle = (i / 24) * 360
    const dist  = 60 + Math.random() * 60
    const dx = Math.cos(angle * Math.PI / 180) * dist + 'px'
    const dy = Math.sin(angle * Math.PI / 180) * dist + 'px'
    p.style.cssText = `
      left: 50%; top: 50%;
      background: ${colors[i % colors.length]};
      --dx: ${dx}; --dy: ${dy};
      animation-delay: ${Math.random() * 0.2}s;
    `
    container.appendChild(p)
  }

  overlay.style.display = 'flex'
  setTimeout(() => {
    overlay.style.opacity = '0'
    overlay.style.transition = 'opacity 0.5s'
    setTimeout(() => {
      overlay.style.display = 'none'
      overlay.style.opacity = ''
      overlay.style.transition = ''
    }, 500)
  }, 3000)
}
