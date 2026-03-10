
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Coffee, AlertCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect jika sudah login
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const errors = {};
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(email.toLowerCase().trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle specific error messages
      if (err.message.includes('Too many attempts')) {
        setError(err.message);
      } else if (err.message.includes('Incorrect')) {
        setError('Email atau password tidak sesuai. Coba lagi.');
      } else if (err.message.includes('network')) {
        setError('Koneksi error. Cek internet Anda.');
      } else {
        setError(err.message || 'Login gagal. Coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>Login | Unfoold Espresso</title>
      </Helmet>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Coffee className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Selamat Datang Kembali
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Masuk ke akun Unfoold Anda
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-center space-x-2">
                <AlertCircle size={20} className="shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background text-foreground transition ${
                    fieldErrors.email ? 'border-destructive focus:ring-destructive' : 'border-border'
                  }`}
                  placeholder="contoh@email.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background text-foreground transition ${
                    fieldErrors.password ? 'border-destructive focus:ring-destructive' : 'border-border'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.password}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  Baru di Unfoold?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center space-y-3">
              <Link to="/signup" className="block font-medium text-primary hover:text-primary/80 transition-colors">
                Buat Akun Baru
              </Link>
              <Link to="/forgot-password" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">
                Lupa Password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
