import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

const KasirRoute = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser?.role !== 'kasir' && currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default KasirRoute;
