import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster";
import { registerSW } from './utils/pwa';
import { initDB } from './utils/indexedDB';

// Initialize PWA functionality
async function initPWA() {
  try {
    await Promise.all([
      registerSW(),
      initDB()
    ]);
    console.log('✅ PWA initialization complete');
  } catch (error) {
    console.error('❌ PWA initialization failed:', error);
  }
}

// Global notification handler
window.addEventListener('app-notification', ((event: CustomEvent) => {
  const { title, message, type } = event.detail;
  
  // Create toast notification
  const toastEvent = new CustomEvent('show-toast', {
    detail: {
      title,
      description: message,
      variant: type === 'error' ? 'destructive' : 'default'
    }
  });
  window.dispatchEvent(toastEvent);
}) as EventListener);

// Initialize PWA
initPWA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </StrictMode>,
)