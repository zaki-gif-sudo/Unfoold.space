import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus.js';
import { usePWA } from '@/utils/PWAManager.jsx';

const OfflineIndicator = () => {
  const isOnline = useNetworkStatus();
  const { queuedActions } = usePWA();

  if (isOnline && queuedActions === 0) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shadow-md animate-in slide-in-from-top transition-colors ${isOnline ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground'}`}>
      {!isOnline ? (
        <>
          <WifiOff size={16} />
          <span>You are offline. Browsing cached version.</span>
          {queuedActions > 0 && (
            <span className="bg-background/20 px-2 py-0.5 rounded-full text-xs">
              {queuedActions} action{queuedActions > 1 ? 's' : ''} queued
            </span>
          )}
        </>
      ) : (
        <>
          <RefreshCw size={16} className="animate-spin" />
          <span>Back online! Syncing {queuedActions} queued action{queuedActions > 1 ? 's' : ''}...</span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;