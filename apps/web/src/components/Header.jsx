import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { usePWA } from '@/utils/PWAManager.jsx';
import NotificationBell from './NotificationBell.jsx';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const { currentUser, logout, isAuthenticated } = useAuth();
  const { isInstallable, showInstallPrompt } = usePWA();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCommunityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCommunityOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-2 md:py-3">
        <div className="flex items-center justify-between">
          {/* Logo Branding */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src="https://horizons-cdn.hostinger.com/13222a4f-1f4e-4729-8f8a-40893789af3d/9c7dd692ee2a4fd539941e60c9f6e133.png" 
              alt="Unfoold Logo" 
              className="h-16 md:h-20 w-auto object-contain brightness-0 dark:invert" 
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`text-sm font-medium transition-opacity hover:opacity-70 ${location.pathname === '/' ? 'font-bold' : 'text-foreground'}`}>Home</Link>
            <Link to="/menu" className={`text-sm font-medium transition-opacity hover:opacity-70 ${isActive('/menu') ? 'font-bold' : 'text-foreground'}`}>Menu</Link>
            <Link to="/reserve" className={`text-sm font-medium transition-opacity hover:opacity-70 ${isActive('/reserve') ? 'font-bold' : 'text-foreground'}`}>Reserve</Link>
            
            {/* Community Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsCommunityOpen(!isCommunityOpen)}
                className={`flex items-center space-x-1 text-sm font-medium transition-opacity hover:opacity-70 ${isActive('/community') ? 'font-bold' : 'text-foreground'}`}
              >
                <span>Community</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isCommunityOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isCommunityOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-md shadow-xl py-2 z-50"
                  >
                    <Link to="/community/events" className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">Events</Link>
                    <Link to="/community/discussions" className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">Discussions</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Desktop Auth/Profile & PWA */}
          <div className="hidden md:flex items-center space-x-4">
            {isInstallable && (
              <button 
                onClick={showInstallPrompt}
                className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Download size={16} />
                <span>Add to Home Screen</span>
              </button>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <Link to="/profile" className="flex items-center space-x-2 text-foreground hover:opacity-70 transition-opacity">
                  <User size={20} />
                  <span className="text-sm font-medium">{currentUser?.name || 'Profile'}</span>
                </Link>
                <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-medium text-foreground hover:opacity-70 transition-opacity">
                  Login
                </Link>
                <Link to="/signup" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-bold hover:opacity-90 transition-opacity">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-foreground hover:opacity-70 transition-opacity"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4 flex flex-col">
              {isInstallable && (
                <button 
                  onClick={showInstallPrompt}
                  className="flex items-center justify-center space-x-2 bg-primary text-primary-foreground px-4 py-3 rounded-md text-base font-medium hover:opacity-90 transition-opacity w-full mb-4"
                >
                  <Download size={18} />
                  <span>Add to Home Screen</span>
                </button>
              )}
              
              <Link to="/" className={`text-lg font-medium ${location.pathname === '/' ? 'font-bold' : 'text-foreground'}`}>Home</Link>
              <Link to="/menu" className={`text-lg font-medium ${isActive('/menu') ? 'font-bold' : 'text-foreground'}`}>Menu</Link>
              <Link to="/reserve" className={`text-lg font-medium ${isActive('/reserve') ? 'font-bold' : 'text-foreground'}`}>Reserve</Link>
              
              <div className="space-y-2">
                <div className="text-lg font-medium text-muted-foreground">Community</div>
                <Link to="/community/events" className={`block pl-4 text-base ${isActive('/community/events') ? 'font-bold' : 'text-foreground'}`}>Events</Link>
                <Link to="/community/discussions" className={`block pl-4 text-base ${isActive('/community/discussions') ? 'font-bold' : 'text-foreground'}`}>Discussions</Link>
              </div>
              
              <div className="pt-4 border-t border-border flex flex-col space-y-4">
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" className="text-lg font-medium text-foreground flex items-center space-x-2">
                      <User size={20} />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/profile" className="text-lg font-medium text-foreground flex items-center space-x-2">
                      <User size={20} />
                      <span>Profile Settings</span>
                    </Link>
                    <button onClick={handleLogout} className="text-lg font-medium text-foreground text-left flex items-center space-x-2">
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-lg font-medium text-foreground">Login</Link>
                    <Link to="/signup" className="text-lg font-medium text-primary-foreground bg-primary px-4 py-2 rounded-md text-center">Sign Up</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;