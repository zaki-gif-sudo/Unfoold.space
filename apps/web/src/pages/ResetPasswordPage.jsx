import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Zap } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  // Check password strength
  useEffect(() => {
    let strength = 0;
    const pwd = password;

    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    setPasswordStrength(strength);
  }, [password]);

  // Auto redirect on success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  const validateForm = () => {
    const errors = {};

    if (!password) {
      errors.password = 'Password baru harus diisi';
    } else if (password.length < 8) {
      errors.password = 'Password minimal 8 karakter';
    }

    if (!passwordConfirm) {
      errors.passwordConfirm = 'Konfirmasi password harus diisi';
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = 'Password tidak cocok';
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

    if (!token) {
      setError('Link reset password tidak valid');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, password, passwordConfirm);
      setIsSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);

      if (err.message.includes('expired') || err.message.includes('Invalid')) {
        setError('Link reset password sudah expired. Silakan request ulang.');
      } else {
        setError(err.message || 'Gagal reset password. Coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthLabel = () => {
    if (!password) return '';
    const labels = ['Sangat lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'];
    return labels[passwordStrength - 1] || '';
  };

  const getPasswordStrengthColor = () => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
    return colors[passwordStrength - 1] || 'bg-gray-300';
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <Helmet>
          <title>Invalid Link | Unfoold</title>
        </Helmet>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-card rounded-2xl shadow-2xl border border-border p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-destructive/10 rounded-full p-4 border border-destructive/20">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Link Tidak Valid</h2>
              <p className="text-muted-foreground">
                Link reset password sudah expired atau tidak valid. Silakan request ulang.
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition inline-block"
            >
              Request Reset Link Baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <Helmet>
          <title>Password Reset | Unfoold</title>
        </Helmet>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-card rounded-2xl shadow-2xl border border-border p-8 text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg animate-pulse"></div>
                <div className="relative bg-green-500/10 rounded-full p-4 border border-green-200">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Password Berhasil Direset!</h2>
              <p className="text-muted-foreground">
                Password Anda telah berhasil diubah. Silakan login dengan password baru Anda.
              </p>
            </div>

            {/* Redirect Info */}
            <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <Zap size={16} className="inline mr-2" />
                Redirect ke halaman Login dalam 3 detik...
              </p>
            </div>

            {/* Manual Link */}
            <Link
              to="/login"
              className="inline-block w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition"
            >
              Login Sekarang
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>Reset Password | Unfoold</title>
      </Helmet>

      {/* Back Button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Login
        </Link>
      </div>

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
          <Lock className="text-primary" size={24} />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Buat Password Baru
        </h1>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Masukkan password baru untuk akun {email || 'Anda'}
        </p>
      </div>

      {/* Form Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card rounded-2xl shadow-2xl border border-border p-8 space-y-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* New Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-3">
                Password Baru
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  placeholder="••••••••"
                  className={`appearance-none block w-full pl-12 pr-10 py-3 border rounded-lg shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm bg-background text-foreground transition ${
                    fieldErrors.password ? 'border-destructive focus:ring-destructive/20' : 'border-border'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle size={12} />
                  {fieldErrors.password}
                </p>
              )}

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-2 rounded-full transition ${
                          i < passwordStrength ? getPasswordStrengthColor() : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Kekuatan: <span className="font-semibold text-foreground">{getPasswordStrengthLabel()}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-semibold text-foreground mb-3">
                Konfirmasi Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Lock size={18} />
                </div>
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    if (fieldErrors.passwordConfirm) {
                      setFieldErrors(prev => ({ ...prev, passwordConfirm: '' }));
                    }
                  }}
                  placeholder="••••••••"
                  className={`appearance-none block w-full pl-12 pr-10 py-3 border rounded-lg shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm bg-background text-foreground transition ${
                    fieldErrors.passwordConfirm ? 'border-destructive focus:ring-destructive/20' : 'border-border'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.passwordConfirm ? (
                <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle size={12} />
                  {fieldErrors.passwordConfirm}
                </p>
              ) : password && passwordConfirm && password === passwordConfirm && (
                <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Password cocok
                </p>
              )}
            </div>

            {/* Requirements Checklist */}
            {password && (
              <div className="bg-secondary/50 rounded-lg p-4 border border-border space-y-2">
                <p className="text-xs font-semibold text-foreground mb-2">Requirement:</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className={password.length >= 8 ? 'text-green-600' : ''}>
                    {password.length >= 8 ? '✓' : '○'} Minimal 8 karakter
                  </p>
                  <p className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                    {/[a-z]/.test(password) ? '✓' : '○'} Huruf kecil (a-z)
                  </p>
                  <p className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                    {/[A-Z]/.test(password) ? '✓' : '○'} Huruf besar (A-Z)
                  </p>
                  <p className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                    {/[0-9]/.test(password) ? '✓' : '○'} Angka (0-9)
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || !password || !passwordConfirm || password !== passwordConfirm}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200"
              >
                {isLoading ? 'Menyimpan Password...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Link reset berlaku selama <strong>20 menit</strong></p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;