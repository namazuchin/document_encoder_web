/**
 * IndexedDB service for storing video files
 * Allows persistent storage of large File objects beyond localStorage limits
 */

const DB_NAME = 'DocumentEncoderDB';
const DB_VERSION = 1;
const STORE_NAME = 'videoFiles';
const VIDEO_KEY = 'currentVideo';

interface StoredVideoFile {
    file: File;
    timestamp: number;
}

/**
 * Initialize IndexedDB database
 */
const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error('Failed to open IndexedDB'));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

/**
 * Save a video file to IndexedDB
 */
const saveVideoFile = async (file: File): Promise<void> => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const data: StoredVideoFile = {
            file,
            timestamp: Date.now()
        };

        const request = store.put(data, VIDEO_KEY);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to save video file to IndexedDB'));
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
};

/**
 * Get the stored video file from IndexedDB
 */
const getVideoFile = async (): Promise<File | null> => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(VIDEO_KEY);

        request.onsuccess = () => {
            const data = request.result as StoredVideoFile | undefined;
            resolve(data?.file || null);
        };

        request.onerror = () => {
            reject(new Error('Failed to get video file from IndexedDB'));
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
};

/**
 * Delete the stored video file from IndexedDB
 */
const deleteVideoFile = async (): Promise<void> => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(VIDEO_KEY);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to delete video file from IndexedDB'));
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
};

/**
 * Check if a video file exists in IndexedDB
 */
const hasVideoFile = async (): Promise<boolean> => {
    try {
        const file = await getVideoFile();
        return file !== null;
    } catch {
        return false;
    }
};

export const IndexedDBService = {
    initDB,
    saveVideoFile,
    getVideoFile,
    deleteVideoFile,
    hasVideoFile
};
