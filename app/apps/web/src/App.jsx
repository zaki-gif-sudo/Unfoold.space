
import React, { useEffect, Suspense, lazy } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { PWAProvider, registerServiceWorker } from './utils/PWAManager.jsx';
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
const MenuPage = lazy(() => import('./pages/MenuPage.jsx'));
const ReservationPage = lazy(() => import('./pages/ReservationPage.jsx'));
const EventsListingPage = lazy(() => import('./pages/EventsListingPage.jsx'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage.jsx'));
const DiscussionsPage = lazy(() => import('./pages/DiscussionsPage.jsx'));
const DiscussionDetailPage = lazy(() => import('./pages/DiscussionDetailPage.jsx'));
const ProfileSettingsPage = lazy(() => import('./pages/ProfileSettingsPage.jsx'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation.jsx'));
const OfflinePage = lazy(() => import('./pages/OfflinePage.jsx'));

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
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/community/events" element={<EventsListingPage />} />
              <Route path="/community/events/:eventId" element={<EventDetailPage />} />
              <Route path="/community/discussions" element={<DiscussionsPage />} />
              <Route path="/community/discussions/:discussionId" element={<DiscussionDetailPage />} />
              <Route path="/offline" element={<OfflinePage />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
              <Route path="/signup" element={<AuthRedirect><SignupPage /></AuthRedirect>} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              <Route path="/reserve" element={<ProtectedRoute><ReservationPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
              <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
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
        <Router>
          <ScrollToTop />
          <AppRoutes />
        </Router>
      </AuthProvider>
    </PWAProvider>
  );
}

export default App;
