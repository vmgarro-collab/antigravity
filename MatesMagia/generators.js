// ============================================================
// generators.js — MatesMagia question generators
// No ES modules — all global functions
// ============================================================

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function gcd(a, b) {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) { let t = b; b = a % b; a = t }
  return a
}

function frac(n, d) { return `${n}/${d}` }

function simplify(n, d) {
  const g = gcd(Math.abs(n), Math.abs(d))
  return [n / g, d / g]
}

// ---- Superscript helpers ----
function toSup(n) {
  const map = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻' }
  return String(n).split('').map(c => map[c] || c).join('')
}

function formatMono(coeff, varName, exp) {
  // e.g. formatMono(3,'x',2) → "3x²"
  if (exp === 0) return String(coeff)
  const c = coeff === 1 ? '' : coeff === -1 ? '-' : String(coeff)
  const e = exp === 1 ? '' : toSup(exp)
  return `${c}${varName}${e}`
}

function formatPoly(a, b, c) {
  // ax² + bx + c  (a always 1 here)
  let s = 'x²'
  if (b > 0) s += `+${b}x`
  else if (b < 0) s += `${b}x`
  if (c > 0) s += `+${c}`
  else if (c < 0) s += `${c}`
  return s
}

// ---- Shuffle array ----
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ---- SUMAS ----
function generateSumas() {
  const isSuma = Math.random() < 0.5
  let a, b, respuesta, enunciado, subtipo

  if (isSuma) {
    a = randInt(10, 99)
    b = randInt(10, Math.min(99, 150 - a))
    respuesta = a + b
    enunciado = `${a} + ${b} = ?`
    subtipo = 'suma'
  } else {
    a = randInt(20, 99)
    b = randInt(5, a - 5)
    respuesta = a - b
    enunciado = `${a} − ${b} = ?`
    subtipo = 'resta'
  }

  return {
    enunciado,
    respuesta: String(respuesta),
    tipo: 'numpad',
    area: 'sumas',
    subtipo,
    distractores: []
  }
}

// ---- FRACCIONES ----
function generateFracciones() {
  const isSimplify = Math.random() < 0.5

  if (isSimplify) {
    // Pick a simplified fraction then multiply by GCD factor
    const numS = randInt(1, 9)
    const denS = randInt(numS + 1, 12)
    const factor = randInt(2, 6)
    const num = numS * factor
    const den = denS * factor
    const [rn, rd] = simplify(num, den)
    const respuesta = frac(rn, rd)

    // Distractors: wrong simplifications
    const g = gcd(num, den)
    const half = Math.floor(g / 2) || 1
    const d1 = frac(num / half, den / half)  // under-simplified
    const d2 = frac(rn + 1, rd)              // off by 1 numerator
    const d3 = frac(rn, rd + 1)              // off by 1 denominator
    const opts = shuffle([respuesta, d1, d2, d3].filter((v, i, a) => a.indexOf(v) === i))
    // Ensure exactly 4 unique options
    while (opts.length < 4) opts.push(frac(rn + opts.length, rd + opts.length))
    const finalOpts = opts.slice(0, 4)

    return {
      enunciado: `Simplifica: ${frac(num, den)}`,
      respuesta,
      tipo: 'test',
      area: 'fracciones',
      subtipo: 'simplificar',
      distractores: finalOpts.filter(o => o !== respuesta)
    }
  } else {
    // Add or subtract fractions
    const isSub = Math.random() < 0.5
    const d1 = randInt(2, 8)
    const d2 = randInt(2, 8)
    const lcm = (d1 * d2) / gcd(d1, d2)
    const n1 = randInt(1, d1 - 1 || 1)
    const n2 = randInt(1, d2 - 1 || 1)

    let rNum = isSub
      ? (n1 * (lcm / d1)) - (n2 * (lcm / d2))
      : (n1 * (lcm / d1)) + (n2 * (lcm / d2))
    let rDen = lcm

    // Avoid zero result on subtraction
    if (rNum === 0) { rNum = n1 * (lcm / d1) + n2 * (lcm / d2); }

    const [sn, sd] = simplify(rNum, rDen)
    const respuesta = sd === 1 ? String(sn) : frac(sn, sd)
    const op = isSub ? '−' : '+'

    const dist = []
    dist.push(frac(sn + 1, sd))
    dist.push(frac(sn, sd + 1))
    dist.push(frac(n1 + n2, d1 + d2))  // classic wrong: add tops and bottoms

    const finalDist = dist.filter(o => o !== respuesta).slice(0, 3)
    while (finalDist.length < 3) finalDist.push(frac(sn + finalDist.length + 1, sd))

    return {
      enunciado: `${frac(n1, d1)} ${op} ${frac(n2, d2)} = ?`,
      respuesta,
      tipo: 'test',
      area: 'fracciones',
      subtipo: isSub ? 'resta' : 'suma',
      distractores: finalDist
    }
  }
}

// ---- MONOMIOS ----
function generateMonomios() {
  const ops = ['suma', 'producto', 'division']
  const subtipo = ops[randInt(0, 2)]
  const vars = ['x', 'y']
  const v = vars[randInt(0, 1)]

  if (subtipo === 'suma') {
    // Same variable and exponent
    const exp = randInt(1, 3)
    const c1 = randInt(1, 9)
    const c2 = randInt(1, 9)
    const cr = c1 + c2
    const respuesta = formatMono(cr, v, exp)
    const enunciado = `${formatMono(c1, v, exp)} + ${formatMono(c2, v, exp)} = ?`

    const dist = [
      formatMono(cr, v, exp + 1),
      formatMono(c1 * c2, v, exp),
      formatMono(cr + 1, v, exp)
    ]

    return { enunciado, respuesta, tipo: 'test', area: 'monomios', subtipo, distractores: dist }
  }

  if (subtipo === 'producto') {
    const c1 = randInt(1, 6)
    const c2 = randInt(1, 6)
    const e1 = randInt(1, 3)
    const e2 = randInt(1, 3)
    const cr = c1 * c2
    const er = e1 + e2
    const respuesta = formatMono(cr, v, er)
    const enunciado = `${formatMono(c1, v, e1)} × ${formatMono(c2, v, e2)} = ?`

    const dist = [
      formatMono(cr, v, er + 1),
      formatMono(cr, v, er - 1 < 1 ? er + 2 : er - 1),
      formatMono(c1 + c2, v, er)
    ]

    return { enunciado, respuesta, tipo: 'test', area: 'monomios', subtipo, distractores: dist }
  }

  // division — guarantee integer coeff result
  const cr = randInt(1, 6)
  const c2 = randInt(2, 6)
  const c1 = cr * c2
  const er = randInt(1, 3)
  const e2 = randInt(1, er)   // e2 ≤ er so result exp ≥ 0
  const e1 = er + e2
  const respuesta = er === 0 ? String(cr) : formatMono(cr, v, er)
  const enunciado = `${formatMono(c1, v, e1)} ÷ ${formatMono(c2, v, e2)} = ?`

  const dist = [
    formatMono(cr, v, er + 1),
    formatMono(cr + 1, v, er),
    formatMono(c1 - c2, v, er)
  ]

  return { enunciado, respuesta, tipo: 'test', area: 'monomios', subtipo: 'division', distractores: dist }
}

// ---- POLINOMIOS ----
function generatePolinomios() {
  const ops = ['producto', 'cuadrado', 'diferencia']
  const subtipo = ops[randInt(0, 2)]

  if (subtipo === 'cuadrado') {
    // (x + a)² = x² + 2ax + a²
    const a = randInt(1, 8)
    const sign = Math.random() < 0.5 ? 1 : -1
    const signStr = sign > 0 ? '+' : '−'
    const b = 2 * a * sign
    const c = a * a
    const respuesta = formatPoly(1, b, c)
    const enunciado = `(x ${signStr} ${a})² = ?`

    const dist = [
      formatPoly(1, a * sign, c),          // forgot ×2 in middle term
      formatPoly(1, b, a),                 // forgot to square constant (only differs when a>1)
      formatPoly(1, b, c + 2)              // off by 2 on constant
    ].filter(d => d !== respuesta)

    // Ensure 3 unique distractors
    if (!dist.includes(formatPoly(1, b, c - 1)) && formatPoly(1, b, c - 1) !== respuesta && dist.length < 3)
      dist.push(formatPoly(1, b, c - 1))
    if (dist.length < 3) dist.push(formatPoly(1, b + sign, c))

    return { enunciado, respuesta, tipo: 'test', area: 'polinomios', subtipo, distractores: dist.slice(0, 3) }
  }

  if (subtipo === 'diferencia') {
    // (x+a)(x-a) = x² - a²
    const a = randInt(1, 9)
    const c = -(a * a)
    const respuesta = formatPoly(1, 0, c)
    const enunciado = `(x+${a})(x−${a}) = ?`

    const dist = [
      formatPoly(1, 2 * a, -(a * a)),   // forgot middle cancels
      formatPoly(1, 0, a * a),           // wrong sign on constant
      formatPoly(1, 0, -(a * a) + 1)    // off by 1
    ]

    return { enunciado, respuesta, tipo: 'test', area: 'polinomios', subtipo, distractores: dist }
  }

  // producto: (x+a)(x+b) = x² + (a+b)x + ab
  const a = randInt(1, 7)
  const b = randInt(1, 7)
  const sa = Math.random() < 0.5 ? 1 : -1
  const sb = Math.random() < 0.5 ? 1 : -1
  const av = a * sa
  const bv = b * sb
  const mid = av + bv
  const con = av * bv

  const s1 = sa > 0 ? `+${a}` : `−${a}`
  const s2 = sb > 0 ? `+${b}` : `−${b}`
  const respuesta = formatPoly(1, mid, con)
  const enunciado = `(x${s1})(x${s2}) = ?`

  const dist = [
    formatPoly(1, mid + 1, con),
    formatPoly(1, mid, con + 1),
    formatPoly(1, av * bv, av + bv)  // swapped mid and constant
  ]

  return { enunciado, respuesta, tipo: 'test', area: 'polinomios', subtipo, distractores: dist }
}

// ---- Main dispatcher ----
function generateQuestion(area) {
  if (area === 'sumas') return generateSumas()
  if (area === 'fracciones') return generateFracciones()
  if (area === 'monomios') return generateMonomios()
  if (area === 'polinomios') return generatePolinomios()
}

// ---- Adaptive quiz ----
function generateAdaptiveQuiz(weakness, total) {
  total = total || 12
  const areas = ['sumas', 'fracciones', 'monomios', 'polinomios']

  // Compute error rates per area
  const rates = {}
  let totalRate = 0
  areas.forEach(a => {
    const w = weakness[a] || {}
    let errors = 0, attempts = 0
    Object.values(w).forEach(s => { errors += s.errors || 0; attempts += s.attempts || 0 })
    rates[a] = attempts > 0 ? errors / attempts : 0.25  // default equal weight
    totalRate += rates[a]
  })

  // Allocate questions proportionally, min 1 each
  const alloc = {}
  let allocated = 0
  areas.forEach(a => {
    alloc[a] = Math.max(1, Math.round((rates[a] / totalRate) * total))
    allocated += alloc[a]
  })

  // Adjust to hit exact total
  let diff = total - allocated
  const sorted = [...areas].sort((a, b) => rates[b] - rates[a])
  let i = 0
  while (diff !== 0) {
    const area = sorted[i % sorted.length]
    if (diff > 0) { alloc[area]++; diff-- }
    else if (alloc[area] > 1) { alloc[area]--; diff++ }
    i++
  }

  const questions = []
  areas.forEach(a => {
    for (let n = 0; n < alloc[a]; n++) questions.push(generateQuestion(a))
  })

  return shuffle(questions)
}

// ---- Weak session ----
function generateWeakSession(weakness) {
  const total = 10
  const areas = ['sumas', 'fracciones', 'monomios', 'polinomios']

  // Collect subtypes with error rates
  const subtypes = []
  areas.forEach(area => {
    const w = weakness[area] || {}
    Object.entries(w).forEach(([sub, stats]) => {
      const rate = stats.attempts > 0 ? stats.errors / stats.attempts : 0
      subtypes.push({ area, sub, rate })
    })
  })

  // Sort worst first
  subtypes.sort((a, b) => b.rate - a.rate)

  const questions = []

  // Fill from worst subtypes
  subtypes.forEach(({ area }) => {
    if (questions.length < total) questions.push(generateQuestion(area))
  })

  // Fill remainder with fracciones and monomios
  while (questions.length < total) {
    const area = questions.length % 2 === 0 ? 'fracciones' : 'monomios'
    questions.push(generateQuestion(area))
  }

  return shuffle(questions.slice(0, total))
}
