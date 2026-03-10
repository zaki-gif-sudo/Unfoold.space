
import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { initializePushNotifications } from '@/utils/push-notification.js';

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
      
      // Initialize push notifications after successful login
      await initializePushNotifications().catch(err => 
        console.log('Push notifications not available:', err)
      );
      
      // Clear attempts on success
      setLoginAttempts(prev => {
        const newAttempts = { ...prev };
        delete newAttempts[email];
        return newAttempts;
      });
      
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
      
      throw new Error('Incorrect email or password. Please try again.');
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
  };

  const signup = async (data) => {
    const record = await pb.collection('users').create({
      ...data,
      loyaltyPoints: 0,
      membershipLevel: 'Coffee Guest'
    }, { $autoCancel: false });
    await login(data.email, data.password);
    return record;
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
