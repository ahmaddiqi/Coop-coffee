// IndexedDB utilities for offline data storage

const DB_NAME = 'KopiDigitalDB';
const DB_VERSION = 1;

interface DBStores {
  offlineSubmissions: 'id' | 'timestamp' | 'url';
  cachedData: 'key' | 'timestamp';
  userData: 'id' | 'lastModified';
}

interface OfflineSubmission {
  id: string;
  url: string;
  method: string;
  data: any;
  headers: Record<string, string>;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

interface CachedData {
  key: string;
  data: any;
  timestamp: string;
  expiry?: string;
}

interface UserData {
  id: string;
  type: 'petani' | 'lahan' | 'inventory' | 'transaksi' | 'aktivitas';
  data: any;
  lastModified: string;
  needsSync: boolean;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ IndexedDB failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('🔄 IndexedDB upgrade needed');

        // Offline submissions store
        if (!db.objectStoreNames.contains('offlineSubmissions')) {
          const submissionsStore = db.createObjectStore('offlineSubmissions', { keyPath: 'id' });
          submissionsStore.createIndex('timestamp', 'timestamp', { unique: false });
          submissionsStore.createIndex('url', 'url', { unique: false });
          submissionsStore.createIndex('status', 'status', { unique: false });
        }

        // Cached API data store
        if (!db.objectStoreNames.contains('cachedData')) {
          const cachedStore = db.createObjectStore('cachedData', { keyPath: 'key' });
          cachedStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // User data store (for offline editing)
        if (!db.objectStoreNames.contains('userData')) {
          const userStore = db.createObjectStore('userData', { keyPath: 'id' });
          userStore.createIndex('type', 'type', { unique: false });
          userStore.createIndex('lastModified', 'lastModified', { unique: false });
          userStore.createIndex('needsSync', 'needsSync', { unique: false });
        }
      };
    });
  }

  // Store offline form submission
  async storeOfflineSubmission(submission: OfflineSubmission): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineSubmissions'], 'readwrite');
      const store = transaction.objectStore('offlineSubmissions');
      
      const request = store.add(submission);
      
      request.onsuccess = () => {
        console.log('💾 Offline submission stored:', submission.id);
        resolve();
      };
      
      request.onerror = () => {
        console.error('❌ Failed to store offline submission:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all pending submissions
  async getPendingSubmissions(): Promise<OfflineSubmission[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineSubmissions'], 'readonly');
      const store = transaction.objectStore('offlineSubmissions');
      const index = store.index('status');
      
      const request = index.getAll('pending');
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Update submission status
  async updateSubmissionStatus(id: string, status: 'pending' | 'syncing' | 'failed', retryCount?: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineSubmissions'], 'readwrite');
      const store = transaction.objectStore('offlineSubmissions');
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const submission = getRequest.result;
        if (submission) {
          submission.status = status;
          if (retryCount !== undefined) {
            submission.retryCount = retryCount;
          }
          
          const updateRequest = store.put(submission);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Submission not found'));
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Remove successful submission
  async removeSubmission(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineSubmissions'], 'readwrite');
      const store = transaction.objectStore('offlineSubmissions');
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log('🗑️ Submission removed:', id);
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Cache API data
  async cacheData(key: string, data: any, expiryMinutes: number = 60): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date();
    const expiry = new Date(now.getTime() + expiryMinutes * 60 * 1000);

    const cachedData: CachedData = {
      key,
      data,
      timestamp: now.toISOString(),
      expiry: expiry.toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readwrite');
      const store = transaction.objectStore('cachedData');
      
      const request = store.put(cachedData);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached data
  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readonly');
      const store = transaction.objectStore('cachedData');
      
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if data has expired
          if (result.expiry && new Date() > new Date(result.expiry)) {
            // Data expired, remove it
            this.removeCachedData(key);
            resolve(null);
          } else {
            resolve(result.data);
          }
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Remove cached data
  async removeCachedData(key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readwrite');
      const store = transaction.objectStore('cachedData');
      
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Store user data for offline editing
  async storeUserData(userData: UserData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readwrite');
      const store = transaction.objectStore('userData');
      
      const request = store.put(userData);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get user data that needs sync
  async getUnsyncedUserData(): Promise<UserData[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readonly');
      const store = transaction.objectStore('userData');
      const index = store.index('needsSync');
      
      const request = index.getAll(true);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all data by type
  async getUserDataByType(type: UserData['type']): Promise<UserData[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readonly');
      const store = transaction.objectStore('userData');
      const index = store.index('type');
      
      const request = index.getAll(type);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Mark user data as synced
  async markUserDataSynced(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readwrite');
      const store = transaction.objectStore('userData');
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const userData = getRequest.result;
        if (userData) {
          userData.needsSync = false;
          userData.lastModified = new Date().toISOString();
          
          const updateRequest = store.put(userData);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('User data not found'));
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Clean up old data
  async cleanup(): Promise<void> {
    if (!this.db) return;

    // Remove old cached data (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readwrite');
      const store = transaction.objectStore('cachedData');
      const index = store.index('timestamp');
      
      const range = IDBKeyRange.upperBound(oneDayAgo.toISOString());
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log('🧹 Old cached data cleaned up');
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const dbManager = new IndexedDBManager();

// Initialize database
export async function initDB(): Promise<void> {
  try {
    await dbManager.init();
    
    // Clean up old data on init
    await dbManager.cleanup();
  } catch (error) {
    console.error('❌ Failed to initialize IndexedDB:', error);
    throw error;
  }
}

// Export types
export type { OfflineSubmission, CachedData, UserData };