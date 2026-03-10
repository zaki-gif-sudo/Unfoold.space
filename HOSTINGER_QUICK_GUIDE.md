# 🌐 Deploy ke Horizons Hostinger - Quick Summary

## 📞 Status: READY TO DEPLOY ✅

Notifikasi system sudah complete dan siap diupload ke Hostinger Horizons.

---

## 🚀 3-Step Quick Deploy

### Step 1: Build Frontend (5 min)
```bash
cd apps/web
npm run build

# Output: ../../dist/apps/web/
# (atau /dist/apps/web dari root)
```

✅ Generated files:
- `index.html`
- `service-worker.js`
- `assets/` (JS, CSS, images)

### Step 2: Upload Frontend to Hostinger (5 min)
**Via SFTP or Hostinger File Manager:**

```
From:   /dist/apps/web/*
To:     /public_html/
        (or /domains/yourdomain.com/public_html/)
```

✅ After upload:
- Visit https://yourdomain.com → Should load app

### Step 3: Setup Backend (PocketBase)

**Option A: Simple - Static Frontend Only** (24 hours to live)
```
Upload frontend to /public_html/
PocketBase runs locally on your machine
Frontend → talks to your local PocketBase
Problem: Only works when your PC on
```

**Option B: Full Production** (Recommended)
```
Frontend: Hostinger static hosting ✅
Backend:  Run PocketBase on Hostinger server
Problem: Hostinger shared hosting doesn't allow running servers
Solution: Upgrade to VPS or use PocketBase Cloud
```

---

## ⚡ Best Option for You: Mixed Setup

### Plan A: Cost-Free (Development)
```
Frontend:    Hostinger free tier
Backend:     Your local computer (PocketBase running)
Database:    SQLite (auto in PocketBase)

Problem: Only works when PC on & internet stable
Good for: Testing before full production
```

### Plan B: Production Ready (~$5-10/month)
```
Frontend:    Hostinger Shared Hosting ($2.99/mo) ✅
Backend:     Separate VPS ($5-10/mo)
Database:    PocketBase SQLite on VPS

Frontend URL: https://yourdomain.com
Backend URL:  https://api.yourdomain.com
Everything works 24/7 ✅
```

---

## 🔧 For PLAN A (Local Backend)

### 1. Build & Upload Frontend
```bash
# From your computer
cd apps/web
npm run build

# Upload dist/apps/web/* to Hostinger /public_html/
```

### 2. Setup .env for Local Backend
```bash
# Update apps/web/.env.local:
VITE_VAPID_PUBLIC_KEY=BCz53E3BrX344cD6fkhzRPlLOMA2Mc84Cnt7Y-z090_BlegkTINsPylD7GMGhO4YAMwNQOGxI7qdpY_ccCVPg_I
VITE_POCKETBASE_URL=http://localhost:8090
VITE_NOTIFICATIONS_OPTIONAL=true
```

### 3. Rebuild & Upload
```bash
npm run build
# Upload dist/apps/web/* again
```

### 4. Run PocketBase Locally
```bash
cd apps/pocketbase
./pocketbase serve
# Runs on http://localhost:8090
```

### 5. Test
- Frontend at: https://yourdomain.com
- Calls local PocketBase: http://localhost:8090
- Works as long as your PC running ✅

---

## 🔧 For PLAN B (Full Production - Recommended)

### Same as Plan A, but:

### 1. Upgrade Hostinger to VPS
- Contact Hostinger support
- Upgrade to VPS plan (~$5-10/month)
- Get SSH access

### 2. Upload PocketBase to VPS
```bash
# Create deployment package
mkdir pocketbase-prod
cd pocketbase-prod

# Copy files
cp ../apps/pocketbase/pocketbase ./
cp -r ../apps/pocketbase/pb_migrations ./
cp -r ../apps/pocketbase/pb_hooks ./
chmod +x pocketbase

# Test locally
./pocketbase serve --http=0.0.0.0:8090
```

### 3. Upload to Hostinger VPS
```bash
# Via SFTP: Upload pocketbase-prod/ to /home/username/

# Via SSH (from Hostinger Terminal):
cd ~/pocketbase-prod
chmod +x pocketbase
./pocketbase serve --http=0.0.0.0:8090 &
```

### 4. Setup Reverse Proxy
Contact Hostinger support:
- Need: Reverse proxy for api.yourdomain.com → localhost:8090
- Or: Use cPanel addon domains feature

### 5. Update Frontend .env
```bash
# Update to point to Hostinger backend
VITE_POCKETBASE_URL=https://api.yourdomain.com
```

### 6. Rebuild & Upload Frontend
```bash
npm run build
# Upload dist/apps/web/* to /public_html/ again
```

---

## 📊 Comparison

| Feature | Plan A (Local) | Plan B (VPS) |
|---------|---|---|
| Frontend | Hostinger | Hostinger |
| Backend | Your PC | VPS |
| Database | Your PC | VPS |
| Uptime | When PC on | 24/7 |
| Cost | FREE | ~$5-10/mo |
| Setup | 10 min | 30 min |
| Production Ready | ❌ | ✅ |

---

## ✅ What's Already Done

- [x] VAPID keys generated
- [x] .env.local configured with keys
- [x] Migrations ready for PocketBase
- [x] Hooks ready for PocketBase
- [x] Service worker updated
- [x] React components ready
- [x] Build optimized for production
- [x] Documentation complete

---

## 🎯 Next Actions

### Immediate (Today)
- [ ] Decide: Plan A or Plan B?
- [ ] Build frontend: `npm run build`
- [ ] Get Hostinger credentials (SFTP/SSH)

### Plan A (If Local Backend)
- [ ] Upload `/dist/apps/web/` to Hostinger
- [ ] Update .env.local: VITE_POCKETBASE_URL=localhost:8090
- [ ] Keep PocketBase running locally
- [ ] Test at yourdomain.com

### Plan B (If Production)
- [ ] Upgrade Hostinger to VPS (contact support)
- [ ] Upload PocketBase to VPS
- [ ] Setup reverse proxy
- [ ] Update .env: VITE_POCKETBASE_URL=api.yourdomain.com
- [ ] Upload frontend
- [ ] Test everything

---

## 📞 Hostinger Contact Info

**For Plan B Support Request:**
```
Subject: Setup Reverse Proxy for Sub-domain

Details:
- Domain: yourdomain.com
- Sub-domain: api.yourdomain.com
- Target: localhost:8090
- Purpose: Backend API proxy

Or ask about:
- Node.js support on account
- VPS upgrade options
- SSL/TLS setup for sub-domain
```

---

## 🧪 Testing After Deploy

```bash
# 1. Frontend loads
curl https://yourdomain.com/
# Should see HTML

# 2. Service worker loads
curl https://yourdomain.com/service-worker.js
# Should see JS code

# 3. VAPID key in frontend
# Open browser console at https://yourdomain.com
# Run: console.log(import.meta.env.VITE_VAPID_PUBLIC_KEY)
# Should show your public key

# 4. Backend API
curl https://api.yourdomain.com/api/collections/notifications/records
# Should return JSON (may be 403 unauthorized, that's OK)

# 5. Push notifications
# Login → check browser notification permission
# Should ask to enable notifications
```

---

## 🆘 Common Issues

### "Frontend loads but no styling"
- Check: service-worker.js exists
- Check: assets/ folder uploaded
- Solution: Clear browser cache (Ctrl+Shift+Delete)

### "Cannot reach backend API"
- Check: Backend running on VPS
- Check: Reverse proxy configured
- Check: Firewall allows port 8090
- Contact: Hostinger support

### "Service worker not registering"
- Check: HTTPS enabled (required for SW)
- Check: /service-worker.js exists
- Check: Browser console for errors

---

## 📋 Deployment Checklist

**Before Upload:**
- [ ] `npm run build` completes successfully
- [ ] `/dist/apps/web/` has files
- [ ] Service worker file exists
- [ ] .env.local configured
- [ ] VAPID keys set

**After Upload to Hostinger:**
- [ ] Frontend loads at https://yourdomain.com
- [ ] Service-worker.js accessible
- [ ] No console errors in browser
- [ ] Can reach PocketBase admin
- [ ] Database tables exist

**After Feature Test:**
- [ ] Can login
- [ ] Notification bell visible
- [ ] Can see notification panel
- [ ] Badge counter works

---

## 🚀 Ready!

Tinggal pilih Plan A atau B, dan follow step-by-step.
Semua sudah ready untuk deploy.

**Butuh bantuan dengan step tertentu? Bilang!** 🎉
