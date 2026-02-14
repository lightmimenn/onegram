const DB_NAME = 'onegram_db';
const DB_VERSION = 1;
let dbPromise;

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const users = db.createObjectStore('users', { keyPath: 'id' });
      users.createIndex('username', 'username', { unique: true });

      const communities = db.createObjectStore('communities', { keyPath: 'id' });
      communities.createIndex('username', 'username', { unique: true });

      db.createObjectStore('communityMembers', { keyPath: 'id' });
      db.createObjectStore('posts', { keyPath: 'id' });
      db.createObjectStore('comments', { keyPath: 'id' });
      db.createObjectStore('dialogs', { keyPath: 'id' });
      db.createObjectStore('messages', { keyPath: 'id' });
      db.createObjectStore('images', { keyPath: 'id' });
      db.createObjectStore('moderationSettings', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx(store, mode = 'readonly') {
  const db = await openDB();
  return db.transaction(store, mode).objectStore(store);
}

export async function put(store, value) {
  const os = await tx(store, 'readwrite');
  return promisify(os.put(value), os.transaction);
}

export async function get(store, id) {
  const os = await tx(store);
  return promisify(os.get(id), os.transaction);
}

export async function del(store, id) {
  const os = await tx(store, 'readwrite');
  return promisify(os.delete(id), os.transaction);
}

export async function getAll(store) {
  const os = await tx(store);
  return promisify(os.getAll(), os.transaction);
}

export async function getByIndex(store, index, key) {
  const os = await tx(store);
  return promisify(os.index(index).get(key), os.transaction);
}

function promisify(req, transaction) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    transaction.onerror = () => reject(transaction.error);
  });
}
