# TablasMagia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una app PWA vanilla JS de tablas de multiplicar gamificada, instalable en móvil, con 3 modos de juego y algoritmo adaptativo de errores.

**Architecture:** App de una sola página con pantallas intercambiables (fade/slide). Todo el estado en variables globales y localStorage. Sin build system ni dependencias npm — todo CDN o código inline.

**Tech Stack:** Vanilla JS ES6+, CSS custom properties, localStorage, Service Worker (PWA), Google Fonts CDN (Inter)

> **Nota:** Este proyecto no tiene test suite (ver CLAUDE.md). Las verificaciones son manuales — cada tarea indica qué abrir en el navegador y qué comprobar.

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---------|----------------|
| `TablasMagia/index.html` | Shell HTML, todas las pantallas como `<section>`, carga scripts al final del body |
| `TablasMagia/styles.css` | Variables CSS, glassmorphism, animaciones, layout móvil |
| `TablasMagia/app.js` | Todo el JS: estado global, navegación, modos de juego, algoritmo, recompensas |
| `TablasMagia/manifest.json` | Configuración PWA |
| `TablasMagia/sw.js` | Service worker cache-first |
| `TablasMagia/icon.svg` | Icono SVG (se referencia desde manifest como fallback) |

---

## Task 1: Scaffold — HTML shell + CSS base

**Files:**
- Create: `TablasMagia/index.html`
- Create: `TablasMagia/styles.css`

- [ ] **Step 1: Crear index.html**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#ff2d78" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <title>TablasMagia ✖️</title>
  <link rel="manifest" href="manifest.json" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>

  <!-- SCREEN: Home -->
  <section id="screen-home" class="screen active">
    <div class="home-header">
      <h1 class="logo">✖️ TablasMagia</h1>
      <div class="streak-badge" id="streak-badge">🔥 <span id="streak-count">0</span> días</div>
    </div>
    <div class="progress-block">
      <div class="progress-label">
        <span>Estrellas</span>
        <span id="stars-total">0</span>/30 ⭐
      </div>
      <div class="progress-bar"><div class="progress-fill" id="stars-bar"></div></div>
    </div>
    <div class="trophies-row" id="trophies-row">
      <div class="trophy locked" id="trophy-principiante" title="Principiante: 5 ⭐">🏅</div>
      <div class="trophy locked" id="trophy-maestra" title="Maestra: 15 ⭐">🥈</div>
      <div class="trophy locked" id="trophy-leyenda" title="Leyenda: 30 ⭐">🏆</div>
    </div>
    <div class="mode-buttons">
      <button class="btn-mode btn-quiz" onclick="startQuiz()">
        <span class="mode-icon">⚡</span>
        <span class="mode-title">Quiz Rápido</span>
        <span class="mode-sub">20 preguntas · Puntuación</span>
      </button>
      <button class="btn-mode btn-aventura" onclick="showAventura()">
        <span class="mode-icon">🗺️</span>
        <span class="mode-title">Aventura</span>
        <span class="mode-sub">Desbloquea las 10 tablas</span>
      </button>
      <button class="btn-mode btn-debiles" onclick="startEntrenamiento()">
        <span class="mode-icon">💪</span>
        <span class="mode-title">Entrena Débiles</span>
        <span class="mode-sub">Tus peores multiplicaciones</span>
      </button>
    </div>
  </section>

  <!-- SCREEN: Quiz -->
  <section id="screen-quiz" class="screen">
    <div class="screen-header">
      <button class="btn-back" onclick="goHome()">←</button>
      <span class="screen-title">Quiz Rápido</span>
      <span class="score-display">⭐ <span id="quiz-score">0</span></span>
    </div>
    <div class="quiz-progress">
      <span id="quiz-q-num">1</span>/20
      <div class="timer-bar"><div class="timer-fill" id="timer-fill"></div></div>
    </div>
    <div class="question-card" id="quiz-question-card">
      <div class="question-text" id="quiz-question">7 × 8 = ?</div>
      <div class="feedback-overlay" id="quiz-feedback"></div>
    </div>
    <div class="numpad" id="quiz-numpad"></div>
  </section>

  <!-- SCREEN: Quiz Results -->
  <section id="screen-quiz-results" class="screen">
    <div class="screen-header">
      <button class="btn-back" onclick="goHome()">← Inicio</button>
      <span class="screen-title">Resultado</span>
    </div>
    <div class="results-card">
      <div class="results-score" id="results-score">85</div>
      <div class="results-label">puntos</div>
      <div class="results-stats">
        <div class="stat"><span id="results-correct">17</span><small>correctas</small></div>
        <div class="stat"><span id="results-accuracy">85%</span><small>precisión</small></div>
        <div class="stat"><span id="results-avg-time">4.2s</span><small>tiempo medio</small></div>
      </div>
    </div>
    <button class="btn-primary" onclick="startQuiz()">Jugar de nuevo</button>
    <button class="btn-secondary" onclick="goHome()">Volver al inicio</button>
  </section>

  <!-- SCREEN: Aventura (mapa) -->
  <section id="screen-aventura" class="screen">
    <div class="screen-header">
      <button class="btn-back" onclick="goHome()">←</button>
      <span class="screen-title">Aventura</span>
    </div>
    <div class="island-map" id="island-map"></div>
  </section>

  <!-- SCREEN: Isla (gameplay de aventura) -->
  <section id="screen-isla" class="screen">
    <div class="screen-header">
      <button class="btn-back" onclick="showAventura()">←</button>
      <span class="screen-title" id="isla-title">Tabla del 7</span>
      <span class="score-display" id="isla-progress">1/15</span>
    </div>
    <div class="question-card" id="isla-question-card">
      <div class="question-text" id="isla-question">7 × 3 = ?</div>
      <div class="feedback-overlay" id="isla-feedback"></div>
    </div>
    <div class="numpad" id="isla-numpad"></div>
  </section>

  <!-- SCREEN: Isla Results -->
  <section id="screen-isla-results" class="screen">
    <div class="screen-header">
      <button class="btn-back" onclick="showAventura()">← Mapa</button>
      <span class="screen-title">Isla completada</span>
    </div>
    <div class="results-card">
      <div class="stars-earned" id="isla-stars-earned">⭐⭐⭐</div>
      <div class="results-stats">
        <div class="stat"><span id="isla-results-correct">13</span><small>correctas</small></div>
        <div class="stat"><span id="isla-results-accuracy">86%</span><small>precisión</small></div>
        <div class="stat"><span id="isla-results-avg-time">5.1s</span><small>tiempo medio</small></div>
      </div>
    </div>
    <button class="btn-primary" id="btn-reto-final" onclick="startRetoFinal()" style="display:none">⚡ Reto Final</button>
    <button class="btn-secondary" onclick="showAventura()">Volver al mapa</button>
  </section>

  <!-- SCREEN: Entrena Débiles -->
  <section id="screen-entrena" class="screen">
    <div class="screen-header">
      <button class="btn-back" onclick="goHome()">←</button>
      <span class="screen-title">Entrena Débiles</span>
      <span class="score-display" id="entrena-progress">1/15</span>
    </div>
    <div class="question-card" id="entrena-question-card">
      <div class="question-text" id="entrena-question">6 × 9 = ?</div>
      <div class="feedback-overlay" id="entrena-feedback"></div>
    </div>
    <div class="numpad" id="entrena-numpad"></div>
  </section>

  <!-- SCREEN: Entrena Results -->
  <section id="screen-entrena-results" class="screen">
    <div class="screen-header">
      <button class="btn-back" onclick="goHome()">← Inicio</button>
      <span class="screen-title">Entrenamiento completado</span>
    </div>
    <div class="results-card">
      <h3>Multiplicaciones trabajadas</h3>
      <div class="weakness-list" id="weakness-list"></div>
    </div>
    <button class="btn-primary" onclick="startEntrenamiento()">Otra sesión</button>
    <button class="btn-secondary" onclick="goHome()">Volver al inicio</button>
  </section>

  <!-- OVERLAY: Trofeo / Celebración -->
  <div class="trophy-overlay" id="trophy-overlay" style="display:none">
    <div class="trophy-content">
      <div class="trophy-icon" id="trophy-icon">🏆</div>
      <h2 id="trophy-title">¡Trofeo desbloqueado!</h2>
      <p id="trophy-subtitle">Maestra</p>
      <div class="particles" id="particles"></div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Crear styles.css**

```css
/* === Variables === */
:root {
  --bg-base: #0a0a0f;
  --bg-surface: rgba(25, 25, 35, 0.6);
  --bg-surface-solid: #191923;
  --border: rgba(255, 255, 255, 0.08);
  --accent-magenta: #ff2d78;
  --accent-cyan: #00dfd8;
  --accent-gold: #ffd700;
  --accent-green: #00e676;
  --accent-red: #ff1744;
  --text-primary: #ffffff;
  --text-secondary: #9494a0;
  --radius-lg: 20px;
  --radius-md: 14px;
  --radius-sm: 10px;
  --radius-full: 9999px;
}

/* === Reset & Base === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
}

body {
  background: radial-gradient(ellipse at top, #1a0a2e 0%, var(--bg-base) 70%);
  min-height: 100dvh;
}

/* === Screens === */
.screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
  padding: 16px 16px env(safe-area-inset-bottom, 16px);
  overflow-y: auto;
  opacity: 0;
  pointer-events: none;
  transform: translateY(12px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.screen.active {
  opacity: 1;
  pointer-events: all;
  transform: translateY(0);
}

/* === Header === */
.screen-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-top: env(safe-area-inset-top, 8px);
}
.btn-back {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-size: 1.2rem;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12px);
  transition: background 0.2s;
}
.btn-back:active { background: rgba(255,45,120,0.2); }
.screen-title {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 600;
}
.score-display {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent-gold);
}

/* === Home === */
.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-top: env(safe-area-inset-top, 12px);
}
.logo {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent-magenta), var(--accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.streak-badge {
  background: rgba(255, 100, 0, 0.15);
  border: 1px solid rgba(255, 100, 0, 0.3);
  border-radius: var(--radius-full);
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #ff8c00;
}

/* === Progress === */
.progress-block { margin-bottom: 16px; }
.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.progress-bar {
  height: 8px;
  background: var(--bg-surface);
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 1px solid var(--border);
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-magenta), var(--accent-cyan));
  border-radius: var(--radius-full);
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 0%;
}

/* === Trophies === */
.trophies-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}
.trophy {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  backdrop-filter: blur(12px);
  transition: transform 0.2s, box-shadow 0.2s;
}
.trophy.locked { filter: grayscale(1) opacity(0.4); }
.trophy.unlocked {
  filter: none;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
  border-color: var(--accent-gold);
}

/* === Mode Buttons === */
.mode-buttons { display: flex; flex-direction: column; gap: 12px; }
.btn-mode {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 18px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--bg-surface);
  backdrop-filter: blur(16px);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}
.btn-mode:active { transform: scale(0.97); }
.mode-icon { font-size: 1.6rem; margin-bottom: 4px; }
.mode-title { font-size: 1.1rem; font-weight: 700; }
.mode-sub { font-size: 0.8rem; color: var(--text-secondary); }
.btn-quiz { border-color: rgba(255,45,120,0.3); }
.btn-quiz:hover { border-color: var(--accent-magenta); box-shadow: 0 0 20px rgba(255,45,120,0.2); }
.btn-aventura { border-color: rgba(0,223,216,0.3); }
.btn-aventura:hover { border-color: var(--accent-cyan); box-shadow: 0 0 20px rgba(0,223,216,0.2); }
.btn-debiles { border-color: rgba(255,215,0,0.3); }
.btn-debiles:hover { border-color: var(--accent-gold); box-shadow: 0 0 20px rgba(255,215,0,0.15); }

/* === Question Card === */
.question-card {
  position: relative;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px 20px;
  text-align: center;
  backdrop-filter: blur(16px);
  margin-bottom: 16px;
  overflow: hidden;
}
.question-text {
  font-size: 2.8rem;
  font-weight: 800;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #fff, var(--accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.feedback-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 800;
  opacity: 0;
  pointer-events: none;
  border-radius: var(--radius-lg);
  transition: opacity 0.15s;
}
.feedback-overlay.correct {
  background: rgba(0, 230, 118, 0.15);
  color: var(--accent-green);
  opacity: 1;
}
.feedback-overlay.incorrect {
  background: rgba(255, 23, 68, 0.15);
  color: var(--accent-red);
  opacity: 1;
}

/* === Timer Bar === */
.quiz-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 600;
}
.timer-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-surface);
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 1px solid var(--border);
}
.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-green), var(--accent-cyan));
  border-radius: var(--radius-full);
  transition: width 0.1s linear, background 0.3s;
  width: 100%;
}
.timer-fill.urgent { background: linear-gradient(90deg, var(--accent-red), var(--accent-magenta)); }

/* === Numpad === */
.numpad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.numpad-btn {
  min-height: 64px;
  font-size: 1.4rem;
  font-weight: 700;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition: background 0.1s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.numpad-btn:active { transform: scale(0.93); background: rgba(255,45,120,0.2); }
.numpad-btn.btn-clear { color: var(--accent-magenta); font-size: 1rem; }
.numpad-btn.btn-ok {
  background: linear-gradient(135deg, var(--accent-magenta), #c0005f);
  border-color: transparent;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.numpad-btn.btn-ok:active { opacity: 0.8; }

/* === Results === */
.results-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px 20px;
  text-align: center;
  backdrop-filter: blur(16px);
  margin-bottom: 16px;
}
.results-score {
  font-size: 4rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent-magenta), var(--accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.results-label { color: var(--text-secondary); margin-bottom: 20px; font-size: 0.9rem; }
.results-stats { display: flex; justify-content: space-around; }
.stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat span { font-size: 1.4rem; font-weight: 700; }
.stat small { font-size: 0.75rem; color: var(--text-secondary); }
.stars-earned { font-size: 2.5rem; margin-bottom: 16px; }

/* === Island Map === */
.island-map {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding-bottom: 20px;
}
.island-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 16px;
  text-align: center;
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  position: relative;
}
.island-card:active { transform: scale(0.96); }
.island-card.locked { opacity: 0.4; cursor: not-allowed; filter: grayscale(0.8); }
.island-card.unlocked { border-color: rgba(0,223,216,0.3); }
.island-card.unlocked:hover { border-color: var(--accent-cyan); box-shadow: 0 0 20px rgba(0,223,216,0.2); }
.island-card.boss { border-color: rgba(255,45,120,0.4); }
.island-num { font-size: 2rem; font-weight: 800; }
.island-label { font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0 8px; }
.island-stars { font-size: 1.2rem; letter-spacing: 2px; }
.island-boss-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--accent-magenta);
  border-radius: var(--radius-full);
  padding: 2px 6px;
  font-size: 0.65rem;
  font-weight: 700;
}

/* === Weakness List === */
.weakness-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; text-align: left; }
.weakness-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(255,255,255,0.04);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}
.weakness-key { font-weight: 700; }
.weakness-improvement { font-size: 0.8rem; color: var(--accent-green); }
.weakness-same { font-size: 0.8rem; color: var(--text-secondary); }

/* === Buttons === */
.btn-primary {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--accent-magenta), #c0005f);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 10px;
  transition: opacity 0.2s, transform 0.15s;
}
.btn-primary:active { opacity: 0.85; transform: scale(0.98); }
.btn-secondary {
  width: 100%;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition: background 0.2s;
}
.btn-secondary:active { background: rgba(255,255,255,0.08); }

/* === Trophy Overlay === */
.trophy-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 15, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(20px);
  animation: fadeIn 0.3s ease;
}
.trophy-content { text-align: center; position: relative; }
.trophy-icon { font-size: 5rem; animation: bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
.trophy-content h2 { font-size: 1.5rem; font-weight: 800; margin: 12px 0 4px; }
.trophy-content p { color: var(--text-secondary); }
.particles { position: absolute; inset: -60px; pointer-events: none; }
.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: particleBurst 0.8s ease-out forwards;
}

/* === Animations === */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@keyframes bounceIn {
  from { transform: scale(0.3); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%     { transform: translateX(-8px); }
  40%     { transform: translateX(8px); }
  60%     { transform: translateX(-6px); }
  80%     { transform: translateX(6px); }
}

@keyframes particleBurst {
  0%   { transform: translate(0,0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
}

@keyframes islandReveal {
  0%   { box-shadow: 0 0 0 rgba(0,223,216,0); }
  50%  { box-shadow: 0 0 40px rgba(0,223,216,0.6); }
  100% { box-shadow: 0 0 20px rgba(0,223,216,0.2); }
}

.anim-shake { animation: shake 0.4s ease; }
.anim-reveal { animation: islandReveal 1s ease forwards; }
```

- [ ] **Step 3: Verificar en navegador**

Abrir `TablasMagia/index.html` en Chrome. Comprobar:
- Fondo oscuro con gradiente morado
- Logo "✖️ TablasMagia" con gradiente magenta→cyan
- Tres botones de modo visibles
- Barra de progreso de estrellas (vacía)
- Trofeos grises (locked)

- [ ] **Step 4: Commit**

```bash
git add TablasMagia/index.html TablasMagia/styles.css
git commit -m "feat(TablasMagia): scaffold HTML + CSS glassmorphism base"
```

---

## Task 2: Navegación y estado global

**Files:**
- Create: `TablasMagia/app.js`

- [ ] **Step 1: Crear app.js con estado global y navegación**

```js
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
```

- [ ] **Step 2: Verificar en navegador**

Abrir consola del navegador. Comprobar:
- No hay errores de JS
- `currentScreen` es `'home'`
- `weakness`, `starsData` etc. son objetos vacíos (primera vez)

- [ ] **Step 3: Commit**

```bash
git add TablasMagia/app.js
git commit -m "feat(TablasMagia): estado global y navegación"
```

---

## Task 3: Home screen — render dinámico

**Files:**
- Modify: `TablasMagia/app.js` (añadir al final)

- [ ] **Step 1: Añadir renderHome() y updateStreak() al final de app.js**

```js
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
    // Solo incrementar si hay sesión activa (se llama al completar una partida)
  }
  // No guardar aquí — se guarda al completar partida
}

function incrementStreak() {
  const today = new Date().toISOString().slice(0, 10)
  if (streak.date === today) return
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  streak.count = (streak.date === yesterday) ? streak.count + 1 : 1
  streak.date = today
  saveToStorage()
}
```

- [ ] **Step 2: Verificar en navegador**

Recargar `index.html`. Comprobar:
- Barra de estrellas al 0%
- Contador de racha en 0
- Botones de modo clickables (sin errores en consola)

- [ ] **Step 3: Commit**

```bash
git add TablasMagia/app.js
git commit -m "feat(TablasMagia): render dinámico del Home"
```

---

## Task 4: Teclado numérico (numpad) reutilizable

**Files:**
- Modify: `TablasMagia/app.js` (añadir al final)

- [ ] **Step 1: Añadir buildNumpad() y funciones de entrada**

```js
// === Numpad ===
function buildNumpad(containerId) {
  const container = document.getElementById(containerId)
  container.innerHTML = ''
  // Layout: 1 2 3 / 4 5 6 / 7 8 9 / ← 0 ✓
  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓']
  keys.forEach(k => {
    const btn = document.createElement('button')
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
  const suffixes = { quiz: '-question', isla: '-question', entrena: '-question' }
  // Mostrar input acumulado en la pregunta (añadir al final del texto base)
  const el = document.getElementById(activeMode + suffixes[activeMode])
  if (!el) return
  const base = el.dataset.base || el.textContent.split('=')[0] + '='
  el.dataset.base = base
  el.textContent = base + (currentInput ? ' ' + currentInput : ' ?')
}
```

- [ ] **Step 2: Verificar en navegador**

En consola ejecutar: `buildNumpad('quiz-numpad')` → debe aparecer el teclado numérico en la pantalla quiz. Probar clicks: números acumulan, ⌫ borra, ✓ no hace nada aún (submitAnswer no definida).

- [ ] **Step 3: Commit**

```bash
git add TablasMagia/app.js
git commit -m "feat(TablasMagia): teclado numérico reutilizable"
```

---

## Task 5: Algoritmo adaptativo (recordAnswer)

**Files:**
- Modify: `TablasMagia/app.js` (añadir al final)

- [ ] **Step 1: Añadir recordAnswer() y helpers de preguntas**

```js
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
```

- [ ] **Step 2: Verificar en consola del navegador**

```js
// Simular respuestas y comprobar que weakness se actualiza
recordAnswer(7, 8, false, 8000)
recordAnswer(7, 8, false, 9000)
recordAnswer(6, 9, true, 3000)
console.log(weakness)  // debe mostrar { "7x8": {attempts:2,errors:2}, "6x9": {attempts:1,errors:0} }
console.log(weaknessQuestions(5))  // debe incluir 7x8
```

- [ ] **Step 3: Commit**

```bash
git add TablasMagia/app.js
git commit -m "feat(TablasMagia): algoritmo adaptativo + generadores de preguntas"
```

---

## Task 6: Modo Quiz Rápido

**Files:**
- Modify: `TablasMagia/app.js` (añadir al final)

- [ ] **Step 1: Añadir startQuiz(), renderQuizQuestion(), submitAnswer() para quiz y timer**

```js
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
```

- [ ] **Step 2: Verificar en navegador**

Hacer click en "Quiz Rápido". Comprobar:
- Aparece pregunta con formato "A × B = ?"
- Timer empieza a bajar (barra regresiva)
- Al pulsar números en el numpad se acumulan en la pregunta
- Al pulsar ✓ con respuesta correcta → flash verde → siguiente pregunta
- Al pulsar ✓ con respuesta incorrecta → shake rojo + muestra respuesta correcta
- Al llegar a 20 preguntas → pantalla de resultados con puntuación
- `weakness` en localStorage se actualiza tras cada respuesta

- [ ] **Step 3: Commit**

```bash
git add TablasMagia/app.js
git commit -m "feat(TablasMagia): modo Quiz Rápido completo"
```

---

## Task 7: Modo Aventura — mapa de islas

**Files:**
- Modify: `TablasMagia/app.js` (añadir al final)

- [ ] **Step 1: Añadir showAventura() y renderIslandMap()**

```js
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
```

- [ ] **Step 2: Verificar en navegador**

Click en "Aventura". Comprobar:
- Grid 2 columnas con 10 islas
- Isla 1 clickable, islas 2-10 grises (primera vez)
- Las tablas 6,7,8,9 tienen badge "⚡ RETO"
- Click en isla 1 → no da error (startIsla no definida aún)

- [ ] **Step 3: Commit**

```bash
git add TablasMagia/app.js
git commit -m "feat(TablasMagia): mapa de Aventura con desbloqueo progresivo"
```

---

## Task 8: Modo Aventura — gameplay de isla

**Files:**
- Modify: `TablasMagia/app.js` (añadir al final)

- [ ] **Step 1: Añadir startIsla(), renderIslaQuestion(), handleIslaAnswer(), finishIsla()**

```js
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
  const timeLimit = islaIsRetoFinal ? ISLA_RETO_TIME : ISLA_TIME
  islaTimerInterval = setInterval(() => {
    const elapsed = (Date.now() - islaQuestionStartTime) / 1000
    if (elapsed >= timeLimit) {
      clearInterval(islaTimerInterval)
      islaTimerInterval = null
      handleIslaAnswer(true)  // tiempo agotado = incorrecto
    }
  }, 200)
}

function handleIslaAnswer(timeout) {
  if (islaTimerInterval) { clearInterval(islaTimerInterval); islaTimerInterval = null }
  const q = islaQuestions[islaIndex]
  const timeMs = Date.now() - islaQuestionStartTime
  const timeLimit = islaIsRetoFinal ? ISLA_RETO_TIME : ISLA_TIME
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
  if (total > 0)                         stars = 1
  if (accuracy > ISLA_ACC_THRESH)         stars = 2
  if (accuracy > ISLA_ACC_THRESH && avgTime < ISLA_TIME_THRESH) stars = 3

  // Actualizar estrellas solo si mejora
  if (!islaIsRetoFinal) {
    const prev = starsData[islaTable] || 0
    if (stars > prev) {
      const wasLocked = (starsData[islaTable] || 0) === 0 && islaTable < 10
      starsData[islaTable] = stars
      saveToStorage()
      if (wasLocked) {
        setTimeout(() => revealIsland(islaTable + 1), 500)
      }
    }
    checkTrophies()
    incrementStreak()
  }

  // Mostrar resultados
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
```

- [ ] **Step 2: Verificar en navegador**

1. Ir a Aventura → click en "Tabla del 1"
2. Comprobar que aparecen 15 preguntas de la tabla del 1
3. Responder todas correctas y rápido → debe dar 3 estrellas
4. Volver al mapa → isla 2 debe haberse desbloqueado
5. Ir a tabla del 6 → completar → debe aparecer botón "⚡ Reto Final"
6. Hacer el reto → 5 preguntas a 6 segundos

- [ ] **Step 3: Commit**

```bash
git add TablasMagia/app.js
git commit -m "feat(TablasMagia): gameplay de isla + sistema de estrellas + Reto Final"
```

---

## Task 9: Modo Entrena Débiles

**Files:**
- Modify: `TablasMagia/app.js` (añadir al final)

- [ ] **Step 1: Añadir startEntrenamiento(), renderEntrenaQuestion(), handleEntrenaAnswer(), finishEntrena()**

```js
// === Entrena Débiles ===
const ENTRENA_TOTAL = 15

function startEntrenamiento() {
  const questions = weaknessQuestions(ENTRENA_TOTAL)

  if (questions.length === 0) {
    alert('¡Juega primero al Quiz o a la Aventura para que pueda aprender cuáles son tus puntos débiles!')
    return
  }

  // Guardar snapshot de tasas de error antes de esta sesión
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
  const timeMs = 5000  // sin timer en entrena
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
    entrenaIndex++
    renderEntrenaQuestion()
  }, 900)
}

function finishEntrena() {
  activeMode = ''
  incrementStreak()

  // Calcular mejoras comparando con snapshot anterior
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

  // Eliminar duplicados en la lista visual
  const seen = new Set()
  list.querySelectorAll('.weakness-item').forEach(item => {
    const key = item.querySelector('.weakness-key').textContent
    if (seen.has(key)) item.remove()
    else seen.add(key)
  })

  showScreen('entrena-results')
}
```

- [ ] **Step 2: Verificar en navegador**

1. Sin historial: click en "Entrena Débiles" → debe aparecer alert invitando a jugar primero (o preguntas de tablas 6-9 por defecto si weaknessQuestions devuelve las de relleno)
2. Hacer un quiz primero → volver a Entrena Débiles → debe mostrar preguntas priorizadas
3. Completar las 15 preguntas → pantalla de resultados con lista de multiplicaciones y "↑ Mejorando" / "→ Sigue practicando"

- [ ] **Step 3: Commit**

```bash
git add TablasMagia/app.js
git commit -m "feat(TablasMagia): modo Entrena Débiles con indicadores de mejora"
```

---

## Task 10: Sistema de trofeos y celebración

**Files:**
- Modify: `TablasMagia/app.js` (añadir al final)

- [ ] **Step 1: Añadir checkTrophies() y showTrophyCelebration()**

```js
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

  // Generar partículas
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
```

- [ ] **Step 2: Verificar en navegador**

En consola del navegador:
```js
// Simular 5 estrellas para disparar trofeo Principiante
starsData = { 1: 3, 2: 2 }
localStorage.setItem('tm_stars', JSON.stringify(starsData))
checkTrophies()
// Debe aparecer overlay de trofeo 3 segundos y luego desaparecer
```

- [ ] **Step 3: Commit**

```bash
git add TablasMagia/app.js
git commit -m "feat(TablasMagia): sistema de trofeos con celebración animada"
```

---

## Task 11: PWA — manifest, service worker e icono

**Files:**
- Create: `TablasMagia/manifest.json`
- Create: `TablasMagia/sw.js`
- Create: `TablasMagia/icon.svg`

- [ ] **Step 1: Crear manifest.json**

```json
{
  "name": "TablasMagia",
  "short_name": "TablasMagia",
  "description": "Aprende las tablas de multiplicar jugando",
  "start_url": "./index.html",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a0f",
  "theme_color": "#ff2d78",
  "icons": [
    {
      "src": "icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: Crear sw.js**

```js
const CACHE = 'tablas-magia-v1'
const ASSETS = [
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
})
```

- [ ] **Step 3: Crear icon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="40" fill="#0a0a0f"/>
  <text x="96" y="130" text-anchor="middle" font-family="Arial,sans-serif"
        font-size="110" font-weight="900" fill="#ff2d78">×</text>
</svg>
```

- [ ] **Step 4: Verificar PWA**

1. Servir desde `http://localhost:8000/TablasMagia/index.html` (no desde `file://` — service workers requieren HTTP)
2. Abrir Chrome DevTools → Application → Manifest → verificar que carga correctamente
3. DevTools → Service Workers → verificar que está activo
4. Recarga la página con red offline (DevTools → Network → Offline) → debe seguir funcionando
5. En móvil: abrir la URL → menú del navegador → "Añadir a pantalla de inicio" → debe instalarse como app

- [ ] **Step 5: Commit final**

```bash
git add TablasMagia/manifest.json TablasMagia/sw.js TablasMagia/icon.svg
git commit -m "feat(TablasMagia): PWA completa — manifest + service worker + icono"
```

---

## Verificación final

Antes de declarar la app lista, recorrer este checklist manualmente en Chrome móvil (o DevTools modo móvil, 375px):

- [ ] Home: estrellas, racha y trofeos se muestran correctamente
- [ ] Quiz: 20 preguntas, timer visible, puntuación acumula, resultados al final
- [ ] Aventura: mapa 2 columnas, tabla 1 desbloqueada, resto gris
- [ ] Completar tabla 1 → tabla 2 se desbloquea con animación glow
- [ ] Tabla del 7 → completar → aparece botón Reto Final → 5 preguntas a 6s
- [ ] Entrena Débiles: con historial muestra preguntas priorizadas
- [ ] Trofeo "Principiante" aparece al llegar a 5 estrellas
- [ ] App instalable desde Chrome → funciona offline
- [ ] Teclado físico (Enter/números/Backspace) funciona en desktop

```bash
git log --oneline TablasMagia/
# Debe mostrar todos los commits de las tareas anteriores
```
