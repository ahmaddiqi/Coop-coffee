import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSyncStatus, subscribeSyncStatus, type SyncStatus } from '@/utils/pwa';
import { dbManager } from '@/utils/indexedDB';

const OfflineSyncStatus: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    pendingSubmissions: 0,
    lastSyncTime: null,
    hasUnsyncedData: false
  });
  const [unsyncedDataDetails, setUnsyncedDataDetails] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Initial status
    const initialStatus = getSyncStatus();
    setSyncStatus(initialStatus);
    loadUnsyncedDataDetails();

    // Subscribe to status changes
    const unsubscribe = subscribeSyncStatus((status) => {
      setSyncStatus(status);
      loadUnsyncedDataDetails();
    });

    return unsubscribe;
  }, []);

  const loadUnsyncedDataDetails = async () => {
    try {
      const [pendingSubmissions, unsyncedUserData] = await Promise.all([
        dbManager.getPendingSubmissions(),
        dbManager.getUnsyncedUserData()
      ]);

      const details = [
        ...pendingSubmissions.map(submission => ({
          type: 'form_submission',
          id: submission.id,
          description: `Form submission ke ${submission.url}`,
          timestamp: submission.timestamp,
          retryCount: submission.retryCount,
          status: submission.status
        })),
        ...unsyncedUserData.map(data => ({
          type: 'user_data',
          id: data.id,
          description: `Data ${data.type}: ${data.id}`,
          timestamp: data.lastModified,
          retryCount: 0,
          status: 'pending'
        }))
      ];

      setUnsyncedDataDetails(details);
    } catch (error) {
      console.error('Failed to load unsynced data details:', error);
    }
  };

  const retrySync = async () => {
    if (!navigator.onLine) {
      alert('Tidak ada koneksi internet. Silakan periksa koneksi Anda.');
      return;
    }

    setIsRetrying(true);
    try {
      // Trigger background sync if available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await registration.sync.register('sync-form-submissions');
        }
      }

      // Manual retry for critical data
      const pendingSubmissions = await dbManager.getPendingSubmissions();
      for (const submission of pendingSubmissions) {
        try {
          await dbManager.updateSubmissionStatus(submission.id, 'syncing');
          
          const response = await fetch(submission.url, {
            method: submission.method,
            headers: submission.headers,
            body: JSON.stringify(submission.data)
          });

          if (response.ok) {
            await dbManager.removeSubmission(submission.id);
          } else {
            await dbManager.updateSubmissionStatus(
              submission.id, 
              'failed', 
              submission.retryCount + 1
            );
          }
        } catch (error) {
          await dbManager.updateSubmissionStatus(
            submission.id, 
            'failed', 
            submission.retryCount + 1
          );
        }
      }

      await loadUnsyncedDataDetails();
    } finally {
      setIsRetrying(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'bg-red-500';
    if (syncStatus.hasUnsyncedData) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.hasUnsyncedData) return 'Perlu Sinkronisasi';
    return 'Tersinkronisasi';
  };

  const getAlertVariant = () => {
    if (!syncStatus.isOnline) return 'destructive';
    if (syncStatus.hasUnsyncedData) return 'default';
    return 'default';
  };

  if (!syncStatus.hasUnsyncedData && syncStatus.isOnline) {
    // Show minimal status when everything is synced
    return (
      <div className="flex items-center gap-2 text-sm text-kopi-pekat/60">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
        <span>Tersinkronisasi</span>
        {syncStatus.lastSyncTime && (
          <span className="text-xs">
            ({formatTime(syncStatus.lastSyncTime)})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Status Alert */}
      <Alert variant={getAlertVariant()} className="coffee-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} flex-shrink-0`}>
              {!syncStatus.isOnline && (
                <div className="w-full h-full bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-kopi-pekat">
                  Status: {getStatusText()}
                </span>
                {syncStatus.hasUnsyncedData && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {syncStatus.pendingSubmissions} item pending
                  </Badge>
                )}
              </div>
              
              <AlertDescription className="mt-1">
                {!syncStatus.isOnline && (
                  <span>Tidak ada koneksi internet. Data akan disinkronisasi saat koneksi kembali.</span>
                )}
                {syncStatus.isOnline && syncStatus.hasUnsyncedData && (
                  <span>Ada {syncStatus.pendingSubmissions} data yang belum tersinkronisasi.</span>
                )}
                {syncStatus.lastSyncTime && (
                  <span className="block text-xs text-kopi-pekat/60 mt-1">
                    Sinkronisasi terakhir: {formatTime(syncStatus.lastSyncTime)}
                  </span>
                )}
              </AlertDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {syncStatus.hasUnsyncedData && (
              <Button
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                variant="outline"
                className="text-xs"
              >
                {isExpanded ? '🔼' : '🔽'} Detail
              </Button>
            )}
            
            {syncStatus.isOnline && syncStatus.hasUnsyncedData && (
              <Button
                size="sm"
                onClick={retrySync}
                disabled={isRetrying}
                className="text-xs bg-aksen-oranye hover:bg-aksen-oranye/90"
              >
                {isRetrying ? '🔄' : '🔄'} {isRetrying ? 'Syncing...' : 'Sync Sekarang'}
              </Button>
            )}
          </div>
        </div>
      </Alert>

      {/* Detailed Unsynced Data List */}
      {isExpanded && unsyncedDataDetails.length > 0 && (
        <div className="coffee-card p-4 space-y-3">
          <h4 className="font-semibold text-kopi-pekat font-display">
            Data Belum Tersinkronisasi ({unsyncedDataDetails.length})
          </h4>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {unsyncedDataDetails.map((item, index) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 bg-krem-muda rounded-lg border border-kopi-pekat/10"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-kopi-pekat">
                      {item.description}
                    </span>
                    <Badge 
                      variant={item.status === 'failed' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {item.status === 'pending' && '⏳ Pending'}
                      {item.status === 'syncing' && '🔄 Syncing'}
                      {item.status === 'failed' && '❌ Failed'}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-kopi-pekat/60 mt-1">
                    {formatTime(item.timestamp)}
                    {item.retryCount > 0 && (
                      <span className="ml-2 text-red-600">
                        • {item.retryCount} retry attempts
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.type === 'form_submission' && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Form
                    </span>
                  )}
                  {item.type === 'user_data' && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Data
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary and Actions */}
          <div className="pt-3 border-t border-kopi-pekat/10">
            <div className="flex items-center justify-between text-xs text-kopi-pekat/60">
              <span>
                Total: {unsyncedDataDetails.length} item belum tersinkronisasi
              </span>
              
              {syncStatus.isOnline && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="text-xs"
                  >
                    🔄 Refresh Page
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={retrySync}
                    disabled={isRetrying}
                    className="text-xs bg-aksen-oranye hover:bg-aksen-oranye/90"
                  >
                    🚀 Sync Semua
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offline Help */}
      {!syncStatus.isOnline && (
        <div className="coffee-card p-4 bg-red-50 border-red-200">
          <h4 className="font-semibold text-red-800 mb-2">💡 Mode Offline</h4>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• Data yang Anda input akan disimpan secara lokal</li>
            <li>• Sinkronisasi otomatis akan berjalan saat koneksi kembali</li>
            <li>• Hindari menutup aplikasi hingga data tersinkronisasi</li>
            <li>• Beberapa fitur mungkin tidak tersedia saat offline</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default OfflineSyncStatus;