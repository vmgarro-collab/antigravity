const REC_DB_NAME = 'AIgorRecordingsDB';
const REC_DB_VERSION = 1;
const REC_STORE = 'recordings';

let recDb;

function recDbInit() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(REC_DB_NAME, REC_DB_VERSION);
    req.onerror = e => reject(e.target.error);
    req.onsuccess = e => { recDb = e.target.result; resolve(recDb); };
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(REC_STORE)) {
        db.createObjectStore(REC_STORE, { keyPath: 'id' });
      }
    };
  });
}

function recDbSave(data) {
  return new Promise((resolve, reject) => {
    const tx = recDb.transaction([REC_STORE], 'readwrite');
    tx.objectStore(REC_STORE).put(data).onsuccess = () => resolve(data.id);
    tx.onerror = e => reject(e.target.error);
  });
}

function recDbGetAll() {
  return new Promise((resolve, reject) => {
    const tx = recDb.transaction([REC_STORE], 'readonly');
    const req = tx.objectStore(REC_STORE).getAll();
    req.onsuccess = e => resolve(e.target.result.sort((a, b) => b.id - a.id));
    req.onerror = e => reject(e.target.error);
  });
}

function recDbDelete(id) {
  return new Promise((resolve, reject) => {
    const tx = recDb.transaction([REC_STORE], 'readwrite');
    tx.objectStore(REC_STORE).delete(id).onsuccess = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });
}
