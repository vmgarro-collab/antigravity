// ============================================================
// app.js — MatesMagia game logic
// No ES modules — vanilla JS, all text via renderConstants()
// ============================================================

// ---- Constants ----
const QUIZ_TOTAL = 12
const ADVENTURE_QUESTIONS = 10
const WEAK_TOTAL = 10
const QUIZ_TIMER_NUMPAD = 15
const QUIZ_TIMER_TEST = 20
const AREAS = ['sumas', 'fracciones', 'monomios', 'polinomios']
const AREA_NAMES = { sumas: 'Sumas', fracciones: 'Fracciones', monomios: 'Monomios', polinomios: 'Polinomios' }
const AREA_LEVELS = 5
const MAX_STARS_PER_AREA = AREA_LEVELS * 3   // 15

const LEVEL_NAMES = {
  sumas: ['Sumas Fáciles', 'Sumas Rápidas', 'Restas', 'Mixto', 'Cronometrado'],
  fracciones: ['Simplificar', 'Sumas de Fracciones', 'Restas', 'Mixto', 'Avanzado'],
  monomios: ['Sumas', 'Productos', 'Divisiones', 'Mixto', 'Avanzado'],
  polinomios: ['Cuadrados', 'Diferencia de Cuadrados', 'Productos', 'Mixto', 'Avanzado']
}
const LEVEL_DESCS = {
  sumas: ['Suma números de dos cifras', 'Más velocidad', 'Restas sencillas', 'Suma y resta mezclados', 'Contrarreloj'],
  fracciones: ['Simplifica fracciones', 'Suma con distinto denominador', 'Resta fracciones', 'Todo mezclado', 'Fracciones complejas'],
  monomios: ['Suma monomios iguales', 'Multiplica monomios', 'Divide monomios', 'Operaciones mixtas', 'Nivel experto'],
  polinomios: ['(x+a)² paso a paso', '(x+a)(x-a)', '(x+a)(x+b)', 'Todo mezclado', 'Nivel experto']
}

const TROPHY_DEFS = {
  aprendiz:    { label: '🏅 Aprendiz',    req: 10,  desc: '10 estrellas' },
  calculadora: { label: '🧮 Calculadora', req: 30,  desc: '30 estrellas' },
  matematica:  { label: '🏆 Matemática',  req: 60,  desc: '60 estrellas' }
}

// Text constants (all UI text lives here — no hardcoded text in HTML)
const TEXT = {
  appTitle: 'MatesMagia ✨',
  appSub: 'Practica y mejora cada día',
  streakLabel: 'días',
  starsLabel: 'estrellas',
  modeQuizName: 'Quiz Rápido',
  modeQuizSub: `${QUIZ_TOTAL} preguntas adaptadas a ti`,
  modeAdvName: 'Aventura',
  modeAdvSub: 'Supera niveles y gana estrellas',
  modeWeakName: 'Entrena Débiles',
  modeWeakSub: 'Refuerza donde más lo necesitas',
  areaProgressHeading: 'Tu progreso por área',
  questionLabel: 'Pregunta ',
  quizResultTitle: '¡Resultado!',
  accuracyLabel: 'Aciertos',
  avgTimeLabel: 'Seg/pregunta',
  homeBtn: '🏠 Inicio',
  advHeading: 'Aventura',
  advSub: 'Elige un área y supera los 5 niveles',
  weakHeading: 'Entrena Débiles',
  weakSub: `${WEAK_TOTAL} preguntas de tus puntos flojos`,
  weakResultTitle: '¡Sesión completada!',
  weakAgainBtn: '🔁 Repetir sesión',
  advRetryBtn: '🔁 Reintentar nivel',
  advZonesBtn: '🗺️ Ver zonas',
  advHomeBtn: '🏠 Inicio',
  starMessages: ['Sigue practicando 💪', '¡Buen trabajo! ⭐⭐', '¡Perfecto! 🌟🌟🌟']
}

// ---- State ----
let weakness = {}       // { area: { subtipo: { errors, attempts } } }
let stars = {}          // { "sumas-1": 3, ... }
let trophies = []
let streak = { date: '', count: 0 }
let activeMode = ''     // 'quiz' | 'adventure' | 'weak'

let currentQuestions = []
let currentIdx = 0
let score = 0
let sessionResults = []  // [{area, subtipo, correct, time}]
let quizTimer = null
let timeLeft = 0
let timeStart = 0

let adventureZone = ''
let adventureLevel = 0

// Numpad input state per prefix
const numpadState = { qz: '', adq: '', wk: '' }

// Pre-session weakness snapshot for before/after comparison
let weaknessBefore = {}

// ---- Persistence ----
function saveAll() {
  localStorage.setItem('mm_weakness', JSON.stringify(weakness))
  localStorage.setItem('mm_stars', JSON.stringify(stars))
  localStorage.setItem('mm_trophies', JSON.stringify(trophies))
  localStorage.setItem('mm_streak', JSON.stringify(streak))
}

function loadFromStorage() {
  try { weakness = JSON.parse(localStorage.getItem('mm_weakness')) || {} } catch { weakness = {} }
  try { stars = JSON.parse(localStorage.getItem('mm_stars')) || {} } catch { stars = {} }
  try { trophies = JSON.parse(localStorage.getItem('mm_trophies')) || [] } catch { trophies = [] }
  try { streak = JSON.parse(localStorage.getItem('mm_streak')) || { date: '', count: 0 } } catch { streak = { date: '', count: 0 } }
}

// ---- Streak ----
function updateStreak() {
  const today = new Date().toISOString().slice(0, 10)
  if (streak.date === today) return
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (streak.date === yesterday) {
    streak.count++
  } else {
    streak.count = 1
  }
  streak.date = today
  saveAll()
}

// ---- renderConstants ----
function renderConstants() {
  safeSetText('home-title', TEXT.appTitle)
  safeSetText('home-subtitle', TEXT.appSub)
  safeSetText('home-streak-label', TEXT.streakLabel)
  safeSetText('home-stars-label', TEXT.starsLabel)
  safeSetText('mode-quiz-name', TEXT.modeQuizName)
  safeSetText('mode-quiz-sub', TEXT.modeQuizSub)
  safeSetText('mode-adv-name', TEXT.modeAdvName)
  safeSetText('mode-adv-sub', TEXT.modeAdvSub)
  safeSetText('mode-weak-name', TEXT.modeWeakName)
  safeSetText('mode-weak-sub', TEXT.modeWeakSub)
  safeSetText('area-progress-heading', TEXT.areaProgressHeading)
  safeSetText('home-question-label', TEXT.questionLabel)
  safeSetText('qz-res-title', TEXT.quizResultTitle)
  safeSetText('qz-res-accuracy-label', TEXT.accuracyLabel)
  safeSetText('qz-res-time-label', TEXT.avgTimeLabel)
  safeSetText('qz-res-home-btn', TEXT.homeBtn)
  safeSetText('adv-heading', TEXT.advHeading)
  safeSetText('adv-sub', TEXT.advSub)
  safeSetText('adq-question-label', TEXT.questionLabel)
  safeSetText('weak-heading', TEXT.weakHeading)
  safeSetText('weak-sub', TEXT.weakSub)
  safeSetText('wk-question-label', TEXT.questionLabel)
  safeSetText('wk-res-title', TEXT.weakResultTitle)
  safeSetText('wk-res-again', TEXT.weakAgainBtn)
  safeSetText('wk-res-home', TEXT.homeBtn)
  safeSetText('adv-res-retry', TEXT.advRetryBtn)
  safeSetText('adv-res-zones', TEXT.advZonesBtn)
  safeSetText('adv-res-home', TEXT.advHomeBtn)
  safeSetText('wk-total', WEAK_TOTAL)
  safeSetText('qz-total', QUIZ_TOTAL)
  safeSetText('qz-score-total', QUIZ_TOTAL)
  safeSetText('adq-total', ADVENTURE_QUESTIONS)
  safeSetText('adq-score-total', ADVENTURE_QUESTIONS)
  safeSetText('adq-question-label', TEXT.questionLabel)
}

function safeSetText(id, val) {
  const el = document.getElementById(id)
  if (el) el.textContent = val
}
function safeSetHTML(id, val) {
  const el = document.getElementById(id)
  if (el) el.innerHTML = val
}

// ---- Screen navigation ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  const el = document.getElementById('screen-' + id)
  if (el) { el.classList.add('active'); el.scrollTop = 0; window.scrollTo(0, 0) }
}

function goHome() {
  clearTimer()
  activeMode = ''
  renderHome()
  showScreen('home')
}

// ---- Home rendering ----
function renderHome() {
  safeSetText('home-streak-count', streak.count)

  const totalStars = Object.values(stars).reduce((s, v) => s + v, 0)
  safeSetText('home-stars-total', totalStars)

  // Trophies
  const trophyRow = document.getElementById('home-trophies')
  if (trophyRow) {
    if (trophies.length > 0) {
      trophyRow.style.display = 'flex'
      trophyRow.innerHTML = trophies.map(t =>
        `<div class="trophy-chip">${TROPHY_DEFS[t] ? TROPHY_DEFS[t].label : t}</div>`
      ).join('')
    } else {
      trophyRow.style.display = 'none'
    }
  }

  // Area cards
  const grid = document.getElementById('home-area-cards')
  if (grid) {
    grid.innerHTML = AREAS.map(area => {
      const earned = areaStarTotal(area)
      return `
        <div class="area-card ${area}">
          <div class="area-card-name">${AREA_NAMES[area]}</div>
          <div class="area-star-count">${earned}</div>
          <div class="area-card-stars">/ ${MAX_STARS_PER_AREA} ⭐</div>
        </div>`
    }).join('')
  }
}

function areaStarTotal(area) {
  let total = 0
  for (let lvl = 1; lvl <= AREA_LEVELS; lvl++) {
    total += (stars[`${area}-${lvl}`] || 0)
  }
  return total
}

// ---- Timer ----
function clearTimer() {
  if (quizTimer) { clearInterval(quizTimer); quizTimer = null }
}

function startTimer(seconds, barId, onExpire) {
  clearTimer()
  timeLeft = seconds
  timeStart = Date.now()
  const bar = document.getElementById(barId)
  if (bar) {
    bar.style.transition = 'none'
    bar.style.width = '100%'
    // Force reflow
    bar.offsetWidth // eslint-disable-line
    bar.style.transition = `width ${seconds}s linear`
    bar.style.width = '0%'
  }
  quizTimer = setInterval(() => {
    timeLeft--
    if (timeLeft <= 0) {
      clearTimer()
      onExpire()
    }
  }, 1000)
}

// ---- Weakness tracking ----
function recordAnswer(area, subtipo, correct) {
  if (!weakness[area]) weakness[area] = {}
  if (!weakness[area][subtipo]) weakness[area][subtipo] = { errors: 0, attempts: 0 }
  weakness[area][subtipo].attempts++
  if (!correct) weakness[area][subtipo].errors++
}

function errorRate(area, subtipo) {
  const w = (weakness[area] || {})[subtipo]
  if (!w || w.attempts === 0) return 0
  return w.errors / w.attempts
}

// ---- Check trophies ----
function checkTrophies() {
  const totalStars = Object.values(stars).reduce((s, v) => s + v, 0)
  if (totalStars >= TROPHY_DEFS.aprendiz.req && !trophies.includes('aprendiz')) trophies.push('aprendiz')
  if (totalStars >= TROPHY_DEFS.calculadora.req && !trophies.includes('calculadora')) trophies.push('calculadora')
  if (totalStars >= TROPHY_DEFS.matematica.req && !trophies.includes('matematica')) trophies.push('matematica')
}

// ---- Stars rendering helper ----
function renderStarIcons(earned, total) {
  let html = ''
  for (let i = 0; i < total; i++) {
    html += `<span class="star ${i < earned ? 'earned' : 'empty'}">${i < earned ? '⭐' : '☆'}</span>`
  }
  return html
}

// ============================================================
// QUIZ MODE
// ============================================================
function startQuiz() {
  activeMode = 'quiz'
  currentQuestions = generateAdaptiveQuiz(weakness, QUIZ_TOTAL)
  currentIdx = 0
  score = 0
  sessionResults = []
  numpadState.qz = ''

  safeSetText('qz-total', QUIZ_TOTAL)
  safeSetText('qz-score-total', QUIZ_TOTAL)
  safeSetText('qz-score', 0)

  showScreen('quiz')
  renderQuizQuestion()
}

function renderQuizQuestion() {
  if (activeMode !== 'quiz') return
  if (currentIdx >= currentQuestions.length) { endQuiz(); return }

  const q = currentQuestions[currentIdx]
  numpadState.qz = ''

  safeSetText('qz-num', currentIdx + 1)
  safeSetText('qz-question-text', q.enunciado)

  // Area badge
  const badge = document.getElementById('qz-area-badge')
  if (badge) {
    badge.textContent = AREA_NAMES[q.area]
    badge.className = 'area-badge badge-' + q.area
  }

  // Timer
  const timerSecs = q.tipo === 'numpad' ? QUIZ_TIMER_NUMPAD : QUIZ_TIMER_TEST
  timeStart = Date.now()
  startTimer(timerSecs, 'qz-timer-bar', () => {
    if (activeMode !== 'quiz') return
    processQuizAnswer(null, 'qz')
  })

  // Show correct input area
  const numpadSec = document.getElementById('qz-numpad-section')
  const testSec = document.getElementById('qz-test-section')

  if (q.tipo === 'numpad') {
    numpadSec.style.display = 'block'
    testSec.style.display = 'none'
    safeSetText('qz-numpad-display', '—')
  } else {
    numpadSec.style.display = 'none'
    testSec.style.display = 'block'
    renderTestOptions(q, 'qz-options', 'qz')
  }

  // Reset card animation
  const card = document.getElementById('qz-question-card')
  if (card) { card.classList.remove('flash-correct', 'shake-wrong') }
}

function renderTestOptions(q, containerId, prefix) {
  const container = document.getElementById(containerId)
  if (!container) return

  const allOptions = shuffle([q.respuesta, ...q.distractores.slice(0, 3)])
  container.innerHTML = allOptions.map(opt =>
    `<button class="test-btn" onclick="selectTestOption('${prefix}', this, '${escOpt(opt)}')">${opt}</button>`
  ).join('')
}

function escOpt(s) {
  return s.replace(/'/g, "\\'").replace(/"/g, '&quot;')
}

function selectTestOption(prefix, btn, chosen) {
  if (activeMode !== prefix.replace('adq', 'adventure').replace('qz', 'quiz').replace('wk', 'weak')) {
    // Map prefix back to mode
  }
  // Disable all buttons
  const container = btn.parentElement
  container.querySelectorAll('.test-btn').forEach(b => {
    b.disabled = true
    b.onclick = null
  })

  const modeMap = { qz: 'quiz', adq: 'adventure', wk: 'weak' }
  processAnswer(chosen, prefix, modeMap[prefix])
}

// ---- Numpad ----
function numpadPress(prefix, val) {
  const modeMap = { qz: 'quiz', adq: 'adventure', wk: 'weak' }
  if (activeMode !== modeMap[prefix]) return

  const display = document.getElementById(`${prefix}-numpad-display`)

  if (val === 'submit') {
    const typed = numpadState[prefix]
    if (typed === '' || typed === '-') return
    processAnswer(typed, prefix, modeMap[prefix])
    return
  }
  if (val === 'back') {
    numpadState[prefix] = numpadState[prefix].slice(0, -1)
    if (display) display.textContent = numpadState[prefix] || '—'
    return
  }
  if (val === '-') {
    if (numpadState[prefix] === '') {
      numpadState[prefix] = '-'
      if (display) display.textContent = '-'
    }
    return
  }
  // digit
  if (numpadState[prefix].length >= 6) return
  numpadState[prefix] += val
  if (display) display.textContent = numpadState[prefix]
}

// ---- Answer processing (quiz) ----
function processAnswer(chosen, prefix, mode) {
  if (activeMode !== mode) return
  clearTimer()

  const timeTaken = (Date.now() - timeStart) / 1000
  let q, card, correct

  if (mode === 'quiz') {
    q = currentQuestions[currentIdx]
    card = document.getElementById('qz-question-card')
  } else if (mode === 'adventure') {
    q = currentQuestions[currentIdx]
    card = document.getElementById('adq-question-card')
  } else {
    q = currentQuestions[currentIdx]
    card = document.getElementById('wk-question-card')
  }

  correct = chosen !== null && String(chosen).trim() === String(q.respuesta).trim()

  // Visual feedback
  if (card) {
    card.classList.remove('flash-correct', 'shake-wrong')
    void card.offsetWidth
    card.classList.add(correct ? 'flash-correct' : 'shake-wrong')
  }

  // Highlight test options
  if (q.tipo === 'test') {
    const optId = prefix === 'qz' ? 'qz-options' : prefix === 'adq' ? 'adq-options' : 'wk-options'
    const container = document.getElementById(optId)
    if (container) {
      container.querySelectorAll('.test-btn').forEach(btn => {
        const btnVal = btn.textContent.trim()
        if (btnVal === q.respuesta) btn.classList.add('correct')
        else if (!correct && btnVal === chosen) btn.classList.add('wrong')
      })
    }
  } else {
    // Numpad: show correct answer briefly
    const dispId = `${prefix}-numpad-display`
    const disp = document.getElementById(dispId)
    if (disp) {
      disp.textContent = correct ? chosen : `✗ ${q.respuesta}`
      disp.style.color = correct ? '#00e676' : '#ff2d78'
      setTimeout(() => { if (disp) disp.style.color = '' }, 900)
    }
  }

  // Record
  if (correct) score++
  recordAnswer(q.area, q.subtipo, correct)
  sessionResults.push({ area: q.area, subtipo: q.subtipo, correct, time: timeTaken })

  if (mode === 'quiz') safeSetText('qz-score', score)
  if (mode === 'adventure') safeSetText('adq-score', score)
  if (mode === 'weak') safeSetText('wk-score', score)

  currentIdx++

  const capturedMode = mode
  const capturedPrefix = prefix
  setTimeout(() => {
    if (activeMode !== capturedMode) return
    numpadState[capturedPrefix] = ''
    if (mode === 'quiz') renderQuizQuestion()
    else if (mode === 'adventure') renderAdvQuestion()
    else renderWeakQuestion()
  }, 900)
}

// Alias for timer expiry (null answer = timeout)
function processQuizAnswer(chosen, prefix) {
  processAnswer(chosen, prefix, 'quiz')
}

// ---- End quiz ----
function endQuiz() {
  activeMode = ''
  clearTimer()
  saveAll()
  checkTrophies()
  saveAll()

  const total = sessionResults.length
  const correct = sessionResults.filter(r => r.correct).length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const avgTime = total > 0 ? (sessionResults.reduce((s, r) => s + r.time, 0) / total).toFixed(1) : 0

  safeSetText('qz-res-score', `${correct}/${total}`)
  safeSetText('qz-res-accuracy', accuracy + '%')
  safeSetText('qz-res-time', avgTime + 's')

  // Breakdown per area
  const breakdown = document.getElementById('qz-breakdown')
  if (breakdown) {
    breakdown.innerHTML = AREAS.map(area => {
      const aRes = sessionResults.filter(r => r.area === area)
      if (aRes.length === 0) return ''
      const aC = aRes.filter(r => r.correct).length
      return `
        <div class="breakdown-item">
          <span class="breakdown-label">${AREA_NAMES[area]}</span>
          <span class="breakdown-val badge-${area}">${aC}/${aRes.length}</span>
        </div>`
    }).join('')
  }

  showScreen('quiz-result')
}

// ============================================================
// ADVENTURE MODE
// ============================================================
function showAdventure() {
  activeMode = 'adventure'  // set broadly so back works; cleared on actual quiz start
  activeMode = ''
  clearTimer()

  const list = document.getElementById('adv-zone-list')
  if (list) {
    list.innerHTML = AREAS.map(area => {
      const earned = areaStarTotal(area)
      return `
        <div class="zone-card ${area}" onclick="showZone('${area}')">
          <div>
            <div class="zone-name">${AREA_NAMES[area]}</div>
            <div class="zone-stars-text">${earned} / ${MAX_STARS_PER_AREA} ⭐</div>
          </div>
          <span class="zone-arrow">›</span>
        </div>`
    }).join('')
  }
  showScreen('adventure')
}

function showZone(area) {
  adventureZone = area
  const title = document.getElementById('adv-zone-title')
  if (title) title.textContent = AREA_NAMES[area]

  const list = document.getElementById('adv-level-list')
  if (list) {
    list.innerHTML = ''
    for (let lvl = 1; lvl <= AREA_LEVELS; lvl++) {
      const key = `${area}-${lvl}`
      const earned = stars[key] || 0
      const unlocked = lvl === 1 || (stars[`${area}-${lvl - 1}`] || 0) >= 1

      const btn = document.createElement('button')
      btn.className = 'level-btn'
      if (!unlocked) btn.disabled = true

      const starsHtml = unlocked
        ? renderStarIcons(earned, 3)
        : '<span>🔒</span>'

      btn.innerHTML = `
        <span class="level-num">${lvl}</span>
        <span class="level-info">
          <div class="level-name">${LEVEL_NAMES[area][lvl - 1]}</div>
          <div class="level-desc">${LEVEL_DESCS[area][lvl - 1]}</div>
        </span>
        <span class="level-stars">${starsHtml}</span>`

      if (unlocked) btn.onclick = () => startAdventureLevel(area, lvl)
      list.appendChild(btn)
    }
  }
  showScreen('adv-zone')
}

function startAdventureLevel(area, level) {
  adventureZone = area
  adventureLevel = level
  activeMode = 'adventure'
  currentQuestions = []
  currentIdx = 0
  score = 0
  sessionResults = []
  numpadState.adq = ''

  // Generate questions for this area
  for (let i = 0; i < ADVENTURE_QUESTIONS; i++) {
    currentQuestions.push(generateQuestion(area))
  }

  safeSetText('adq-total', ADVENTURE_QUESTIONS)
  safeSetText('adq-score-total', ADVENTURE_QUESTIONS)
  safeSetText('adq-score', 0)
  safeSetText('adq-num', 1)

  const badge = document.getElementById('adq-area-badge')
  if (badge) { badge.textContent = AREA_NAMES[area]; badge.className = 'area-badge badge-' + area }

  showScreen('adv-quiz')
  renderAdvQuestion()
}

function renderAdvQuestion() {
  if (activeMode !== 'adventure') return
  if (currentIdx >= currentQuestions.length) { endAdventure(); return }

  const q = currentQuestions[currentIdx]
  numpadState.adq = ''

  safeSetText('adq-num', currentIdx + 1)
  safeSetText('adq-question-text', q.enunciado)

  const timerSecs = q.tipo === 'numpad' ? QUIZ_TIMER_NUMPAD : QUIZ_TIMER_TEST
  timeStart = Date.now()
  startTimer(timerSecs, 'adq-timer-bar', () => {
    if (activeMode !== 'adventure') return
    processAnswer(null, 'adq', 'adventure')
  })

  const numpadSec = document.getElementById('adq-numpad-section')
  const testSec = document.getElementById('adq-test-section')

  if (q.tipo === 'numpad') {
    numpadSec.style.display = 'block'
    testSec.style.display = 'none'
    safeSetText('adq-numpad-display', '—')
  } else {
    numpadSec.style.display = 'none'
    testSec.style.display = 'block'
    renderTestOptions(q, 'adq-options', 'adq')
  }

  const card = document.getElementById('adq-question-card')
  if (card) { card.classList.remove('flash-correct', 'shake-wrong') }
}

function endAdventure() {
  activeMode = ''
  clearTimer()

  const total = sessionResults.length
  const correct = sessionResults.filter(r => r.correct).length
  const accuracy = total > 0 ? correct / total : 0
  const avgTime = total > 0 ? sessionResults.reduce((s, r) => s + r.time, 0) / total : 99

  // Stars: 1=complete, 2=>80%, 3=>80%+avgTime<10
  let earned = 1
  if (accuracy >= 0.8) earned = 2
  if (accuracy >= 0.8 && avgTime < 10) earned = 3

  const key = `${adventureZone}-${adventureLevel}`
  const prev = stars[key] || 0
  if (earned > prev) stars[key] = earned

  recordAnswer(adventureZone, 'nivel' + adventureLevel, correct === total)
  checkTrophies()
  saveAll()

  // Render result
  const starsEl = document.getElementById('adv-res-stars')
  if (starsEl) starsEl.innerHTML = renderStarIcons(earned, 3)

  safeSetText('adv-res-score', `${correct}/${total}`)
  safeSetText('adv-res-msg', TEXT.starMessages[earned - 1] || '')

  showScreen('adv-result')
}

// ============================================================
// WEAK TRAINING
// ============================================================
function startWeak() {
  activeMode = 'weak'
  weaknessBefore = JSON.parse(JSON.stringify(weakness))

  currentQuestions = generateWeakSession(weakness)
  currentIdx = 0
  score = 0
  sessionResults = []
  numpadState.wk = ''

  safeSetText('wk-total', currentQuestions.length)
  safeSetText('wk-score-total', currentQuestions.length)
  safeSetText('wk-score', 0)
  safeSetText('wk-num', 1)

  showScreen('weak')
  renderWeakQuestion()
}

function renderWeakQuestion() {
  if (activeMode !== 'weak') return
  if (currentIdx >= currentQuestions.length) { endWeak(); return }

  const q = currentQuestions[currentIdx]
  numpadState.wk = ''

  safeSetText('wk-num', currentIdx + 1)
  safeSetText('wk-question-text', q.enunciado)

  // No timer in weak mode
  const card = document.getElementById('wk-question-card')
  if (card) { card.classList.remove('flash-correct', 'shake-wrong') }

  const numpadSec = document.getElementById('wk-numpad-section')
  const testSec = document.getElementById('wk-test-section')

  if (q.tipo === 'numpad') {
    numpadSec.style.display = 'block'
    testSec.style.display = 'none'
    safeSetText('wk-numpad-display', '—')
  } else {
    numpadSec.style.display = 'none'
    testSec.style.display = 'block'
    renderTestOptions(q, 'wk-options', 'wk')
  }
}

function endWeak() {
  activeMode = ''
  clearTimer()

  const total = sessionResults.length
  const correct = sessionResults.filter(r => r.correct).length

  saveAll()
  checkTrophies()
  saveAll()

  safeSetText('wk-res-score', `${correct}/${total}`)

  // Build breakdown: which subtypes improved?
  const seenSubs = {}
  sessionResults.forEach(r => {
    const key = `${r.area}__${r.subtipo}`
    if (!seenSubs[key]) seenSubs[key] = { area: r.area, subtipo: r.subtipo, errors: 0, attempts: 0 }
    seenSubs[key].attempts++
    if (!r.correct) seenSubs[key].errors++
  })

  const breakdown = document.getElementById('wk-breakdown')
  if (breakdown) {
    breakdown.innerHTML = Object.values(seenSubs).map(({ area, subtipo, errors, attempts }) => {
      const beforeW = (weaknessBefore[area] || {})[subtipo] || { errors: 0, attempts: 0 }
      const beforeRate = beforeW.attempts > 0 ? beforeW.errors / beforeW.attempts : null
      const afterRate = attempts > 0 ? errors / attempts : 0
      let changeClass = 'same', changeText = '→ sin cambio'
      if (beforeRate !== null) {
        if (afterRate < beforeRate) { changeClass = 'improved'; changeText = '↑ mejoró' }
        else if (afterRate > beforeRate) { changeClass = 'worse'; changeText = '↓ bajó' }
      }
      const label = `${AREA_NAMES[area]} — ${subtipo}`
      const scoreStr = `${attempts - errors}/${attempts}`
      return `
        <div class="weak-result-item">
          <span class="weak-item-name">${label} (${scoreStr})</span>
          <span class="weak-item-change ${changeClass}">${changeText}</span>
        </div>`
    }).join('')
  }

  showScreen('weak-result')
}

// ---- selectTestOption — need to map prefix to activeMode ----
// Override to properly check mode
function selectTestOption(prefix, btn, chosen) {
  const modeMap = { qz: 'quiz', adq: 'adventure', wk: 'weak' }
  if (activeMode !== modeMap[prefix]) return

  const container = btn.parentElement
  container.querySelectorAll('.test-btn').forEach(b => {
    b.disabled = true
    b.onclick = null
  })

  processAnswer(chosen, prefix, modeMap[prefix])
}

// ---- Service Worker registration ----
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .catch(err => console.warn('SW registration failed:', err))
  }
}

// ---- init ----
function init() {
  loadFromStorage()
  updateStreak()
  renderConstants()
  renderHome()
  registerSW()
}

// Shuffle helper (app.js copy for use in renderTestOptions)
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

document.addEventListener('DOMContentLoaded', init)
