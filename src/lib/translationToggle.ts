// In-memory cache for faster access
const memoryCache = new Map<number, Promise<string | null>>();

// Initialize IndexedDB for persistent caching
const DB_NAME = 'reverseXDB';
const STORE_NAME = 'gameTranslations';

let dbInstance: IDBDatabase | null = null;

const initDB = async (): Promise<IDBDatabase> => {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'gameId' });
      }
    };
  });
};

const getCachedFromDB = async (gameId: number): Promise<string | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(gameId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.description : null);
      };
    });
  } catch (error) {
    console.warn('[Translation] IndexedDB read error:', error);
    return null;
  }
};

const saveToDB = async (gameId: number, description: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ gameId, description, timestamp: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.warn('[Translation] IndexedDB write error:', error);
  }
};

// Steam API with timeout protection
const fetchSteamDescription = async (steamAppId: string): Promise<string | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    const steamResponse = await fetch(
      `https://steamcommunity.com/api/appdetails?appids=${steamAppId}&l=russian`,
      { signal: controller.signal }
    );

    if (!steamResponse.ok) return null;

    const steamData = await steamResponse.json();

    if (steamData[steamAppId] && steamData[steamAppId].data) {
      const gameData = steamData[steamAppId].data;
      return (
        gameData.detailed_description ||
        gameData.about_the_game ||
        gameData.short_description ||
        null
      );
    }

    return null;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('[Translation] Steam API request timeout');
    } else {
      console.error('[Translation] Steam API error:', error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Get Steam app ID from RAWG cache or API
const steamAppIdCache = new Map<number, Promise<string | null>>();

const getSteamAppId = async (gameId: number): Promise<string | null> => {
  if (steamAppIdCache.has(gameId)) {
    return steamAppIdCache.get(gameId)!;
  }

  const promise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const rawgResponse = await fetch(
        `https://api.rawg.io/api/games/${gameId}?key=c33c648c0d8f45c494af8da025d7b862`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!rawgResponse.ok) return null;

      const rawgData = await rawgResponse.json();

      if (rawgData.stores) {
        for (const store of rawgData.stores) {
          if (store.store.id === 1 && store.url) {
            const match = store.url.match(/\/app\/(\d+)/);
            if (match) return match[1];
          }
        }
      }

      return null;
    } catch (error) {
      console.warn('[Translation] Failed to get Steam app ID:', error);
      return null;
    }
  })();

  steamAppIdCache.set(gameId, promise);
  return promise;
};

export const getGameDescriptionFromSteam = async (gameId: number): Promise<string | null> => {
  // Check memory cache first (fastest)
  if (memoryCache.has(gameId)) {
    return memoryCache.get(gameId)!;
  }

  // Create promise and cache it immediately to prevent duplicate requests
  const promise = (async () => {
    try {
      // Check IndexedDB (fast persistent cache)
      const cached = await getCachedFromDB(gameId);
      if (cached) {
        console.log(`[Translation] Using IndexedDB cache for game ${gameId}`);
        return cached;
      }

      // Get Steam app ID
      const steamAppId = await getSteamAppId(gameId);
      if (!steamAppId) {
        console.log(`[Translation] No Steam app ID found for game ${gameId}`);
        return null;
      }

      // Fetch from Steam
      console.log(`[Translation] Fetching Steam description for app ${steamAppId}`);
      const description = await fetchSteamDescription(steamAppId);

      if (description) {
        // Save to IndexedDB for future use
        await saveToDB(gameId, description);
        console.log(`[Translation] Successfully fetched and cached Russian description for game ${gameId}`);
        return description;
      }

      return null;
    } catch (error) {
      console.error('[Translation] Error:', error);
      return null;
    }
  })();

  memoryCache.set(gameId, promise);
  return promise;
};

export const preloadTranslations = async (gameIds: number[]): Promise<void> => {
  // Batch preload translations in the background
  console.log(`[Translation] Preloading ${gameIds.length} translations`);
  
  // Limit concurrent requests
  const batchSize = 3;
  for (let i = 0; i < gameIds.length; i += batchSize) {
    const batch = gameIds.slice(i, i + batchSize);
    await Promise.all(batch.map(id => getGameDescriptionFromSteam(id)));
    
    // Add small delay between batches to avoid rate limiting
    if (i + batchSize < gameIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

export const clearTranslationCache = () => {
  memoryCache.clear();
  console.log('[Translation] Memory cache cleared');
};
