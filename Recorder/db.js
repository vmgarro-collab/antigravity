const DB_NAME = 'NeuroScribeDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Database error:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                // We will store: id (timestamp), title, dateLabel, duration, audioBlob
                store.createIndex('date', 'id', { unique: false });
            }
        };
    });
}

function saveRecording(recordData) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("Database not initialized");
            return;
        }
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const request = store.add(recordData);
        
        request.onsuccess = () => {
            resolve(recordData.id);
        };
        
        request.onerror = (event) => {
            console.error("Error saving recording", event.target.error);
            reject(event.target.error);
        };
    });
}

function getAllRecordings() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("Database not initialized");
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => {
            // Sort by ID descending (newest first)
            const results = event.target.result.sort((a, b) => b.id - a.id);
            resolve(results);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

function getRecordingById(id) {
    return new Promise((resolve, reject) => {
         if(!db) {
             reject("DB not init");
             return;
         }
         const transaction = db.transaction([STORE_NAME], 'readonly');
         const store = transaction.objectStore(STORE_NAME);
         const request = store.get(id);

         request.onsuccess = (event) => {
             resolve(event.target.result);
         }
         request.onerror = (event) => {
             reject(event.target.error);
         }
    });
}

function updateRecording(recordData) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("Database not initialized");
            return;
        }
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(recordData);
        
        request.onsuccess = () => resolve(recordData.id);
        request.onerror = (e) => reject(e.target.error);
    });
}

function deleteRecording(id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("Database not initialized");
            return;
        }
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
}
