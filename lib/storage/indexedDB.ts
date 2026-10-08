// IndexedDB storage layer for SHOPY PWA
// Provides structured offline storage with user isolation

export interface StorageItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
  userId?: string;
  ttl?: number; // Time to live in milliseconds
}

export interface StorageMetadata {
  version: number;
  lastSynced?: number;
  userId?: string;
}

export interface UserScopedKey {
  baseKey: string;
  userId?: string;
}

const DB_NAME = 'shopy-offline-db';
const DB_VERSION = 1;

// Store names for different data types
const STORES = {
  PUBLIC_DATA: 'public_data',       // Public catalog, categories, homepage
  USER_DATA: 'user_data',           // User-specific data (cart, orders, profile)
  APP_STATE: 'app_state',           // Application state (auth, UI, preferences)
  CACHE_METADATA: 'cache_metadata', // Cache metadata and timestamps
} as const;

// The actual IndexedDB object-store names (the values above), which is what
// `IDBDatabase.transaction()` and `.objectStore()` expect.
type StoreName = (typeof STORES)[keyof typeof STORES];

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;
  private currentUserId: string | null = null;

  // Guarded so the module-level instance is safe to import during SSR.
  // IndexedDB is a browser-only API; on the server we simply never initialize.
  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
  }

  constructor() {
    if (this.isBrowser) {
      void this.initialize();
    }
  }

  // Initialize the database
  private async initialize(): Promise<IDBDatabase> {
    if (this.initPromise) {
      return this.initPromise;
    }

    // Server / non-browser: no IndexedDB available. Reject explicitly rather
    // than reference an undefined global, so callers can catch it cleanly.
    if (!this.isBrowser) {
      throw new Error('[IndexedDB] IndexedDB is not available in this environment');
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[IndexedDB] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Database initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.PUBLIC_DATA)) {
          const publicStore = db.createObjectStore(STORES.PUBLIC_DATA, { keyPath: 'key' });
          publicStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
          const userStore = db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
          userStore.createIndex('userId', 'userId', { unique: false });
          userStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.APP_STATE)) {
          db.createObjectStore(STORES.APP_STATE, { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains(STORES.CACHE_METADATA)) {
          db.createObjectStore(STORES.CACHE_METADATA, { keyPath: 'key' });
        }

        console.log('[IndexedDB] Database schema upgraded');
      };
    });

    return this.initPromise;
  }

  // Wait for database to be ready
  private async ensureReady(): Promise<IDBDatabase> {
    if (!this.db) {
      return this.initialize();
    }
    return this.db;
  }

  // Set current user ID for scoped operations
  setUserId(userId: string | null): void {
    this.currentUserId = userId;
  }

  // Clear all data for a specific user (on logout or switch)
  async clearUserData(userId: string): Promise<void> {
    const db = await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.USER_DATA], 'readwrite');
      const store = transaction.objectStore(STORES.USER_DATA);
      const index = store.index('userId');
      const request = index.openCursor(IDBKeyRange.only(userId));

      const keysToDelete: string[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          keysToDelete.push(cursor.value.key);
          cursor.continue();
        } else {
          // Delete all found keys
          const deleteTransaction = db.transaction([STORES.USER_DATA], 'readwrite');
          const deleteStore = deleteTransaction.objectStore(STORES.USER_DATA);

          keysToDelete.forEach(key => {
            deleteStore.delete(key);
          });

          deleteTransaction.oncomplete = () => {
            console.log(`[IndexedDB] Cleared user data for ${userId}`);
            resolve();
          };

          deleteTransaction.onerror = () => {
            reject(deleteTransaction.error);
          };
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Generate a user-scoped key
  private generateKey(baseKey: string, userId?: string): string {
    const effectiveUserId = userId || this.currentUserId;
    if (effectiveUserId) {
      return `user:${effectiveUserId}:${baseKey}`;
    }
    return baseKey;
  }

  // Store public data (catalog, categories, etc.)
  async setPublicData<T>(key: string, value: T, ttl?: number): Promise<void> {
    const db = await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PUBLIC_DATA], 'readwrite');
      const store = transaction.objectStore(STORES.PUBLIC_DATA);

      const item: StorageItem<T> = {
        key,
        value,
        timestamp: Date.now(),
        ttl,
      };

      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get public data
  async getPublicData<T>(key: string): Promise<T | null> {
    const db = await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PUBLIC_DATA], 'readonly');
      const store = transaction.objectStore(STORES.PUBLIC_DATA);
      const request = store.get(key);

      request.onsuccess = () => {
        const item = request.result as StorageItem<T> | undefined;
        if (!item) {
          resolve(null);
          return;
        }

        // Check TTL
        if (item.ttl && Date.now() - item.timestamp > item.ttl) {
          // Expired, delete it
          store.delete(key);
          resolve(null);
          return;
        }

        resolve(item.value);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Store user-specific data (with automatic user scoping)
  async setUserData<T>(baseKey: string, value: T, ttl?: number, userId?: string): Promise<void> {
    const db = await this.ensureReady();
    const effectiveUserId = userId || this.currentUserId;

    if (!effectiveUserId) {
      throw new Error('User ID required for user-specific data');
    }

    const key = this.generateKey(baseKey, effectiveUserId);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.USER_DATA], 'readwrite');
      const store = transaction.objectStore(STORES.USER_DATA);

      const item: StorageItem<T> = {
        key,
        value,
        timestamp: Date.now(),
        userId: effectiveUserId,
        ttl,
      };

      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get user-specific data
  async getUserData<T>(baseKey: string, userId?: string): Promise<T | null> {
    const db = await this.ensureReady();
    const effectiveUserId = userId || this.currentUserId;

    if (!effectiveUserId) {
      return null;
    }

    const key = this.generateKey(baseKey, effectiveUserId);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.USER_DATA], 'readonly');
      const store = transaction.objectStore(STORES.USER_DATA);
      const request = store.get(key);

      request.onsuccess = () => {
        const item = request.result as StorageItem<T> | undefined;
        if (!item) {
          resolve(null);
          return;
        }

        // Verify this data belongs to the requesting user
        if (item.userId !== effectiveUserId) {
          console.warn('[IndexedDB] User data access violation');
          resolve(null);
          return;
        }

        // Check TTL
        if (item.ttl && Date.now() - item.timestamp > item.ttl) {
          store.delete(key);
          resolve(null);
          return;
        }

        resolve(item.value);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Store application state
  async setAppState<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.APP_STATE], 'readwrite');
      const store = transaction.objectStore(STORES.APP_STATE);

      const item: StorageItem<T> = {
        key,
        value,
        timestamp: Date.now(),
      };

      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get application state
  async getAppState<T>(key: string): Promise<T | null> {
    const db = await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.APP_STATE], 'readonly');
      const store = transaction.objectStore(STORES.APP_STATE);
      const request = store.get(key);

      request.onsuccess = () => {
        const item = request.result as StorageItem<T> | undefined;
        resolve(item?.value ?? null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Store cache metadata
  async setCacheMetadata(key: string, metadata: StorageMetadata): Promise<void> {
    const db = await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE_METADATA], 'readwrite');
      const store = transaction.objectStore(STORES.CACHE_METADATA);

      const item: StorageItem<StorageMetadata> = {
        key,
        value: metadata,
        timestamp: Date.now(),
      };

      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get cache metadata
  async getCacheMetadata(key: string): Promise<StorageMetadata | null> {
    const db = await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE_METADATA], 'readonly');
      const store = transaction.objectStore(STORES.CACHE_METADATA);
      const request = store.get(key);

      request.onsuccess = () => {
        const item = request.result as StorageItem<StorageMetadata> | undefined;
        resolve(item?.value ?? null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Delete data by key
  async delete(key: string, storeName: StoreName): Promise<void> {
    const db = await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data in a store
  async clearStore(storeName: StoreName): Promise<void> {
    const db = await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get all keys in a store
  async getAllKeys(storeName: StoreName): Promise<string[]> {
    const db = await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result.map(key => key.toString()));
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Clean up expired data
  async cleanupExpiredData(): Promise<void> {
    const db = await this.ensureReady();
    const now = Date.now();

    const cleanupStore = async (storeName: StoreName) => {
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.openCursor();

        const keysToDelete: string[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const item = cursor.value as StorageItem;
            if (item.ttl && now - item.timestamp > item.ttl) {
              keysToDelete.push(item.key);
            }
            cursor.continue();
          } else {
            // Delete all expired items
            keysToDelete.forEach(key => {
              store.delete(key);
            });
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });
    };

    await Promise.all([
      cleanupStore(STORES.PUBLIC_DATA),
      cleanupStore(STORES.USER_DATA),
    ]);

    console.log('[IndexedDB] Cleaned up expired data');
  }

  // Estimate storage usage (approximate)
  async estimateStorage(): Promise<{ used: number; free: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          free: estimate.quota ? estimate.quota - (estimate.usage || 0) : 0,
        };
      } catch (error) {
        console.warn('[IndexedDB] Storage estimation failed:', error);
      }
    }
    return { used: 0, free: 0 };
  }
}

// Export a singleton instance
export const offlineStorage = new OfflineStorage();

// Convenience functions for common operations
export const storage = {
  // Public data (TTL: 1 hour for catalog data)
  catalog: {
    set: (data: any) => offlineStorage.setPublicData('catalog', data, 60 * 60 * 1000),
    get: () => offlineStorage.getPublicData('catalog'),
  },

  categories: {
    set: (data: any) => offlineStorage.setPublicData('categories', data, 60 * 60 * 1000),
    get: () => offlineStorage.getPublicData('categories'),
  },

  homepage: {
    set: (data: any) => offlineStorage.setPublicData('homepage', data, 30 * 60 * 1000),
    get: () => offlineStorage.getPublicData('homepage'),
  },

  // User data
  cart: {
    set: (userId: string, data: any) => offlineStorage.setUserData('cart', data, 24 * 60 * 60 * 1000, userId),
    get: (userId: string) => offlineStorage.getUserData('cart', userId),
  },

  orders: {
    set: (userId: string, data: any) => offlineStorage.setUserData('orders', data, 7 * 24 * 60 * 60 * 1000, userId),
    get: (userId: string) => offlineStorage.getUserData('orders', userId),
  },

  profile: {
    set: (userId: string, data: any) => offlineStorage.setUserData('profile', data, 24 * 60 * 60 * 1000, userId),
    get: (userId: string) => offlineStorage.getUserData('profile', userId),
  },

  // App state
  auth: {
    set: (data: any) => offlineStorage.setAppState('auth', data),
    get: () => offlineStorage.getAppState('auth'),
  },

  ui: {
    set: (key: string, data: any) => offlineStorage.setAppState(`ui:${key}`, data),
    get: (key: string) => offlineStorage.getAppState(`ui:${key}`),
  },
};

// Initialize storage cleanup on app startup
if (typeof window !== 'undefined') {
  // Run cleanup once per day
  const lastCleanup = localStorage.getItem('shopy_last_storage_cleanup');
  const oneDay = 24 * 60 * 60 * 1000;

  if (!lastCleanup || Date.now() - parseInt(lastCleanup, 10) > oneDay) {
    offlineStorage.cleanupExpiredData().then(() => {
      localStorage.setItem('shopy_last_storage_cleanup', Date.now().toString());
    });
  }
}