# Notification System - Complete Code Examples & Testing

## 🚀 Quick Start Test

### 1. Verify Collections Created
```bash
# SSH into PocketBase or use admin UI
# Check that these collections exist:
# - notifications
# - push_subscriptions
```

### 2. Test Order Notification
```bash
# Via PocketBase Admin UI:
# 1. Go to orders collection
# 2. Create a test record:
{
  "user_id": "your_user_id",
  "item_name": "Cappuccino",
  "status": "pending",
  ...other fields
}

# 3. Update it:
# Change status: pending → ready

# 4. Expected result:
# - Notification appears in app panel
# - Badge counter increments
# - If SW subscribed: desktop notification appears
```

## 📝 Example: Custom Notification Endpoint

If you need a manual endpoint to trigger notifications:

```javascript
// Add to your PocketBase hooks or route handler
routerAdd(
  "POST",
  "/api/notify/:userId",
  (e) => {
    const userId = e.urlPath("userId");
    const body = e.request.json();
    
    // Check admin auth
    if (!e.admin) {
      throw new Error("Admin access required");
    }
    
    // Call sendNotification
    sendNotification(
      userId,
      body.type || "custom:message",
      body.title,
      body.body,
      body.url || "/",
      body.payload || {}
    );
    
    e.json(200, { success: true });
  },
  $apis.requireAdminAuth()
);

// Usage:
// curl -X POST http://localhost:8090/api/notify/user123 \
//   -H 'Authorization: Bearer admin_token' \
//   -d '{
//     "type": "announcement:news",
//     "title": "New Menu Item!",
//     "body": "Try our new Matcha Latte",
//     "url": "/menu",
//     "payload": {}
//   }'
```

## 🧪 Frontend Testing

### Test 1: Notification Panel
```javascript
// In browser console (when logged in):

// Check NotificationContext state
import { NotificationContext } from './contexts/NotificationContext.jsx';
// Check notifications, unreadCount

// Manually add test notification (admin only):
pb.collection('notifications').create({
  user_id: pb.authStore.model.id,
  type: 'test:manual',
  title: 'Test Notification',
  body: 'This is a test',
  url: '/',
  is_read: false
});

// Should see it appear immediately in panel
```

### Test 2: Badge Counter
```javascript
// Check that badge updates
// Open DevTools Elements
// Find <span class="notification-badge">N</span>
// Create/delete notifications
// Badge should update without page reload
```

### Test 3: Real-time Sync
```javascript
// Open app in two browser windows
// In window 1: Create notification via admin
// In window 2: Should appear immediately
// Verifies PocketBase realtime working
```

### Test 4: Navigation on Click
```javascript
// In notification panel
// Click any notification
// Should mark as read (loses bold)
// Should navigate to the URL
// Should close panel
```

## ⚙️ Manual Testing: Order Flow

```
Step 1: Create Order
POST /api/collections/orders
{
  "user_id": "logged_in_user",
  "item_name": "Espresso",
  "size": "medium",
  "status": "pending"
}

Step 2: Trigger Notification
PATCH /api/collections/orders/{order_id}
{
  "status": "ready"
}

Step 3: Verify
- Check notifications table
- Should have one record:
  type: "order:update"
  title: "Order #abc123"
  body: "Espresso is now Ready for pickup"

- Check frontend
- Notification should appear

- Check browser notification
  (if subscribed to push)
```

## 📧 Testing Push Notifications (Local HTTPS)

### Option 1: ngrok tunnel
```bash
cd apps/web
npm run dev

# In another terminal
ngrok http 5173

# Use ngrok URL as localhost
```

### Option 2: localhost with self-signed cert
```bash
# Create cert
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update vite.config.js
export default {
  server: {
    https: {
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./cert.pem'),
    },
    host: 'localhost',
    port: 5173,
  },
};

npm run dev
# Open https://localhost:5173
```

## 🔍 Debug: Service Worker Issues

```javascript
// In browser console

// Check if registered
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registered SWs:', regs);
});

// Check if subscribed to push
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Push subscription:', sub);
  });
});

// Check notification permission
console.log('Notification.permission:', Notification.permission);

// Request permission
Notification.requestPermission().then(perm => {
  console.log('Permission result:', perm);
});

// Test push locally (simulate backend)
navigator.serviceWorker.ready.then(reg => {
  const testData = {
    title: 'Test Push',
    body: 'This is a test notification',
    data: { url: '/', notificationId: 'test123' }
  };
  reg.active.postMessage({
    type: 'test-push',
    payload: testData
  });
});
```

## 🐛 Debug: Realtime Not Working

```javascript
// In browser console

// Check WebSocket connection
pb.realtime?.subscribe('notifications', data => {
  console.log('Realtime event:', data);
});

// Check auth
console.log('Auth token:', pb.authStore.token);
console.log('User:', pb.authStore.model);

// Check collection permissions
// PocketBase Admin → Collections → notifications
// Verify read rule includes current user
```

## 📊 Monitoring: Check Notifications in DB

```javascript
// Via cURL (PocketBase)
curl -X GET "http://localhost:8090/api/collections/notifications/records" \
  -H "Authorization: Bearer <user_token>" \
  -H "Accept: application/json"

// Response:
{
  "page": 1,
  "perPage": 30,
  "totalItems": 5,
  "items": [
    {
      "id": "abc123",
      "user_id": "user789",
      "type": "order:update",
      "title": "Order #abc123",
      "body": "Status changed to ready",
      "is_read": false,
      "created_at": "2026-03-10T...",
      ...
    }
  ]
}
```

## 🔧 Performance: Query Optimization

### Add DB indexes (PocketBase - via code/UI)
```javascript
// Recommended indexes:
// notifications(user_id, created_at DESC)
// notifications(user_id, is_read)
// push_subscriptions(user_id) PRIMARY
```

### Pagination in NotificationContext
```javascript
// Update to load in pages instead of all at once:
const NOTIFICATIONS_PER_PAGE = 20;

const [page, setPage] = useState(1);

const fetchNotifications = async (p) => {
  const records = await pb.collection('notifications').getList(p, NOTIFICATIONS_PER_PAGE, {
    sort: '-created_at',
    filter: `user_id = "${pb.authStore.model.id}"`
  });
  setNotifications(records.items);
};

// On scroll to bottom, increase page
```

## 🚨 Error Handling

### Common Errors & Fixes

**Error: "Push notification permission denied"**
- Solution: Check browser notification settings
- Settings → Privacy → Notifications → Allow site

**Error: "VAPID_PUBLIC_KEY not configured"**
- Solution: Add to .env.local
- VITE_VAPID_PUBLIC_KEY=your_key_here

**Error: "Service Worker failed to register"**
- Solution: Check browser console for details
- Verify /service-worker.js exists
- Check for syntax errors in SW

**Error: "Notification collection access denied"**
- Solution: Check collection rules
- Admin UI → Collections → notifications
- Verify read rule: @request.auth.id = user_id

**Error: "WebSocket connection failed"**
- Solution: Check PocketBase realtime enabled
- Admin UI → Settings → Enable Realtime

## ✅ Acceptance Criteria Checklist

- [ ] Order status change triggers notification
- [ ] RSVP payment success shows notification
- [ ] Reservation confirmation appears
- [ ] Photo upload notifies followers
- [ ] Likes/comments notify photo owner
- [ ] Points earned shows notification
- [ ] Tier upgrade shows congratulations notif
- [ ] Badge counter accurate
- [ ] Click notification navigates correctly
- [ ] Mark as read works
- [ ] Delete notification works
- [ ] Offline notifications persist
- [ ] Push notification shows desktop alert
- [ ] Service Worker installed
- [ ] Push subscription saved to DB
- [ ] Real-time sync works (2 windows)
- [ ] Notifications load on page refresh
- [ ] Mobile responsive UI
- [ ] Earth-tone styling consistent
- [ ] No console errors

## 📋 Production Deployment Checklist

- [ ] Generate real VAPID keys (not test ones)
- [ ] Set VITE_VAPID_PUBLIC_KEY in production .env
- [ ] Store VAPID private key securely on backend
- [ ] Enable PocketBase realtime
- [ ] Add database indexes for performance
- [ ] Test push notifications on production domain
- [ ] Setup HTTPS certificate (required for SW & push)
- [ ] Monitor push delivery rate
- [ ] Setup error logging for failed pushes
- [ ] Rate limit notifications to users
- [ ] Archive old notifications (>30 days)
- [ ] Setup monitoring/alerts for push failures

## 🎓 Next Learning: Advanced Features

### Email Notifications
```javascript
// In sendNotification():
if (type.includes('payment') || type.includes('tier')) {
  await sendEmail(userId, emailTemplate, { title, body });
}
```

### SMS Notifications
```javascript
// For critical alerts:
if (type === 'reservation:confirmed' && urgent) {
  await sendSMS(userPhone, body);
}
```

### Scheduled Reminders
```javascript
// RSVP reminder 1 day before:
onRecordCreate('eventRegistrations', (e) => {
  const eventId = e.record.event_id;
  const event = dao().findRecordById('events', eventId);
  const remindTime = new Date(event.date) - 24*3600*1000;
  
  // Schedule cron job to send at remindTime
  scheduleJob(remindTime, () => {
    sendNotification(userId, 'event:reminder', ...);
  });
});
```

### Notification Preferences
```javascript
// Let users opt-in/out per category:
userPreferences collection:
  - user_id
  - orders_notifications: boolean
  - events_notifications: boolean
  - moments_notifications: boolean
  - loyalty_notifications: boolean
  - push_enabled: boolean

// Check in sendNotification():
const prefs = dao().findRecordsByFilter(
  'userPreferences',
  `user_id = "${userId}"`
)[0];

if (!prefs.orders_notifications && type.startsWith('order:')) {
  return; // Skip
}
```
