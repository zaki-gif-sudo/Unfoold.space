// src/contexts/NotificationContext.jsx

import { createContext, useEffect, useState, useCallback } from 'react';
import pb from '../lib/pocketbaseClient.js';

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!pb.authStore.model) return;
        
        const records = await pb.collection('notifications').getList(1, 50, {
          sort: '-created_at',
          filter: `user_id = "${pb.authStore.model.id}"`,
        });
        
        setNotifications(records.items || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Subscribe to new notifications via PocketBase realtime
  useEffect(() => {
    if (!pb.authStore.model) return;

    const unsubscribe = pb.collection('notifications').subscribe('*', (e) => {
      if (e.action === 'create' && e.record.user_id === pb.authStore.model.id) {
        setNotifications(prev => [e.record, ...prev]);
      } else if (e.action === 'update') {
        setNotifications(prev =>
          prev.map(n => n.id === e.record.id ? e.record : n)
        );
      } else if (e.action === 'delete') {
        setNotifications(prev => prev.filter(n => n.id !== e.record.id));
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen for service worker messages (push notifications)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (e) => {
      if (e.data?.type === 'NEW_NOTIFICATION') {
        const notif = e.data.payload;
        setNotifications(prev => [notif, ...prev]);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useCallback(async (id) => {
    try {
      const updated = await pb.collection('notifications').update(id, { is_read: true });
      setNotifications(prev =>
        prev.map(n => n.id === id ? updated : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await pb.collection('notifications').delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await Promise.all(
        notifications
          .filter(n => !n.is_read)
          .map(n => pb.collection('notifications').update(n.id, { is_read: true }))
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        deleteNotification,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
