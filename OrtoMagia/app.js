// app.js — OrtoMagia

'use strict'

// ── Zones config ──────────────────────────────────────────────────────────
const ZONES = {
  martin: [
    { id: 'agudas',   label: 'Isla de las Agudas',   emoji: '🌴', categoria: 'aguda',     nivel: 1 },
    { id: 'llanas',   label: 'Valle de las Llanas',   emoji: '⛰️', categoria: 'llana',     nivel: 1 },
    { id: 'esdruj',   label: 'Isla Esdrújula',        emoji: '🏝️', categoria: 'esdrujula', nivel: 2 },
    { id: 'hache',    label: 'Cueva de la H',         emoji: '🕳️', categoria: 'h',         nivel: 2 },
    { id: 'bv',       label: 'Selva B/V',             emoji: '🌿', categoria: 'b_v',       nivel: 3 },
    { id: 'gj',       label: 'Puerto G/J',            emoji: '⚓', categoria: 'g_j',       nivel: 3 },
    { id: 'lly',      label: 'Bosque LL/Y',           emoji: '🌲', categoria: 'll_y',      nivel: 3 },
  ],
  sofia: [
    { id: 'agudas',   label: 'Palabras agudas',       emoji: '', categoria: 'aguda',     nivel: 1 },
    { id: 'llanas',   label: 'Palabras llanas',       emoji: '', categoria: 'llana',     nivel: 1 },
    { id: 'esdruj',   label: 'Palabras esdrújulas',   emoji: '', categoria: 'esdrujula', nivel: 2 },
    { id: 'hache',    label: 'La h intercalada',      emoji: '', categoria: 'h',         nivel: 2 },
    { id: 'bv',       label: 'B y V',                 emoji: '', categoria: 'b_v',       nivel: 3 },
    { id: 'gj',       label: 'G y J',                 emoji: '', categoria: 'g_j',       nivel: 3 },
    { id: 'lly',      label: 'LL e Y',                emoji: '', categoria: 'll_y',      nivel: 3 },
  ],
}

const CAT_LABELS = {
  aguda: 'Agudas', llana: 'Llanas', esdrujula: 'Esdrújulas',
  h: 'H muda', b_v: 'B / V', g_j: 'G / J', ll_y: 'LL / Y',
  diacritica: 'Diacríticas', interrogacion: 'Interrogativas',
}

const TROPHIES = [
  { id: 'principiante', label: 'Principiante', icon: '🏅', threshold: 10 },
  { id: 'practicante',  label: 'Practicante',  icon: '🥈', threshold: 30 },
  { id: 'experto',      label: 'Experto',       icon: '🏆', threshold: 60 },
  { id: 'maestro',      label: 'Maestro',       icon: '🌟', threshold: 100 },
]

// ── State ─────────────────────────────────────────────────────────────────
let currentProfile = null
let allItems = []
let session = { queue: [], idx: 0, results: [], mode: null, zone: null }

// ── localStorage helpers ──────────────────────────────────────────────────
function ls(key, def) {
  const v = localStorage.getItem(`ortomagia_${currentProfile}_${key}`)
  return v !== null ? JSON.parse(v) : def
}
function lsSet(key, val) {
  localStorage.setItem(`ortomagia_${currentProfile}_${key}`, JSON.stringify(val))
}

// ── Screens ───────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(id).classList.add('active')
}

// ── DOM helpers ───────────────────────────────────────────────────────────
function $(id) { return document.getElementById(id) }
function setText(id, text) { const el = $(id); if (el) el.textContent = text }
function setHTML(id, html) { const el = $(id); if (el) el.innerHTML = html }
function hide(id) { const el = $(id); if (el) el.classList.add('hidden') }
function show(id) { const el = $(id); if (el) el.classList.remove('hidden') }

// ── Bank loading & validation ─────────────────────────────────────────────
async function loadBanco() {
  let base = []
  try {
    const res = await fetch('banco.json')
    const data = await res.json()
    const prevVersion = parseInt(localStorage.getItem('ortomagia_bancoVersion') || '0')
    if (data.version > prevVersion) {
      localStorage.setItem('ortomagia_bancoVersion', data.version)
    }
    base = data.items || []
  } catch (e) {
    console.warn('No se pudo cargar banco.json, usando solo custom items:', e)
  }

  // Merge custom items from both profiles
  const customMartin = JSON.parse(localStorage.getItem('ortomagia_martin_customItems') || '[]')
  const customSofia  = JSON.parse(localStorage.getItem('ortomagia_sofia_customItems')  || '[]')
  const all = [...base, ...customMartin, ...customSofia]

  const errors = validateBanco(all)
  if (errors.length) console.warn('Errores en banco:', errors)

  allItems = all
}

// ── Profile selection ─────────────────────────────────────────────────────
function selectProfile(profile) {
  currentProfile = profile
  document.body.className = profile

  const accentKey = ls('accent', 'purple')
  if (profile === 'sofia') {
    document.body.classList.add(`accent-${accentKey}`)
  }

  refreshHome()
  showScreen('screen-home')
}

function refreshHome() {
  const racha   = ls('racha', { count: 0, lastDate: null, best: 0 })
  const stars   = ls('stars', 0)
  const weakness = ls('weakness', {})
  const profileItems = allItems.filter(i => i.perfiles && i.perfiles.includes(currentProfile) && i.mecanica === 'palabra')
  const weakCount = profileItems.filter(i => {
    const w = weakness[i.id]
    return w && w.attempts >= 3 && w.errors / w.attempts > 0.3
  }).length

  setText('home-profile-name', currentProfile === 'martin' ? '🧑 Martín' : '👩 Sofía')
  setText('home-racha', racha.count)
  setText('home-stars', stars)
  setText('mode-debiles-desc', weakCount > 0 ? `${weakCount} palabras débiles` : 'Refuerza tus errores')
  if (currentProfile === 'sofia') {
    setText('mode-icon-aventura', '📚')
  } else {
    setText('mode-icon-aventura', '🗺️')
  }
}

// ── Queue builders ────────────────────────────────────────────────────────
function profileItems() {
  return allItems.filter(i => i.perfiles && i.perfiles.includes(currentProfile) && i.mecanica === 'palabra')
}

function buildQuizQueue() {
  return shuffle(profileItems()).slice(0, 10)
}

function buildZoneQueue(zone) {
  const items = profileItems().filter(i => i.categoria === zone.categoria)
  if (items.length === 0) return []
  let q = [...items]
  while (q.length < 6) q = [...q, ...items]
  return shuffle(q).slice(0, 10)
}

function buildWeakQueue() {
  const weakness = ls('weakness', {})
  const items = profileItems()
    .filter(i => {
      const w = weakness[i.id]
      return w && w.attempts >= 3 && w.errors / w.attempts > 0.3
    })
    .sort((a, b) => {
      const wa = weakness[a.id], wb = weakness[b.id]
      return (wb.errors / wb.attempts) - (wa.errors / wa.attempts)
    })
  return items.slice(0, 15)
}

// ── Session start ─────────────────────────────────────────────────────────
function startSession(mode, zone = null) {
  let queue = []
  if (mode === 'quiz')     queue = buildQuizQueue()
  if (mode === 'aventura') queue = buildZoneQueue(zone)
  if (mode === 'debiles')  queue = buildWeakQueue()

  if (queue.length === 0) {
    if (mode === 'debiles') {
      alert('¡Todavía no tienes palabras débiles! Juega un Quiz Rápido primero.')
    } else {
      alert('No hay palabras disponibles en esta zona. Añade palabras en el Modo Padre.')
    }
    return
  }

  session = { queue, idx: 0, results: [], mode, zone }
  renderQuestion()
  showScreen('screen-quiz')
}

// ── Question rendering ────────────────────────────────────────────────────
function renderQuestion() {
  const item = session.queue[session.idx]
  const total = session.queue.length
  const idx = session.idx

  const tipo = session.mode === 'debiles' ? 'input' : 'choice'
  const q = generarPregunta(item, tipo, profileItems())

  if (!q) { advanceSession(false); return }

  // Progress
  $('quiz-progress').style.width = `${(idx / total) * 100}%`
  setText('quiz-counter', `${idx + 1}/${total}`)

  // Category label
  setText('q-category', CAT_LABELS[item.categoria] || item.categoria)

  // Question text
  setText('q-text', q.enunciado)

  // Hide feedback
  const panel = $('feedback-panel')
  panel.classList.remove('show', 'ok', 'fail')

  if (q.tipo === 'choice') {
    hide('q-input-group')
    show('q-choices')
    const grid = $('q-choices')
    grid.innerHTML = ''
    q.opciones.forEach(opt => {
      const btn = document.createElement('button')
      btn.className = 'choice-btn'
      btn.textContent = opt
      btn.addEventListener('click', () => handleChoice(btn, opt, q, item))
      grid.appendChild(btn)
    })
  } else {
    hide('q-choices')
    show('q-input-group')
    // Mostrar la forma incorrecta como referencia visible
    let hint = $('q-incorrect-hint')
    if (!hint) {
      hint = document.createElement('div')
      hint.id = 'q-incorrect-hint'
      hint.style.cssText = 'font-size:2rem;font-weight:800;text-align:center;letter-spacing:0.04em;color:var(--error);margin-bottom:4px'
      $('q-input-group').insertBefore(hint, $('q-input-group').firstChild)
    }
    hint.textContent = q.palabraIncorrecta || ''
    $('q-input').value = ''
    $('q-input').focus()
    $('btn-submit-input').onclick = () => {
      const val = $('q-input').value.trim()
      if (!val) return
      handleInput(val, q, item)
    }
    $('q-input').onkeydown = e => {
      if (e.key === 'Enter') $('btn-submit-input').click()
    }
  }
}

function handleChoice(btn, answer, q, item) {
  // Disable all buttons
  $('q-choices').querySelectorAll('.choice-btn').forEach(b => {
    b.disabled = true
    if (b.textContent === q.respuesta) b.classList.add('correct')
  })
  const correct = answer === q.respuesta
  if (!correct) btn.classList.add('wrong')
  showFeedback(item, answer, correct)
}

function handleInput(answer, q, item) {
  $('btn-submit-input').disabled = true
  $('q-input').disabled = true
  const correct = answer.toLowerCase() === q.respuesta.toLowerCase()
  showFeedback(item, answer, correct)
}

function showFeedback(item, userAnswer, correct) {
  const fb = buildFeedback(item, userAnswer)
  const panel = $('feedback-panel')

  $('feedback-icon').textContent = correct ? '✓' : '✗'
  setHTML('feedback-text', fb.texto)
  panel.classList.add('show', correct ? 'ok' : 'fail')

  session.results.push({ item, correct, answer: userAnswer })
  $('btn-next').onclick = advanceSession
}

function advanceSession() {
  // Re-enable inputs
  $('btn-submit-input').disabled = false
  $('q-input').disabled = false

  session.idx++
  if (session.idx < session.queue.length) {
    renderQuestion()
  } else {
    finishSession()
  }
}

// ── Session end ───────────────────────────────────────────────────────────
function finishSession() {
  const { results, mode, zone } = session

  // Record weakness
  const weakness = ls('weakness', {})
  results.forEach(({ item, correct }) => {
    if (!weakness[item.id]) weakness[item.id] = { errors: 0, attempts: 0 }
    weakness[item.id].attempts++
    if (!correct) weakness[item.id].errors++
  })
  lsSet('weakness', weakness)

  // Update stars
  const gained = results.filter(r => r.correct).length
  lsSet('stars', ls('stars', 0) + gained)

  // Weekly stats
  updateWeeklyStats(gained, results.length)

  // Racha
  updateRacha()

  // Check trophies
  const newTrophy = checkTrophies()

  if (mode === 'aventura' && zone) {
    showZoneResult(zone, results, newTrophy)
  } else {
    showResults(results, mode, newTrophy)
  }
}

// ── Results display ───────────────────────────────────────────────────────
function showResults(results, mode, trophy) {
  const correct = results.filter(r => r.correct).length
  const total   = results.length
  const pct     = Math.round(correct / total * 100)

  const labels = { quiz: 'Quiz Rápido', debiles: 'Entrena Débiles' }
  setText('results-mode-label', labels[mode] || 'Resultado')
  setText('results-score', `${correct}/${total}`)
  setText('results-label', `${pct}% correcto`)

  setHTML('results-breakdown', `
    <div class="breakdown-row"><span>Correctas</span><strong>${correct}</strong></div>
    <div class="breakdown-row"><span>Errores</span><strong>${total - correct}</strong></div>
    <div class="breakdown-row"><span>Estrellas ganadas</span><strong>⭐ ${correct}</strong></div>
  `)

  $('results-items').innerHTML = results.map(r => `
    <div class="result-item">
      <span class="ri-icon">${r.correct ? '✓' : '✗'}</span>
      <div>
        <div class="ri-word">${r.item.palabra}</div>
        <div class="ri-rule">${r.item.regla || r.item.mnemotecnia || ''}</div>
      </div>
    </div>
  `).join('')

  $('btn-results-home').onclick = () => {
    refreshHome()
    showScreen('screen-home')
    if (trophy) showTrophy(trophy)
  }

  showScreen('screen-results')
}

function showZoneResult(zone, results, trophy) {
  const correct = results.filter(r => r.correct).length
  const total   = results.length
  const pct     = correct / total
  const stars   = pct >= 0.9 ? 3 : pct >= 0.75 ? 2 : pct >= 0.5 ? 1 : 0

  // Save zone stars
  const zoneStars = ls('zoneStars', {})
  const prev = zoneStars[zone.id] || 0
  if (stars > prev) { zoneStars[zone.id] = stars; lsSet('zoneStars', zoneStars) }

  setText('zona-res-title', zone.label)
  setText('zona-res-stars', stars > 0 ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆')
  setText('zona-res-label', stars > 0 ? `${correct}/${total} — ${Math.round(pct*100)}%` : 'Inténtalo de nuevo')

  setHTML('zona-res-breakdown', `
    <div class="breakdown-row"><span>Correctas</span><strong>${correct}</strong></div>
    <div class="breakdown-row"><span>Errores</span><strong>${total - correct}</strong></div>
    <div class="breakdown-row"><span>Estrellas zona</span><strong>${'⭐'.repeat(stars) || '—'}</strong></div>
  `)

  $('zona-res-items').innerHTML = results.map(r => `
    <div class="result-item">
      <span class="ri-icon">${r.correct ? '✓' : '✗'}</span>
      <div>
        <div class="ri-word">${r.item.palabra}</div>
        <div class="ri-rule">${r.item.regla || r.item.mnemotecnia || ''}</div>
      </div>
    </div>
  `).join('')

  $('btn-zona-res-back').onclick = () => {
    showAventuraMap()
    if (trophy) showTrophy(trophy)
  }

  showScreen('screen-zona-result')
}

// ── Adventure map ─────────────────────────────────────────────────────────
function showAventuraMap() {
  const zones    = ZONES[currentProfile]
  const zoneStars = ls('zoneStars', {})
  const list     = $('zones-list')
  list.innerHTML = ''

  setText('aventura-title', currentProfile === 'martin' ? '🗺️ Aventura' : 'Aventura')

  zones.forEach((zone, i) => {
    const stars     = zoneStars[zone.id] || 0
    const unlocked  = i === 0 || (zoneStars[zones[i - 1].id] || 0) >= 2
    const items     = profileItems().filter(it => it.categoria === zone.categoria)

    const btn = document.createElement('button')
    btn.disabled = !unlocked

    if (currentProfile === 'martin') {
      btn.className = 'zone-card'
      const starStr = stars > 0 ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆'
      btn.innerHTML = `
        <span class="zone-emoji">${zone.emoji}</span>
        <div class="zone-info">
          <div class="zone-name">${zone.label}</div>
          <div class="zone-stars">${starStr}</div>
          ${!unlocked ? '<div class="zone-locked">🔒 Completa la zona anterior</div>' : ''}
        </div>
      `
    } else {
      btn.className = 'zone-card'
      const pct = items.length > 0 ? Math.round(stars / 3 * 100) : 0
      btn.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="zone-name">${zone.label}</span>
          <span class="zone-pct">${stars > 0 ? '⭐'.repeat(stars) : unlocked ? '0 / 3 ⭐' : '🔒'}</span>
        </div>
        <div class="zone-progress-bar"><div class="zone-progress-fill" style="width:${pct}%"></div></div>
      `
    }

    if (unlocked) btn.onclick = () => startSession('aventura', zone)
    list.appendChild(btn)
  })

  showScreen('screen-aventura')
}

// ── Stats screen ───────────────────────────────────────────────────────────
function showStats() {
  const racha      = ls('racha', { count: 0, lastDate: null, best: 0 })
  const stars      = ls('stars', 0)
  const weakness   = ls('weakness', {})
  const weeklyStats = ls('weeklyStats', [])
  const zoneStars  = ls('zoneStars', {})

  // Cat accuracy
  const catData = {}
  const items = profileItems()
  items.forEach(item => {
    if (!catData[item.categoria]) catData[item.categoria] = { correct: 0, total: 0 }
    const w = weakness[item.id]
    if (w && w.attempts > 0) {
      catData[item.categoria].total   += w.attempts
      catData[item.categoria].correct += w.attempts - w.errors
    }
  })

  // Zones progress
  const zones = ZONES[currentProfile]
  const zonesCompleted = zones.filter(z => (zoneStars[z.id] || 0) >= 2).length

  const body = $('stats-body')

  body.innerHTML = `
    <div class="stat-section">
      <h3>Resumen</h3>
      <div class="kpi-row">
        <div class="kpi"><div class="kpi-val">🔥${racha.count}</div><div class="kpi-label">Racha actual</div></div>
        <div class="kpi"><div class="kpi-val">🔥${racha.best || 0}</div><div class="kpi-label">Mejor racha</div></div>
        <div class="kpi"><div class="kpi-val">⭐${stars}</div><div class="kpi-label">Estrellas</div></div>
      </div>
    </div>

    <div class="stat-section">
      <h3>Por categoría</h3>
      <div class="cat-rows">
        ${Object.entries(catData).map(([cat, d]) => {
          const pct = d.total > 0 ? Math.round(d.correct / d.total * 100) : 0
          return `<div class="cat-row">
            <div class="cat-label-row">
              <span>${CAT_LABELS[cat] || cat}</span>
              <span>${d.total > 0 ? `${pct}%` : '—'}</span>
            </div>
            <div class="cat-bar"><div class="cat-fill" style="width:${pct}%"></div></div>
          </div>`
        }).join('') || '<p class="empty-msg">Todavía sin datos. ¡Juega un Quiz!</p>'}
      </div>
    </div>

    <div class="stat-section">
      <h3>Últimas semanas</h3>
      ${weeklyStats.length > 0 ? renderWeekChart(weeklyStats) : '<p class="empty-msg">Sin datos semanales aún.</p>'}
    </div>

    <div class="stat-section">
      <h3>Aventura</h3>
      <div class="kpi-row">
        <div class="kpi"><div class="kpi-val">${zonesCompleted}</div><div class="kpi-label">Zonas (≥2⭐)</div></div>
        <div class="kpi"><div class="kpi-val">${zones.length}</div><div class="kpi-label">Zonas totales</div></div>
      </div>
    </div>

    ${renderTrophySection()}
  `
}

function renderWeekChart(weeklyStats) {
  const maxTotal = Math.max(...weeklyStats.map(w => w.total), 1)
  const bars = weeklyStats.slice(-8).map((w, i) => {
    const pct = w.total > 0 ? Math.round(w.correct / w.total * 100) : 0
    const h   = Math.round((w.total / maxTotal) * 48)
    return `<div class="week-bar-wrap">
      <div class="week-bar-bg">
        <div class="week-bar-fill" style="height:${h}px"></div>
      </div>
      <div class="week-label">${pct}%</div>
    </div>`
  })
  return `<div class="week-chart">${bars.join('')}</div>`
}

function renderTrophySection() {
  const stars = ls('stars', 0)
  const rows = TROPHIES.map(t => {
    const unlocked = stars >= t.threshold
    return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:0.88rem;${unlocked ? '' : 'opacity:0.4'}">
      <span style="font-size:1.4rem">${t.icon}</span>
      <div>
        <div style="font-weight:700">${t.label}</div>
        <div style="color:var(--text-muted);font-size:0.75rem">${t.threshold} ⭐</div>
      </div>
      ${unlocked ? '<span style="margin-left:auto;color:var(--success);font-weight:700">✓</span>' : ''}
    </div>`
  }).join('<hr style="border-color:var(--border)">')

  return `<div class="stat-section"><h3>Trofeos</h3>${rows}</div>`
}

// ── Racha & stats helpers ─────────────────────────────────────────────────
function updateRacha() {
  const racha = ls('racha', { count: 0, lastDate: null, best: 0 })
  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (racha.lastDate === today) return racha

  if (racha.lastDate === yesterday) {
    racha.count++
  } else {
    racha.count = 1
  }
  racha.lastDate = today
  racha.best = Math.max(racha.best || 0, racha.count)
  lsSet('racha', racha)
  return racha
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function updateWeeklyStats(correct, total) {
  const stats = ls('weeklyStats', [])
  const week  = getISOWeek(new Date())
  const entry = stats.find(s => s.week === week)
  if (entry) {
    entry.correct += correct
    entry.total   += total
  } else {
    stats.push({ week, correct, total })
  }
  while (stats.length > 8) stats.shift()
  lsSet('weeklyStats', stats)
}

// ── Trophy check ───────────────────────────────────────────────────────────
function checkTrophies() {
  const stars    = ls('stars', 0)
  const unlocked = ls('unlockedTrophies', [])
  for (const t of TROPHIES) {
    if (stars >= t.threshold && !unlocked.includes(t.id)) {
      unlocked.push(t.id)
      lsSet('unlockedTrophies', unlocked)
      return t
    }
  }
  return null
}

function showTrophy(t) {
  setText('trophy-icon', t.icon)
  setText('trophy-title', `¡${t.label}!`)
  setText('trophy-sub', `Has conseguido ${t.threshold} estrellas`)
  $('trophy-overlay').classList.add('show')
  $('btn-trophy-ok').onclick = () => $('trophy-overlay').classList.remove('show')
}

// ── Modo Padre ────────────────────────────────────────────────────────────
function renderCustomList() {
  const profile = $('padre-perfil').value
  const items   = JSON.parse(localStorage.getItem(`ortomagia_${profile}_customItems`) || '[]')
  const list    = $('custom-list')

  if (items.length === 0) {
    list.innerHTML = '<p class="empty-msg">Sin palabras personalizadas aún.</p>'
    return
  }
  list.innerHTML = items.map(it => `
    <div class="custom-item">
      <div><strong>${it.palabra}</strong> <span style="color:var(--text-muted);font-size:0.8rem">(${CAT_LABELS[it.categoria] || it.categoria})</span></div>
      <button class="btn-del" data-id="${it.id}">✕</button>
    </div>
  `).join('')

  list.querySelectorAll('.btn-del').forEach(btn => {
    btn.onclick = () => deleteCustomItem(profile, btn.dataset.id)
  })
}

function deleteCustomItem(profile, id) {
  const key   = `ortomagia_${profile}_customItems`
  const items = JSON.parse(localStorage.getItem(key) || '[]').filter(i => i.id !== id)
  localStorage.setItem(key, JSON.stringify(items))
  // Reload allItems
  loadBanco().then(renderCustomList)
}

function addCustomItem() {
  const profile     = $('padre-perfil').value
  const categoria   = $('padre-cat').value
  const palabra     = $('padre-palabra').value.trim()
  const distStr     = $('padre-distractores').value.trim()
  const regla       = $('padre-regla').value.trim() || null
  const mnemotecnia = $('padre-mnemo').value.trim() || null
  const nivel       = parseInt($('padre-nivel').value)

  const errEl = $('padre-error')
  errEl.classList.add('hidden')

  if (!palabra) { errEl.textContent = 'La palabra es obligatoria.'; errEl.classList.remove('hidden'); return }

  const distractores = distStr ? distStr.split(',').map(d => d.trim()).filter(Boolean) : []

  // Validate
  if (distractores.includes(palabra)) {
    errEl.textContent = `"${palabra}" no puede estar en sus propios distractores.`
    errEl.classList.remove('hidden'); return
  }
  const seen = new Set()
  for (const d of distractores) {
    if (seen.has(d)) { errEl.textContent = `Distractor duplicado: "${d}".`; errEl.classList.remove('hidden'); return }
    seen.add(d)
  }

  const id   = `custom-${profile}-${Date.now()}`
  const item = { id, mecanica: 'palabra', categoria, palabra, distractores, regla, mnemotecnia, nivel, perfiles: [profile], custom: true }

  const key   = `ortomagia_${profile}_customItems`
  const items = JSON.parse(localStorage.getItem(key) || '[]')
  items.push(item)
  localStorage.setItem(key, JSON.stringify(items))

  // Clear form
  $('padre-palabra').value = ''
  $('padre-distractores').value = ''
  $('padre-regla').value = ''
  $('padre-mnemo').value = ''

  loadBanco().then(renderCustomList)
}

function exportCustomItems(profile) {
  const items = JSON.parse(localStorage.getItem(`ortomagia_${profile}_customItems`) || '[]')
  const blob  = new Blob([JSON.stringify({ profile, exportedAt: new Date().toISOString(), items }, null, 2)], { type: 'application/json' })
  const a     = document.createElement('a')
  a.href      = URL.createObjectURL(blob)
  a.download  = `ortomagia-custom-${profile}.json`
  a.click()
}

function importCustomItems(file) {
  const reader = new FileReader()
  reader.onload = e => {
    try {
      const data    = JSON.parse(e.target.result)
      const profile = data.profile
      if (!profile || !['martin', 'sofia'].includes(profile)) throw new Error('Perfil inválido')
      const items = data.items || []

      const errors = validateBanco(items)
      if (errors.length) { alert('Errores en el JSON:\n' + errors.join('\n')); return }

      const key     = `ortomagia_${profile}_customItems`
      const current = JSON.parse(localStorage.getItem(key) || '[]')
      const ids     = new Set(current.map(i => i.id))
      const toAdd   = items.filter(i => !ids.has(i.id))

      localStorage.setItem(key, JSON.stringify([...current, ...toAdd]))
      alert(`Importados ${toAdd.length} ítems para ${profile}.`)
      loadBanco().then(renderCustomList)
    } catch (err) {
      alert('Error al importar: ' + err.message)
    }
  }
  reader.readAsText(file)
}

// ── App init ──────────────────────────────────────────────────────────────
async function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(console.warn)
  }

  await loadBanco()

  // Profile buttons
  document.querySelectorAll('.profile-btn').forEach(btn => {
    btn.onclick = () => selectProfile(btn.dataset.profile)
  })

  $('btn-to-padre').onclick = () => {
    renderCustomList()
    showScreen('screen-padre')
  }
  $('btn-padre-back').onclick = () => showScreen('screen-profiles')

  // Home
  $('btn-home-back').onclick = () => {
    document.body.className = ''
    currentProfile = null
    showScreen('screen-profiles')
  }
  $('btn-to-stats').onclick = () => { showStats(); showScreen('screen-stats') }
  $('btn-stats-back').onclick = () => showScreen('screen-home')

  $('btn-home-settings').onclick = () => {
    if (currentProfile === 'sofia') {
      $('settings-overlay').classList.remove('hidden')
    }
  }
  $('btn-settings-close').onclick = () => $('settings-overlay').classList.add('hidden')

  document.querySelectorAll('.accent-dot').forEach(dot => {
    dot.onclick = () => {
      const accent = dot.dataset.accent
      document.body.className = `sofia accent-${accent}`
      lsSet('accent', accent)
      document.querySelectorAll('.accent-dot').forEach(d => d.classList.toggle('active', d === dot))
    }
  })

  // Mode buttons
  document.querySelectorAll('.mode-card').forEach(btn => {
    btn.onclick = () => {
      const mode = btn.dataset.mode
      if (mode === 'aventura') { showAventuraMap(); return }
      startSession(mode)
    }
  })

  // Quiz
  $('btn-quiz-back').onclick = () => { showScreen('screen-home'); refreshHome() }
  $('btn-aventura-back').onclick = () => showScreen('screen-home')

  // Padre
  $('padre-perfil').onchange = renderCustomList
  $('btn-padre-add').onclick = addCustomItem
  $('btn-export-martin').onclick = () => exportCustomItems('martin')
  $('btn-export-sofia').onclick  = () => exportCustomItems('sofia')
  $('btn-import').onchange = e => { if (e.target.files[0]) importCustomItems(e.target.files[0]) }

  // Init accent dots state
  // (done when profile selected)
}

document.addEventListener('DOMContentLoaded', init)
