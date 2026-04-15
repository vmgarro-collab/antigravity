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

const ONESIGNAL_APP_ID       = "YOUR_ONESIGNAL_APP_ID";
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

