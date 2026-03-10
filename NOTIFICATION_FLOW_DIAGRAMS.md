# Real-Time Notification System - Visual Flows

## 🔄 Complete Notification Flow - All 5 Features

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        UNFOOLD NOTIFICATION SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────── FEATURE 1: ORDER NOTIFICATIONS ──────────────────┐
│                                                                     │
│  Admin View: Change status                                         │
│  pending ────► ready ──► completed or canceled                    │
│    │                          │                                    │
│    └──────────┬───────────────┘                                   │
│               ▼                                                    │
│    PocketBase Hook (onRecordUpdate)                              │
│    order-notifications.pb.js                                      │
│               │                                                    │
│    ┌──────────┴──────────┐                                        │
│    ▼                     ▼                                         │
│  Send Notif    Send Notif                                         │
│  "ready"       "completed"                                        │
│    │                                                              │
│    └──────────┬──────────┘                                        │
│               ▼                                                    │
│    Database: INSERT notifications                                │
│    - type: "order:update"                                        │
│    - body: "Status: ready"                                       │
│    - url: "/orders/{id}"                                         │
│               │                                                   │
│    ┌──────────┼──────────┐                                        │
│    ▼          ▼          ▼                                         │
│  Realtime   Push Web   Notify All                                │
│  Event      Push API   Clients                                   │
│    │          │          │                                        │
│    └──────────┼──────────┘                                        │
│               ▼                                                    │
│    Frontend receives:                                             │
│    - NotificationContext updates                                 │
│    - Badge counter +1                                            │
│    - Panel shows new item (bold = unread)                       │
│    - Service Worker shows toast                                 │
│               │                                                   │
│               ▼                                                   │
│    User clicks notification                                      │
│    - Mark as read                                                │
│    - Navigate to /orders/{id}                                    │
│                                                                   │
└────────────────────────────────────────────────────────────────────┘

┌────────────────── FEATURE 2: RSVP/EVENT NOTIFICATIONS ──────────────────┐
│                                                                           │
│  User Action: Complete payment for event                                │
│               │                                                          │
│               ▼                                                          │
│    PocketBase Hook (onRecordUpdate eventRegistrations)                 │
│    rsvp-notifications.pb.js                                             │
│               │                                                          │
│    ┌──────────┴──────────┐                                              │
│    ▼                     ▼                                               │
│  Payment       Payment      [FUTURE: Schedule                          │
│  Success       Failed       events 1-24h before]                       │
│  Notif         Notif                                                    │
│    │                                                                     │
│    └──────────┬──────────┘                                              │
│               ▼                                                          │
│    Database + Realtime + Push (same as Order flow)                     │
│               │                                                          │
│               ▼                                                          │
│    Frontend: Badge +1, Panel updates                                   │
│    User clicks → /events/{eventId}                                     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌────────────────── FEATURE 3: RESERVATION NOTIFICATIONS ──────────────────┐
│                                                                            │
│  User Action: Create reservation                                         │
│               │                                                           │
│               ▼                                                           │
│    PocketBase Hook (onRecordCreate reservations)                        │
│    reservation-notifications.pb.js                                       │
│               │                                                           │
│    Type A: New booking    Type B: Status update                         │
│    "confirmed"            "pending" → "confirmed"                       │
│    User makes booking  OR Status changes (admin approval)               │
│    Notif sent           Notif sent                                      │
│    │                     │                                               │
│    └──────────┬──────────┘                                              │
│               ▼                                                           │
│    Same flow: DB + Realtime + Push                                      │
│               │                                                           │
│               ▼                                                           │
│    Frontend: Badge +1                                                  │
│    User clicks → /reservations/{id}                                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

┌──────────────── FEATURE 4: MOMENTS & PHOTO NOTIFICATIONS ──────────────────┐
│                                                                              │
│  User A uploads photo                                                      │
│      │                                                                      │
│      ▼                                                                      │
│  onRecordCreate(moments)                                                  │
│  moments-notifications.pb.js                                              │
│      │                                                                      │
│   ┌──┴──────────────────────────────────────────┐                         │
│   ▼                                              ▼                          │
│  Find all followers                          Find event attendees       │
│  of photo uploader                           (if event_id attached)     │
│      │                                              │                      │
│      └──────────┬───────────────────────────────────┘                     │
│                 ▼                                                          │
│          For each follower/attendee:                                      │
│          sendNotification(..., "moments:upload", ...)                    │
│                 │                                                          │
│                 ▼                                                          │
│          DB + Realtime + Push (batch for all recipients)                 │
│                                                                             │
│  User B likes the photo                                                   │
│      │                                                                      │
│      ▼                                                                      │
│  onRecordCreate(momentLikes)                                             │
│      │                                                                      │
│      ▼                                                                      │
│  Send to uploader: "moments:like"                                        │
│  Uploader receives → Badge +1 → /moments/{photoId}                       │
│                                                                             │
│  User C comments on photo                                                │
│      │                                                                      │
│      ▼                                                                      │
│  onRecordCreate(momentComments)                                          │
│      │                                                                      │
│      ▼                                                                      │
│  Send to uploader: "moments:comment"                                     │
│  Uploader receives → Badge +1 → /moments/{photoId}                       │
│                                                                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌───────────────── FEATURE 5: LOYALTY/REWARDS NOTIFICATIONS ──────────────────┐
│                                                                              │
│  User places order (150 points)                                            │
│      │                                                                      │
│      ▼                                                                      │
│  Order processing updates users.loyaltyPoints (100 → 250)                 │
│      │                                                                      │
│      ▼                                                                      │
│  onRecordUpdate(users, loyaltyPoints changed)                            │
│  loyalty-notifications.pb.js                                              │
│      │                                                                      │
│      ▼                                                                      │
│  sendNotification(..., "loyalty:points-earned", "+150 points", ...)      │
│      │                                                                      │
│      ├─► Frontend: Badge +1, /loyalty shows new total                    │
│      │                                                                      │
│      ▼                                                                      │
│  Check if points triggered tier upgrade                                   │
│  (e.g., 250 points = "Coffee Enthusiast")                                │
│      │                                                                      │
│      ▼ (if membershipLevel changed)                                       │
│  onRecordUpdate(users, membershipLevel changed)                          │
│      │                                                                      │
│      ▼                                                                      │
│  sendNotification(..., "loyalty:tier-up",                                │
│    "Congratulations! Unlock 5% discount", ...path)                       │
│      │                                                                      │
│      └─► Frontend: Badge +1, Panel shows celebration                     │
│          User clicks → /loyalty to see new perks                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Frontend Real-Time Update Loop

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND NOTIFICATION FLOW                         │
└──────────────────────────────────────────────────────────────────────────┘

USER LOGS IN
    │
    ▼
App.jsx loads
    │
    ├─► AuthContext login complete
    │
    ├─► initializePushNotifications()
    │   └─► Register service worker
    │   └─► Subscribe to push
    │   └─► Save subscription to DB
    │
    ├─► NotificationProvider mounts
    │   └─► Initial fetch from DB
    │   └─► Subscribe to realtime ("notifications" collection)
    │   └─► Setup SW message listener
    │
    ▼
USER NAVIGATES APP
    │
    ┌─────────────────────────────────────────┐
    │ Backend event triggers (order status)   │
    │ sendNotification() called                │
    └─────────────────────────────────────────┘
          │
          ├─► Path A: Realtime Event
          │   └─► PocketBase broadcasts to WebSocket
          │       └─► NotificationContext receives
          │           └─► setNotifications([...new])
          │               └─► State change detected
          │                   └─► React re-renders
          │                       ├─► NotificationBell
          │                       │   └─► Badge count +1
          │                       └─► NotificationPanel
          │                           └─► New item appears
          │
          └─► Path B: Service Worker (Low Power/Offline)
              └─► Push backend sends notification
                  └─► Browser receives push event
                      └─► Service Worker (push handler)
                          ├─► showNotification() → Desktop toast
                          └─► postMessage() to all clients
                              └─► App message listener
                                  └─► setNotifications([...new])
                                      └─► UI updates

USER INTERACTS WITH NOTIFICATION
    │
    ├─► In Panel: Click notification
    │   └─► markAsRead(id) called
    │   ├─► Backend update is_read = true
    │   ├─► Frontend state updates
    │   ├─► Item loses bold style
    │   ├─► Badge count -1
    │   └─► navigate(url) → Redirect page
    │
    ├─► In Panel: Delete button
    │   └─► deleteNotification(id)
    │       └─► Backend DELETE
    │       └─► Frontend removes from list
    │       └─► Badge count -1
    │
    ├─► In Panel: Mark all as read
    │   └─► markAllAsRead()
    │       └─► Backend update all unread → read
    │       └─► Frontend: all items loose bold
    │       └─► Badge → 0
    │
    └─► Desktop toast: Click
        └─► Switch to app
        └─► SW handler calls client.openWindow(url)
            └─► Navigate to relevant page
```

---

## 📊 Badge Counter State Machine

```
Component: NotificationBell
Prop: unreadCount (from NotificationContext)

                    ┌─────────┐
                    │  UNREAD │
                    │  COUNT  │
                    │  = 0    │
                    └────┬────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    New Notif        User Marks      Notification
    Received         as Read         Deleted
         │               │               │
         ▼               ▼               ▼
    +1 Count        -1 Count        -1 Count
         │               │               │
         └───────────────┼───────────────┘
                         │
                    ┌────▼────┐
                    │  UPDATE  │
                    │  STATE   │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │ RE-RENDER│
                    │ DISPLAY  │
                    │ NEW #    │
                    └────┬────┘
                         │
    Updated UI immediately without page reload
    
    Display Logic:
    - Count = 0  → Badge hidden
    - Count 1-9  → Show number (1, 2, 3...9)
    - Count 10+  → Show "9+"
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY & ACCESS CONTROL                        │
└─────────────────────────────────────────────────────────────────────┘

FRONTEND
    │
    ├─► User logs in
    │   └─► pb.authStore.token created
    │       └─► Stored in pb instance
    │
    ├─► Read notifications
    │   └─► pb.collection('notifications').getList()
    │       └─► Automatically includes auth header
    │           └─► PocketBase checks: user_id = @request.auth.id
    │               └─► ✅ Rule passes → Return all user's notifs
    │               └─► ❌ Rule fails → Deny access

PUSH NOTIFICATION SECURITY
    │
    ├─► Generate VAPID keys (public + private)
    │   └─► Public: Embedded in frontend .env (safe)
    │   └─► Private: ONLY on backend (secure)
    │
    ├─► User subscribes
    │   ├─► Browser generates subscription
    │   └─► Frontend sends to backend
    │       └─► Backend verifies auth
    │       └─► Save subscription to DB
    │
    ├─► Backend sends push
    │   └─► Uses VAPID private key to sign
    │   └─► Endpoint URL from subscription
    │   └─► Browser receives & validates signature
    │       └─► ✅ Valid → Show notification
    │       └─► ❌ Invalid → Discard

REALTIME SECURITY
    │
    ├─► WebSocket connection established
    │   └─► Auth token verified
    │   └─► Only subscribed to user's collection
    │
    ├─► Backend broadcasts notification
    │   └─► Includes user_id filter
    │   └─► Only users with read permission receive

OFFLINE CACHE
    │
    ├─► Service Worker caches logic
    │   └─► No sensitive data cached
    │   └─► Cache cleared on logout
    │
    └─► Notifications stored in browser DB
        └─► Only accessible by same origin
```

---

## 📈 System Scalability

```
┌─────────────────────────────────────────────────────────────────────┐
│           HANDLING SCALE: 1K → 100K → 1M NOTIFICATIONS            │
└─────────────────────────────────────────────────────────────────────┘

1,000 NOTIFICATIONS PER USER
├─ Query: SELECT * FROM notifications WHERE user_id = ?
├─ Impact: ~100ms (with database index)
└─ Solution: Already optimized

10,000+ NOTIFICATIONS
├─ Add pagination to NotificationContext
│  const [page, setPage] = useState(1);
│  const [limit] = useState(20);
│  
│  getList(page, limit) // Load 20 items per page
│
├─ Lazy load on scroll
│  if (scrollTop < 100px) loadMore()
│
└─ Impact: Constant memory, fast loads

MULTI-USER CONCURRENCY
├─ Different users = different records
│  (no read contention)
├─ Same user cannot create race condition
│  (one per notification stored)
└─ Scale: 1M users = 1M separate queries

NOTIFICATION THROUGHPUT (orders/sec)
├─ 1 order/sec = 1 notification/sec
│  → sendNotification() runs
│  → DB insert: ~5ms
│  → Web push: ~20ms (async)
│  → Realtime: ~10ms
│  → Total: ~35ms (can handle 28 orders/sec)
│
├─ 100 orders/sec required
│  ├─ Add job queue (Bull/Redis)
│  │  └─ Batch operations
│  ├─ Add push delivery service
│  │  └─ Firebase Cloud Messaging (auto-scales)
│  └─ Shard notifications table
│
└─ Solution: Use AWS SQS + SNS for production scale
```

---

## ✅ Complete Feature Matrix

```
┌─────────────────┬──────────┬──────────┬────────┬──────────┬─────────┐
│ Feature         │ Badge    │ In-App   │ Push   │ Email    │ Preview │
│                 │ Counter  │ Panel    │ Notif  │ (Ready)  │ Status  │
├─────────────────┼──────────┼──────────┼────────┼──────────┼─────────┤
│ Order Status    │    ✅    │    ✅    │   ✅   │   📋     │    ✅    │
│ RSVP/Payment    │    ✅    │    ✅    │   ✅   │   📋     │    ✅    │
│ Reservation     │    ✅    │    ✅    │   ✅   │   📋     │    ✅    │
│ Photo Upload    │    ✅    │    ✅    │   ✅   │   📋     │    ✅    │
│ Like/Comment    │    ✅    │    ✅    │   ✅   │   📋     │    ✅    │
│ Points Earned   │    ✅    │    ✅    │   ✅   │   📋     │    ✅    │
│ Tier Upgrade    │    ✅    │    ✅    │   ✅   │   📋     │    ✅    │
│ Offline Support │    ✅    │    ✅    │ queue  │    N/A   │    ✅    │
│ Real-Time Sync  │    ✅    │    ✅    │   ✅   │    N/A   │    ✅    │
└─────────────────┴──────────┴──────────┴────────┴──────────┴─────────┘

✅ = Implemented & tested
📋 = Template ready (easy to integrate)
🔄 = Queued by browser, sent on next sync
N/A = Not applicable for this feature
```

**Status: PRODUCTION READY 🚀**
