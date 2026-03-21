import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import pb from '../lib/pocketbaseClient.js';

const VAPID_PUBLIC_KEY = 'BCeYYMFfCv9B18ap10N0N95XpD9uIBnXh2VqGRAb4NdsqUaySlvugYnVCDUflrwDdqb4wqjcuzDVcMMeIiaqO6Y';

// Pre-create audio context on first user interaction (required by mobile browsers)
let audioCtx = null;
let audioUnlocked = false;

const unlockAudio = () => {
  if (audioUnlocked) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
    audioUnlocked = true;
  } catch (e) {}
};

if (typeof window !== 'undefined') {
  ['touchstart', 'touchend', 'click', 'keydown'].forEach(evt => {
    document.addEventListener(evt, unlockAudio, { once: false, passive: true });
  });
}

const playNotificationSound = () => {
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const chime = [
      { freq: 880, start: 0, dur: 0.15, vol: 0.4 },
      { freq: 1108.73, start: 0.18, dur: 0.15, vol: 0.4 },
      { freq: 1318.51, start: 0.36, dur: 0.4, vol: 0.5 },
    ];
    chime.forEach(({ freq, start, dur, vol }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });
    chime.forEach(({ freq, start, dur, vol }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq * 2;
      gain.gain.setValueAtTime(vol * 0.2, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });
  } catch (e) {
    console.warn('Sound playback failed:', e);
  }
};

// Convert URL-safe base64 to Uint8Array for push subscription
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Subscribe to Web Push and save subscription to PocketBase
async function subscribeToPush(userId) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push not supported');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const subJSON = subscription.toJSON();
    const endpoint = subJSON.endpoint;
    const p256dh = subJSON.keys.p256dh;
    const auth = subJSON.keys.auth;

    // Check if this subscription already exists in PocketBase
    try {
      const existing = await pb.collection('push_subscriptions').getList(1, 1, {
        filter: `user_id="${userId}" && endpoint="${endpoint.replace(/"/g, '\\"')}"`,
      });

      if (existing.items.length > 0) {
        // Update existing subscription (keys may have changed)
        await pb.collection('push_subscriptions').update(existing.items[0].id, {
          p256dh: p256dh,
          auth: auth,
        });
        console.log('Push subscription updated');
        return;
      }
    } catch (e) {
      // Collection might not exist yet or filter error, continue to create
      console.log('Push subscription check failed, creating new:', e?.message);
    }

    // Save subscription to PocketBase
    await pb.collection('push_subscriptions').create({
      user_id: userId,
      endpoint: endpoint,
      p256dh: p256dh,
      auth: auth,
    });

    console.log('Push subscription saved');
  } catch (err) {
    console.error('Push subscription failed:', err);
  }
}

const OrderNotificationListener = () => {
  const { currentUser } = useAuth();
  const toastRef = useRef(null);

  // Remove toast
  const dismissToast = () => {
    if (toastRef.current) {
      toastRef.current.remove();
      toastRef.current = null;
    }
  };

  // Show toast notification
  const showOrderReadyToast = (orderId) => {
    dismissToast();

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      z-index: 99999; max-width: 420px; width: calc(100% - 32px);
      background: linear-gradient(135deg, #10b981, #059669);
      color: white; padding: 16px 20px; border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      display: flex; align-items: center; gap: 12px;
      animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer; font-family: system-ui, sans-serif;
    `;

    toast.innerHTML = `
      <div style="font-size: 32px; flex-shrink: 0;">☕</div>
      <div style="flex: 1;">
        <div style="font-weight: 700; font-size: 16px; margin-bottom: 2px;">Pesanan Siap! 🎉</div>
        <div style="font-size: 13px; opacity: 0.9;">Pesanan #${orderId.slice(0, 8).toUpperCase()} sudah siap diambil</div>
      </div>
      <button style="background:rgba(255,255,255,0.2); border:none; color:white; width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center;">✕</button>
    `;

    // Add animation keyframes if not exists
    if (!document.getElementById('order-notif-style')) {
      const style = document.createElement('style');
      style.id = 'order-notif-style';
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-100px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(0); opacity: 1; }
          to { transform: translateX(-50%) translateY(-100px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    toast.onclick = dismissToast;
    toast.querySelector('button').onclick = (e) => {
      e.stopPropagation();
      dismissToast();
    };

    document.body.appendChild(toast);
    toastRef.current = toast;

    // Auto dismiss after 10 seconds
    setTimeout(() => {
      if (toastRef.current === toast) {
        toast.style.animation = 'slideUp 0.3s ease-in forwards';
        setTimeout(dismissToast, 300);
      }
    }, 10000);
  };

  useEffect(() => {
    if (!currentUser) return;

    const userId = currentUser.id;
    let unsubscribe = null;

    // Subscribe to Web Push notifications (works even when site is closed)
    subscribeToPush(userId);

    // Listen for service worker messages (when push arrives while site is open)
    const handleSWMessage = (event) => {
      if (event.data?.type === 'PUSH_NOTIFICATION') {
        playNotificationSound();
        const tag = event.data.payload?.tag || '';
        const orderId = tag.replace('order-ready-', '');
        if (orderId) showOrderReadyToast(orderId);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    // Also keep realtime subscription for when the page is open
    let retryTimer = null;
    const subscribe = async () => {
      try {
        unsubscribe = await pb.collection('orders').subscribe('*', (e) => {
          if (e.action === 'update' && e.record.userId === userId && e.record.status === 'ready') {
            playNotificationSound();
            showOrderReadyToast(e.record.id);
          }
        }, { $autoCancel: false });
        console.log('Order realtime subscription active');
      } catch (err) {
        console.error('Failed to subscribe to order updates, retrying in 5s:', err);
        retryTimer = setTimeout(subscribe, 5000);
      }
    };

    subscribe();

    return () => {
      if (unsubscribe) {
        pb.collection('orders').unsubscribe('*');
      }
      if (retryTimer) clearTimeout(retryTimer);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
      dismissToast();
    };
  }, [currentUser]);

  return null; // This component only listens, no UI
};

export default OrderNotificationListener;
