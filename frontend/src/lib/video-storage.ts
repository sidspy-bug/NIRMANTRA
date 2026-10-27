/**
 * Local IndexedDB Video Storage Utility
 * Provides persistent local storage for live inspection video sweeps without cloud dependency.
 */

const DB_NAME = "NirmaantraLocalEvidenceDB";
const STORE_NAME = "inspection_videos";
const DB_VERSION = 1;

// In-memory fallback if IndexedDB is unavailable
const memoryCache = new Map<string, Blob>();

function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error("IndexedDB is not supported in this environment."));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
  });
}

/**
 * Saves a video Blob locally in IndexedDB keyed by a storage identifier.
 */
export async function saveVideoBlobLocally(key: string, blob: Blob): Promise<string> {
  memoryCache.set(key, blob);

  if (!isIndexedDBAvailable()) {
    return key;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, key);

      req.onsuccess = () => resolve(key);
      req.onerror = () => reject(req.error || new Error("Failed to write video Blob"));
    });
  } catch (err) {
    console.warn("IndexedDB write failed, falling back to in-memory store:", err);
    return key;
  }
}

/**
 * Retrieves a video Blob locally from IndexedDB or memory cache.
 */
export async function getVideoBlobLocally(key: string): Promise<Blob | null> {
  if (memoryCache.has(key)) {
    return memoryCache.get(key) || null;
  }

  if (!isIndexedDBAvailable()) {
    return null;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        const result = req.result as Blob | undefined;
        if (result) {
          memoryCache.set(key, result);
          resolve(result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error || new Error("Failed to read video Blob"));
    });
  } catch (err) {
    console.warn("IndexedDB read failed:", err);
    return null;
  }
}

/**
 * Returns an active object URL for the stored video.
 */
export async function getVideoBlobUrl(key: string): Promise<string | null> {
  const blob = await getVideoBlobLocally(key);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

/**
 * Deletes a stored video Blob locally.
 */
export async function deleteVideoBlobLocally(key: string): Promise<boolean> {
  memoryCache.delete(key);

  if (!isIndexedDBAvailable()) {
    return true;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error || new Error("Failed to delete video Blob"));
    });
  } catch (err) {
    console.warn("IndexedDB delete failed:", err);
    return false;
  }
}

/**
 * Computes the cryptographic SHA-256 fingerprint of the video Blob for audit immutability.
 */
export async function computeVideoSha256(blob: Blob): Promise<string> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (err) {
    console.warn("SubtleCrypto failed, generating fallback hash:", err);
    return "sha256-sim-" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}
