import React from 'react';
import { Coffee } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[50vh]">
      <div className="relative">
        <Coffee size={48} className="text-foreground animate-pulse" />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-foreground/20 rounded-full blur-sm animate-pulse"></div>
      </div>
      <p className="mt-6 text-muted-foreground font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingSpinner;