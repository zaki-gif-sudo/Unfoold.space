# Notification System Setup Guide

## Overview
This real-time notification system provides:
- In-app notifications panel with unread badge counter
- Push notifications via Web Push API
- Background sync support
- Offline notification persistence
- Auto-redirect to relevant pages on notification click

## Key Files Created

### Backend (PocketBase)

1. **Migrations**
   - `pb_migrations/1776432000_create_notifications.js` - Notifications table
   - `pb_migrations/1776432001_create_push_subscriptions.js` - Push subscriptions storage

2. **Hooks** (Trigger notifications on events)
   - `pb_hooks/notifications.pb.js` - Core sendNotification() helper
   - `pb_hooks/order-notifications.pb.js` - Order status changes
   - `pb_hooks/rsvp-notifications.pb.js` - Event RSVP/payment events
   - `pb_hooks/reservation-notifications.pb.js` - Booking confirmations
   - `pb_hooks/moments-notifications.pb.js` - Photo uploads, likes, comments
   - `pb_hooks/loyalty-notifications.pb.js` - Points & tier upgrades

### Frontend (React)

1. **Context**
   - `src/contexts/NotificationContext.jsx` - State management & real-time sync

2. **Components**
   - `src/components/NotificationBell.jsx` - Bell icon with unread badge
   - `src/components/NotificationPanel.jsx` - Dropdown panel for notifications

3. **Utilities**
   - `src/utils/push-notification.js` - VAPID subscription & SW initialization

4. **Service Worker**
   - `public/service-worker.js` - Updated with push handlers

5. **CSS**
   - `src/styles/notification-bell.css` - Bell styles with earth-tone palette
   - `src/styles/notification-panel.css` - Panel dropdown styles

## Setup Instructions

### 1. Generate VAPID Keys ✅ (Already Done!)
```bash
# Keys have been generated and saved to:
# - Public key: apps/web/.env.local (VITE_VAPID_PUBLIC_KEY)
# - Private key: Keep safe if needed for backend

# The script used:
node generate-vapid.js

# Keys are ready to use!
```

### 2. Environment Setup ✅ (Already Done!)
```bash
# File: /apps/web/.env.local
# Already configured with generated keys
VITE_VAPID_PUBLIC_KEY=BCz53E3BrX344cD6fkhzRPlLOMA2Mc84Cnt7Y-z090_BlegkTINsPylD7GMGhO4YAMwNQOGxI7qdpY_ccCVPg_I
VITE_POCKETBASE_URL=http://localhost:8090
VITE_NOTIFICATIONS_OPTIONAL=true
```

### 3. Run Migrations
```bash
cd apps/pocketbase
./pocketbase migrate
```

### 4. Frontend Integration
- Already added to `src/App.jsx` via `<NotificationProvider>`
- `NotificationBell` is in the Header navbar
- Push initialization happens on login

### 5. Create Collections (if using default PocketBase UI)
If migrations don't run automatically, create these collections:

**notifications**
- user_id (text)
- type (text) - e.g., "order:update", "event:rsvp"
- title (text)
- body (text)
- payload (json)
- url (text)
- is_read (boolean, default: false)
- created_at (autodate)

**push_subscriptions**
- user_id (text)
- endpoint (text)
- p256dh (text)
- auth (text)
- updated_at (autodate)

## Notification Types

| Event | Type | Redirect |
|-------|------|----------|
| Order status change | `order:update` | `/orders/{id}` |
| RSVP success | `event:rsvp` | `/events/{id}` |
| Event payment | `event:payment-success` | `/events/{id}` |
| Reservation confirmed | `reservation:confirmed` | `/reservations/{id}` |
| Reservation update | `reservation:updated` | `/reservations/{id}` |
| Photo upload | `moments:upload` | `/moments/{id}` |
| Photo like | `moments:like` | `/moments/{id}` |
| Photo comment | `moments:comment` | `/moments/{id}` |
| Points earned | `loyalty:points-earned` | `/loyalty` |
| Tier upgrade | `loyalty:tier-up` | `/loyalty` |

## Features

### ✅ In-App Notifications
- Dropdown panel in the navbar (bell icon)
- Badge counter shows unread count
- Click to read and redirect to relevant page
- Delete or mark as read individually
- "Mark all as read" button

### ✅ Push Notifications
- Desktop notifications via Web Push API
- Triggered when push_subscriptions table updated
- User can grant/deny permission on first login
- Subscription stored per user

### ✅ Real-time Updates
- PocketBase realtime subscriptions for in-app updates
- Service Worker message passing for SW-originated notifications

### ✅ Offline Support
- Notifications persisted in database
- Loaded on app startup/reconnect
- Service Worker caches notification logic

### ✅ Style
- Monochrome + earth-tone palette (#b38b6d, #8b7355, #5a4a3f)
- Smooth transitions & animations
- Mobile responsive

## Backend Trigger Examples

### Order Status Update
```javascript
// In pb_hooks/order-notifications.pb.js
onRecordUpdate(
  (e) => e.collection.name === "orders",
  (e) => {
    if (e.changedFields.status) {
      const newStatus = e.changedFields.status[1];
      sendNotification(
        order.user_id,
        "order:update",
        `Order #${orderId}`,
        `Status: ${newStatus}`,
        `/orders/${orderId}`,
        { orderId, status: newStatus }
      );
    }
  }
);
```

### Auto-send similar notifications for other events

## Testing Locally

1. **Start PocketBase**
   ```bash
   cd apps/pocketbase
   ./pocketbase serve
   ```

2. **Start Frontend Dev Server**
   ```bash
   cd apps/web
   npm run dev
   ```

3. **Test Notifications**
   - Login to create user + push subscription
   - Manually update order status in PocketBase Admin
   - See notification appear in app

4. **Test Push Notifications** (requires HTTPS)
   - Deploy to staging with HTTPS
   - Backend sends push via VAPID
   - SW receives and displays

## Security & Rate Limiting

### PocketBase Rules
- Notifications: Only user can read/update their own
- Subscriptions: Only authenticated users can create

### Rate Limiting
Add to `notifications.pb.js` if needed:
```javascript
// Simple token bucket rate limiter
const rateLimits = {};
const LIMIT = 10; // max per minute
const WINDOW = 60000;

function checkRateLimit(userId) {
  const now = Date.now();
  const key = userId;
  
  if (!rateLimits[key]) {
    rateLimits[key] = [];
  }
  
  rateLimits[key] = rateLimits[key].filter(t => now - t < WINDOW);
  
  if (rateLimits[key].length >= LIMIT) {
    return false;
  }
  
  rateLimits[key].push(now);
  return true;
}
```

## Troubleshooting

### Push notifications not appearing
1. Check VAPID_PUBLIC_KEY in .env
2. Verify service worker is registered (`chrome://serviceworker-internals/`)
3. Check browser notification permissions

### Notifications not syncing real-time
1. Check PocketBase realtime is enabled
2. Verify WebSocket connection in DevTools Network tab
3. Check NotificationContext is wrapped in App

### Collection access denied errors
1. Verify PocketBase migration ran
2. Check collection rules allow authenticated users
3. Try creating collections manually

## Next Steps

1. **Email channels**: Integrate SendGrid for RSVP/critical emails
2. **SMS notifications**: Add Twilio for urgent alerts
3. **Analytics**: Track notification open rates
4. **Persistence**: Add IndexedDB caching for offline
5. **Scheduling**: Add cron jobs for reminder notifications (RSVP 1-24h before)
