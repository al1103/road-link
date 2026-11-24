/** Photos stay on the device in IndexedDB; localStorage only keeps a short key, so edits never blow the 5 MB quota. */
const DB_NAME = 'roadlink-photos', STORE = 'photos';
let opening: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (opening) return opening;
  opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch(error => { opening = null; throw error; });
  return opening;
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return open().then(db => new Promise<T | null>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  })).catch(() => null);
}

export async function putPhoto(key: string, dataUrl: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  await run('readwrite', store => store.put(dataUrl, key));
}

export function getPhoto(key: string): Promise<string | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return run<string>('readonly', store => store.get(key));
}

export async function deletePhoto(key: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  await run('readwrite', store => store.delete(key));
}
