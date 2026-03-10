import React, { createContext, useContext, useState, useEffect } from 'react';

const PWAContext = createContext(null);

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

const SplashScreen = () => (
  <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center transition-opacity duration-500">
    <div className="w-10 h-10 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin"></div>
  </div>
);

export const PWAProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [queuedActions, setQueuedActions] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Minimal splash screen timer
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    });

    // Check queued actions
    const updateQueueCount = () => {
      const orders = JSON.parse(localStorage.getItem('offlineOrders') || '[]');
      const reservations = JSON.parse(localStorage.getItem('offlineReservations') || '[]');
      setQueuedActions(orders.length + reservations.length);
    };

    updateQueueCount();
    window.addEventListener('storage', updateQueueCount);
    window.addEventListener('offlineActionQueued', updateQueueCount);
    window.addEventListener('online', updateQueueCount);

    return () => {
      clearTimeout(splashTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('storage', updateQueueCount);
      window.removeEventListener('offlineActionQueued', updateQueueCount);
      window.removeEventListener('online', updateQueueCount);
    };
  }, []);

  const showInstallPrompt = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <PWAContext.Provider value={{ isInstallable, showInstallPrompt, queuedActions }}>
      {showSplash && <SplashScreen />}
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => useContext(PWAContext);