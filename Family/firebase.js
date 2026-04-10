// Family/firebase.js
// Sustituir los valores de firebaseConfig con los del proyecto Firebase real.

const firebaseConfig = {
  apiKey:            "AIzaSyBVwkTsiamEEz3AGbIeL_OuGn5eTcCaJQs",
  authDomain:        "family-planner-70a4d.firebaseapp.com",
  projectId:         "family-planner-70a4d",
  storageBucket:     "family-planner-70a4d.firebasestorage.app",
  messagingSenderId: "122830421513",
  appId:             "1:122830421513:web:3f925b45355e9af73582d8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ── Colección events ──

function addEvent(data) {
  // data: { title, start, end?, assignees[] }
  return db.collection('events').add({
    ...data,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function updateEvent(id, data) {
  return db.collection('events').doc(id).update(data);
}

function deleteEvent(id) {
  return db.collection('events').doc(id).delete();
}

function onEvents(callback) {
  // callback recibe array de { id, title, start, end, assignees }
  return db.collection('events').onSnapshot(snap => {
    const events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(events);
  });
}

// ── Colección pending ──

function addPending(data) {
  // data: { title, assignees[] }
  return db.collection('pending').add({
    ...data,
    done: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function updatePending(id, data) {
  return db.collection('pending').doc(id).update(data);
}

function deletePending(id) {
  return db.collection('pending').doc(id).delete();
}

function onPending(callback) {
  // callback recibe array de { id, title, assignees, done }
  return db.collection('pending')
    .orderBy('createdAt', 'asc')
    .onSnapshot(snap => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(items);
    });
}
