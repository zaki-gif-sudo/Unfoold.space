
import React, { useEffect, Suspense, lazy } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { PWAProvider, registerServiceWorker } from './utils/PWAManager.jsx';
import { initializePushNotifications } from './utils/push-notification.js';
import ScrollToTop from './components/ScrollToTop.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import OfflineIndicator from './components/OfflineIndicator.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
// Lazy loaded pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));
const UserDashboard = lazy(() => import('./pages/UserDashboard.jsx'));
const MenuShowcasePage = lazy(() => import('./pages/MenuShowcasePage.jsx'));
const EventsListingPage = lazy(() => import('./pages/EventsListingPage.jsx'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage.jsx'));
const DiscussionsPage = lazy(() => import('./pages/DiscussionsPage.jsx'));
const DiscussionDetailPage = lazy(() => import('./pages/DiscussionDetailPage.jsx'));
const ProfileSettingsPage = lazy(() => import('./pages/ProfileSettingsPage.jsx'));
const OfflinePage = lazy(() => import('./pages/OfflinePage.jsx'));
const SocialPage = lazy(() => import('./pages/SocialPage.jsx'));
const MomentsPage = lazy(() => import('./pages/MomentsPage.jsx'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage.jsx'));

// Auth Redirect Component
const AuthRedirect = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <div className="flex flex-col min-h-screen">
      <OfflineIndicator />
      <Header />
      <main className="flex-grow">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="Loading Unfoold..." />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/menu-showcase" element={<MenuShowcasePage />} />
              <Route path="/community/events" element={<EventsListingPage />} />
              <Route path="/community/events/:eventId" element={<EventDetailPage />} />
              <Route path="/community/discussions" element={<DiscussionsPage />} />
              <Route path="/community/discussions/:discussionId" element={<DiscussionDetailPage />} />
              <Route path="/offline" element={<OfflinePage />} />
              
              {/* Social Routes */}
              <Route path="/social" element={<ProtectedRoute><SocialPage /></ProtectedRoute>} />
              <Route path="/social/user/:userId" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
              <Route path="/moments" element={<ProtectedRoute><MomentsPage /></ProtectedRoute>} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
              <Route path="/signup" element={<AuthRedirect><SignupPage /></AuthRedirect>} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
              
              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <PWAProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <ScrollToTop />
            <AppRoutes />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </PWAProvider>
  );
}

export default App;
