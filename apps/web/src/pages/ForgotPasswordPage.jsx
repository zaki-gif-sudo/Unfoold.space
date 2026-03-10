import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Coffee, ArrowLeft, CheckCircle2, AlertCircle, Mail, Clock } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateEmail = (value) => {
    if (!value.trim()) {
      return 'Email harus diisi';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Format email tidak valid';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const validation = validateEmail(email);
    if (validation) {
      setFieldError(validation);
      return;
    }

    if (countdown > 0) return;

    setIsLoading(true);
    try {
      await requestPasswordReset(email.toLowerCase().trim());
      setIsSubmitted(true);
      setCountdown(60);
    } catch (err) {
      console.error('Password reset error:', err);
      // Tetap show success untuk security (prevent email enumeration)
      setIsSubmitted(true);
      setCountdown(60);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendClick = async () => {
    if (countdown > 0 || isLoading) return;
    await handleSubmit({ preventDefault: () => {} });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>Lupa Password | Unfoold Coffee & Events</title>
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
          <Mail className="text-primary" size={24} />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Lupa Password?
        </h1>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Masukkan email Anda, kami akan mengirimkan link untuk reset password
        </p>
      </div>

      {/* Form Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card rounded-2xl shadow-2xl border border-border p-8 space-y-6">
          {isSubmitted ? (
            /* Success State */
            <div className="text-center space-y-6">
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
                <h3 className="text-2xl font-bold text-foreground">Email Terkirim!</h3>
                <p className="text-sm text-muted-foreground">
                  Link reset password telah dikirim ke <br />
                  <span className="font-semibold text-foreground">{email}</span>
                </p>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-blue-900">Langkah selanjutnya:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Buka email Anda</li>
                  <li>✓ Klik link "Reset Password"</li>
                  <li>✓ Buat password baru</li>
                  <li>✓ Login dengan password baru</li>
                </ul>
              </div>

              {/* Spam Reminder */}
              <p className="text-xs text-muted-foreground">
                Jika tidak menemukan email, cek folder Spam atau Promosi
              </p>

              {/* Resend & Back Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleResendClick}
                  disabled={countdown > 0 || isLoading}
                  className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                >
                  {countdown > 0 ? (
                    <>
                      <Clock size={16} />
                      Kirim Ulang dalam {countdown}s
                    </>
                  ) : (
                    'Kirim Ulang Email'
                  )}
                </button>

                <Link
                  to="/login"
                  className="block w-full px-4 py-2 border border-border text-foreground font-medium rounded-lg hover:bg-secondary transition text-center"
                >
                  Kembali ke Login
                </Link>
              </div>
            </div>
          ) : (
            /* Form State */
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <Mail size={18} />
                  </div>
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
                      if (fieldError) setFieldError('');
                    }}
                    placeholder="contoh@email.com"
                    className={`appearance-none block w-full pl-12 pr-4 py-3 border rounded-lg shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm bg-background text-foreground transition ${
                      fieldError ? 'border-destructive focus:ring-destructive/20' : 'border-border'
                    }`}
                  />
                </div>
                {fieldError && (
                  <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle size={12} />
                    {fieldError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200"
                >
                  {isLoading ? 'Mengirim...' : 'Kirim Link Reset Password'}
                </button>
              </div>

              {/* Info Box */}
              <div className="bg-secondary/50 border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground text-center">
                  Link reset akan berlaku selama <strong>20 menit</strong>. Pastikan segera check email Anda.
                </p>
              </div>

              {/* Back Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Ingat password? 
                  <Link
                    to="/login"
                    className="ml-1 font-semibold text-primary hover:text-primary/80 transition"
                  >
                    Login di sini
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Butuh bantuan? <Link to="/support" className="text-primary hover:text-primary/80">Hubungi Support</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;