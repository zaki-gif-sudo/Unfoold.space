# 🚀 Hostinger Deployment Checklist

## 📋 Pre-Deployment

- [ ] VAPID keys generated ✅
- [ ] `.env.local` configured ✅
- [ ] PocketBase migrations ready
- [ ] All hooks in `/pb_hooks/` ✅
- [ ] Frontend builds successfully

```bash
cd apps/web
npm run build
# Check: dist/ folder exists and has files
```

---

## 📤 Frontend Deployment

### Local Preparation
```bash
# 1. Build for production
cd apps/web
npm run build

# 2. Verify build output
ls -la dist/apps/web/
# Should show: index.html, service-worker.js, assets/, etc.

# 3. Check service worker exists
file dist/apps/web/service-worker.js
```

### Upload to Hostinger
- [ ] Connect via SFTP or File Manager
- [ ] Upload `dist/apps/web/*` → `/public_html/`
- [ ] Verify `index.html` exists
- [ ] Verify `service-worker.js` exists
- [ ] Test: Visit https://yourdomain.com

---

## ⚙️ Backend Deployment (PocketBase)

### Local Preparation
```bash
# 1. Create deployment package
mkdir -p pocketbase-deploy
cd pocketbase-deploy

# 2. Copy binary
cp ../apps/pocketbase/pocketbase ./
chmod +x pocketbase

# 3. Copy migrations
cp -r ../apps/pocketbase/pb_migrations ./

# 4. Copy hooks
cp -r ../apps/pocketbase/pb_hooks ./

# 5. Create startup script
cat > start.sh << 'EOF'
#!/bin/bash
./pocketbase serve --http=0.0.0.0:8090
EOF
chmod +x start.sh

# 6. Create .env
cat > .env << 'EOF'
PB_URL=https://api.yourdomain.com
PB_DATA_DIR=./pb_data
EOF
```

### Upload to Hostinger
- [ ] Connect via SFTP
- [ ] Create folder: `/home/username/pocketbase/`
- [ ] Upload all files:
  - [ ] `pocketbase` (binary)
  - [ ] `pb_migrations/` (folder)
  - [ ] `pb_hooks/` (folder)
  - [ ] `start.sh` (script)
  - [ ] `.env` (config)
- [ ] Set permissions: `chmod +x pocketbase start.sh`

---

## 🔧 Hostinger Configuration

### Via SSH (Terminal)
```bash
# 1. Connect
ssh username@yourdomain.com

# 2. Navigate
cd pocketbase/

# 3. Verify binary
./pocketbase version

# 4. Test run (short test)
timeout 5 ./pocketbase serve --http=0.0.0.0:8090 || true

# 5. Check for errors in logs
```

### Configure Reverse Proxy
- [ ] Contact Hostinger support OR
- [ ] Use cPanel (if available):
  - Addon Domains → api.yourdomain.com
  - Point to PocketBase server

---

## 🌐 Update frontend .env

### Production Configuration
Update `apps/web/.env.production`:

```bash
# If deploying to Hostinger
VITE_VAPID_PUBLIC_KEY=BCz53E3BrX344cD6fkhzRPlLOMA2Mc84Cnt7Y-z090_BlegkTINsPylD7GMGhO4YAMwNQOGxI7qdpY_ccCVPg_I
VITE_POCKETBASE_URL=https://api.yourdomain.com
VITE_NOTIFICATIONS_OPTIONAL=true
```

Rebuild & upload:
```bash
npm run build
# Upload dist/ folder again
```

---

## ✅ Post-Deployment Verification

### Frontend Tests
- [ ] Page loads at https://yourdomain.com
- [ ] No console errors (DevTools F12)
- [ ] Service worker registered (DevTools → Application → Service Workers)
- [ ] VAPID key visible in code

```javascript
// In browser console:
console.log(import.meta.env.VITE_VAPID_PUBLIC_KEY)
```

### Backend Tests
- [ ] PocketBase admin accessible at https://api.yourdomain.com/_/
- [ ] Can login with admin credentials
- [ ] Collections exist:
  - [ ] notifications
  - [ ] push_subscriptions
- [ ] Check hooks loaded in admin UI

### API Tests
```bash
# Test API connectivity
curl https://api.yourdomain.com/api/collections/notifications/records

# Should return JSON (may be unauthorized, that's OK)
```

### Feature Tests
- [ ] Can login to app
- [ ] Notification bell shows in header
- [ ] Can see notification panel
- [ ] Service worker message in console
- [ ] Badge counter working
- [ ] Push notifications enabled

---

## 🔒 Security Checks

- [ ] SSL certificate active (https://)
- [ ] Admin password set (strong)
- [ ] Collection rules protected (user_id filter)
- [ ] .env file not publicly readable
- [ ] PocketBase behind reverse proxy
- [ ] CORS configured (if needed)

---

## 📊 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Cannot connect to API" | Check reverse proxy, restart PocketBase |
| "Service worker not loading" | Check `/service-worker.js` exists in public_html |
| "Notifications not appearing" | Check browser permissions, PocketBase admin |
| "Push failed" | Check VAPID key match, HTTPS enabled |
| "Collections not found" | Run migrations, check PocketBase admin |

---

## 🔄 Continuous Deployment

### For Updates
```bash
# 1. Local build
npm run build

# 2. Upload new frontend
# (same as initial deployment)

# 3. No need to restart backend
# (unless PocketBase code changed)
```

### If Changing Backend
```bash
# 1. SSH to server
# 2. Stop PocketBase
# 3. Upload new pb_hooks/ or pb_migrations/
# 4. Restart: ./start.sh &
```

---

## 💾 Backup Strategy

### Auto Backups (PocketBase)
```bash
# PocketBase auto-creates pb_data/ folder
# Contains SQLite database

# Weekly backup:
tar -czf backup-$(date +%Y%m%d).tar.gz pb_data/
```

### Hostinger Backups
- [ ] Enable automatic backups in control panel
- [ ] Store pb_data backups monthly

---

## 📞 Need Help?

1. **Hostinger Setup**: Contact Hostinger support
   - Request: Reverse proxy setup
   - Domain: api.yourdomain.com → localhost:8090

2. **Deployment Issues**: Check logs
   ```bash
   tail -f pocketbase.log
   ```

3. **Mobile Testing**: Use real device
   ```bash
   https://yourdomain.com (on phone)
   ```

---

**Status: Ready for deployment! 🎉**

Next: When ready to deploy, follow checklist from top to bottom.
