const CACHE_NAME = 'unfoold-cache-v3';
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

  // Cache-first strategy for static assets (CSS, JS, Fonts, Images)
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/) || 
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

  // Network-first strategy for API calls and HTML navigation
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/offline') || caches.match('/index.html');
          }
          return new Response('Offline content not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

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