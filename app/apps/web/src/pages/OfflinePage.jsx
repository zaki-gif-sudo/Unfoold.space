import React from 'react';
import { Helmet } from 'react-helmet';
import { WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const OfflinePage = () => {
  return (
    <div className="min-h-[80vh] bg-background flex items-center justify-center p-4">
      <Helmet>
        <title>Offline | Unfoold Espresso</title>
      </Helmet>
      
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-lg">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff size={40} className="text-muted-foreground" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">You're Offline</h1>
        <p className="text-muted-foreground mb-8">
          It looks like you've lost your internet connection. Don't worry, you can still browse cached pages or wait until you reconnect.
        </p>
        
        <div className="space-y-4">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={18} /> Try Again
          </button>
          
          <Link 
            to="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-background text-foreground border border-border rounded-lg font-bold hover:bg-muted transition-colors"
          >
            <ArrowLeft size={18} /> Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;