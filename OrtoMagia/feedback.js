// feedback.js — builds the feedback message after each answer

function buildFeedback(item, userAnswer) {
  const correcto = userAnswer.trim().toLowerCase() === item.palabra.toLowerCase()

  let texto
  if (correcto) {
    texto = item.regla
      ? `✓ ${item.regla}`
      : item.mnemotecnia
        ? `✓ ${item.mnemotecnia}`
        : '✓ ¡Correcto!'
  } else {
    const forma = `La forma correcta es <strong>${item.palabra}</strong>.`
    if (item.regla) {
      texto = `${forma} ${item.regla}`
    } else if (item.mnemotecnia) {
      texto = `${forma} ${item.mnemotecnia}`
    } else {
      texto = forma
    }
  }

  return { correcto, texto }
}
