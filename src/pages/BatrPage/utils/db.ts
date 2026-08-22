
const DB_NAME = 'PinkGlassDB';
const STORE_NAME = 'backgrounds';
const keyForSpace = (space: number) => `custom_video_space_${space}`;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const saveVideo = async (file: File, space: number): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(file, keyForSpace(space));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getVideo = async (space: number): Promise<Blob | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(keyForSpace(space));
    request.onsuccess = () => resolve(request.result as Blob || null);
    request.onerror = () => reject(request.error);
  });
};

export const deleteVideo = async (space: number): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(keyForSpace(space));
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
