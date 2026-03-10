# 📋 Plan B: Phase-by-Phase Quick Checklist

## 🚀 Phase 1: VPS Setup (1-2 hours)

### 1.1 - Upgrade Hostinger Account
- [ ] Go to hPanel → Current Plan → Upgrade
- [ ] Select VPS ($5-10/month)
- [ ] Complete payment
- [ ] Wait 15-30 min for activation

### 1.2 - Get SSH Credentials
- [ ] hPanel → VPS → SSH Access
- [ ] Copy: IP address, Username, Password
- [ ] Test connection: `ssh root@XXX.XXX.XXX.XXX`
- [ ] Should see terminal prompt

---

## 📦 Phase 2: Upload PocketBase Backend (30 min)

### 2.1 - Prepare Files (Local Machine)
```bash
mkdir pocketbase-prod
cd pocketbase-prod

cp ../apps/pocketbase/pocketbase ./
cp -r ../apps/pocketbase/pb_migrations ./
cp -r ../apps/pocketbase/pb_hooks ./
cp ../apps/pocketbase/package.json ./

ls -la
```
- [ ] pocketbase file exists
- [ ] pb_migrations/ folder exists
- [ ] pb_hooks/ folder exists

### 2.2 - Upload to VPS (via SFTP)
```bash
sftp root@XXX.XXX.XXX.XXX

cd /root/pocketbase
put pocketbase
put -r pb_migrations
put -r pb_hooks
put package.json

ls -la
exit
```
- [ ] All files uploaded to /root/pocketbase/

### 2.3 - Setup on VPS
```bash
ssh root@XXX.XXX.XXX.XXX
cd /root/pocketbase

chmod +x pocketbase
./pocketbase version

# Should show version number
```
- [ ] PocketBase executable runs

### 2.4 - Create .env
```bash
cat > .env << 'EOF'
PB_URL=https://api.yourdomain.com
PB_DATA_DIR=./pb_data
EOF

cat .env
```
- [ ] .env file created with correct domain

### 2.5 - Run as Service
```bash
# Option A: Screen (simple)
screen -S pocketbase -d -m ./pocketbase serve --http=0.0.0.0:8090
screen -ls  # Verify "pocketbase" shows

# OR Option B: Systemd (recommended)
sudo cat > /etc/systemd/system/pocketbase.service << 'EOF'
[Unit]
Description=PocketBase Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/pocketbase
ExecStart=/root/pocketbase/pocketbase serve --http=0.0.0.0:8090
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl start pocketbase
sudo systemctl status pocketbase
```
- [ ] PocketBase running on port 8090
- [ ] Service will start on reboot

---

## 🔗 Phase 3: Setup Reverse Proxy with Nginx (30 min)

### 3.1 - Create Nginx Config
```bash
ssh root@XXX.XXX.XXX.XXX

sudo cat > /etc/nginx/sites-available/api.yourdomain.com << 'EOF'
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
```
- [ ] Nginx config created for api.yourdomain.com
- [ ] Config test shows "ok"

### 3.2 - Setup SSL Certificate
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d api.yourdomain.com

# Follow prompts:
# Email: your@email.com
# Agree to terms: Y
# Share email: Y or N

sudo systemctl restart nginx
```
- [ ] SSL certificate created automatically
- [ ] Nginx restarted

### 3.3 - Test Access
```bash
# From local machine
curl -I https://api.yourdomain.com/_/
# Should return 401 (auth required, that's OK)
```
- [ ] api.yourdomain.com accessible via HTTPS

---

## 🎨 Phase 4: Build & Upload Frontend (15 min)

### 4.1 - Build for Production (Local Machine)
```bash
cd /Users/macbookair/Desktop/UNFOOLD/horizons-export-13222a4f-1f4e-4729-8f8a-40893789af3d

cat > apps/web/.env.production << 'EOF'
VITE_VAPID_PUBLIC_KEY=BCz53E3BrX344cD6fkhzRPlLOMA2Mc84Cnt7Y-z090_BlegkTINsPylD7GMGhO4YAMwNQOGxI7qdpY_ccCVPg_I
VITE_POCKETBASE_URL=https://api.yourdomain.com
VITE_NOTIFICATIONS_OPTIONAL=true
EOF

npm run build

ls -la dist/apps/web/
```
- [ ] dist/apps/web/ folder created
- [ ] index.html exists
- [ ] service-worker.js exists
- [ ] assets/ folder exists

### 4.2 - Upload Frontend
```bash
# Via SFTP to Hostinger static hosting
sftp username@yourdomain.com

cd public_html
# Delete old files if any
rm -r *

put -r /path/to/dist/apps/web/* .

ls -la
# Should show: index.html, service-worker.js, assets/, etc.

exit
```
- [ ] All files uploaded to /public_html/

### 4.3 - Test Frontend
```bash
# In browser
https://yourdomain.com

# Should see:
# - Homepage loads
# - No certificate warnings
# - Service worker in DevTools shows "registered"
```
- [ ] Frontend loads at https://yourdomain.com

---

## ✅ Phase 5: Verification & Testing (15 min)

### 5.1 - Backend Tests
```bash
# Test PocketBase admin
https://api.yourdomain.com/_/

# Should see:
# - Login page
# - No certificate warnings
# ✅ Can login with admin credentials
```
- [ ] PocketBase admin accessible
- [ ] Collections exist: notifications, push_subscriptions
- [ ] Collections have correct fields

### 5.2 - Frontend + Backend Connection Tests
```bash
# At https://yourdomain.com

# In DevTools Console:
console.log(import.meta.env.VITE_POCKETBASE_URL)
# Should show: https://api.yourdomain.com

console.log(import.meta.env.VITE_VAPID_PUBLIC_KEY)
# Should show: BCz53E3...
```
- [ ] Environment variables correct
- [ ] No console errors

### 5.3 - Feature Tests
```bash
# 1. Login
# Click login button
# Can authenticate ✅

# 2. Notification bell
# Should see bell icon in header
# Badge shows count ✅

# 3. Service worker
# Browser asks for notification permission
# Allow it ✅

# 4. Create test notification
# Go to PocketBase admin
# Collections → orders
# Create test order with status "pending"
# Update it to "ready"
# Check frontend - should see notification ✅
```
- [ ] Login works
- [ ] Bell icon visible
- [ ] Notification permission asked
- [ ] Test notification appears
- [ ] Click redirects to correct page

---

## 🔒 Phase 6: Security Configuration (15 min)

### 6.1 - PocketBase Admin
```bash
# At https://api.yourdomain.com/_/

# Login with default admin
# Settings → Admin
# Change password to 32+ character strong password
```
- [ ] Admin password changed to strong value

### 6.2 - Collection Rules
```bash
# In PocketBase admin:

# notifications collection:
# Create: null
# Read: @request.auth.id = user_id
# Update: @request.auth.id = user_id
# Delete: @request.auth.id = user_id

# push_subscriptions collection:
# Create: @request.auth.id != ''
# Read: @request.auth.id = user_id
# Update: @request.auth.id = user_id
# Delete: @request.auth.id = user_id
```
- [ ] Rules configured for both collections

### 6.3 - Firewall
```bash
ssh root@XXX.XXX.XXX.XXX

sudo ufw enable
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

sudo ufw status
```
- [ ] Firewall enabled
- [ ] Only SSH, HTTP, HTTPS open

### 6.4 - Backup Script
```bash
ssh root@XXX.XXX.XXX.XXX
cd /root/pocketbase

cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/pocketbase/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf $BACKUP_DIR/pb_data_$DATE.tar.gz pb_data/
find $BACKUP_DIR -mtime +30 -delete
EOF

chmod +x backup.sh

# Add to cron (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /root/pocketbase/backup.sh
```
- [ ] Backup script created
- [ ] Added to cron

---

## 📊 Final Checklist: Everything Working?

- [ ] https://yourdomain.com loads ✅
- [ ] https://api.yourdomain.com/_ loads ✅
- [ ] Service worker registered ✅
- [ ] Can login ✅
- [ ] Bell icon visible ✅
- [ ] Notification permission asked ✅
- [ ] Test notification triggers ✅
- [ ] Click notification redirects ✅
- [ ] Badge counter works ✅
- [ ] Admin password strong ✅
- [ ] Collection rules set ✅
- [ ] Firewall enabled ✅
- [ ] Backups scheduled ✅

---

## 🎯 Time Estimates

| Phase | Time | Status |
|-------|------|--------|
| 1. VPS Setup | 1-2h | After payment |
| 2. Upload Backend | 30m | SFTP upload |
| 3. Nginx + SSL | 30m | Auto-configured |
| 4. Build Frontend | 15m | `npm run build` |
| 5. Test & Verify | 15m | Manual testing |
| 6. Security | 15m | Config review |
| **Total** | **~3-4 hours** | **Live!** |

---

## 📞 If Issues Arise

1. **Check logs**: `ssh root@XXX && tail -f /var/log/nginx/error.log`
2. **Restart services**: `sudo systemctl restart pocketbase && sudo systemctl restart nginx`
3. **View PocketBase logs**: `sudo journalctl -u pocketbase -f`
4. **Contact Hostinger**: Support with domain + error message

---

## 🚀 You're Now Production-Ready!

**Next Steps:**
1. Monitor for 24 hours
2. Check backup runs daily
3. Test login daily
4. Plan content updates

**Congratulations!** Your notification system is live 24/7 🎉
