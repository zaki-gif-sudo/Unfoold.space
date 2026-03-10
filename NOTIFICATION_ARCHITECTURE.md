# Real-Time Notification System - Architecture & Flow

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER (PWA)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐   ┌──────────────────┐                │
│  │  React App       │   │  Service Worker  │                │
│  │ ┌──────────────┐ │   │ ┌──────────────┐ │                │
│  │ │ NotificationBell  │   │ Push Event   │ │                │
│  │ │ (badge: N)   │ │   │ Handler      │ │                │
│  │ └──────────────┘ │   │ ┌──────────────┐ │                │
│  │ ┌──────────────┐ │   │ │ Notification │ │                │
│  │ │ Notif Panel  │ │   │ │ Click Handler│ │                │
│  │ └──────────────┘ │   │ └──────────────┘ │                │
│  └─────────┬────────┘   └─────────┬────────┘                │
│            │                      │                          │
│  ┌─────────▼──────────────────────▼────────┐                │
│  │    NotificationContext (State)           │                │
│  │  - list: Notification[]                  │                │
│  │  - unreadCount: number                   │                │
│  │  - markAsRead(id)                        │                │
│  │  - delete(id)                            │                │
│  └────────────┬─────────────────────────────┘                │
│               │                                               │
└───────────────┼──────────────────────────────────────────────┘
                │
   ┌────────────┼──────────────────┐
   │ Real-Time  │                  │
   │ Connection │                  │
   ▼            ▼                  ▼
┌──────────────────────────────────────────┐
│   POCKETBASE BACKEND (Go)                │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────────────────────┐  │
│  │ Event Triggers (pb_hooks/)       │  │
│  │ - onRecordUpdate(orders) ────┐   │  │
│  │ - onRecordCreate(events) ──┐ │   │  │
│  │ - onRecordUpdate(users) ──┐ │ │   │  │
│  │ - onRecordCreate(moments) ─┼─┼─┐ │  │
│  └──────────────────────────────┼─┼─┼──┘  │
│                                │ │ │  │
│  ┌──────────────────────────────▼─▼─▼──┐  │
│  │   sendNotification()                │  │
│  │   ┌─────────────────────────────┐   │  │
│  │   │ 1. Persist in DB            │   │  │
│  │   │ 2. Emit realtime event      │   │  │
│  │   │ 3. Send push (if sub exists)│   │  │
│  │   └─────────────────────────────┘   │  │
│  └──────────┬──────────────┬─────┬──────┘  │
│             │              │     │         │
└─────────────┼──────────────┼─────┼─────────┘
              │              │     │
    ┌─────────▼──────┐  ┌────▼──────────────┐
    │ notifications  │  │ push_subscriptions│
    │ Collection     │  │ Collection        │
    │ - id           │  │ - user_id         │
    │ - user_id      │  │ - endpoint        │
    │ - type         │  │ - p256dh          │
    │ - title        │  │ - auth            │
    │ - body         │  └───────────────────┘
    │ - url          │
    │ - is_read      │
    │ - payload      │
    │ - created_at   │
    └────┬───────────┘
         │
    ┌────▼────────────────┐
    │ (a) Realtime Event  │
    │  → Frontend context │
    │    updates UI       │
    │                     │
    │ (b) Web Push        │
    │  (if subscribed)    │
    │  → Browser SW       │
    │    shows toast      │
    └─────────────────────┘
```

## 🔄 Notification Flow by Type

### Type 1: Order Status Update
```
User updates order in PocketBase Admin
           ↓
onRecordUpdate(orders) hook fires
           ↓
Checks if status changed (pending → ready)
           ↓
sendNotification(userId, "order:update", ...)
           ↓
┌─────────────────────────────────┐
│ DB: INSERT into notifications   │
│     order_id, status, timestamp │
└──────────┬──────────────────────┘
           │
           ├─→ PocketBase Realtime Event
           │   → NotificationContext refetch
           │   → Badge count +1
           │   → Panel shows new notif
           │
           └─→ Push subscription exists?
               YES → sendWebPush(subscription)
               → Service Worker push event
               → showNotification(title, body)
               → User sees desktop toast

User clicks desktop toast
           ↓
notificationclick event in SW
           ↓
SW calls client.openWindow(url)
           ↓
redirect to /orders/:id
```

### Type 2: RSVP + Payment Success
```
User completes payment for event
           ↓
Payment service updates eventRegistrations
           ↓
onRecordUpdate(eventRegistrations) hook fires
           ↓
Checks if payment_status = "completed"
           ↓
sendNotification(userId, "event:payment-success", ...)
           ↓
(same flow as Type 1)
           ↓
Optional: Schedule reminder notification 1-24h before
```

### Type 3: Reservation Booking
```
User creates new reservation
           ↓
onRecordCreate(reservations) hook fires
           ↓
sendNotification(userId, "reservation:confirmed", ...)
           ↓
(same persistence + realtime + push)
```

### Type 4: Moments / Photo Interactions
```
User uploads photo to moments collection
           ↓
onRecordCreate(moments) hook fires
           ↓
Query: Find all users following this uploader
       AND users registered for this event
           ↓
Loop through followers:
  sendNotification(followerId, "moments:upload", ...)
           ↓
(same flow for each follower)

User 2 likes the photo (momentLikes insert)
           ↓
onRecordCreate(momentLikes) hook fires
           ↓
sendNotification(uploaderId, "moments:like", ...)

User 3 comments (momentComments insert)
           ↓
onRecordCreate(momentComments) hook fires
           ↓
sendNotification(uploaderId, "moments:comment", ...)
```

### Type 5: Loyalty Rewards
```
User places order worth 150 points
           ↓
Order processing updates users.loyaltyPoints
           ↓
onRecordUpdate(users) hook fires
           ↓
Checks if loyaltyPoints increased
           ↓
sendNotification(userId, "loyalty:points-earned", ...)
           ↓
(same persistence + realtime + push)

If points trigger tier upgrade:
updateUser(membershipLevel: "Coffee Regular" → "Coffee Enthusiast")
           ↓
onRecordUpdate(users) hook fires again
           ↓
Detects membershipLevel changed
           ↓
sendNotification(userId, "loyalty:tier-up", ...)
```

## 🔌 Real-Time Sync Mechanism

### On Frontend:
```
NotificationContext useEffect ┐
  1. Initial fetch              │
     GET /api/collections/notifications
                                │
  2. Subscribe to realtime      │
     PocketBase.subscribe('*')  ├─→ Updates state
                                │
  3. Listen to SW messages      │
     navigator.serviceWorker    │
     addEventListener('message')│
                                ▼
Each triggers: setNotifications(...)
     ↓
React re-renders
     ↓
NotificationBell badge +1
NotificationPanel shows new item
```

### On Backend:
```
sendNotification() called
     ↓
Insert into notifications table
     ↓
PocketBase realizes realtime broadcast
    (subscribers to 'notifications' collection)
     ↓
Sends to all connected WebSocket clients
     ↓
Each browser receives update message
     ↓
NotificationContext updates → UI refreshes
```

## 🔐 Security & Authorization

### 1. Database Rules (PocketBase)
```javascript
notifications collection:
  listRule: @request.auth.id = user_id
  viewRule: @request.auth.id = user_id
  updateRule: @request.auth.id = user_id
  createRule: null (backend only)

push_subscriptions collection:
  listRule: @request.auth.id = user_id
  viewRule: @request.auth.id = user_id
  updateRule: @request.auth.id = user_id
  createRule: @request.auth.id != ''
```

### 2. VAPID Keys
- Public key: Safe to embed in frontend .env
- Private key: Only on backend (NOT in web code)
- Used to verify Web Push requests

### 3. Rate Limiting
```javascript
// Simple rate limit in notifications.pb.js
const MAX_NOTIFICATIONS_PER_MINUTE = 10;
// Check before sendNotification()
```

## 📱 Service Worker Flow

```
1. REGISTRATION (on login)
   ├─ navigator.serviceWorker.register('/service-worker.js')
   └─ pushManager.subscribe(VAPID_KEY)
      └─ Save subscription to DB

2. PUSH EVENT (backend sends)
   ├─ self.addEventListener('push', e)
   ├─ Parse e.data.json()
   ├─ self.registration.showNotification()
   └─ Post message to all clients
      └─ NotificationContext receives

3. NOTIFICATION CLICK
   ├─ self.addEventListener('notificationclick', e)
   ├─ Get URL from notification.data.url
   └─ self.clients.openWindow(url)

4. OFFLINE SUPPORT
   ├─ Push event queued by browser
   ├─ User reconnects
   ├─ SW receives queued push
   └─ Shows notification
```

## 🎨 UI Component Hierarchy

```
<App>
  <NotificationProvider>  ← Context root
    <Header>
      <NotificationBell>  ← Bell icon + badge
         ↓ (click)
      <NotificationPanel> ← Dropdown list
       [Notifications]
        ├─ item 1
        ├─ item 2 (unread - bold)
        └─ item 3
           (onclick) → navigate(url)
                     → markAsRead(id)
```

## 📊 Data Models

### notifications table
```
{
  id: "abc123def456",
  user_id: "user789",           // Target user
  type: "order:update",          // Event type namespace
  title: "Order #abc123",        // Short title
  body: "Ready for pickup",      // Details
  url: "/orders/abc123",         // Click destination
  payload: {                     // Extra data
    orderId: "abc123",
    status: "ready"
  },
  is_read: false,
  created_at: "2026-03-10T..."
}
```

### push_subscriptions table
```
{
  id: "sub123abc",
  user_id: "user789",
  endpoint: "https://fcm.googleapis.com/...",
  p256dh: "BCkEAbcd...",
  auth: "XYZ123...",
  updated_at: "2026-03-10T..."
}
```

## 🌍 Scale Considerations

### Multi-User Support
- Each notification keyed to specific user_id
- Realtime filters by user permission
- Push sends to specific subscription endpoint

### High Throughput
- Use DB index on (user_id, created_at) for queries
- Consider message queue (Bull/Redis) for push batching
- Rate limit per user to prevent spam

### Retention Policy
- Keep notifications 30 days (configurable)
- Archive old records
- Archive old subscriptions (delete unused)

## 🧪 Testing Checklist

- [ ] Create order → status changes → notification appears
- [ ] RSVP for event → payment success notif
- [ ] Create reservation → booking confirmation
- [ ] Upload moment → followers receive notif
- [ ] Like/comment on moments → uploader notif
- [ ] Earn points → points notif
- [ ] Tier upgrade → tier notif
- [ ] Click notification → redirect works
- [ ] Badge counter increments/decrements
- [ ] Mark as read → removes unread indicator
- [ ] Offline → reconnect → persisted notifs load
- [ ] Desktop push → shows OS notification
- [ ] Service worker → register → subscribe flow

## 📞 Support & Extension

### To add new notification type:
1. Create hook in `pb_hooks/feature-notifications.pb.js`
2. Call `sendNotification(...)`
3. Add to redirect mapping in NotificationPanel
4. Update NOTIFICATION_SETUP.md table

### To add email channel:
1. Setup SendGrid/Mailgun API
2. Update sendNotification() to also send email
3. Add email template for critical events

### To add SMS:
1. Setup Twilio API
2. Add to sendNotification() for urgent alerts
3. Add user preference toggle
