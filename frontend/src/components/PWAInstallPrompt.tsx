import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { checkInstallPrompt, promptInstall } from '@/utils/pwa';

// App configuration - can be moved to environment variables or config file
const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Kopi Digital',
  displayName: import.meta.env.VITE_APP_DISPLAY_NAME || 'Kopi Digital',
  description: 'Sistem Manajemen Koperasi Kopi Digital dengan Traceability'
};

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setIsInstallable(true);
      
      // Show prompt after a delay (don't be too aggressive)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setIsInstallable(false);
      
      // Show success message
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: {
          title: '✅ Aplikasi Terinstall',
          message: 'Kopi Digital berhasil diinstall! Akses lebih mudah dari home screen.',
          type: 'success'
        }
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    setIsInstalling(true);
    try {
      installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ User accepted PWA install');
        setShowPrompt(false);
      } else {
        console.log('❌ User dismissed PWA install');
      }
    } catch (error) {
      console.error('PWA install failed:', error);
    } finally {
      setIsInstalling(false);
      setInstallPrompt(null);
      setIsInstallable(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !isInstallable || !showPrompt) {
    return null;
  }

  // Don't show if user dismissed in this session
  if (sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="coffee-card shadow-coffee-lg border-aksen-oranye/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-aksen-oranye rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">📱</span>
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold text-kopi-pekat font-display mb-1">
                Install {APP_CONFIG.displayName}
              </h4>
              <p className="text-sm text-kopi-pekat/70 mb-3">
                {APP_CONFIG.description} - Install untuk akses lebih cepat dan dapat bekerja offline
              </p>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="bg-aksen-oranye hover:bg-aksen-oranye/90 text-white flex-1"
                >
                  {isInstalling ? '⏳' : '📲'} {isInstalling ? 'Installing...' : 'Install'}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismiss}
                  className="text-kopi-pekat/60"
                >
                  ✕
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;