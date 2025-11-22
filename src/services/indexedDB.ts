/**
 * IndexedDB service for storing video files
 * Allows persistent storage of large File objects beyond localStorage limits
 */

const DB_NAME = 'DocumentEncoderDB';
const DB_VERSION = 2; // Increment version for schema change if needed, though we are just changing value type
const STORE_NAME = 'videoFiles';
const VIDEO_KEY = 'currentVideo';

interface StoredVideoFiles {
    files: File[];
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
 * Save video files to IndexedDB
 */
const saveVideoFiles = async (files: File[]): Promise<void> => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const data: StoredVideoFiles = {
            files,
            timestamp: Date.now()
        };

        const request = store.put(data, VIDEO_KEY);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to save video files to IndexedDB'));
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
};

/**
 * Get the stored video files from IndexedDB
 */
const getVideoFiles = async (): Promise<File[]> => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(VIDEO_KEY);

        request.onsuccess = () => {
            const data = request.result as StoredVideoFiles | undefined;
            // Handle both new array format and potential legacy single file format if DB wasn't cleared
            if (data) {
                if (Array.isArray(data.files)) {
                    resolve(data.files);
                } else if ((data as any).file) {
                    // Legacy support: wrap single file in array
                    resolve([(data as any).file]);
                } else {
                    resolve([]);
                }
            } else {
                resolve([]);
            }
        };

        request.onerror = () => {
            reject(new Error('Failed to get video files from IndexedDB'));
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
};

/**
 * Delete the stored video files from IndexedDB
 */
const deleteVideoFiles = async (): Promise<void> => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(VIDEO_KEY);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to delete video files from IndexedDB'));
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
};

/**
 * Check if video files exist in IndexedDB
 */
const hasVideoFiles = async (): Promise<boolean> => {
    try {
        const files = await getVideoFiles();
        return files.length > 0;
    } catch {
        return false;
    }
};

export const IndexedDBService = {
    initDB,
    saveVideoFiles,
    getVideoFiles,
    deleteVideoFiles,
    hasVideoFiles
};
