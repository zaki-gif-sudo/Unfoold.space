import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

/**
 * SocialRedirect Component
 * Conditionally redirects users:
 * - If authenticated: redirects to /community/discussions (social/community space)
 * - If not authenticated: redirects to /signup
 */
const SocialRedirect = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/community/discussions" replace />;
  }

  return <Navigate to="/signup" replace />;
};

export default SocialRedirect;
