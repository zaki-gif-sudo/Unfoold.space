const CACHE_NAME = 'unfoold-cache-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline',
  'https://horizons-cdn.hostinger.com/13222a4f-1f4e-4729-8f8a-40893789af3d/a43b5512ea4f27d91a3517ce14f19e8c.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // NEVER intercept API calls, PocketBase, push service, or WebSocket connections
  // This prevents the SW from hanging/blocking API requests
  if (
    url.hostname.includes('api.unfoold.space') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/push/') ||
    url.pathname.includes('/_/') ||
    event.request.url.includes('/api/') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:'
  ) {
    return; // Let browser handle it directly
  }

  // Cache-first strategy for CDN/font assets only
  if (
    url.hostname.includes('horizons-cdn') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchRes) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        });
      })
    );
    return;
  }

  // Network-first for same-origin navigation (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For other static assets (.js, .css, images) - network first with cache fallback
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
});

// ============ Push Notification Handlers ============

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Notification',
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || '',
    icon: 'https://horizons-cdn.hostinger.com/13222a4f-1f4e-4729-8f8a-40893789af3d/a43b5512ea4f27d91a3517ce14f19e8c.jpg',
    badge: 'https://horizons-cdn.hostinger.com/13222a4f-1f4e-4729-8f8a-40893789af3d/a43b5512ea4f27d91a3517ce14f19e8c.jpg',
    tag: data.tag || 'notification',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      { action: 'open', title: 'Lihat Pesanan' },
      { action: 'dismiss', title: 'Tutup' }
    ],
    data: {
      url: data.data?.url || '/dashboard',
    },
  };

  event.waitUntil(
    self.registration
      .showNotification(data.title || 'Unfoold', options)
      .then(() => {
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'PUSH_NOTIFICATION',
              payload: {
                title: data.title,
                body: data.body,
                url: data.data?.url,
                tag: data.tag,
              },
            });
          });
        });
      })
      .catch((err) => console.error('Failed to show notification:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';
  const action = event.action;

  if (action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Try to find and focus existing window
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        if ('focus' in client) {
          return client.focus().then((c) => {
            c.postMessage({ type: 'NAVIGATE', url: url });
            return c;
          });
        }
      }
      // If not found, open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// ============ Background Sync Handlers ============

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
  if (event.tag === 'sync-reservations') {
    event.waitUntil(syncReservations());
  }
  if (event.tag === 'sync-discussions') {
    event.waitUntil(syncDiscussions());
  }
});

async function syncOrders() {
  console.log('Background sync for orders triggered');
  // Logic to sync orders from IndexedDB/localStorage to server
}

async function syncReservations() {
  console.log('Background sync for reservations triggered');
  // Logic to sync reservations from IndexedDB/localStorage to server
}

async function syncDiscussions() {
  console.log('Background sync for discussions triggered');
  // Logic to sync discussions from IndexedDB/localStorage to server
}