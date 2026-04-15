// ============================================================
// CONFIGURACIÓN — reemplazar con valores reales de Firebase y OneSignal
// ============================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBgLKcaRqvgSUL1JHBLUJOvq1XGciKlsiw",
  authDomain: "familia-chat-f7a39.firebaseapp.com",
  projectId: "familia-chat-f7a39",
  storageBucket: "familia-chat-f7a39.firebasestorage.app",
  messagingSenderId: "1060799290671",
  appId: "1:1060799290671:web:957347df95406825d195da"
};

const ONESIGNAL_APP_ID = "YOUR_ONESIGNAL_APP_ID";
const ONESIGNAL_REST_API_KEY = "YOUR_ONESIGNAL_REST_API_KEY";

// ============================================================
// USUARIOS
// ============================================================
const USERS = {
  papa: { name: "Papá", color: "#4a90d9", bubble: "bubble-papa", avatar: "👨" },
  mama: { name: "Mamá", color: "#5cb85c", bubble: "bubble-mama", avatar: "👩" },
  sofia: { name: "Sofía", color: "#e8834a", bubble: "bubble-sofia", avatar: "👧" },
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
let oneSignalInitialized = false;

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
  document.getElementById("screen-chat").style.display = "none";
}

function showChat() {
  document.getElementById("screen-login").style.display = "none";
  document.getElementById("screen-chat").style.display = "flex";
  document.getElementById("chat-header-title").textContent =
    `${USERS[currentUser].avatar} ${USERS[currentUser].name}`;
  initOneSignal();
  subscribeToMessages();
}

// Botones de usuario en login — registrados en DOMContentLoaded para no depender del orden del script
document.addEventListener("DOMContentLoaded", () => {
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

  // Envío de mensajes
  document.getElementById("btn-send").addEventListener("click", sendMessage);
  document.getElementById("message-input").addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});

// ============================================================
// MENSAJES — Firestore real-time
// ============================================================
function subscribeToMessages() {
  if (unsubscribeMessages) return; // ya suscrito
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
  const time = msg.timestamp
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

// ============================================================
// ENVÍO DE MENSAJES
// ============================================================
async function sendMessage() {
  const input = document.getElementById("message-input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";

  await db.collection("messages").add({
    sender: currentUser,
    text: text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  sendNotification(currentUser, text); // no await — no bloqueamos la UI
}


// ============================================================
// ONESIGNAL — notificaciones push
// ============================================================
function initOneSignal() {
  if (oneSignalInitialized) return;
  oneSignalInitialized = true;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      serviceWorkerPath: "/OneSignalSDKWorker.js",
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
        playerId: playerId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  });
}

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
    const preview = text.length > 60 ? text.slice(0, 60) + "…" : text;

    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { en: "FamiliaChat" },
        contents: { en: `${senderName}: ${preview}` }
      })
    });
  } catch (err) {
    console.warn("No se pudo enviar notificación:", err);
    // Fallo silencioso — el mensaje ya se guardó en Firestore
  }
}
