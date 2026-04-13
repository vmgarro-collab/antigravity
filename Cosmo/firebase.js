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
  initializeFirestore,
  persistentLocalCache,
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
  apiKey: "AIzaSyB7B02fo7fbMro7bqmzc-7Rnq_M2mvGCBo",
  authDomain: "cosmo-corse.firebaseapp.com",
  projectId: "cosmo-corse",
  storageBucket: "cosmo-corse.firebasestorage.app",
  messagingSenderId: "942015789023",
  appId: "1:942015789023:web:e7519efb9247033cabb66a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});

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
export async function cerrarSesionCorse(uid, sesionId, inicioTimestamp) {
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
