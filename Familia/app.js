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
