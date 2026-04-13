# Cosmo — Corsé Tracker App · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una PWA en `Cosmo/` que permita a una chica de 13 años registrar las horas que lleva su corsé de escoliosis, con Cosmo como personaje motivador y un dashboard de padres protegido por PIN.

**Architecture:** Vanilla JS + HTML/CSS sin build system. Firebase (CDN) para auth y Firestore. Service Worker para PWA instalable y notificaciones locales programadas. Dos modos de UI (Cosmo / Padres) en un único `index.html`, togglados con CSS.

**Tech Stack:** Firebase JS SDK v10 (CDN compat), Chart.js v4 (CDN), Google Fonts (Nunito), Service Worker API, Notification API, Web Crypto API (SHA-256 para PIN).

> **Nota:** No hay test runner. Los pasos de verificación son manuales — se indica exactamente qué abrir y qué comprobar en el navegador.

---

## File Map

| Archivo | Responsabilidad |
|---|---|
| `Cosmo/index.html` | Shell HTML: todas las vistas, CDN scripts |
| `Cosmo/styles.css` | Diseño cálido mobile-first, animaciones CSS, estados de Cosmo |
| `Cosmo/firebase.js` | Init Firebase, Auth, todas las operaciones Firestore |
| `Cosmo/app.js` | Lógica principal: estado global, modos, sesiones, mensajes, logros |
| `Cosmo/notifications.js` | Programación de notificaciones locales vía SW |
| `Cosmo/sw.js` | Service Worker: cache PWA, recepción de mensajes para notificaciones |
| `Cosmo/manifest.json` | PWA manifest: nombre, iconos, colores |

---

## Task 1: Scaffold del proyecto — HTML, manifest y CSS base

**Files:**
- Create: `Cosmo/index.html`
- Create: `Cosmo/manifest.json`
- Create: `Cosmo/styles.css`

- [ ] **Step 1.1: Crear `Cosmo/manifest.json`**

```json
{
  "name": "Cosmo 🌟",
  "short_name": "Cosmo",
  "description": "Tu compañero de corsé",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#FAF8F5",
  "theme_color": "#C4B5FD",
  "orientation": "portrait",
  "icons": [
    {
      "src": "icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 1.2: Crear `Cosmo/index.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Cosmo">
  <meta name="theme-color" content="#C4B5FD">
  <title>Cosmo 🌟</title>
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="icon-192.svg">
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
</head>
<body>

  <!-- ===================== VISTA: LOGIN ===================== -->
  <div id="view-login" class="view active">
    <div class="login-container">
      <div class="login-logo">🌟</div>
      <h1 class="login-title">Cosmo</h1>
      <p class="login-subtitle">Tu compañero de corsé</p>
      <form id="form-login">
        <input type="email" id="input-email" placeholder="Email" autocomplete="email" required>
        <input type="password" id="input-password" placeholder="Contraseña" autocomplete="current-password" required>
        <button type="submit" class="btn-primary">Entrar</button>
      </form>
      <p id="login-error" class="error-msg hidden"></p>
    </div>
  </div>

  <!-- ===================== VISTA: MODO COSMO ===================== -->
  <div id="view-cosmo" class="view">

    <!-- Cabecera -->
    <header class="cosmo-header">
      <div class="cosmo-name-wrap">
        <span id="cosmo-name-display" class="cosmo-name">Cosmo</span>
        <button id="btn-edit-name" class="btn-icon" aria-label="Editar nombre">✏️</button>
      </div>
      <button id="btn-padres" class="btn-padres">👨‍👩‍👧 Padres</button>
    </header>

    <!-- Avatar de Cosmo -->
    <div id="cosmo-avatar-wrap" class="cosmo-avatar-wrap">
      <!-- SVG se inyecta por app.js -->
    </div>

    <!-- Mensaje de Cosmo -->
    <div class="cosmo-message-wrap">
      <p id="cosmo-message" class="cosmo-message"></p>
    </div>

    <!-- Barra de progreso -->
    <div class="progress-section">
      <div class="progress-bar-bg">
        <div id="progress-bar" class="progress-bar-fill"></div>
      </div>
      <div class="progress-labels">
        <span id="progress-hours" class="progress-hours">0h 0min</span>
        <span class="progress-goal">/ 18h</span>
        <span id="progress-pct" class="progress-pct">0%</span>
      </div>
    </div>

    <!-- Botón principal (mantener 1.5s) -->
    <div class="main-btn-wrap">
      <button id="btn-toggle" class="btn-toggle btn-wearing-off">
        <span id="btn-toggle-text">Ponerte a Cosmo 💪</span>
        <div class="btn-hold-ring" id="btn-hold-ring"></div>
      </button>
      <p class="btn-hint">Mantén pulsado para activar</p>
    </div>

    <!-- Logros del día -->
    <div class="daily-summary">
      <div class="stars-today">
        <span id="stars-display" class="stars-display">⭐⭐⭐</span>
        <span class="stars-label">hoy</span>
      </div>
      <div class="streak-today">
        <span class="streak-label">Racha</span>
        <span id="streak-display" class="streak-display">0 días 🔥</span>
      </div>
    </div>

    <!-- Modal editar nombre -->
    <div id="modal-edit-name" class="modal-overlay hidden">
      <div class="modal-box">
        <h3>¿Cómo se llama tu corsé?</h3>
        <input type="text" id="input-new-name" maxlength="20" placeholder="Cosmo">
        <div class="modal-actions">
          <button id="btn-cancel-name" class="btn-secondary">Cancelar</button>
          <button id="btn-save-name" class="btn-primary">Guardar</button>
        </div>
      </div>
    </div>

  </div>

  <!-- ===================== VISTA: MODO PADRES ===================== -->
  <div id="view-padres" class="view">

    <header class="padres-header">
      <button id="btn-volver-cosmo" class="btn-back">← Volver</button>
      <h2 class="padres-title">Dashboard</h2>
    </header>

    <!-- Resumen de hoy -->
    <section class="padres-section">
      <h3 class="section-title">Hoy</h3>
      <div class="today-stats">
        <div class="stat-card">
          <span id="padres-horas-hoy" class="stat-value">0h</span>
          <span class="stat-label">acumuladas</span>
        </div>
        <div class="stat-card">
          <span id="padres-estado" class="stat-value">—</span>
          <span class="stat-label">estado</span>
        </div>
        <div class="stat-card">
          <span id="padres-estrellas-hoy" class="stat-value">—</span>
          <span class="stat-label">estrellas hoy</span>
        </div>
      </div>
    </section>

    <!-- Gráfica semanal -->
    <section class="padres-section">
      <h3 class="section-title">Esta semana</h3>
      <div class="chart-wrap">
        <canvas id="chart-semana"></canvas>
      </div>
    </section>

    <!-- Historial 7 días -->
    <section class="padres-section">
      <h3 class="section-title">Últimos 7 días</h3>
      <div id="historial-lista" class="historial-lista"></div>
    </section>

    <!-- Estadísticas globales -->
    <section class="padres-section">
      <h3 class="section-title">Global</h3>
      <div class="global-stats">
        <div class="stat-card">
          <span id="stat-racha" class="stat-value">0</span>
          <span class="stat-label">racha actual 🔥</span>
        </div>
        <div class="stat-card">
          <span id="stat-mejor-racha" class="stat-value">0</span>
          <span class="stat-label">mejor racha 👑</span>
        </div>
        <div class="stat-card">
          <span id="stat-pct-mes" class="stat-value">—%</span>
          <span class="stat-label">% mes actual</span>
        </div>
        <div class="stat-card">
          <span id="stat-horas-total" class="stat-value">0h</span>
          <span class="stat-label">horas totales</span>
        </div>
      </div>
    </section>

    <!-- Logros -->
    <section class="padres-section">
      <h3 class="section-title">Logros</h3>
      <div id="logros-lista" class="logros-lista"></div>
    </section>

    <!-- Ajustes -->
    <section class="padres-section">
      <h3 class="section-title">Ajustes</h3>
      <div class="ajustes-lista">
        <div class="ajuste-row">
          <label>Nombre del corsé</label>
          <input type="text" id="ajuste-nombre" maxlength="20">
        </div>
        <div class="ajuste-row">
          <label>Recordatorio si no lo lleva (min)</label>
          <input type="number" id="ajuste-recordatorio" min="15" max="240" step="15">
        </div>
        <div class="ajuste-row">
          <label>Hora resumen diario</label>
          <input type="time" id="ajuste-hora-resumen">
        </div>
        <div class="ajuste-row">
          <label>Notificaciones</label>
          <input type="checkbox" id="ajuste-notificaciones">
        </div>
        <div class="ajuste-row">
          <label>Cambiar PIN de padres</label>
          <button id="btn-cambiar-pin" class="btn-secondary btn-sm">Cambiar PIN</button>
        </div>
        <button id="btn-guardar-ajustes" class="btn-primary">Guardar ajustes</button>
      </div>
    </section>

  </div>

  <!-- ===================== MODAL: PIN PADRES ===================== -->
  <div id="modal-pin" class="modal-overlay hidden">
    <div class="modal-box">
      <h3>Acceso Padres 🔒</h3>
      <p class="modal-subtitle">Introduce el PIN de 4 dígitos</p>
      <input type="password" id="input-pin" maxlength="4" inputmode="numeric" pattern="[0-9]*" placeholder="••••">
      <p id="pin-error" class="error-msg hidden">PIN incorrecto</p>
      <div class="modal-actions">
        <button id="btn-cancel-pin" class="btn-secondary">Cancelar</button>
        <button id="btn-confirm-pin" class="btn-primary">Entrar</button>
      </div>
      <p class="pin-first-time hidden" id="pin-first-time">Primera vez: este PIN se guardará</p>
    </div>
  </div>

  <!-- ===================== MODAL: CAMBIAR PIN ===================== -->
  <div id="modal-cambiar-pin" class="modal-overlay hidden">
    <div class="modal-box">
      <h3>Nuevo PIN</h3>
      <input type="password" id="input-nuevo-pin" maxlength="4" inputmode="numeric" pattern="[0-9]*" placeholder="••••">
      <div class="modal-actions">
        <button id="btn-cancel-nuevo-pin" class="btn-secondary">Cancelar</button>
        <button id="btn-save-nuevo-pin" class="btn-primary">Guardar</button>
      </div>
    </div>
  </div>

  <!-- ===================== MODAL: LOGRO DESBLOQUEADO ===================== -->
  <div id="modal-logro" class="modal-overlay hidden">
    <div class="modal-box modal-logro-box">
      <div id="modal-logro-icono" class="logro-icono-grande"></div>
      <h3 id="modal-logro-nombre"></h3>
      <p id="modal-logro-desc" class="modal-subtitle"></p>
      <button id="btn-cerrar-logro" class="btn-primary">¡Genial! 🎉</button>
    </div>
  </div>

  <!-- ===================== BANNER PWA ===================== -->
  <div id="banner-pwa" class="banner-pwa hidden">
    <p>📲 Añade Cosmo a tu pantalla de inicio para recibir notificaciones</p>
    <button id="btn-cerrar-banner" class="btn-icon">✕</button>
  </div>

  <!-- Scripts — orden importa -->
  <script type="module" src="firebase.js"></script>
  <script type="module" src="notifications.js"></script>
  <script type="module" src="app.js"></script>

</body>
</html>
```

- [ ] **Step 1.3: Crear `Cosmo/styles.css` — base, variables, layout**

```css
/* ============================
   VARIABLES Y RESET
   ============================ */
:root {
  --color-bg: #FAF8F5;
  --color-primary: #C4B5FD;
  --color-primary-dark: #A78BFA;
  --color-secondary: #FDBA74;
  --color-secondary-dark: #FB923C;
  --color-accent: #6EE7B7;
  --color-text: #2D2D2D;
  --color-text-muted: #6B7280;
  --color-error: #EF4444;
  --color-white: #FFFFFF;
  --color-card: #FFFFFF;
  --color-border: #E5E7EB;
  --radius: 16px;
  --radius-sm: 8px;
  --shadow: 0 4px 24px rgba(196,181,253,0.18);
  --shadow-card: 0 2px 12px rgba(0,0,0,0.06);
  --transition: 0.2s ease;
  --font: 'Nunito', sans-serif;
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  background: var(--color-bg);
  font-family: var(--font);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
}

/* ============================
   VISTAS
   ============================ */
.view {
  display: none;
  min-height: 100dvh;
  flex-direction: column;
  padding-bottom: calc(24px + var(--safe-bottom));
}
.view.active { display: flex; }

/* ============================
   LOGIN
   ============================ */
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 32px 24px;
  gap: 16px;
}

.login-logo { font-size: 72px; animation: float 3s ease-in-out infinite; }
.login-title { font-size: 2.4rem; font-weight: 900; color: var(--color-primary-dark); }
.login-subtitle { font-size: 1rem; color: var(--color-text-muted); margin-bottom: 8px; }

#form-login {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
}

/* ============================
   INPUTS GLOBALES
   ============================ */
input[type="email"],
input[type="password"],
input[type="text"],
input[type="number"],
input[type="time"] {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font);
  font-size: 1rem;
  color: var(--color-text);
  background: var(--color-white);
  outline: none;
  transition: border-color var(--transition);
}
input:focus { border-color: var(--color-primary); }

/* ============================
   BOTONES
   ============================ */
.btn-primary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition);
  min-height: 48px;
}
.btn-primary:active { transform: scale(0.97); }

.btn-secondary {
  padding: 12px 20px;
  background: transparent;
  color: var(--color-text-muted);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  min-height: 48px;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 8px;
  min-width: 44px;
  min-height: 44px;
}
.btn-sm { width: auto; padding: 10px 16px; font-size: 0.9rem; min-height: 40px; }

/* ============================
   MODO COSMO — HEADER
   ============================ */
.cosmo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 8px;
  padding-top: calc(16px + env(safe-area-inset-top, 0px));
}
.cosmo-name-wrap { display: flex; align-items: center; gap: 4px; }
.cosmo-name { font-size: 1.3rem; font-weight: 800; color: var(--color-primary-dark); }
.btn-padres {
  background: var(--color-white);
  border: 2px solid var(--color-border);
  border-radius: 24px;
  padding: 8px 14px;
  font-family: var(--font);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--color-text-muted);
  min-height: 40px;
}

/* ============================
   AVATAR DE COSMO
   ============================ */
.cosmo-avatar-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
  min-height: 200px;
}
.cosmo-avatar-wrap svg { width: 160px; height: 200px; }

/* Animaciones del avatar */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
@keyframes droop {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(4px) rotate(-2deg); }
}
@keyframes celebrate {
  0% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.12) rotate(5deg); }
  50% { transform: scale(1.12) rotate(-5deg); }
  75% { transform: scale(1.08) rotate(3deg); }
  100% { transform: scale(1) rotate(0deg); }
}
@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}

.cosmo-avatar-wrap.state-wearing svg { animation: float 3s ease-in-out infinite; }
.cosmo-avatar-wrap.state-goal-reached svg { animation: celebrate 0.6s ease-in-out 3; }
.cosmo-avatar-wrap.state-off-short svg { animation: breathe 4s ease-in-out infinite; }
.cosmo-avatar-wrap.state-off-medium svg { animation: droop 3s ease-in-out infinite; }
.cosmo-avatar-wrap.state-off-long svg { animation: droop 2s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .cosmo-avatar-wrap svg,
  .login-logo { animation: none !important; }
}

/* ============================
   MENSAJE DE COSMO
   ============================ */
.cosmo-message-wrap {
  padding: 0 24px;
  text-align: center;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cosmo-message {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.5;
}

/* ============================
   BARRA DE PROGRESO
   ============================ */
.progress-section {
  padding: 12px 24px;
}
.progress-bar-bg {
  background: var(--color-border);
  border-radius: 100px;
  height: 14px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 100px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transition: width 0.5s ease;
  width: 0%;
}
.progress-labels {
  display: flex;
  align-items: center;
  margin-top: 8px;
  gap: 4px;
}
.progress-hours { font-size: 1.1rem; font-weight: 800; color: var(--color-primary-dark); }
.progress-goal { font-size: 0.9rem; color: var(--color-text-muted); flex: 1; }
.progress-pct { font-size: 1rem; font-weight: 700; color: var(--color-text-muted); }

/* ============================
   BOTÓN PRINCIPAL (hold)
   ============================ */
.main-btn-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 24px;
  gap: 8px;
}

.btn-toggle {
  position: relative;
  width: 100%;
  max-width: 320px;
  padding: 22px 24px;
  border: none;
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: 1.15rem;
  font-weight: 800;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.1s ease, box-shadow var(--transition);
  min-height: 72px;
  user-select: none;
  -webkit-user-select: none;
}

.btn-toggle.btn-wearing-off {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: var(--color-white);
  box-shadow: 0 6px 24px rgba(196,181,253,0.4);
}

.btn-toggle.btn-wearing-on {
  background: linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark));
  color: var(--color-white);
  box-shadow: 0 6px 24px rgba(253,186,116,0.4);
}

.btn-toggle:active { transform: scale(0.97); }

/* Anillo de progreso de hold */
.btn-hold-ring {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  background: rgba(255,255,255,0.6);
  border-radius: 0 0 var(--radius) var(--radius);
  width: 0%;
  transition: none;
}
.btn-hold-ring.filling { transition: width 1.5s linear; width: 100%; }

.btn-hint { font-size: 0.78rem; color: var(--color-text-muted); }

/* ============================
   LOGROS DEL DÍA
   ============================ */
.daily-summary {
  display: flex;
  justify-content: space-around;
  padding: 8px 24px 16px;
  gap: 16px;
}
.stars-today, .streak-today {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: var(--color-white);
  border-radius: var(--radius-sm);
  padding: 12px 20px;
  box-shadow: var(--shadow-card);
  flex: 1;
}
.stars-display { font-size: 1.4rem; }
.stars-label, .streak-label { font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.streak-display { font-size: 1rem; font-weight: 800; color: var(--color-secondary-dark); }

/* ============================
   MODO PADRES
   ============================ */
.padres-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  padding-top: calc(16px + env(safe-area-inset-top, 0px));
  border-bottom: 1px solid var(--color-border);
  background: var(--color-white);
  position: sticky;
  top: 0;
  z-index: 10;
}
.btn-back { background: none; border: none; font-family: var(--font); font-size: 0.95rem; font-weight: 700; color: var(--color-primary-dark); cursor: pointer; min-height: 44px; }
.padres-title { font-size: 1.2rem; font-weight: 800; }

.padres-section { padding: 20px 20px 0; }
.section-title { font-size: 1rem; font-weight: 800; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }

.today-stats, .global-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 8px;
}
.global-stats { grid-template-columns: repeat(2, 1fr); }

.stat-card {
  background: var(--color-white);
  border-radius: var(--radius-sm);
  padding: 12px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.stat-value { font-size: 1.3rem; font-weight: 900; color: var(--color-primary-dark); }
.stat-label { font-size: 0.72rem; color: var(--color-text-muted); font-weight: 600; text-align: center; }

/* Gráfica */
.chart-wrap {
  background: var(--color-white);
  border-radius: var(--radius-sm);
  padding: 16px;
  box-shadow: var(--shadow-card);
}

/* Historial */
.historial-lista { display: flex; flex-direction: column; gap: 8px; }
.historial-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-white);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  box-shadow: var(--shadow-card);
}
.historial-fecha { font-size: 0.9rem; color: var(--color-text-muted); font-weight: 600; }
.historial-horas { font-size: 1rem; font-weight: 800; color: var(--color-text); }
.historial-stars { font-size: 0.9rem; }
.historial-ok { color: var(--color-accent); font-weight: 800; }
.historial-warn { color: var(--color-secondary-dark); font-weight: 800; }

/* Logros */
.logros-lista { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.logro-card {
  background: var(--color-white);
  border-radius: var(--radius-sm);
  padding: 12px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: 0.35;
}
.logro-card.unlocked { opacity: 1; }
.logro-icono { font-size: 1.5rem; }
.logro-nombre { font-size: 0.85rem; font-weight: 700; }
.logro-fecha { font-size: 0.72rem; color: var(--color-text-muted); }

/* Ajustes */
.ajustes-lista { display: flex; flex-direction: column; gap: 14px; }
.ajuste-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.ajuste-row label { font-size: 0.9rem; font-weight: 600; color: var(--color-text); flex: 1; }
.ajuste-row input[type="number"],
.ajuste-row input[type="time"],
.ajuste-row input[type="text"] { width: 120px; }
.ajuste-row input[type="checkbox"] { width: 22px; height: 22px; accent-color: var(--color-primary-dark); }

/* ============================
   MODALES
   ============================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}
.modal-overlay.hidden { display: none; }

.modal-box {
  background: var(--color-white);
  border-radius: var(--radius);
  padding: 28px 24px;
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.modal-box h3 { font-size: 1.2rem; font-weight: 800; text-align: center; }
.modal-subtitle { font-size: 0.9rem; color: var(--color-text-muted); text-align: center; }
.modal-actions { display: flex; gap: 10px; }
.modal-actions .btn-secondary { flex: 1; }
.modal-actions .btn-primary { flex: 2; }

.modal-logro-box { text-align: center; }
.logro-icono-grande { font-size: 4rem; }

/* PIN input */
#input-pin, #input-nuevo-pin {
  text-align: center;
  font-size: 1.8rem;
  letter-spacing: 0.5em;
}

/* ============================
   BANNER PWA
   ============================ */
.banner-pwa {
  position: fixed;
  bottom: calc(16px + var(--safe-bottom));
  left: 16px;
  right: 16px;
  background: var(--color-primary-dark);
  color: var(--color-white);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  z-index: 50;
  box-shadow: var(--shadow);
}
.banner-pwa p { flex: 1; }
.banner-pwa.hidden { display: none; }

/* ============================
   UTILIDADES
   ============================ */
.hidden { display: none !important; }
.error-msg { color: var(--color-error); font-size: 0.85rem; text-align: center; font-weight: 600; }
.pin-first-time { font-size: 0.8rem; color: var(--color-text-muted); text-align: center; }

/* ============================
   TABLET (iPad)
   ============================ */
@media (min-width: 768px) {
  .cosmo-avatar-wrap svg { width: 200px; height: 250px; }
  .cosmo-message { font-size: 1.2rem; }
  .btn-toggle { max-width: 400px; }
  .progress-section, .main-btn-wrap, .daily-summary, .cosmo-header, .cosmo-message-wrap { max-width: 500px; margin-left: auto; margin-right: auto; }
  #view-cosmo { align-items: stretch; }
  .padres-section { max-width: 700px; margin-left: auto; margin-right: auto; }
  .today-stats { grid-template-columns: repeat(3, 1fr); }
  .global-stats { grid-template-columns: repeat(4, 1fr); }
}
```

- [ ] **Step 1.4: Verificar estructura visual base**

Abre `Cosmo/index.html` directamente en el navegador (o `http://localhost:8000/Cosmo/index.html` con `python -m http.server 8000`).

Comprueba:
- Fondo color crema `#FAF8F5`
- Solo se ve la vista login (emoji 🌟, título, formulario)
- Fuente Nunito cargada (texto redondeado)
- No hay errores en consola (salvo posibles 404 de los .js aún vacíos)

- [ ] **Step 1.5: Commit**

```bash
git add Cosmo/
git commit -m "feat(cosmo): scaffold HTML, CSS base y manifest PWA"
```

---

## Task 2: Service Worker y PWA

**Files:**
- Create: `Cosmo/sw.js`
- Create: `Cosmo/icon-192.svg`
- Create: `Cosmo/icon-512.svg`

- [ ] **Step 2.1: Crear `Cosmo/icon-192.svg`** (icono de Cosmo simplificado para PWA)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="40" fill="#C4B5FD"/>
  <!-- Cuerpo corsé -->
  <rect x="56" y="60" width="80" height="100" rx="20" fill="#FAF8F5"/>
  <rect x="68" y="72" width="56" height="76" rx="14" fill="#E9D5FF"/>
  <!-- Aperturas laterales -->
  <rect x="52" y="90" width="16" height="30" rx="8" fill="#C4B5FD"/>
  <rect x="124" y="90" width="16" height="30" rx="8" fill="#C4B5FD"/>
  <!-- Cara -->
  <circle cx="84" cy="105" r="6" fill="#2D2D2D"/>
  <circle cx="108" cy="105" r="6" fill="#2D2D2D"/>
  <path d="M84 122 Q96 132 108 122" stroke="#2D2D2D" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Bracitos -->
  <rect x="30" y="88" width="28" height="12" rx="6" fill="#FDBA74"/>
  <rect x="134" y="88" width="28" height="12" rx="6" fill="#FDBA74"/>
  <!-- Estrella -->
  <text x="88" y="52" font-size="24" text-anchor="middle" font-family="serif">🌟</text>
</svg>
```

- [ ] **Step 2.2: Crear `Cosmo/icon-512.svg`** (igual, diferente viewBox)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#C4B5FD"/>
  <!-- Cuerpo corsé -->
  <rect x="146" y="160" width="220" height="270" rx="55" fill="#FAF8F5"/>
  <rect x="178" y="195" width="156" height="200" rx="38" fill="#E9D5FF"/>
  <!-- Aperturas laterales -->
  <rect x="136" y="235" width="44" height="80" rx="22" fill="#C4B5FD"/>
  <rect x="332" y="235" width="44" height="80" rx="22" fill="#C4B5FD"/>
  <!-- Cara -->
  <circle cx="224" cy="278" r="16" fill="#2D2D2D"/>
  <circle cx="288" cy="278" r="16" fill="#2D2D2D"/>
  <path d="M224 325 Q256 350 288 325" stroke="#2D2D2D" stroke-width="8" fill="none" stroke-linecap="round"/>
  <!-- Bracitos -->
  <rect x="80" y="230" width="74" height="32" rx="16" fill="#FDBA74"/>
  <rect x="358" y="230" width="74" height="32" rx="16" fill="#FDBA74"/>
  <!-- Estrella -->
  <text x="256" y="140" font-size="64" text-anchor="middle" font-family="serif">🌟</text>
</svg>
```

- [ ] **Step 2.3: Crear `Cosmo/sw.js`**

```javascript
const CACHE_NAME = 'cosmo-v1';
const ASSETS = [
  './index.html',
  './styles.css',
  './app.js',
  './firebase.js',
  './notifications.js',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'
];

// Instalar y cachear assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache first para assets propios, network first para Firebase
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('firebase') || url.hostname.includes('google')) {
    return; // No cachear Firebase
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Recibir mensaje para mostrar notificación
self.addEventListener('message', e => {
  if (e.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = e.data;
    self.registration.showNotification(title, {
      body,
      tag,
      icon: './icon-192.svg',
      badge: './icon-192.svg',
      vibrate: [200, 100, 200]
    });
  }
});

// Click en notificación → abrir/enfocar app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('./index.html');
    })
  );
});
```

- [ ] **Step 2.4: Verificar que el SW se registra**

Abre `http://localhost:8000/Cosmo/index.html` en Chrome/Safari.  
DevTools → Application → Service Workers: debe aparecer `sw.js` como "activated and running".

- [ ] **Step 2.5: Commit**

```bash
git add Cosmo/sw.js Cosmo/icon-192.svg Cosmo/icon-512.svg
git commit -m "feat(cosmo): service worker PWA y iconos"
```

---

## Task 3: Firebase — inicialización y operaciones Firestore

**Files:**
- Create: `Cosmo/firebase.js`

> **Antes de implementar:** Ve a [https://console.firebase.google.com](https://console.firebase.google.com), crea un proyecto "Cosmo", habilita Authentication (email/contraseña) y Firestore (modo producción, región europe-west). Copia la config del proyecto.

- [ ] **Step 3.1: Crear `Cosmo/firebase.js`**

```javascript
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── CONFIGURACIÓN ───────────────────────────────────────────────
// Reemplaza con los valores de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Persistencia de sesión en localStorage (sobrevive al cierre del navegador)
setPersistence(auth, browserLocalPersistence);

// ── AUTH ─────────────────────────────────────────────────────────
export function loginConEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function cerrarSesion() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── PERFIL ───────────────────────────────────────────────────────
export async function obtenerPerfil(uid) {
  const ref = doc(db, 'usuarios', uid, 'datos', 'perfil');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function guardarPerfil(uid, datos) {
  const ref = doc(db, 'usuarios', uid, 'datos', 'perfil');
  await setDoc(ref, datos, { merge: true });
}

// ── CONFIGURACIÓN ────────────────────────────────────────────────
export async function obtenerConfig(uid) {
  const ref = doc(db, 'usuarios', uid, 'datos', 'configuracion');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : {
    notificacionesActivas: true,
    recordatorioMinutos: 60,
    horaResumenDiario: '21:00'
  };
}

export async function guardarConfig(uid, datos) {
  const ref = doc(db, 'usuarios', uid, 'datos', 'configuracion');
  await setDoc(ref, datos, { merge: true });
}

// ── SESIONES ─────────────────────────────────────────────────────

/** Abre una sesión (corsé puesto). Devuelve el id del doc creado. */
export async function abrirSesion(uid) {
  const ref = collection(db, 'usuarios', uid, 'sesiones');
  const docRef = await addDoc(ref, {
    inicio: serverTimestamp(),
    fin: null,
    duracionMinutos: 0
  });
  return docRef.id;
}

/** Cierra la sesión abierta más reciente. Devuelve duracionMinutos. */
export async function cerrarSesion(uid, sesionId, inicioTimestamp) {
  const ref = doc(db, 'usuarios', uid, 'sesiones', sesionId);
  const fin = Timestamp.now();
  const duracionMs = fin.toMillis() - inicioTimestamp.toMillis();
  const duracionMinutos = Math.round(duracionMs / 60000);
  await updateDoc(ref, { fin, duracionMinutos });
  return duracionMinutos;
}

/** Obtiene todas las sesiones de los últimos N días. */
export async function obtenerSesiones(uid, diasAtras = 35) {
  const desde = new Date();
  desde.setDate(desde.getDate() - diasAtras);
  const ref = collection(db, 'usuarios', uid, 'sesiones');
  const q = query(
    ref,
    where('inicio', '>=', Timestamp.fromDate(desde)),
    orderBy('inicio', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Busca si hay sesión abierta (fin: null). */
export async function obtenerSesionAbierta(uid) {
  const ref = collection(db, 'usuarios', uid, 'sesiones');
  const q = query(ref, where('fin', '==', null), orderBy('inicio', 'desc'));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

// ── LOGROS ───────────────────────────────────────────────────────
export async function obtenerLogros(uid) {
  const ref = collection(db, 'usuarios', uid, 'logros');
  const snap = await getDocs(ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function desbloquearLogro(uid, tipo) {
  // Evita duplicados
  const ref = collection(db, 'usuarios', uid, 'logros');
  const q = query(ref, where('tipo', '==', tipo));
  const snap = await getDocs(q);
  if (!snap.empty) return false; // ya existía
  await addDoc(ref, { tipo, fecha: serverTimestamp(), visto: false });
  return true;
}

export async function marcarLogroVisto(uid, logroId) {
  const ref = doc(db, 'usuarios', uid, 'logros', logroId);
  await updateDoc(ref, { visto: true });
}

// ── REGLAS FIRESTORE (referencia, aplicar en consola Firebase) ────
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
*/
```

- [ ] **Step 3.2: Configurar Firebase en la consola**

1. Ve a Firebase Console → Authentication → Sign-in method → habilita Email/Password
2. Crea un usuario: Authentication → Users → Add user (el email y contraseña de la familia)
3. Ve a Firestore → Rules → pega las reglas del comentario al final de `firebase.js` → Publish
4. Sustituye los valores de `firebaseConfig` en `firebase.js` con los reales de tu proyecto

- [ ] **Step 3.3: Verificar conexión Firebase**

En `app.js` (aún vacío), añade temporalmente:

```javascript
import { onAuthChange } from './firebase.js';
onAuthChange(user => console.log('Auth state:', user));
```

Abre la app en el navegador, comprueba en consola que aparece `Auth state: null` sin errores. Borra ese código temporal antes del siguiente commit.

- [ ] **Step 3.4: Commit**

```bash
git add Cosmo/firebase.js
git commit -m "feat(cosmo): firebase auth y operaciones firestore"
```

---

## Task 4: Lógica de notificaciones

**Files:**
- Create: `Cosmo/notifications.js`

- [ ] **Step 4.1: Crear `Cosmo/notifications.js`**

```javascript
// IDs de timeout en memoria para poder cancelarlos
let timerRecordatorio = null;
let timerResumen = null;

/** Registra el Service Worker si no está registrado. */
export async function registrarSW() {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.warn('SW no registrado:', e);
    return false;
  }
}

/** Pide permiso de notificaciones. Devuelve true si concedido. */
export async function pedirPermisoNotificaciones() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/** Envía notificación al SW para mostrarla. */
async function mostrarNotificacion(title, body, tag) {
  if (Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker.ready;
  reg.active?.postMessage({ type: 'SHOW_NOTIFICATION', title, body, tag });
}

/**
 * Programa recordatorio si el corsé lleva X minutos quitado.
 * @param {string} nombreCorse - "Cosmo" o el nombre que haya puesto
 * @param {number} minutos - minutos de espera
 */
export function programarRecordatorio(nombreCorse, minutos) {
  cancelarRecordatorio();
  timerRecordatorio = setTimeout(() => {
    mostrarNotificacion(
      `${nombreCorse} te echa de menos 🥺`,
      '¿Volvemos juntos? Llevas un rato sin ponértelo 💜',
      'recordatorio'
    );
  }, minutos * 60 * 1000);
}

/** Cancela el recordatorio pendiente. */
export function cancelarRecordatorio() {
  if (timerRecordatorio) {
    clearTimeout(timerRecordatorio);
    timerRecordatorio = null;
  }
}

/**
 * Notificación inmediata de celebración al cumplir el objetivo.
 * @param {string} nombreCorse
 */
export function notificarObjetivoCumplido(nombreCorse) {
  mostrarNotificacion(
    `¡18 horas con ${nombreCorse}! 🏆`,
    '¡Eres una campeona absoluta! Lo hemos conseguido 🥳✨',
    'objetivo'
  );
}

/**
 * Programa resumen diario a la hora indicada.
 * @param {string} hora - "21:00"
 * @param {Function} obtenerResumen - función que devuelve { horas, minutos }
 * @param {string} nombreCorse
 */
export function programarResumenDiario(hora, obtenerResumen, nombreCorse) {
  cancelarResumenDiario();
  const [h, m] = hora.split(':').map(Number);
  const ahora = new Date();
  const objetivo = new Date();
  objetivo.setHours(h, m, 0, 0);
  if (objetivo <= ahora) objetivo.setDate(objetivo.getDate() + 1);
  const msHasta = objetivo.getTime() - ahora.getTime();

  timerResumen = setTimeout(async () => {
    const { horas, minutos } = obtenerResumen();
    const texto = horas >= 18
      ? `¡18 horas hoy! Increíble 🏆 Hasta mañana 🌙`
      : `Hoy llevas ${horas}h ${minutos}min con ${nombreCorse}. ¡Mañana a por las 18! 💪`;
    await mostrarNotificacion(`Resumen del día con ${nombreCorse}`, texto, 'resumen');
    // Re-programar para el día siguiente
    programarResumenDiario(hora, obtenerResumen, nombreCorse);
  }, msHasta);
}

/** Cancela el resumen diario pendiente. */
export function cancelarResumenDiario() {
  if (timerResumen) {
    clearTimeout(timerResumen);
    timerResumen = null;
  }
}
```

- [ ] **Step 4.2: Verificar notificaciones manualmente**

Con el SW registrado (Task 2), abre la consola del navegador y ejecuta:

```javascript
// Pide permiso
await Notification.requestPermission();

// Envía notificación de prueba
const reg = await navigator.serviceWorker.ready;
reg.active.postMessage({
  type: 'SHOW_NOTIFICATION',
  title: 'Prueba Cosmo 🌟',
  body: 'Las notificaciones funcionan correctamente',
  tag: 'test'
});
```

Debe aparecer una notificación del sistema.

- [ ] **Step 4.3: Commit**

```bash
git add Cosmo/notifications.js
git commit -m "feat(cosmo): sistema de notificaciones locales con SW"
```

---

## Task 5: Avatar SVG de Cosmo y estados

**Files:**
- Modify: `Cosmo/app.js` (primera sección)

El avatar se define como strings SVG inyectados en `#cosmo-avatar-wrap`. Hay 6 estados de expresión del avatar.

- [ ] **Step 5.1: Crear `Cosmo/app.js` — parte 1: avatar SVG y mensajes**

```javascript
import {
  onAuthChange, loginConEmail, cerrarSesion as fbCerrarSesion,
  obtenerPerfil, guardarPerfil, obtenerConfig, guardarConfig,
  abrirSesion, cerrarSesion as fbCerrarSesionCorse,
  obtenerSesiones, obtenerSesionAbierta,
  obtenerLogros, desbloquearLogro, marcarLogroVisto
} from './firebase.js';

import {
  registrarSW, pedirPermisoNotificaciones,
  programarRecordatorio, cancelarRecordatorio,
  notificarObjetivoCumplido, programarResumenDiario
} from './notifications.js';

// ── ESTADO GLOBAL ────────────────────────────────────────────────
let uid = null;
let perfil = { nombreCorse: 'Cosmo', objetivoHoras: 18, pinPadres: null, fechaInicio: null };
let config = { notificacionesActivas: true, recordatorioMinutos: 60, horaResumenDiario: '21:00' };
let sesionActiva = null;       // { id, inicio (Timestamp) } o null
let sesiones = [];             // array de todas las sesiones cargadas
let logros = [];               // array de logros desbloqueados
let tickInterval = null;       // setInterval del contador
let objetivoCelebrado = false; // para no notificar dos veces en el mismo día

// ── AVATAR SVG ───────────────────────────────────────────────────
// Estados: 'wearing' | 'goal-reached' | 'off-short' | 'off-medium' | 'off-long' | 'celebrating'

function svgCosmo(estado) {
  // Ojos y boca varían por estado
  const expresiones = {
    'wearing': {
      ojoi: 'M80 100 Q84 96 88 100 Q84 104 80 100Z',
      ojod: 'M104 100 Q108 96 112 100 Q108 104 104 100Z',
      boca: 'M82 118 Q96 128 110 118',
      colorCuerpo: '#E9D5FF',
      colorCorreas: '#FDBA74'
    },
    'goal-reached': {
      ojoi: 'M78 98 Q84 90 90 98',
      ojod: 'M102 98 Q108 90 114 98',
      boca: 'M80 116 Q96 132 112 116',
      colorCuerpo: '#BBF7D0',
      colorCorreas: '#6EE7B7'
    },
    'off-short': {
      ojoi: 'M82 101 Q86 97 90 101 Q86 105 82 101Z',
      ojod: 'M102 101 Q106 97 110 101 Q106 105 102 101Z',
      boca: 'M84 118 Q96 124 108 118',
      colorCuerpo: '#E9D5FF',
      colorCorreas: '#FDBA74'
    },
    'off-medium': {
      ojoi: 'M82 103 Q86 99 90 103 Q86 107 82 103Z',
      ojod: 'M102 103 Q106 99 110 103 Q106 107 102 103Z',
      boca: 'M84 120 Q96 116 108 120',
      colorCuerpo: '#DDD6FE',
      colorCorreas: '#C4B5FD'
    },
    'off-long': {
      ojoi: 'M82 105 Q86 101 90 105 Q86 109 82 105Z',
      ojod: 'M102 105 Q106 101 110 105 Q106 109 102 105Z',
      boca: 'M84 124 Q96 118 108 124',
      colorCuerpo: '#C4B5FD',
      colorCorreas: '#A78BFA'
    },
    'celebrating': {
      ojoi: 'M78 96 Q84 88 90 96',
      ojod: 'M102 96 Q108 88 114 96',
      boca: 'M78 114 Q96 134 114 114',
      colorCuerpo: '#FDE68A',
      colorCorreas: '#FDBA74'
    }
  };

  const e = expresiones[estado] || expresiones['off-short'];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 240" role="img" aria-label="Cosmo">
  <!-- Cuerpo principal del corsé -->
  <rect x="46" y="50" width="100" height="150" rx="30" fill="#FAF8F5" stroke="#E5E7EB" stroke-width="2"/>
  <!-- Panel frontal -->
  <rect x="60" y="65" width="72" height="120" rx="20" fill="${e.colorCuerpo}"/>
  <!-- Aperturas laterales características del corsé de escoliosis -->
  <ellipse cx="40" cy="115" rx="16" ry="28" fill="${e.colorCuerpo}" stroke="#E5E7EB" stroke-width="1.5"/>
  <ellipse cx="152" cy="115" rx="16" ry="28" fill="${e.colorCuerpo}" stroke="#E5E7EB" stroke-width="1.5"/>
  <!-- Correas -->
  <rect x="56" y="70" width="80" height="8" rx="4" fill="${e.colorCorreas}"/>
  <rect x="56" y="175" width="80" height="8" rx="4" fill="${e.colorCorreas}"/>
  <!-- Cara: ojos -->
  <path d="${e.ojoi}" fill="#2D2D2D"/>
  <path d="${e.ojod}" fill="#2D2D2D"/>
  <!-- Cara: mejillas -->
  <circle cx="76" cy="113" r="7" fill="#FDBA74" opacity="0.4"/>
  <circle cx="116" cy="113" r="7" fill="#FDBA74" opacity="0.4"/>
  <!-- Cara: boca -->
  <path d="${e.boca}" stroke="#2D2D2D" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Bracitos -->
  <rect x="18" y="104" width="32" height="14" rx="7" fill="${e.colorCorreas}"/>
  <rect x="142" y="104" width="32" height="14" rx="7" fill="${e.colorCorreas}"/>
  <!-- Destellos (solo en goal-reached y celebrating) -->
  ${(estado === 'goal-reached' || estado === 'celebrating') ? `
  <text x="20" y="50" font-size="14" opacity="0.9" style="animation: sparkle 1s ease-in-out infinite">✨</text>
  <text x="155" y="45" font-size="16" opacity="0.9" style="animation: sparkle 1s ease-in-out 0.3s infinite">⭐</text>
  <text x="170" y="80" font-size="12" opacity="0.8" style="animation: sparkle 1s ease-in-out 0.6s infinite">✨</text>
  ` : ''}
</svg>`;
}

// ── MENSAJES DE COSMO ────────────────────────────────────────────
const MENSAJES = {
  alPonerse: [
    '¡Allá vamos! Juntos somos imparables 💪',
    '¡Hola! Te he echado de menos 🌸',
    '¡Vamos a por ello! Hoy va a ser un gran día ✨',
    '¡Me alegra que estemos juntos! 🌟'
  ],
  llevando: [
    'Estás siendo increíble hoy ✨',
    'Mira qué bien lo estás haciendo 🌟',
    'Cada hora cuenta. Y tú eres de las que cuentan 💎',
    'Eres más fuerte de lo que crees 💪',
    'Estoy muy orgulloso de ti 🌸'
  ],
  objetivoCumplido: [
    '¡18 HORAS! Soy el corsé más orgulloso del mundo 🏆',
    '¡LO HEMOS CONSEGUIDO! Eres una campeona absoluta 🥳✨',
    '¡18 horas! Esto merece una celebración enorme 🎉'
  ],
  sinCorsePoco: [
    'Aquí esperando, sin prisa. Cuando quieras 💜',
    'Descansando un poco, ¡pero ya tengo ganas de verte! 🌸',
    'Tómate tu tiempo. Aquí estaré ✨'
  ],
  sinCorseMedia: [
    'Oye... te echo de menos 🥺 ¿Volvemos?',
    'Sé que a veces cuesta. Pero tú puedes 🌸',
    'Te espero con ganas. ¡Juntos somos un equipazo! 💪'
  ],
  sinCorseMucho: [
    'Te echo mucho de menos 😢 ¿Cuándo vuelves?',
    'Estoy aquí cuando estés lista. Sin prisa, pero sin pausa 💜',
    'Recuerda que cada hora con yo suma. ¡Volvemos? 🌟'
  ],
  alQuitarse: [
    '¡Hasta luego! Ha sido un placer 🌸',
    'Descansa un ratito. ¡Volvemos pronto! 💜',
    '¡Buen trabajo hoy! Te mereces un descanso ✨'
  ]
};

function mensajeAleatorio(categoria) {
  const arr = MENSAJES[categoria];
  return arr[Math.floor(Math.random() * arr.length)];
}

function determinarEstadoAvatar() {
  if (sesionActiva) {
    const hoysMin = calcularMinutosHoy();
    if (hoysMin >= 18 * 60) return 'goal-reached';
    return 'wearing';
  }
  // Sin corsé: ¿cuánto tiempo lleva sin él?
  const ultima = ultimaSesionCerrada();
  if (!ultima) return 'off-short';
  const minSin = (Date.now() - ultima.fin.toMillis()) / 60000;
  if (minSin < 60) return 'off-short';
  if (minSin < 120) return 'off-medium';
  return 'off-long';
}

function mensajePorEstado(estado) {
  if (estado === 'goal-reached') return mensajeAleatorio('objetivoCumplido');
  if (estado === 'wearing') return mensajeAleatorio('llevando');
  if (estado === 'off-short') return mensajeAleatorio('sinCorsePoco');
  if (estado === 'off-medium') return mensajeAleatorio('sinCorseMedia');
  return mensajeAleatorio('sinCorseMucho');
}

// ── CÁLCULOS ─────────────────────────────────────────────────────

/** Minutos acumulados hoy (incluyendo sesión activa si la hay). */
function calcularMinutosHoy() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const maniana = new Date(hoy);
  maniana.setDate(maniana.getDate() + 1);

  let total = 0;
  for (const s of sesiones) {
    const inicio = s.inicio?.toDate ? s.inicio.toDate() : new Date(s.inicio);
    if (inicio < hoy || inicio >= maniana) continue;
    if (s.fin) {
      total += s.duracionMinutos || 0;
    } else if (sesionActiva?.id === s.id) {
      // Sesión abierta: contar hasta ahora
      total += Math.floor((Date.now() - inicio.getTime()) / 60000);
    }
  }
  return total;
}

/** Minutos acumulados en una fecha específica (Date). */
function calcularMinutosFecha(fecha) {
  const inicio = new Date(fecha);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);

  let total = 0;
  for (const s of sesiones) {
    const sInicio = s.inicio?.toDate ? s.inicio.toDate() : new Date(s.inicio);
    if (sInicio < inicio || sInicio >= fin) continue;
    total += s.duracionMinutos || 0;
  }
  return total;
}

/** Estrellas para una cantidad de minutos. */
function estrellasParaMinutos(min) {
  if (min >= 18 * 60) return '⭐⭐⭐';
  if (min >= 15 * 60) return '⭐⭐';
  if (min >= 12 * 60) return '⭐';
  return '';
}

/** Última sesión cerrada (la más reciente con fin !== null). */
function ultimaSesionCerrada() {
  const cerradas = sesiones.filter(s => s.fin !== null);
  if (cerradas.length === 0) return null;
  return cerradas[cerradas.length - 1];
}

/** Racha de días consecutivos cumpliendo objetivo. Devuelve { actual, mejor }. */
function calcularRachas() {
  let actual = 0, mejor = 0, temp = 0;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Recorrer los últimos 365 días hacia atrás
  for (let i = 0; i < 365; i++) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    const min = calcularMinutosFecha(d);
    if (min >= 18 * 60) {
      temp++;
      if (i === 0 || (i > 0 && temp > 1)) actual = temp; // solo si incluye hoy
    } else {
      if (temp > mejor) mejor = temp;
      temp = 0;
      if (i === 0) actual = 0;
    }
  }
  if (temp > mejor) mejor = temp;
  return { actual, mejor };
}

/** Porcentaje de días cumplidos en el mes actual. */
function calcularPctMes() {
  const hoy = new Date();
  const diasMes = hoy.getDate(); // días transcurridos incluyendo hoy
  let cumplidos = 0;
  for (let i = 0; i < diasMes; i++) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    if (calcularMinutosFecha(d) >= 18 * 60) cumplidos++;
  }
  return Math.round((cumplidos / diasMes) * 100);
}

/** Total de minutos acumulados en todas las sesiones. */
function calcularTotalMinutos() {
  return sesiones
    .filter(s => s.fin !== null)
    .reduce((acc, s) => acc + (s.duracionMinutos || 0), 0);
}

// ── LOGROS: COMPROBACIÓN ─────────────────────────────────────────
async function comprobarLogros() {
  const tiposYa = new Set(logros.map(l => l.tipo));
  const nuevos = [];

  // Primera vez
  if (sesiones.length >= 1 && !tiposYa.has('primera_vez')) {
    if (await desbloquearLogro(uid, 'primera_vez')) nuevos.push('primera_vez');
  }

  // Rachas
  const { actual } = calcularRachas();
  for (const [tipo, dias] of [['racha_3', 3], ['racha_7', 7], ['racha_30', 30]]) {
    if (actual >= dias && !tiposYa.has(tipo)) {
      if (await desbloquearLogro(uid, tipo)) nuevos.push(tipo);
    }
  }

  // Semana perfecta: 7 días seguidos con 3 estrellas
  if (!tiposYa.has('semana_perfecta')) {
    let consecutivos = 0;
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(hoy); d.setDate(d.getDate() - i);
      if (calcularMinutosFecha(d) >= 18 * 60) consecutivos++;
      else break;
    }
    if (consecutivos >= 7) {
      if (await desbloquearLogro(uid, 'semana_perfecta')) nuevos.push('semana_perfecta');
    }
  }

  // Horas totales
  const totalH = calcularTotalMinutos() / 60;
  if (totalH >= 100 && !tiposYa.has('horas_100')) {
    if (await desbloquearLogro(uid, 'horas_100')) nuevos.push('horas_100');
  }
  if (totalH >= 500 && !tiposYa.has('horas_500')) {
    if (await desbloquearLogro(uid, 'horas_500')) nuevos.push('horas_500');
  }

  // Recargar logros actualizados
  if (nuevos.length > 0) {
    logros = await obtenerLogros(uid);
    for (const tipo of nuevos) {
      const l = logros.find(x => x.tipo === tipo);
      if (l) mostrarModalLogro(l);
    }
  }
}

// ── DEFINICIÓN DE LOGROS ─────────────────────────────────────────
const CATALOGO_LOGROS = {
  primera_vez:    { icono: '🌱', nombre: 'Primer día', desc: '¡Empezaste tu aventura con Cosmo!' },
  racha_3:        { icono: '🔥', nombre: 'Racha de 3', desc: '3 días consecutivos cumpliendo el objetivo' },
  racha_7:        { icono: '💎', nombre: 'Racha de 7', desc: '7 días seguidos. ¡Increíble constancia!' },
  racha_30:       { icono: '👑', nombre: 'Racha de 30', desc: '30 días seguidos. ¡Eres una leyenda!' },
  semana_perfecta:{ icono: '🌟', nombre: 'Semana perfecta', desc: '7 días seguidos con las 3 estrellas' },
  horas_100:      { icono: '💪', nombre: '100 horas', desc: '100 horas acumuladas con Cosmo' },
  horas_500:      { icono: '🚀', nombre: '500 horas', desc: '500 horas. ¡Una campeona absoluta!' }
};
```

- [ ] **Step 5.2: Verificar SVG del avatar**

En `app.js`, al final del archivo añade temporalmente:

```javascript
document.getElementById('cosmo-avatar-wrap').innerHTML = svgCosmo('wearing');
document.getElementById('cosmo-avatar-wrap').className = 'cosmo-avatar-wrap state-wearing';
```

Abre la app en el navegador (en la vista login). Inspecciona el DOM — el SVG de Cosmo debe ser visible si cambias temporalmente la vista. Comprueba todos los estados pasando `'goal-reached'`, `'off-long'`, etc.

- [ ] **Step 5.3: Commit**

```bash
git add Cosmo/app.js
git commit -m "feat(cosmo): avatar SVG, estados, mensajes y cálculos"
```

---

## Task 6: UI del Modo Cosmo — login, arranque y ticker

**Files:**
- Modify: `Cosmo/app.js` (segunda parte)

- [ ] **Step 6.1: Añadir al final de `app.js` — gestión de vistas y login**

```javascript
// ── VISTAS ───────────────────────────────────────────────────────
function mostrarVista(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── ACTUALIZAR UI MODO COSMO ─────────────────────────────────────
function actualizarUICosmo() {
  const estado = determinarEstadoAvatar();
  const wrap = document.getElementById('cosmo-avatar-wrap');
  wrap.innerHTML = svgCosmo(estado);
  wrap.className = `cosmo-avatar-wrap state-${estado}`;

  // Mensaje
  document.getElementById('cosmo-message').textContent = mensajePorEstado(estado);

  // Nombre
  document.getElementById('cosmo-name-display').textContent = perfil.nombreCorse || 'Cosmo';

  // Botón
  const btn = document.getElementById('btn-toggle');
  const btnText = document.getElementById('btn-toggle-text');
  if (sesionActiva) {
    btn.className = 'btn-toggle btn-wearing-on';
    btnText.textContent = `Quitarte a ${perfil.nombreCorse || 'Cosmo'} 🎽`;
  } else {
    btn.className = 'btn-toggle btn-wearing-off';
    btnText.textContent = `Ponerte a ${perfil.nombreCorse || 'Cosmo'} 💪`;
  }

  // Progreso
  const minHoy = calcularMinutosHoy();
  const pct = Math.min(100, Math.round((minHoy / (18 * 60)) * 100));
  document.getElementById('progress-bar').style.width = `${pct}%`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  const h = Math.floor(minHoy / 60);
  const m = minHoy % 60;
  document.getElementById('progress-hours').textContent = `${h}h ${m}min`;

  // Estrellas y racha
  document.getElementById('stars-display').textContent = estrellasParaMinutos(minHoy) || '—';
  const { actual } = calcularRachas();
  document.getElementById('streak-display').textContent = `${actual} días 🔥`;

  // Objetivo cumplido: notificar una vez por día
  if (minHoy >= 18 * 60 && !objetivoCelebrado && config.notificacionesActivas) {
    objetivoCelebrado = true;
    notificarObjetivoCumplido(perfil.nombreCorse || 'Cosmo');
  }
}

function iniciarTicker() {
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(actualizarUICosmo, 30000); // cada 30 segundos
}

// ── LOGIN ────────────────────────────────────────────────────────
document.getElementById('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('input-email').value.trim();
  const pass = document.getElementById('input-password').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');
  try {
    await loginConEmail(email, pass);
    // onAuthChange se encargará de cargar la app
  } catch (err) {
    errEl.textContent = 'Email o contraseña incorrectos';
    errEl.classList.remove('hidden');
  }
});

// ── ARRANQUE ─────────────────────────────────────────────────────
async function cargarDatos() {
  [perfil, config, sesionActiva, sesiones, logros] = await Promise.all([
    obtenerPerfil(uid).then(p => p || perfil),
    obtenerConfig(uid),
    obtenerSesionAbierta(uid),
    obtenerSesiones(uid, 35),
    obtenerLogros(uid)
  ]);
  // Añadir sesión activa a la lista si no está
  if (sesionActiva && !sesiones.find(s => s.id === sesionActiva.id)) {
    sesiones.push(sesionActiva);
  }
}

async function init() {
  // Registrar SW
  await registrarSW();

  // Mostrar banner PWA en Safari móvil si no está instalada
  const esIOS = /iphone|ipad/i.test(navigator.userAgent);
  const esSafariStandalone = window.navigator.standalone;
  if (esIOS && !esSafariStandalone) {
    document.getElementById('banner-pwa').classList.remove('hidden');
  }

  // Escuchar cambios de auth
  onAuthChange(async user => {
    if (!user) {
      if (tickInterval) clearInterval(tickInterval);
      mostrarVista('view-login');
      return;
    }
    uid = user.uid;
    await cargarDatos();
    // Si es primera vez, crear perfil
    if (!perfil.fechaInicio) {
      perfil.fechaInicio = new Date();
      await guardarPerfil(uid, perfil);
    }
    // Pedir permiso de notificaciones
    if (config.notificacionesActivas) await pedirPermisoNotificaciones();
    // Programar resumen diario
    programarResumenDiario(
      config.horaResumenDiario || '21:00',
      () => {
        const min = calcularMinutosHoy();
        return { horas: Math.floor(min / 60), minutos: min % 60 };
      },
      perfil.nombreCorse || 'Cosmo'
    );
    // Comprobar logros no vistos
    const noVistos = logros.filter(l => !l.visto);
    for (const l of noVistos) mostrarModalLogro(l);

    mostrarVista('view-cosmo');
    actualizarUICosmo();
    iniciarTicker();
  });
}

// Iniciar cuando DOM esté listo
document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 6.2: Verificar login y carga**

1. Abre `http://localhost:8000/Cosmo/index.html`
2. Introduce el email y contraseña creados en Firebase Console
3. Debe mostrar la vista Modo Cosmo con el avatar de Cosmo, barra de progreso en 0% y botón "Ponerte a Cosmo 💪"
4. La consola no debe mostrar errores

- [ ] **Step 6.3: Commit**

```bash
git add Cosmo/app.js
git commit -m "feat(cosmo): login, arranque firebase y ticker UI"
```

---

## Task 7: Botón principal (hold 1.5s) y sesiones

**Files:**
- Modify: `Cosmo/app.js` (tercera parte)

- [ ] **Step 7.1: Añadir al final de `app.js` — lógica del botón hold y sesiones**

```javascript
// ── BOTÓN HOLD (1.5 segundos) ────────────────────────────────────
let holdTimer = null;
let holdStart = null;

const btnToggle = document.getElementById('btn-toggle');
const holdRing = document.getElementById('btn-hold-ring');

function iniciarHold() {
  holdStart = Date.now();
  holdRing.classList.remove('filling');
  // forzar reflow para reiniciar la transición
  void holdRing.offsetWidth;
  holdRing.classList.add('filling');

  holdTimer = setTimeout(async () => {
    holdRing.classList.remove('filling');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    await toggleSesion();
  }, 1500);
}

function cancelarHold() {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
  holdRing.classList.remove('filling');
  holdRing.style.width = '0%';
  void holdRing.offsetWidth;
}

btnToggle.addEventListener('pointerdown', iniciarHold);
btnToggle.addEventListener('pointerup', cancelarHold);
btnToggle.addEventListener('pointerleave', cancelarHold);
btnToggle.addEventListener('contextmenu', e => e.preventDefault()); // evitar menú largo-tap en iOS

async function toggleSesion() {
  if (sesionActiva) {
    // QUITAR el corsé
    try {
      await fbCerrarSesionCorse(uid, sesionActiva.id, sesionActiva.inicio);
      // Actualizar objeto en sesiones locales
      const idx = sesiones.findIndex(s => s.id === sesionActiva.id);
      if (idx >= 0) {
        sesiones[idx].fin = { toMillis: () => Date.now(), toDate: () => new Date() };
        sesiones[idx].duracionMinutos = Math.floor((Date.now() - sesionActiva.inicio.toMillis()) / 60000);
      }
      sesionActiva = null;
      // Programar recordatorio
      if (config.notificacionesActivas) {
        programarRecordatorio(perfil.nombreCorse || 'Cosmo', config.recordatorioMinutos || 60);
      }
      // Mostrar mensaje de despedida
      document.getElementById('cosmo-message').textContent = mensajeAleatorio('alQuitarse');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  } else {
    // PONER el corsé
    try {
      cancelarRecordatorio();
      const id = await abrirSesion(uid);
      const now = { toMillis: () => Date.now(), toDate: () => new Date() };
      sesionActiva = { id, inicio: now };
      sesiones.push({ id, inicio: now, fin: null, duracionMinutos: 0 });
      // Restablecer flag de objetivo si es un día nuevo
      const minHoy = calcularMinutosHoy();
      if (minHoy < 18 * 60) objetivoCelebrado = false;
      // Mostrar mensaje de bienvenida
      document.getElementById('cosmo-message').textContent = mensajeAleatorio('alPonerse');
    } catch (err) {
      console.error('Error al abrir sesión:', err);
    }
  }

  actualizarUICosmo();
  await comprobarLogros();
}
```

- [ ] **Step 7.2: Verificar toggle de sesión**

1. Con la app abierta y sesión Firebase activa, pulsa y mantén el botón "Ponerte a Cosmo" durante 1.5s
2. El botón debe cambiar a "Quitarte a Cosmo 🎽", el avatar cambia a estado `wearing`, el mensaje cambia
3. En Firebase Console → Firestore → usuarios/{uid}/sesiones: debe aparecer un doc con `fin: null`
4. Mantén de nuevo el botón: debe cerrarse la sesión (el doc de Firestore tendrá `fin` con timestamp)
5. Si tienes notificaciones habilitadas, en 60 minutos llegará el recordatorio (para probar, cambia temporalmente `recordatorioMinutos` a 0.1 en el código)

- [ ] **Step 7.3: Commit**

```bash
git add Cosmo/app.js
git commit -m "feat(cosmo): botón hold 1.5s, apertura y cierre de sesiones"
```

---

## Task 8: Editar nombre y modal de logro

**Files:**
- Modify: `Cosmo/app.js` (cuarta parte)

- [ ] **Step 8.1: Añadir al final de `app.js` — editar nombre de Cosmo y modal de logro**

```javascript
// ── EDITAR NOMBRE ────────────────────────────────────────────────
document.getElementById('btn-edit-name').addEventListener('click', () => {
  document.getElementById('input-new-name').value = perfil.nombreCorse || 'Cosmo';
  document.getElementById('modal-edit-name').classList.remove('hidden');
});

document.getElementById('btn-cancel-name').addEventListener('click', () => {
  document.getElementById('modal-edit-name').classList.add('hidden');
});

document.getElementById('btn-save-name').addEventListener('click', async () => {
  const nuevo = document.getElementById('input-new-name').value.trim() || 'Cosmo';
  perfil.nombreCorse = nuevo;
  await guardarPerfil(uid, { nombreCorse: nuevo });
  document.getElementById('modal-edit-name').classList.add('hidden');
  actualizarUICosmo();
});

// ── MODAL LOGRO DESBLOQUEADO ─────────────────────────────────────
function mostrarModalLogro(logro) {
  const cat = CATALOGO_LOGROS[logro.tipo];
  if (!cat) return;
  document.getElementById('modal-logro-icono').textContent = cat.icono;
  document.getElementById('modal-logro-nombre').textContent = `¡${cat.nombre}!`;
  document.getElementById('modal-logro-desc').textContent = cat.desc;
  document.getElementById('modal-logro').classList.remove('hidden');

  // Poner avatar en celebración
  const wrap = document.getElementById('cosmo-avatar-wrap');
  wrap.innerHTML = svgCosmo('celebrating');
  wrap.className = 'cosmo-avatar-wrap state-celebrating';

  document.getElementById('btn-cerrar-logro').onclick = async () => {
    document.getElementById('modal-logro').classList.add('hidden');
    await marcarLogroVisto(uid, logro.id);
    actualizarUICosmo();
  };
}

// ── BANNER PWA ───────────────────────────────────────────────────
document.getElementById('btn-cerrar-banner').addEventListener('click', () => {
  document.getElementById('banner-pwa').classList.add('hidden');
});
```

- [ ] **Step 8.2: Verificar edición de nombre**

1. Pulsa el icono ✏️ junto al nombre "Cosmo"
2. Cambia el nombre a "Cosmo 2" → Guardar
3. El header debe mostrar "Cosmo 2", el botón debe decir "Ponerte a Cosmo 2 💪"
4. Recarga la página: el nombre debe persistir (está en Firestore)

- [ ] **Step 8.3: Commit**

```bash
git add Cosmo/app.js
git commit -m "feat(cosmo): edición de nombre y modal de logro desbloqueado"
```

---

## Task 9: Modal PIN y Modo Padres — estructura y datos

**Files:**
- Modify: `Cosmo/app.js` (quinta parte)

- [ ] **Step 9.1: Añadir al final de `app.js` — PIN y acceso a Modo Padres**

```javascript
// ── HASH SHA-256 PARA PIN ────────────────────────────────────────
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'cosmo-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── MODAL PIN ────────────────────────────────────────────────────
document.getElementById('btn-padres').addEventListener('click', () => {
  document.getElementById('pin-error').classList.add('hidden');
  document.getElementById('input-pin').value = '';
  // Si no hay PIN guardado, mostrar aviso de primera vez
  if (!perfil.pinPadres) {
    document.getElementById('pin-first-time').classList.remove('hidden');
  } else {
    document.getElementById('pin-first-time').classList.add('hidden');
  }
  document.getElementById('modal-pin').classList.remove('hidden');
});

document.getElementById('btn-cancel-pin').addEventListener('click', () => {
  document.getElementById('modal-pin').classList.add('hidden');
});

document.getElementById('btn-confirm-pin').addEventListener('click', async () => {
  const pin = document.getElementById('input-pin').value;
  if (pin.length !== 4) {
    document.getElementById('pin-error').textContent = 'Introduce 4 dígitos';
    document.getElementById('pin-error').classList.remove('hidden');
    return;
  }
  const pinHash = await hashPin(pin);

  if (!perfil.pinPadres) {
    // Primera vez: guardar el PIN
    perfil.pinPadres = pinHash;
    await guardarPerfil(uid, { pinPadres: pinHash });
    document.getElementById('modal-pin').classList.add('hidden');
    await abrirModoPadres();
  } else if (pinHash === perfil.pinPadres) {
    document.getElementById('modal-pin').classList.add('hidden');
    await abrirModoPadres();
  } else {
    document.getElementById('pin-error').textContent = 'PIN incorrecto';
    document.getElementById('pin-error').classList.remove('hidden');
  }
});

// Permitir confirmar con Enter
document.getElementById('input-pin').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-confirm-pin').click();
});

// ── MODO PADRES ──────────────────────────────────────────────────
async function abrirModoPadres() {
  // Recargar sesiones para tener datos frescos
  sesiones = await obtenerSesiones(uid, 35);
  logros = await obtenerLogros(uid);
  renderDashboardPadres();
  mostrarVista('view-padres');
}

document.getElementById('btn-volver-cosmo').addEventListener('click', () => {
  mostrarVista('view-cosmo');
  actualizarUICosmo();
});

function renderDashboardPadres() {
  // Resumen hoy
  const minHoy = calcularMinutosHoy();
  const hHoy = Math.floor(minHoy / 60);
  const mHoy = minHoy % 60;
  document.getElementById('padres-horas-hoy').textContent = `${hHoy}h ${mHoy}m`;
  document.getElementById('padres-estado').textContent = sesionActiva ? '🟢 Puesto' : '⚫ Quitado';
  document.getElementById('padres-estrellas-hoy').textContent = estrellasParaMinutos(minHoy) || '—';

  // Estadísticas globales
  const { actual, mejor } = calcularRachas();
  document.getElementById('stat-racha').textContent = actual;
  document.getElementById('stat-mejor-racha').textContent = mejor;
  document.getElementById('stat-pct-mes').textContent = `${calcularPctMes()}%`;
  const totalMin = calcularTotalMinutos();
  document.getElementById('stat-horas-total').textContent = `${Math.floor(totalMin / 60)}h`;

  // Historial 7 días
  renderHistorial();

  // Gráfica semanal
  renderGraficaSemanal();

  // Logros
  renderLogros();

  // Ajustes
  document.getElementById('ajuste-nombre').value = perfil.nombreCorse || 'Cosmo';
  document.getElementById('ajuste-recordatorio').value = config.recordatorioMinutos || 60;
  document.getElementById('ajuste-hora-resumen').value = config.horaResumenDiario || '21:00';
  document.getElementById('ajuste-notificaciones').checked = config.notificacionesActivas !== false;
}

function renderHistorial() {
  const lista = document.getElementById('historial-lista');
  lista.innerHTML = '';
  const hoy = new Date(); hoy.setHours(0,0,0,0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(hoy); d.setDate(d.getDate() - i);
    const min = calcularMinutosFecha(d);
    const h = Math.floor(min / 60);
    const m = min % 60;
    const ok = min >= 18 * 60;
    const stars = estrellasParaMinutos(min);

    const nombreDia = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    const row = document.createElement('div');
    row.className = 'historial-row';
    row.innerHTML = `
      <span class="historial-fecha">${i === 0 ? 'Hoy' : nombreDia}</span>
      <span class="historial-horas">${min > 0 ? `${h}h ${m}m` : '—'}</span>
      <span class="historial-stars">${stars}</span>
      <span class="${ok ? 'historial-ok' : 'historial-warn'}">${ok ? '✓' : min > 0 ? '!' : '—'}</span>
    `;
    lista.appendChild(row);
  }
}

function renderLogros() {
  const lista = document.getElementById('logros-lista');
  lista.innerHTML = '';
  const tiposDesbloqueados = new Map(logros.map(l => [l.tipo, l]));

  for (const [tipo, cat] of Object.entries(CATALOGO_LOGROS)) {
    const desbloqueado = tiposDesbloqueados.get(tipo);
    const card = document.createElement('div');
    card.className = `logro-card${desbloqueado ? ' unlocked' : ''}`;
    let fechaStr = '';
    if (desbloqueado?.fecha?.toDate) {
      fechaStr = desbloqueado.fecha.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    card.innerHTML = `
      <span class="logro-icono">${cat.icono}</span>
      <span class="logro-nombre">${cat.nombre}</span>
      <span class="logro-fecha">${desbloqueado ? fechaStr : cat.desc}</span>
    `;
    lista.appendChild(card);
  }
}
```

- [ ] **Step 9.2: Verificar acceso al modo padres**

1. Pulsa "👨‍👩‍👧 Padres"
2. Se muestra el modal de PIN — escribe cualquier 4 dígitos (primera vez: se guarda)
3. Debes ver el dashboard con resumen, historial (todo en 0 si es la primera vez), logros en gris
4. El botón "← Volver" debe regresar al Modo Cosmo

- [ ] **Step 9.3: Commit**

```bash
git add Cosmo/app.js
git commit -m "feat(cosmo): modal PIN, dashboard padres, historial y logros"
```

---

## Task 10: Gráfica semanal con Chart.js

**Files:**
- Modify: `Cosmo/index.html` (añadir CDN Chart.js)
- Modify: `Cosmo/app.js` (sexta parte)

- [ ] **Step 10.1: Añadir Chart.js CDN en `index.html`**

Justo antes de los `<script type="module">` al final del body, añade:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

- [ ] **Step 10.2: Añadir al final de `app.js` — gráfica Chart.js**

```javascript
// ── GRÁFICA SEMANAL ──────────────────────────────────────────────
let chartInstance = null;

function renderGraficaSemanal() {
  const labels = [];
  const datos = [];
  const colores = [];
  const hoy = new Date(); hoy.setHours(0,0,0,0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy); d.setDate(d.getDate() - i);
    const min = calcularMinutosFecha(d);
    const horas = min / 60;
    const nombreDia = d.toLocaleDateString('es-ES', { weekday: 'short' });
    labels.push(i === 0 ? 'Hoy' : nombreDia);
    datos.push(Math.round(horas * 10) / 10);
    colores.push(horas >= 18 ? '#6EE7B7' : horas >= 12 ? '#C4B5FD' : '#FDBA74');
  }

  const ctx = document.getElementById('chart-semana').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Horas con Cosmo',
        data: datos,
        backgroundColor: colores,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw}h`
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 20,
          ticks: {
            callback: v => `${v}h`,
            font: { family: 'Nunito', size: 11 }
          },
          grid: { color: '#F3F4F6' }
        },
        x: {
          ticks: { font: { family: 'Nunito', size: 11 } },
          grid: { display: false }
        }
      },
      // Línea de objetivo a 18h
      plugins: {
        annotation: undefined // no usamos plugin de anotaciones — dibujamos la línea con dataset
      }
    },
    plugins: [{
      id: 'objetivo-line',
      afterDraw(chart) {
        const { ctx: c, scales: { y, x } } = chart;
        const yPos = y.getPixelForValue(18);
        c.save();
        c.strokeStyle = '#EF4444';
        c.lineWidth = 1.5;
        c.setLineDash([6, 4]);
        c.beginPath();
        c.moveTo(x.left, yPos);
        c.lineTo(x.right, yPos);
        c.stroke();
        c.fillStyle = '#EF4444';
        c.font = '10px Nunito';
        c.fillText('18h', x.right + 4, yPos + 4);
        c.restore();
      }
    }]
  });
}
```

- [ ] **Step 10.3: Verificar gráfica**

1. Abre el Modo Padres
2. Debe aparecer la gráfica de barras con los últimos 7 días
3. La línea roja discontinua debe estar a las 18h
4. Los colores: verde (≥18h), lavanda (12-18h), melocotón (<12h)

- [ ] **Step 10.4: Commit**

```bash
git add Cosmo/index.html Cosmo/app.js
git commit -m "feat(cosmo): gráfica semanal Chart.js con línea de objetivo"
```

---

## Task 11: Ajustes desde Modo Padres y cambio de PIN

**Files:**
- Modify: `Cosmo/app.js` (séptima parte)

- [ ] **Step 11.1: Añadir al final de `app.js` — ajustes y cambio de PIN**

```javascript
// ── AJUSTES ──────────────────────────────────────────────────────
document.getElementById('btn-guardar-ajustes').addEventListener('click', async () => {
  const nuevoNombre = document.getElementById('ajuste-nombre').value.trim() || 'Cosmo';
  const nuevoRecordatorio = parseInt(document.getElementById('ajuste-recordatorio').value) || 60;
  const nuevaHoraResumen = document.getElementById('ajuste-hora-resumen').value || '21:00';
  const nuevasNotif = document.getElementById('ajuste-notificaciones').checked;

  perfil.nombreCorse = nuevoNombre;
  config.recordatorioMinutos = nuevoRecordatorio;
  config.horaResumenDiario = nuevaHoraResumen;
  config.notificacionesActivas = nuevasNotif;

  await Promise.all([
    guardarPerfil(uid, { nombreCorse: nuevoNombre }),
    guardarConfig(uid, { recordatorioMinutos: nuevoRecordatorio, horaResumenDiario: nuevaHoraResumen, notificacionesActivas: nuevasNotif })
  ]);

  // Re-programar resumen diario con nueva hora
  programarResumenDiario(
    nuevaHoraResumen,
    () => { const min = calcularMinutosHoy(); return { horas: Math.floor(min / 60), minutos: min % 60 }; },
    nuevoNombre
  );

  alert(`✅ Ajustes guardados`);
});

// ── CAMBIAR PIN ──────────────────────────────────────────────────
document.getElementById('btn-cambiar-pin').addEventListener('click', () => {
  document.getElementById('input-nuevo-pin').value = '';
  document.getElementById('modal-cambiar-pin').classList.remove('hidden');
});

document.getElementById('btn-cancel-nuevo-pin').addEventListener('click', () => {
  document.getElementById('modal-cambiar-pin').classList.add('hidden');
});

document.getElementById('btn-save-nuevo-pin').addEventListener('click', async () => {
  const pin = document.getElementById('input-nuevo-pin').value;
  if (pin.length !== 4) {
    alert('El PIN debe tener 4 dígitos');
    return;
  }
  const pinHash = await hashPin(pin);
  perfil.pinPadres = pinHash;
  await guardarPerfil(uid, { pinPadres: pinHash });
  document.getElementById('modal-cambiar-pin').classList.add('hidden');
  alert('✅ PIN actualizado');
});
```

- [ ] **Step 11.2: Verificar ajustes**

1. En Modo Padres, cambia el nombre a "Cosmo ✨" → Guardar ajustes
2. Vuelve al Modo Cosmo: el nombre debe ser "Cosmo ✨"
3. En Ajustes, pulsa "Cambiar PIN" → introduce un nuevo PIN de 4 dígitos
4. Sal al Modo Cosmo y vuelve a entrar a Padres: el nuevo PIN debe funcionar, el antiguo no

- [ ] **Step 11.3: Commit**

```bash
git add Cosmo/app.js
git commit -m "feat(cosmo): ajustes desde modo padres y cambio de PIN"
```

---

## Task 12: Pulido final — touch events iOS, accesibilidad y prueba PWA

**Files:**
- Modify: `Cosmo/styles.css` (ajustes iOS)
- Modify: `Cosmo/app.js` (touch events)

- [ ] **Step 12.1: Ajustes CSS para iOS Safari**

Añade al final de `styles.css`:

```css
/* ============================
   AJUSTES iOS / SAFARI
   ============================ */

/* Evitar zoom en inputs en iOS (font-size >= 16px) */
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  input[type="email"],
  input[type="password"],
  input[type="text"],
  input[type="number"],
  input[type="time"] {
    font-size: 16px;
  }
}

/* Tap highlight */
* { -webkit-tap-highlight-color: transparent; }

/* Scroll suave */
.view { -webkit-overflow-scrolling: touch; overflow-y: auto; }

/* Evitar selección de texto en botones */
button { -webkit-user-select: none; user-select: none; }

/* Padding bottom seguro en iPhone con notch */
#view-cosmo {
  padding-bottom: calc(32px + env(safe-area-inset-bottom, 0px));
}
```

- [ ] **Step 12.2: Añadir touch events como refuerzo en `app.js`**

Al inicio del bloque del botón hold (justo antes de `btnToggle.addEventListener('pointerdown', iniciarHold)`), añade:

```javascript
// Touch events como refuerzo para iOS Safari
btnToggle.addEventListener('touchstart', e => { e.preventDefault(); iniciarHold(); }, { passive: false });
btnToggle.addEventListener('touchend', e => { e.preventDefault(); cancelarHold(); }, { passive: false });
btnToggle.addEventListener('touchcancel', cancelarHold);
```

- [ ] **Step 12.3: Probar como PWA en iPhone**

1. Con la app servida desde HTTPS (o localhost en el mismo dispositivo vía IP local):
   - En Mac: `python3 -m http.server 8000` y accede desde iPhone a `http://IP_MAC:8000/Cosmo/`
   - O despliega en Netlify/GitHub Pages (recomendado para prueba real)
2. En Safari iPhone → compartir → "Añadir a pantalla de inicio"
3. Abre la app desde el icono: debe abrirse sin barra de Safari (standalone)
4. Prueba el botón hold: debe funcionar con touch en iOS
5. Ve a Ajustes del iPhone → Notificaciones → Cosmo: habilita notificaciones si no lo están

- [ ] **Step 12.4: Commit final**

```bash
git add Cosmo/styles.css Cosmo/app.js
git commit -m "feat(cosmo): pulido iOS Safari, touch events y PWA lista"
```

---

## Self-Review

### Cobertura del spec

| Requisito | Task |
|---|---|
| Login Firebase Auth | Task 6 |
| Modo Cosmo — pantalla principal | Tasks 5, 6 |
| Avatar SVG animado con estados | Task 5 |
| Mensajes dinámicos de Cosmo | Task 5 |
| Botón hold 1.5s | Task 7 |
| Sesiones abrir/cerrar en Firestore | Tasks 3, 7 |
| Barra de progreso y contador | Task 6 |
| Estrellas diarias | Tasks 5, 6 |
| Racha de días | Tasks 5, 6 |
| Editar nombre de Cosmo | Task 8 |
| Modal de logro desbloqueado | Task 8 |
| Sistema de logros (7 tipos) | Task 5 |
| Comprobación automática de logros | Task 5 |
| Acceso Padres con PIN (hash SHA-256) | Task 9 |
| Dashboard resumen hoy | Task 9 |
| Gráfica semanal Chart.js | Task 10 |
| Historial 7 días | Task 9 |
| Estadísticas globales | Task 9 |
| Logros en dashboard padres | Task 9 |
| Ajustes desde padres | Task 11 |
| Cambio de PIN | Task 11 |
| Notificación recordatorio | Task 4 |
| Notificación objetivo cumplido | Tasks 4, 6 |
| Resumen diario programado | Tasks 4, 6 |
| Service Worker PWA | Task 2 |
| Manifest + iconos | Tasks 1, 2 |
| Banner instalación iOS | Task 6 |
| Diseño cálido mobile-first | Task 1 |
| Soporte iPad (tablet) | Task 1 |
| Touch events iOS Safari | Task 12 |

✅ Todos los requisitos del spec tienen task asignada.

### Consistencia de tipos

- `sesionActiva`: `{ id: string, inicio: Timestamp-like }` — usado consistentemente en Tasks 5, 7
- `sesiones`: array de `{ id, inicio, fin, duracionMinutos }` — consistente en Tasks 3, 5, 6, 7
- `perfil`, `config`, `logros`: objetos planos sincronizados con Firestore — consistentes en Tasks 3, 6, 9, 11
- `calcularMinutosHoy()`, `calcularMinutosFecha()`, `calcularRachas()`, `calcularTotalMinutos()` definidos en Task 5, usados en Tasks 6, 9, 10
- `estrellasParaMinutos()`: definida en Task 5, usada en Tasks 6, 9
- `CATALOGO_LOGROS`: definido en Task 5, usado en Tasks 8, 9
- `mostrarModalLogro()`: definida en Task 8 — llamada desde Task 5 (`comprobarLogros`) y Task 6 (`init`). ⚠️ **Nota de orden:** `mostrarModalLogro` se llama desde `comprobarLogros` (Task 5) y desde `init` (Task 6), pero se define en Task 8. En el archivo final, las funciones de Task 8 deben ir ANTES de las llamadas en Task 5/6. Al implementar, asegurarse de que `mostrarModalLogro` está declarada antes de `comprobarLogros` e `init` en `app.js`.

**Corrección:** El plan está estructurado en tareas secuenciales pero el archivo `app.js` se construye de forma acumulativa. La función `mostrarModalLogro` (Task 8) se referencia en `comprobarLogros` (Task 5) e `init` (Task 6). JavaScript con `function declarations` tiene hoisting, pero estas son funciones normales definidas con `function` — dado que el archivo se añade en partes, el desarrollador debe verificar que en el archivo final `mostrarModalLogro` esté definida antes de ser llamada, o convertirla a `function declaration` (con `function mostrarModalLogro(logro) {...}`) para beneficiarse del hoisting. **Usar `function` declarations en lugar de `const` para todas las funciones en app.js.**
