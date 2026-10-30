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

// Strip accents — usado para mostrar la palabra "sin tilde" como prompt
function sinTilde(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '')
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

// poolItems: todos los ítems del perfil (para padding de opciones)
function generarPreguntaPalabra(item, tipo = 'choice', poolItems = []) {
  if (tipo === 'choice') {
    let opciones = [item.palabra, ...item.distractores]

    // Pad hasta 4 opciones con distractores plausibles de otros ítems
    // de la misma categoría (para evitar que 2 opciones sea trivial)
    if (opciones.length < 4) {
      const mismaCategoria = poolItems.filter(
        i => i.id !== item.id && i.mecanica === 'palabra' && i.categoria === item.categoria
      )
      for (const otro of shuffle(mismaCategoria)) {
        if (opciones.length >= 4) break
        // Añadir la versión sin tilde del otro ítem como decoy
        const decoy = otro.distractores[0]
        if (decoy && !opciones.includes(decoy) && decoy !== item.palabra) {
          opciones.push(decoy)
        }
      }
    }

    return {
      mecanica: 'palabra',
      tipo: 'choice',
      enunciado: '¿Cómo se escribe?',
      opciones: shuffle(opciones),
      respuesta: item.palabra,
      item,
    }
  }

  // Modo input: mostrar la forma incorrecta como prompt para que el usuario la corrija
  const incorrecta = item.distractores[0] || sinTilde(item.palabra)
  return {
    mecanica: 'palabra',
    tipo: 'input',
    enunciado: 'Corrige esta palabra:',
    palabraIncorrecta: incorrecta,
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

function generarPregunta(item, tipo = 'choice', poolItems = []) {
  switch (item.mecanica) {
    case 'palabra':    return generarPreguntaPalabra(item, tipo, poolItems)
    case 'contexto':   return generarPreguntaContexto(item)
    case 'puntuacion': return generarPreguntaPuntuacion(item)
    default:
      console.warn('Mecánica desconocida:', item.mecanica)
      return null
  }
}
