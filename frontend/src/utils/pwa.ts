// PWA Service Worker Registration and Utilities

export interface SyncStatus {
  isOnline: boolean;
  pendingSubmissions: number;
  lastSyncTime: string | null;
  hasUnsyncedData: boolean;
}

let syncStatusListeners: ((status: SyncStatus) => void)[] = [];

// Register Service Worker - DISABLED for troubleshooting
export async function registerSW(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      // Unregister existing service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Unregistered service worker:', registration.scope);
      }
      
      console.log('Service Worker disabled for troubleshooting');
      return;
      
      /* DISABLED
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration.scope);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('🔄 New Service Worker available');
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, refresh the page
              if (confirm('Versi baru aplikasi tersedia. Refresh sekarang?')) {
                window.location.reload();
              }
            }
          });
        }
      });
      
      // Set up background sync
      setupBackgroundSync(registration);
      
      // Monitor online/offline status
      setupConnectionMonitoring();
      */
      
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  } else {
    console.warn('Service Worker not supported in this browser');
  }
}

// Setup background sync for offline form submissions
function setupBackgroundSync(registration: ServiceWorkerRegistration): void {
  if ('sync' in window.ServiceWorkerRegistration.prototype) {
    // Register for background sync
    window.addEventListener('online', async () => {
      try {
        await registration.sync.register('sync-form-submissions');
        console.log('📡 Background sync registered');
        notifyStatusChange();
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    });
  }
}

// Monitor connection status
function setupConnectionMonitoring(): void {
  const updateOnlineStatus = () => {
    console.log(`🌐 Connection status: ${navigator.onLine ? 'Online' : 'Offline'}`);
    notifyStatusChange();
    
    // Show user notification
    if (navigator.onLine) {
      showNotification('✅ Koneksi kembali', 'Data akan disinkronkan otomatis', 'success');
    } else {
      showNotification('📡 Mode Offline', 'Data akan disimpan secara lokal', 'warning');
    }
  };
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

// Get current sync status
export function getSyncStatus(): SyncStatus {
  const pendingSubmissions = getPendingSubmissionsCount();
  const lastSyncTime = localStorage.getItem('lastSyncTime');
  
  return {
    isOnline: navigator.onLine,
    pendingSubmissions,
    lastSyncTime,
    hasUnsyncedData: pendingSubmissions > 0
  };
}

// Subscribe to sync status changes
export function subscribeSyncStatus(callback: (status: SyncStatus) => void): () => void {
  syncStatusListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    syncStatusListeners = syncStatusListeners.filter(listener => listener !== callback);
  };
}

// Notify all listeners of status changes
function notifyStatusChange(): void {
  const status = getSyncStatus();
  syncStatusListeners.forEach(listener => listener(status));
}

// Store form submission for offline sync
export async function storeOfflineSubmission(
  url: string, 
  method: string, 
  data: any, 
  headers: Record<string, string> = {}
): Promise<void> {
  const submission = {
    id: crypto.randomUUID(),
    url,
    method,
    data,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    timestamp: new Date().toISOString(),
    retryCount: 0
  };
  
  // Store in IndexedDB (fallback to localStorage for now)
  const stored = getStoredSubmissions();
  stored.push(submission);
  localStorage.setItem('offlineSubmissions', JSON.stringify(stored));
  
  console.log('💾 Form submission stored for offline sync:', submission.id);
  notifyStatusChange();
  
  // Try to sync immediately if online
  if (navigator.onLine && 'serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-form-submissions');
  }
}

// Get stored submissions count
function getPendingSubmissionsCount(): number {
  return getStoredSubmissions().length;
}

// Get all stored submissions
function getStoredSubmissions(): any[] {
  try {
    const stored = localStorage.getItem('offlineSubmissions');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Show user notification
function showNotification(title: string, message: string, type: 'success' | 'warning' | 'error' = 'success'): void {
  // This would integrate with your toast system
  if (window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('app-notification', {
      detail: { title, message, type }
    }));
  }
}

// Check if app can be installed
export function checkInstallPrompt(): boolean {
  return 'beforeinstallprompt' in window;
}

// Prompt for app installation
export async function promptInstall(): Promise<boolean> {
  const event = (window as any).deferredPrompt;
  if (event) {
    event.prompt();
    const result = await event.userChoice;
    return result.outcome === 'accepted';
  }
  return false;
}

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  
  // Show install button or notification
  showNotification('📱 Install App', 'Install Kopi Digital untuk akses lebih mudah', 'success');
});

// Mark data as synced
export function markDataSynced(): void {
  localStorage.setItem('lastSyncTime', new Date().toISOString());
  notifyStatusChange();
}

// Clear offline data after successful sync
export function clearOfflineData(): void {
  localStorage.removeItem('offlineSubmissions');
  notifyStatusChange();
}