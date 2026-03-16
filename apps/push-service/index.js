const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

// VAPID keys for Web Push
const VAPID_PUBLIC_KEY = 'BCeYYMFfCv9B18ap10N0N95XpD9uIBnXh2VqGRAb4NdsqUaySlvugYnVCDUflrwDdqb4wqjcuzDVcMMeIiaqO6Y';
const VAPID_PRIVATE_KEY = 'DuxgacwwSK08EWwWbHEp5TphFfP8K3TP2lTinSTF2VQ';
const PB_URL = 'http://127.0.0.1:8090';

webpush.setVapidDetails(
  'mailto:admin@unfoold.space',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Helper: fetch from PocketBase internal API
async function pbFetch(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, PB_URL);
    console.log('[pbFetch] GET', url.href);
    http.get(url.href, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          console.error('[pbFetch] Invalid JSON:', data.substring(0, 200));
          reject(new Error('Invalid JSON from PB'));
        }
      });
    }).on('error', (err) => {
      console.error('[pbFetch] Request error:', err.message);
      reject(err);
    });
  });
}

// Send push notification to a user
app.post('/send-push', async (req, res) => {
  const { userId, title, body, url, tag } = req.body;
  console.log('[send-push] Request:', { userId, title, tag });

  if (!userId || !title) {
    return res.status(400).json({ error: 'userId and title required' });
  }

  try {
    // Get all push subscriptions for this user from PocketBase
    const filter = encodeURIComponent(`user_id="${userId}"`);
    const result = await pbFetch(
      `/api/collections/push_subscriptions/records?filter=${filter}&perPage=50`
    );

    if (!result.items || result.items.length === 0) {
      console.log('[send-push] No subscriptions for user', userId);
      return res.json({ sent: 0, message: 'No push subscriptions found for user' });
    }

    console.log('[send-push] Found', result.items.length, 'subscriptions for user', userId);

    const payload = JSON.stringify({
      title: title,
      body: body || '',
      tag: tag || 'order-notification',
      data: { url: url || '/dashboard' }
    });

    let sent = 0;
    let failed = 0;

    for (const sub of result.items) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
      } catch (err) {
        console.error(`Push failed for sub ${sub.id}:`, err.statusCode || err.message);
        failed++;
        // If subscription is expired/invalid (410 Gone), delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
          try {
            const deleteUrl = new URL(`/api/collections/push_subscriptions/records/${sub.id}`, PB_URL);
            const deleteReq = http.request(deleteUrl.href, { method: 'DELETE' });
            deleteReq.end();
          } catch (e) { /* ignore cleanup errors */ }
        }
      }
    }

    res.json({ sent, failed, total: result.items.length });
    console.log('[send-push] Result:', { sent, failed, total: result.items.length });
  } catch (err) {
    console.error('[send-push] Error:', err.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'push-service' });
});

// Get VAPID public key (for frontend)
app.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

const PORT = 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Push service running on http://127.0.0.1:${PORT}`);
});
