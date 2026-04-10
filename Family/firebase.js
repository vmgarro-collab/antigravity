// Family/firebase.js
// Sustituir los valores de firebaseConfig con los del proyecto Firebase real.

const firebaseConfig = {
  apiKey:            "REEMPLAZAR",
  authDomain:        "REEMPLAZAR",
  projectId:         "REEMPLAZAR",
  storageBucket:     "REEMPLAZAR",
  messagingSenderId: "REEMPLAZAR",
  appId:             "REEMPLAZAR"
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
