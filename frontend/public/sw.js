const CACHE_NAME = 'kopi-digital-v1.0.0';
const API_CACHE_NAME = 'kopi-digital-api-v1.0.0';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/dashboard/inventory',
  '/dashboard/petani',
  '/dashboard/lahan',
  '/dashboard/aktivitas',
  '/dashboard/transaksi-inventory',
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/users/profile',
  '/api/inventory',
  '/api/petani',
  '/api/lahan',
  '/api/koperasi'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request)
    );
  }
  // Handle static assets with cache-first strategy
  else {
    event.respondWith(
      cacheFirstStrategy(request)
    );
  }
});

// Network-first strategy for API calls
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful and GET request, cache the response
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    
    // Network failed, try cache (only for GET requests)
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline fallback for API calls
    return new Response(
      JSON.stringify({ 
        error: 'Tidak ada koneksi internet', 
        message: 'Data ini tersimpan secara offline dan mungkin tidak terbaru',
        offline: true 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Cache miss, try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for static asset', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Return a basic offline response
    return new Response('Offline - Tidak ada koneksi internet', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'sync-form-submissions') {
    event.waitUntil(syncFormSubmissions());
  }
});

// Sync offline form submissions when back online
async function syncFormSubmissions() {
  try {
    // Get stored form submissions from IndexedDB
    const submissions = await getStoredSubmissions();
    
    for (const submission of submissions) {
      try {
        const response = await fetch(submission.url, {
          method: submission.method,
          headers: submission.headers,
          body: JSON.stringify(submission.data)
        });
        
        if (response.ok) {
          // Remove from offline storage
          await removeStoredSubmission(submission.id);
          console.log('Service Worker: Synced offline submission', submission.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync submission', submission.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// IndexedDB operations for background sync
async function getStoredSubmissions() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineSubmissions'], 'readonly');
      const store = transaction.objectStore('offlineSubmissions');
      const index = store.index('status');
      
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get stored submissions:', error);
    return [];
  }
}

async function removeStoredSubmission(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineSubmissions'], 'readwrite');
      const store = transaction.objectStore('offlineSubmissions');
      
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to remove stored submission:', error);
  }
}

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KopiDigitalDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});