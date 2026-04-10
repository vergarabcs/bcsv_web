export type StoredMidiRecord = {
  id: string;
  name: string;
  createdAt: string;
  sourceType: string;
  size: number;
  bytes: ArrayBuffer;
};

const DB_NAME = 'synthesia-midi-db';
const STORE_NAME = 'midis';
const DB_VERSION = 1;

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'midi';

const ensureIndexedDb = () => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new Error('IndexedDB is not available in this browser.');
  }
};

const openDatabase = (): Promise<IDBDatabase> => {
  ensureIndexedDb();

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open the MIDI library database.'));
  });
};

const withStore = async <T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T>
): Promise<T> => {
  const db = await openDatabase();

  try {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    return await handler(store);
  } finally {
    db.close();
  }
};

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });

export const buildStoredMidiId = ({
  name,
}: {
  sourceType?: string;
  name: string;
}) => `upload:${slugify(name)}:${Date.now()}`;

export const listStoredMidis = () =>
  withStore('readonly', async (store) => {
    const items = await requestToPromise(store.getAll() as IDBRequest<StoredMidiRecord[]>);
    return items.sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  });

export const getStoredMidi = (id: string) =>
  withStore('readonly', (store) => requestToPromise(store.get(id) as IDBRequest<StoredMidiRecord | undefined>));

export const saveStoredMidi = (record: StoredMidiRecord) =>
  withStore('readwrite', async (store) => {
    await requestToPromise(store.put(record));
  });

export const deleteStoredMidi = (id: string) =>
  withStore('readwrite', async (store) => {
    await requestToPromise(store.delete(id));
  });
