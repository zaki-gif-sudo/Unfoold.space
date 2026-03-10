// src/utils/push-notification.js

import pb from '../lib/pocketbaseClient.js';

// Get your VAPID public key from environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Convert VAPID key to Uint8Array for subscription
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission and subscribe to push
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return null;
  }

  if (Notification.permission === 'granted') {
    return subscribeToPush();
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return subscribeToPush();
    }
  }

  return null;
}

/**
 * Subscribe user to push notifications
 */
export async function subscribeToPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push messaging is not supported');
      return null;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID_PUBLIC_KEY not configured');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Subscribe to push
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Send subscription to backend
      await sendSubscriptionToBackend(subscription);
    }

    return subscription;
  } catch (err) {
    console.error('Failed to subscribe to push notifications:', err);
    return null;
  }
}

/**
 * Send push subscription to PocketBase backend
 */
async function sendSubscriptionToBackend(subscription) {
  try {
    const userId = pb.authStore.model?.id;
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    // Check if subscription already exists
    const existing = await pb.collection('push_subscriptions').getList(1, 1, {
      filter: `user_id = "${userId}"`,
    });

    const subData = {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: arrayToBase64(subscription.getKey('p256dh')),
      auth: arrayToBase64(subscription.getKey('auth')),
    };

    if (existing.items.length > 0) {
      // Update existing subscription
      await pb.collection('push_subscriptions').update(existing.items[0].id, subData);
    } else {
      // Create new subscription
      await pb.collection('push_subscriptions').create(subData);
    }

    console.log('Push subscription saved to backend');
  } catch (err) {
    console.error('Failed to save subscription to backend:', err);
  }
}

/**
 * Convert Uint8Array to base64 string
 */
function arrayToBase64(array) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(array)));
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Delete from backend
      const userId = pb.authStore.model?.id;
      if (userId) {
        const existing = await pb.collection('push_subscriptions').getList(1, 1, {
          filter: `user_id = "${userId}"`,
        });
        if (existing.items.length > 0) {
          await pb.collection('push_subscriptions').delete(existing.items[0].id);
        }
      }

      // Unsubscribe from push
      await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications');
      return true;
    }

    return false;
  } catch (err) {
    console.error('Failed to unsubscribe from push notifications:', err);
    return false;
  }
}

/**
 * Register service worker and request permissions
 */
export async function initializePushNotifications() {
  try {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported');
      return false;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
    console.log('Service Worker registered:', registration);

    // Request notification permission and subscribe
    await requestNotificationPermission();
    return true;
  } catch (err) {
    console.error('Failed to initialize push notifications:', err);
    return false;
  }
}
