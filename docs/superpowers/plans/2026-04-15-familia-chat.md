# FamiliaChat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una app de mensajería familiar privada para 4 usuarios (Papá, Mamá, Sofía, Martín) con chat grupal en tiempo real y notificaciones push en iOS y PC.

**Architecture:** Vanilla JS sin build system. Firebase Firestore para mensajes en tiempo real vía `onSnapshot`. OneSignal para notificaciones push sin backend propio. PWA con `manifest.json` para instalación en iOS.

**Tech Stack:** Firebase JS SDK v9 (compat CDN), OneSignal Web SDK (CDN), Firestore, PWA (manifest + service worker)

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|----------------|
| `Familia/index.html` | Estructura HTML: pantalla login + pantalla chat |
| `Familia/styles.css` | Estilos: login, burbujas, layout mobile-first |
| `Familia/app.js` | Toda la lógica: login, Firestore, OneSignal, envío/recepción |
| `Familia/manifest.json` | PWA: nombre, iconos, colores, display standalone |
| `Familia/OneSignalSDKWorker.js` | Service worker de OneSignal (1 línea, requerido por su SDK) |

---

## Task 1: Setup externo — Firebase y OneSignal

**Files:**
- No se crean archivos en este task. Solo configuración en consolas externas.

### Firebase

- [ ] **Paso 1: Crear proyecto Firebase**
  1. Ir a [https://console.firebase.google.com](https://console.firebase.google.com)
  2. "Crear proyecto" → nombre: `familia-chat` → desactivar Google Analytics → Crear
  3. En el panel del proyecto: "Agregar app" → icono Web (`</>`) → nombre: `familia-chat` → Registrar app
  4. Copiar el objeto `firebaseConfig` que aparece — lo usarás en Task 3

- [ ] **Paso 2: Activar Firestore**
  1. En el panel izquierdo: Build → Firestore Database → "Crear base de datos"
  2. Modo: **Iniciar en modo de prueba** (permite lecturas/escrituras sin auth durante 30 días — suficiente para la primera versión)
  3. Ubicación: `eur3 (europe-west)` → Habilitar

- [ ] **Paso 3: Configurar reglas de Firestore**
  En Firestore → pestaña "Reglas", reemplazar con:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
  ```
  Publicar. (Abierto al mundo — aceptable para app familiar privada sin datos sensibles.)

### OneSignal

- [ ] **Paso 4: Crear app en OneSignal**
  1. Ir a [https://app.onesignal.com](https://app.onesignal.com) → crear cuenta gratuita
  2. "New App/Website" → nombre: `FamiliaChat`
  3. Plataforma: **Web**
  4. Site URL: la URL donde servirás la app (p.ej. `http://localhost:8000/Familia` para pruebas, o tu dominio final)
  5. Activar **Safari Web Push** — requiere subir un icono (usa cualquier imagen 256×256)
  6. Completar el wizard → **No** descargar el service worker que ofrece (lo crearemos nosotros)

- [ ] **Paso 5: Obtener credenciales de OneSignal**
  En OneSignal → Settings → Keys & IDs:
  - Copiar **App ID** (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
  - Copiar **REST API Key** (empieza por `os_v2_...`)
  Guárdalos — se usarán en Task 3.

---

## Task 2: Scaffold — index.html y manifest.json

**Files:**
- Crear: `Familia/index.html`
- Crear: `Familia/manifest.json`
- Crear: `Familia/OneSignalSDKWorker.js`

- [ ] **Paso 1: Crear `Familia/manifest.json`**

  ```json
  {
    "name": "FamiliaChat",
    "short_name": "Familia",
    "start_url": "/Familia/index.html",
    "display": "standalone",
    "background_color": "#1a1a2e",
    "theme_color": "#1a1a2e",
    "icons": [
      {
        "src": "https://via.placeholder.com/192x192/1a1a2e/ffffff?text=F",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "https://via.placeholder.com/512x512/1a1a2e/ffffff?text=F",
        "sizes": "512x512",
        "type": "image/png"
      }
    ]
  }
  ```

- [ ] **Paso 2: Crear `Familia/OneSignalSDKWorker.js`**

  ```js
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
  ```

- [ ] **Paso 3: Crear `Familia/index.html`**

  ```html
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="FamiliaChat">
    <title>FamiliaChat</title>
    <link rel="manifest" href="manifest.json">
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>

    <!-- PANTALLA LOGIN -->
    <div id="screen-login" class="screen">
      <div class="login-container">
        <h1 class="login-title">👨‍👩‍👧‍👦 FamiliaChat</h1>
        <p class="login-subtitle">¿Quién eres?</p>
        <div class="user-grid">
          <button class="user-btn" data-user="papa">
            <span class="user-avatar">👨</span>
            <span class="user-name">Papá</span>
          </button>
          <button class="user-btn" data-user="mama">
            <span class="user-avatar">👩</span>
            <span class="user-name">Mamá</span>
          </button>
          <button class="user-btn" data-user="sofia">
            <span class="user-avatar">👧</span>
            <span class="user-name">Sofía</span>
          </button>
          <button class="user-btn" data-user="martin">
            <span class="user-avatar">👦</span>
            <span class="user-name">Martín</span>
          </button>
        </div>
      </div>
    </div>

    <!-- PANTALLA CHAT -->
    <div id="screen-chat" class="screen" style="display:none">
      <div class="chat-header">
        <span id="chat-header-title">👨‍👩‍👧‍👦 Familia</span>
        <button id="btn-change-user" class="btn-change">Cambiar</button>
      </div>
      <div id="messages-container" class="messages-container"></div>
      <div class="chat-input-bar">
        <input id="message-input" class="message-input" type="text" placeholder="Escribe un mensaje..." autocomplete="off">
        <button id="btn-send" class="btn-send">Enviar</button>
      </div>
    </div>

    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <!-- OneSignal SDK -->
    <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
    <!-- App -->
    <script src="app.js"></script>
  </body>
  </html>
  ```

- [ ] **Paso 4: Verificar estructura**

  ```
  Familia/
    index.html          ✓
    manifest.json       ✓
    OneSignalSDKWorker.js ✓
  ```

- [ ] **Paso 5: Commit**

  ```bash
  git add Familia/
  git commit -m "feat(familia): scaffold inicial — HTML, manifest, OneSignal SW"
  ```

---

## Task 3: Estilos — styles.css

**Files:**
- Crear: `Familia/styles.css`

- [ ] **Paso 1: Crear `Familia/styles.css`**

  ```css
  /* ===== RESET & BASE ===== */
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #1a1a2e;
    color: #e8e8f0;
    height: 100dvh;
    overflow: hidden;
  }

  .screen { height: 100dvh; display: flex; flex-direction: column; }

  /* ===== LOGIN ===== */
  .login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 2rem;
    padding: 2rem;
  }

  .login-title {
    font-size: 2rem;
    font-weight: 700;
    color: #e8e8f0;
  }

  .login-subtitle {
    font-size: 1.1rem;
    color: #a0a0b8;
  }

  .user-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    width: 100%;
    max-width: 320px;
  }

  .user-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem 1rem;
    background: #252540;
    border: 2px solid #353560;
    border-radius: 16px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, transform 0.1s;
    color: #e8e8f0;
  }

  .user-btn:active { transform: scale(0.96); }
  .user-btn:hover { background: #2e2e55; border-color: #5555a0; }

  .user-avatar { font-size: 2.5rem; }
  .user-name { font-size: 1rem; font-weight: 600; }

  /* ===== CHAT HEADER ===== */
  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.9rem 1.2rem;
    background: #252540;
    border-bottom: 1px solid #353560;
    flex-shrink: 0;
  }

  #chat-header-title { font-weight: 600; font-size: 1rem; }

  .btn-change {
    background: none;
    border: 1px solid #555580;
    border-radius: 8px;
    color: #a0a0c0;
    font-size: 0.8rem;
    padding: 0.3rem 0.7rem;
    cursor: pointer;
  }

  /* ===== MESSAGES ===== */
  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    scroll-behavior: smooth;
  }

  .message-row {
    display: flex;
    flex-direction: column;
    max-width: 78%;
  }

  .message-row.own { align-self: flex-end; align-items: flex-end; }
  .message-row.other { align-self: flex-start; align-items: flex-start; }

  .message-meta {
    font-size: 0.72rem;
    color: #8080a0;
    margin-bottom: 0.2rem;
    padding: 0 0.4rem;
  }

  .message-bubble {
    padding: 0.6rem 0.9rem;
    border-radius: 18px;
    font-size: 0.95rem;
    line-height: 1.4;
    word-break: break-word;
  }

  /* Colores por usuario */
  .bubble-papa   { background: #2a4a7a; color: #d0e4ff; border-bottom-right-radius: 4px; }
  .bubble-mama   { background: #2a5a3a; color: #c8f0d0; border-bottom-right-radius: 4px; }
  .bubble-sofia  { background: #6a3020; color: #ffd0b8; border-bottom-right-radius: 4px; }
  .bubble-martin { background: #4a2a6a; color: #e0c8ff; border-bottom-right-radius: 4px; }

  .message-row.other .message-bubble { border-bottom-left-radius: 4px; border-bottom-right-radius: 18px; }

  /* ===== INPUT BAR ===== */
  .chat-input-bar {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #252540;
    border-top: 1px solid #353560;
    flex-shrink: 0;
  }

  .message-input {
    flex: 1;
    background: #1a1a2e;
    border: 1px solid #353560;
    border-radius: 22px;
    padding: 0.65rem 1rem;
    color: #e8e8f0;
    font-size: 0.95rem;
    outline: none;
  }

  .message-input:focus { border-color: #5555a0; }
  .message-input::placeholder { color: #606080; }

  .btn-send {
    background: #4a4a90;
    border: none;
    border-radius: 22px;
    padding: 0.65rem 1.2rem;
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    flex-shrink: 0;
  }

  .btn-send:hover { background: #5555a8; }
  .btn-send:active { background: #3a3a78; }
  ```

- [ ] **Paso 2: Verificar visualmente**

  Servir la app (`python -m http.server 8000` desde la raíz del proyecto) y abrir `http://localhost:8000/Familia/index.html`. Deberías ver la pantalla de login con los 4 botones de usuario sobre fondo oscuro.

- [ ] **Paso 3: Commit**

  ```bash
  git add Familia/styles.css
  git commit -m "feat(familia): estilos — login, chat, burbujas por usuario"
  ```

---

## Task 4: app.js — Login y configuración

**Files:**
- Crear: `Familia/app.js`

- [ ] **Paso 1: Crear `Familia/app.js` con config y login**

  Sustituir `YOUR_*` con los valores reales copiados en Task 1.

  ```js
  // ============================================================
  // CONFIGURACIÓN — reemplazar con valores reales de Firebase y OneSignal
  // ============================================================
  const FIREBASE_CONFIG = {
    apiKey:            "YOUR_API_KEY",
    authDomain:        "YOUR_PROJECT.firebaseapp.com",
    projectId:         "YOUR_PROJECT_ID",
    storageBucket:     "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:             "YOUR_APP_ID"
  };

  const ONESIGNAL_APP_ID      = "YOUR_ONESIGNAL_APP_ID";
  const ONESIGNAL_REST_API_KEY = "YOUR_ONESIGNAL_REST_API_KEY";

  // ============================================================
  // USUARIOS
  // ============================================================
  const USERS = {
    papa:   { name: "Papá",   color: "#4a90d9", bubble: "bubble-papa",   avatar: "👨" },
    mama:   { name: "Mamá",   color: "#5cb85c", bubble: "bubble-mama",   avatar: "👩" },
    sofia:  { name: "Sofía",  color: "#e8834a", bubble: "bubble-sofia",  avatar: "👧" },
    martin: { name: "Martín", color: "#9b59b6", bubble: "bubble-martin", avatar: "👦" }
  };

  // ============================================================
  // INIT FIREBASE
  // ============================================================
  firebase.initializeApp(FIREBASE_CONFIG);
  const db = firebase.firestore();

  // ============================================================
  // ESTADO
  // ============================================================
  let currentUser = localStorage.getItem("familia_user"); // "papa" | "mama" | "sofia" | "martin" | null
  let unsubscribeMessages = null;

  // ============================================================
  // ARRANQUE
  // ============================================================
  document.addEventListener("DOMContentLoaded", () => {
    if (currentUser && USERS[currentUser]) {
      showChat();
    } else {
      showLogin();
    }
  });

  // ============================================================
  // LOGIN
  // ============================================================
  function showLogin() {
    document.getElementById("screen-login").style.display = "flex";
    document.getElementById("screen-chat").style.display  = "none";
  }

  function showChat() {
    document.getElementById("screen-login").style.display = "none";
    document.getElementById("screen-chat").style.display  = "flex";
    document.getElementById("chat-header-title").textContent =
      `${USERS[currentUser].avatar} ${USERS[currentUser].name}`;
    initOneSignal();
    subscribeToMessages();
  }

  // Botones de usuario en login
  document.querySelectorAll(".user-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const userId = btn.dataset.user;
      localStorage.setItem("familia_user", userId);
      currentUser = userId;
      showChat();
    });
  });

  // Botón cambiar usuario
  document.getElementById("btn-change-user").addEventListener("click", () => {
    if (unsubscribeMessages) { unsubscribeMessages(); unsubscribeMessages = null; }
    localStorage.removeItem("familia_user");
    currentUser = null;
    document.getElementById("messages-container").innerHTML = "";
    showLogin();
  });
  ```

- [ ] **Paso 2: Verificar login**

  Abrir `http://localhost:8000/Familia/index.html`. Hacer clic en "Papá" — debe aparecer la pantalla de chat con "👨 Papá" en el header. Recargar — debe ir directo al chat. Pulsar "Cambiar" — debe volver al login.

- [ ] **Paso 3: Commit**

  ```bash
  git add Familia/app.js
  git commit -m "feat(familia): login — selección de usuario con persistencia en localStorage"
  ```

---

## Task 5: app.js — Mensajes en tiempo real con Firestore

**Files:**
- Modificar: `Familia/app.js`

- [ ] **Paso 1: Añadir función `subscribeToMessages` al final de `app.js`**

  ```js
  // ============================================================
  // MENSAJES — Firestore real-time
  // ============================================================
  function subscribeToMessages() {
    const container = document.getElementById("messages-container");

    unsubscribeMessages = db.collection("messages")
      .orderBy("timestamp", "asc")
      .limitToLast(100)
      .onSnapshot(snapshot => {
        container.innerHTML = "";
        snapshot.forEach(doc => {
          const msg = doc.data();
          container.appendChild(buildMessageEl(msg));
        });
        container.scrollTop = container.scrollHeight;
      });
  }

  function buildMessageEl(msg) {
    const user = USERS[msg.sender];
    const isOwn = msg.sender === currentUser;
    const time  = msg.timestamp
      ? new Date(msg.timestamp.toMillis()).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
      : "";

    const row = document.createElement("div");
    row.className = `message-row ${isOwn ? "own" : "other"}`;

    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.textContent = isOwn ? time : `${user ? user.avatar + " " + user.name : msg.sender} · ${time}`;

    const bubble = document.createElement("div");
    bubble.className = `message-bubble ${user ? user.bubble : ""}`;
    bubble.textContent = msg.text;

    row.appendChild(meta);
    row.appendChild(bubble);
    return row;
  }
  ```

- [ ] **Paso 2: Añadir función `sendMessage` y listeners de input al final de `app.js`**

  ```js
  // ============================================================
  // ENVÍO DE MENSAJES
  // ============================================================
  async function sendMessage() {
    const input = document.getElementById("message-input");
    const text = input.value.trim();
    if (!text) return;

    input.value = "";

    await db.collection("messages").add({
      sender:    currentUser,
      text:      text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    sendNotification(currentUser, text); // no await — no bloqueamos la UI
  }

  document.getElementById("btn-send").addEventListener("click", sendMessage);

  document.getElementById("message-input").addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  ```

- [ ] **Paso 3: Verificar mensajería**

  1. Abrir `http://localhost:8000/Familia/index.html` en dos pestañas del navegador
  2. En una pestaña entrar como "Papá", en la otra como "Martín"
  3. Enviar un mensaje desde "Papá" — debe aparecer en ambas pestañas en tiempo real
  4. Los mensajes propios aparecen a la derecha, los del otro a la izquierda

- [ ] **Paso 4: Commit**

  ```bash
  git add Familia/app.js
  git commit -m "feat(familia): mensajes en tiempo real con Firestore"
  ```

---

## Task 6: app.js — Notificaciones push con OneSignal

**Files:**
- Modificar: `Familia/app.js`

- [ ] **Paso 1: Añadir función `initOneSignal` al final de `app.js`**

  Esta función inicializa OneSignal, pide permiso de notificaciones y guarda el player ID del dispositivo en Firestore para poder enviarte notificaciones.

  ```js
  // ============================================================
  // ONESIGNAL — notificaciones push
  // ============================================================
  function initOneSignal() {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        serviceWorkerPath: "OneSignalSDKWorker.js",
        notifyButton: { enable: false }
      });

      // Pedir permiso si no se ha pedido antes
      const permission = await OneSignal.Notifications.permission;
      if (!permission) {
        await OneSignal.Notifications.requestPermission();
      }

      // Guardar player ID en Firestore
      const playerId = await OneSignal.User.PushSubscription.id;
      if (playerId) {
        await db.collection("tokens").doc(currentUser).set({
          playerId:  playerId,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    });
  }
  ```

- [ ] **Paso 2: Añadir función `sendNotification` al final de `app.js`**

  Esta función envía una notificación a los otros 3 miembros de la familia.

  > **Nota de seguridad:** La REST API key de OneSignal queda expuesta en el cliente. Para una app familiar privada esto es aceptable — el peor escenario es que alguien envíe una notificación a vuestra familia.

  ```js
  async function sendNotification(senderKey, text) {
    try {
      // Obtener los player IDs de los otros usuarios desde Firestore
      const tokensSnap = await db.collection("tokens").get();
      const playerIds = [];
      tokensSnap.forEach(doc => {
        if (doc.id !== senderKey && doc.data().playerId) {
          playerIds.push(doc.data().playerId);
        }
      });

      if (playerIds.length === 0) return; // Nadie más ha instalado la app aún

      const senderName = USERS[senderKey].name;
      const preview    = text.length > 60 ? text.slice(0, 60) + "…" : text;

      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id:            ONESIGNAL_APP_ID,
          include_player_ids: playerIds,
          headings:          { en: "FamiliaChat" },
          contents:          { en: `${senderName}: ${preview}` }
        })
      });
    } catch (err) {
      console.warn("No se pudo enviar notificación:", err);
      // Fallo silencioso — el mensaje ya se guardó en Firestore
    }
  }
  ```

- [ ] **Paso 3: Verificar notificaciones**

  1. Servir la app desde un servidor HTTPS o usar `localhost` (OneSignal requiere HTTPS en producción, pero acepta localhost para pruebas)
  2. Abrir la app en Chrome en el PC → entrar como "Papá" → aceptar el permiso de notificaciones cuando aparezca el prompt
  3. Abrir la app en otra pestaña → entrar como "Mamá"
  4. Minimizar la primera pestaña (o poner la app en segundo plano)
  5. Desde "Mamá" enviar un mensaje — "Papá" debe recibir una notificación del sistema

  Para iOS: la app debe estar **instalada** en la pantalla de inicio (Safari → Compartir → Añadir a pantalla de inicio). Las notificaciones no funcionan desde Safari directamente.

- [ ] **Paso 4: Commit**

  ```bash
  git add Familia/app.js
  git commit -m "feat(familia): notificaciones push via OneSignal"
  ```

---

## Task 7: Deploy y setup para la familia

**Files:**
- No se crean archivos nuevos.

- [ ] **Paso 1: Elegir dónde hospedar la app**

  Opciones ordenadas por facilidad:

  | Opción | Dificultad | HTTPS incluido | Coste |
  |--------|-----------|----------------|-------|
  | **GitHub Pages** | Fácil | Sí | Gratis |
  | **Firebase Hosting** | Fácil | Sí | Gratis |
  | **Netlify** | Fácil | Sí | Gratis |
  | Servidor propio | Media | Manual | Variable |

  Con GitHub Pages: activar en Settings → Pages → rama `main` → carpeta `/` o `/docs`.

  Con Firebase Hosting:
  ```bash
  npm install -g firebase-tools
  firebase login
  firebase init hosting   # public dir: . (raíz del repo)
  firebase deploy
  ```

- [ ] **Paso 2: Actualizar la URL en OneSignal**

  En OneSignal → Settings → Configuration → actualizar "Site URL" con la URL de producción (p.ej. `https://tuusuario.github.io/AntiGravity/Familia`).

- [ ] **Paso 3: Actualizar `start_url` en `manifest.json`**

  Cambiar `start_url` por la URL absoluta de producción:
  ```json
  "start_url": "https://tuusuario.github.io/AntiGravity/Familia/index.html"
  ```

- [ ] **Paso 4: Instrucciones para cada familiar**

  Enviarles este mensaje (por WhatsApp u otro canal):

  > "Abrir esta URL en Safari: [URL de la app]
  > Pulsar el botón compartir (⬆️) → 'Añadir a pantalla de inicio' → Añadir
  > Abrir la app desde la pantalla de inicio → seleccionar tu nombre → aceptar las notificaciones"

- [ ] **Paso 5: Commit final**

  ```bash
  git add Familia/manifest.json
  git commit -m "feat(familia): actualizar manifest para producción"
  ```

---

## Resumen de variables a configurar

Antes de que la app funcione, editar `Familia/app.js` y reemplazar:

| Variable | Dónde obtenerla |
|----------|----------------|
| `FIREBASE_CONFIG.apiKey` | Firebase Console → Project Settings → Web app |
| `FIREBASE_CONFIG.authDomain` | Ídem |
| `FIREBASE_CONFIG.projectId` | Ídem |
| `FIREBASE_CONFIG.storageBucket` | Ídem |
| `FIREBASE_CONFIG.messagingSenderId` | Ídem |
| `FIREBASE_CONFIG.appId` | Ídem |
| `ONESIGNAL_APP_ID` | OneSignal → Settings → Keys & IDs |
| `ONESIGNAL_REST_API_KEY` | OneSignal → Settings → Keys & IDs |
