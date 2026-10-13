// generators.js — question generation per mechanic

// ── Utilities ──────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Validator ──────────────────────────────────────────────────────────────

function validateBanco(items) {
  const errors = []
  const ids = new Set()
  for (const item of items) {
    if (!item.id) { errors.push('Item sin id'); continue }
    if (ids.has(item.id)) errors.push(`ID duplicado: ${item.id}`)
    ids.add(item.id)

    if (item.mecanica === 'palabra') {
      if (!item.distractores) { errors.push(`${item.id}: sin distractores`); continue }
      if (item.distractores.includes(item.palabra)) {
        errors.push(`${item.id}: "${item.palabra}" aparece en sus propios distractores`)
      }
      const seen = new Set()
      for (const d of item.distractores) {
        if (seen.has(d)) errors.push(`${item.id}: distractor duplicado "${d}"`)
        seen.add(d)
      }
    }
  }
  return errors
}

// ── Mechanic 1: "palabra" ──────────────────────────────────────────────────

function generarPreguntaPalabra(item, tipo = 'choice') {
  if (tipo === 'choice') {
    const opciones = shuffle([item.palabra, ...item.distractores])
    return {
      mecanica: 'palabra',
      tipo: 'choice',
      enunciado: '¿Cómo se escribe?',
      opciones,
      respuesta: item.palabra,
      item,
    }
  }
  return {
    mecanica: 'palabra',
    tipo: 'input',
    enunciado: 'Escribe la palabra correctamente:',
    respuesta: item.palabra,
    item,
  }
}

// ── Mechanic 2: "contexto" (stub) ──────────────────────────────────────────

function generarPreguntaContexto(item) {
  console.warn('Mecánica "contexto" aún no implementada', item.id)
  return null
}

// ── Mechanic 3: "puntuacion" (stub) ───────────────────────────────────────

function generarPreguntaPuntuacion(item) {
  console.warn('Mecánica "puntuacion" aún no implementada', item.id)
  return null
}

// ── Dispatcher ────────────────────────────────────────────────────────────

function generarPregunta(item, tipo = 'choice') {
  switch (item.mecanica) {
    case 'palabra':    return generarPreguntaPalabra(item, tipo)
    case 'contexto':   return generarPreguntaContexto(item)
    case 'puntuacion': return generarPreguntaPuntuacion(item)
    default:
      console.warn('Mecánica desconocida:', item.mecanica)
      return null
  }
}
