
import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
// import { initializePushNotifications } from '@/utils/push-notification.js';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(pb.authStore.model);
  const [loading, setLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh({ $autoCancel: false });
          setCurrentUser(pb.authStore.model);
        } catch (error) {
          console.error("Auth refresh failed:", error);
          pb.authStore.clear();
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();

    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const login = async (email, password) => {
    const now = Date.now();
    const attempt = loginAttempts[email] || { count: 0, lockedUntil: null };

    if (attempt.lockedUntil && now < attempt.lockedUntil) {
      const remainingMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
      throw new Error(`Too many attempts. Please try again in ${remainingMinutes} minutes.`);
    }

    try {
      const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      
      // Clear attempts on success
      setLoginAttempts(prev => {
        const newAttempts = { ...prev };
        delete newAttempts[email];
        return newAttempts;
      });
      
      // Push notifications disabled for now - debugging
      // Promise.race([
      //   initializePushNotifications(),
      //   new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      // ]).catch(err => 
      //   console.log('Push notifications not available:', err)
      // );
      
      return authData;
    } catch (error) {
      console.error("Login error details:", error);
      
      const newCount = attempt.count + 1;
      const newLockedUntil = newCount >= 5 ? now + 15 * 60 * 1000 : null; // 15 minutes lock
      
      setLoginAttempts(prev => ({
        ...prev,
        [email]: { count: newCount, lockedUntil: newLockedUntil }
      }));

      // Artificial delay of 2.5 seconds to slow down brute force
      await delay(2500);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Login gagal. Coba lagi.';
      
      if (error.status === 401 || error.status === 400) {
        errorMessage = 'Email atau password tidak sesuai. Coba lagi.';
      } else if (error.status === 0 || error.message?.includes('fetch') || error.message?.includes('net')) {
        errorMessage = 'Koneksi error. Cek internet Anda.';
      } else if (error.status >= 500) {
        errorMessage = 'Server sedang bermasalah. Coba lagi nanti.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
  };

  const signup = async (data) => {
    try {
      // Validate input
      if (!data.name || !data.email || !data.password) {
        throw new Error('Semua field harus diisi');
      }

      if (data.password !== data.passwordConfirm) {
        throw new Error('Password tidak cocok');
      }

      if (data.password.length < 8) {
        throw new Error('Password minimal 8 karakter');
      }

      // Create user record
      const record = await pb.collection('users').create({
        name: data.name,
        email: data.email,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
        loyaltyPoints: 0,
        membershipLevel: 'Coffee Guest'
      }, { $autoCancel: false });

      // Auto login after signup (without timeout - simplified)
      try {
        await login(data.email, data.password);
      } catch (loginError) {
        console.warn("Auto-login after signup failed:", loginError);
        // Signup succeeded, just auto-login failed - user can login manually
      }
      
      return record;
    } catch (error) {
      console.error('Signup error:', error);
      
      // Parse PocketBase error messages
      if (error.data?.data?.email?.message) {
        throw new Error('Email sudah terdaftar');
      } else if (error.message.includes('network')) {
        throw new Error('Koneksi error. Cek internet Anda.');
      } else if (error.status === 400) {
        throw new Error('Data tidak valid. Coba lagi.');
      }
      
      throw error;
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      await pb.collection('users').requestPasswordReset(email, { $autoCancel: false });
      
      const token = crypto.randomUUID().replace(/-/g, '');
      const expiresAt = new Date(Date.now() + 20 * 60000).toISOString();
      await pb.collection('passwordResetTokens').create({
        email,
        token,
        expiresAt,
        used: false
      }, { $autoCancel: false }).catch(() => {}); 
      
    } catch (error) {
      console.error("Password reset request error:", error);
    }
  };

  const resetPassword = async (token, newPassword) => {
    await pb.collection('users').confirmPasswordReset(token, newPassword, newPassword, { $autoCancel: false });
  };

  const value = {
    currentUser,
    login,
    logout,
    signup,
    requestPasswordReset,
    resetPassword,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
