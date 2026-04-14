import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
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
  serverTimestamp,
  limit
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyB7B02fo7fbMro7bqmzc-7Rnq_M2mvGCBo",
  authDomain: "cosmo-corse.firebaseapp.com",
  projectId: "cosmo-corse",
  storageBucket: "cosmo-corse.firebasestorage.app",
  messagingSenderId: "942015789023",
  appId: "1:942015789023:web:e7519efb9247033cabb66a"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});

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
export async function abrirSesion(uid) {
  const ref = collection(db, 'usuarios', uid, 'sesiones');
  const docRef = await addDoc(ref, {
    inicio: serverTimestamp(),
    fin: null,
    duracionMinutos: 0
  });
  return docRef.id;
}

export async function cerrarSesionCorse(uid, sesionId, inicioTimestamp) {
  const ref = doc(db, 'usuarios', uid, 'sesiones', sesionId);
  const fin = Timestamp.now();
  const duracionMs = fin.toMillis() - inicioTimestamp.toMillis();
  const duracionMinutos = Math.round(duracionMs / 60000);
  await updateDoc(ref, { fin, duracionMinutos });
  return duracionMinutos;
}

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

export async function obtenerSesionAbierta(uid) {
  // Sin orderBy para evitar índice compuesto — solo puede haber una sesión abierta
  const ref = collection(db, 'usuarios', uid, 'sesiones');
  const q = query(ref, where('fin', '==', null));
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
  const ref = collection(db, 'usuarios', uid, 'logros');
  const q = query(ref, where('tipo', '==', tipo));
  const snap = await getDocs(q);
  if (!snap.empty) return false;
  await addDoc(ref, { tipo, fecha: serverTimestamp(), visto: false });
  return true;
}

export async function marcarLogroVisto(uid, logroId) {
  const ref = doc(db, 'usuarios', uid, 'logros', logroId);
  await updateDoc(ref, { visto: true });
}

// ── COMENTARIOS ──────────────────────────────────────────────────
export async function obtenerComentarios(uid) {
  const ref = collection(db, 'usuarios', uid, 'comentarios');
  const q = query(ref, orderBy('fecha', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function agregarComentario(uid, autor, texto) {
  const ref = collection(db, 'usuarios', uid, 'comentarios');
  await addDoc(ref, { autor, texto, fecha: serverTimestamp() });
}

// ── REGLAS FIRESTORE (aplicar en consola Firebase) ────────────────
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
*/
