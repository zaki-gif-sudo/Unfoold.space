# 🚀 Plan B: Production Deployment - Step-by-Step

## 📊 Plan B Overview

```
Frontend:  Hostinger Static (yourdomain.com)
Backend:   Hostinger VPS (api.yourdomain.com)
Database:  PocketBase SQLite on VPS
Status:    24/7 Production ✅
```

---

## ✅ Pre-Deployment Checklist

- [x] VAPID keys generated
- [x] .env.local configured
- [x] Migrations ready
- [x] Hooks ready
- [ ] Hostinger VPS purchased
- [ ] SSH access obtained
- [ ] Domain configured

---

## 🎯 Phase 1: Prepare Hostinger VPS (1-2 hours)

### Step 1.1: Upgrade to VPS

**Via Hostinger Control Panel:**
1. Go to: https://hpanel.hostinger.com/
2. My Hosting → Current Plan
3. Click "Upgrade"
4. Select VPS Plan ($5-10/month)
5. Complete payment

### Step 1.2: Get SSH Access

After upgrade:
1. hPanel → VPS → SSH Access
2. Copy:
   - Hostname/IP: `XXX.XXX.XXX.XXX`
   - Username: `root` or `admin_username`
   - Password: Check email or reset
3. Save these credentials

### Step 1.3: Test SSH Connection

```bash
ssh root@XXX.XXX.XXX.XXX
# Enter password when prompted

# Should see terminal prompt like:
# root@server:~#
```

---

## 🎯 Phase 2: Setup Backend on VPS (30 minutes)

### Step 2.1: Create PocketBase Directory

```bash
# SSH into VPS
ssh root@XXX.XXX.XXX.XXX

# Create folder
mkdir -p /root/pocketbase
cd /root/pocketbase

# Verify
pwd
# Should show: /root/pocketbase
```

### Step 2.2: Upload PocketBase Files

**Option A: Via SFTP** (Easy for Mac/Linux)
```bash
# On your local machine
cd /Users/macbookair/Desktop/UNFOOLD/horizons-export-13222a4f-1f4e-4729-8f8a-40893789af3d

# Create deployment package
mkdir pocketbase-prod
cd pocketbase-prod

# Copy PocketBase files
cp ../apps/pocketbase/pocketbase ./
cp -r ../apps/pocketbase/pb_migrations ./
cp -r ../apps/pocketbase/pb_hooks ./
cp ../apps/pocketbase/package.json ./

# Verify files
ls -la
# Should show: pocketbase, pb_migrations/, pb_hooks/, package.json
```

**Upload via SFTP:**
```bash
# From your machine (still in pocketbase-prod folder)
sftp root@XXX.XXX.XXX.XXX

# In sftp prompt:
cd /root/pocketbase
put pocketbase
put -r pb_migrations
put -r pb_hooks
put package.json

# Verify upload
ls -la
# Should show files

exit
```

**Option B: Via SSH + wget** (If SFTP doesn't work)
```bash
# SSH into VPS
ssh root@XXX.XXX.XXX.XXX

# If PocketBase hosted on GitHub or CDN:
wget https://github.com/pocketbase/pocketbase/releases/download/v0.X.X/pocketbase_0.X.X_linux_amd64.zip
unzip pocketbase_0.X.X_linux_amd64.zip

# Or copy from local via SCP:
# From your local machine:
scp -r pocketbase-prod/* root@XXX.XXX.XXX.XXX:/root/pocketbase/
```

### Step 2.3: Verify Upload

```bash
# SSH into VPS
ssh root@XXX.XXX.XXX.XXX
cd /root/pocketbase

# Check files
ls -la
# Should show all files

# Make executable
chmod +x pocketbase

# Test run
./pocketbase version
# Should show version number
```

### Step 2.4: Create Environment File

```bash
# SSH into VPS
ssh root@XXX.XXX.XXX.XXX
cd /root/pocketbase

# Create .env
cat > .env << 'EOF'
PB_URL=https://api.yourdomain.com
PB_DATA_DIR=./pb_data
PB_LOG_FILE=./pb_logs.txt
EOF

# Verify
cat .env
```

### Step 2.5: Run PocketBase Service

**Option A: Using Screen (Simple)**
```bash
# SSH into VPS
ssh root@XXX.XXX.XXX.XXX
cd /root/pocketbase

# Install screen if needed
apt-get update && apt-get install -y screen

# Run in background screen
screen -S pocketbase -d -m ./pocketbase serve --http=0.0.0.0:8090

# Verify running
screen -ls
# Should show "pocketbase" session

# Check it's listening
netstat -an | grep 8090
# Should show LISTEN on port 8090
```

**Option B: Using systemd (Recommended)**
```bash
# SSH into VPS
ssh root@XXX.XXX.XXX.XXX

# Create systemd service
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
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl start pocketbase

# Verify
sudo systemctl status pocketbase
# Should show "active (running)"

# View logs
sudo journalctl -u pocketbase -f
# Shows real-time logs
```

---

## 🎯 Phase 3: Setup Reverse Proxy (30 minutes)

### Step 3.1: Configure Nginx

Most Hostinger VPS come with Nginx pre-installed.

```bash
# SSH into VPS
ssh root@XXX.XXX.XXX.XXX

# Check if nginx installed
nginx -v
# If not: apt-get install nginx

# Create config for api subdomain
sudo cat > /etc/nginx/sites-available/api.yourdomain.com << 'EOF'
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates (auto via Let's Encrypt)
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

# Enable site
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/

# Test config
sudo nginx -t
# Should show "configuration is ok"

# Restart nginx
sudo systemctl restart nginx
```

### Step 3.2: Setup SSL Certificate (Let's Encrypt)

```bash
# SSH into VPS
ssh root@XXX.XXX.XXX.XXX

# Install certbot if needed
apt-get install -y certbot python3-certbot-nginx

# Get certificate for api.yourdomain.com
sudo certbot certonly --nginx -d api.yourdomain.com

# Follow prompts:
# - Email: your@email.com
# - Agree to terms
# - Share email: Y or N

# Verify certificate
ls -la /etc/letsencrypt/live/api.yourdomain.com/
# Should show: fullchain.pem, privkey.pem

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Step 3.3: Test Reverse Proxy

```bash
# From your local machine
curl -I https://api.yourdomain.com/_/

# Should return 200 OK
# If not: Check DNS, firewall, nginx config
```

---

## 🎯 Phase 4: Build & Upload Frontend (15 minutes)

### Step 4.1: Build for Production

```bash
# On your local machine
cd /Users/macbookair/Desktop/UNFOOLD/horizons-export-13222a4f-1f4e-4729-8f8a-40893789af3d

# Update environment for production
cat > apps/web/.env.production << 'EOF'
VITE_VAPID_PUBLIC_KEY=BCz53E3BrX344cD6fkhzRPlLOMA2Mc84Cnt7Y-z090_BlegkTINsPylD7GMGhO4YAMwNQOGxI7qdpY_ccCVPg_I
VITE_POCKETBASE_URL=https://api.yourdomain.com
VITE_NOTIFICATIONS_OPTIONAL=true
EOF

# Build
npm run build

# Verify
ls -la dist/apps/web/
# Should have: index.html, service-worker.js, assets/
```

### Step 4.2: Upload Frontend to Hostinger Static

**Via Hostinger hPanel File Manager:**
1. hPanel → Files → Public HTML
2. Delete existing files (if any)
3. Upload all files from `/dist/apps/web/`

**Or via SFTP:**
```bash
# On your local machine
sftp username@yourdomain.com

# Navigate
cd public_html

# Upload
put -r /path/to/dist/apps/web/* .

# Verify
ls -la
# Should see: index.html, service-worker.js, assets/, etc.

exit
```

### Step 4.3: Test Frontend

```bash
# In browser
https://yourdomain.com

# Should see:
# - Homepage loads
# - No console errors
# - Service worker shows "registered"
```

---

## ✅ Verification Checklist

### Backend Tests
```bash
# Test 1: PocketBase running
curl -I https://api.yourdomain.com/_/
# Should return 401 (auth required, normal)

# Test 2: API accessible
curl https://api.yourdomain.com/api/collections/notifications/records \
  -H "Authorization: Bearer invalid"
# Should return error (server responding)

# Test 3: Check logs
ssh root@XXX.XXX.XXX.XXX
sudo journalctl -u pocketbase -n 50
# No critical errors should show

# Test 4: Database accessible
# Access PocketBase admin:
# https://api.yourdomain.com/_/
# Login with admin credentials
# Check collections: notifications, push_subscriptions exist
```

### Frontend Tests
```bash
# In browser at https://yourdomain.com:

# Test 1: Page loads
# Devtools → Console
# No errors

# Test 2: Service worker registered
# Devtools → Application → Service Workers
# Should show "registered and running"

# Test 3: VAPID key present
# In console:
console.log(import.meta.env.VITE_VAPID_PUBLIC_KEY)
# Should show key starting with "BCz53..."

# Test 4: Backend URL
console.log(import.meta.env.VITE_POCKETBASE_URL)
# Should show "https://api.yourdomain.com"
```

### Feature Tests
```bash
# Test 1: Login
# Click login
# Should redirect to auth

# Test 2: Notification bell
# After login, should see bell icon in header
# Should have badge counter (might be 0)

# Test 3: Service worker message
# In console:
navigator.serviceWorker.ready.then(reg => 
  reg.pushManager.getSubscription().then(console.log)
)
# Should show subscription object

# Test 4: Push notification permission
# Should ask for notification permission
# Allow it

# Test 5: Test notification
# Via PocketBase admin:
# Collections → orders
# Create test order
# Update status
# Check browser for notification
```

---

## 🔒 Security Post-Deployment

### Step 1: Set Strong Admin Password
```bash
# Access https://api.yourdomain.com/_/
# Login with default admin
# Settings → Admin → Change Password
# Set strong password (30+ chars, mix upper/lower/numbers/symbols)
```

### Step 2: Configure Collection Rules

**In PocketBase Admin UI:**

**notifications collection:**
```
Create Rule: null (backend only)
Read Rule: @request.auth.id = user_id
Update Rule: @request.auth.id = user_id
Delete Rule: @request.auth.id = user_id
```

**push_subscriptions collection:**
```
Create Rule: @request.auth.id != ''
Read Rule: @request.auth.id = user_id
Update Rule: @request.auth.id = user_id
Delete Rule: @request.auth.id = user_id
```

### Step 3: Enable Firewall
```bash
# SSH into VPS
ssh root@XXX.XXX.XXX.XXX

# Check ufw status
sudo ufw status

# If inactive, enable:
sudo ufw enable

# Allow HTTP, HTTPS, SSH only
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block port 8090 (internal only)
# (Already blocked by default)

# Verify
sudo ufw status
```

### Step 4: Setup Backups

```bash
# SSH into VPS
ssh root@XXX.XXX.XXX.XXX
cd /root/pocketbase

# Create daily backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/pocketbase/backups"
mkdir -p $BACKUP_DIR

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pb_data_$DATE.tar.gz"

# Compress database
tar -czf $BACKUP_FILE pb_data/

# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete

echo "Backup created: $BACKUP_FILE"
EOF

chmod +x backup.sh

# Add to cron (daily at 2 AM)
crontab -e
# Add line: 0 2 * * * /root/pocketbase/backup.sh
```

---

## 📊 Monitoring & Maintenance

### Check PocketBase Status
```bash
ssh root@XXX.XXX.XXX.XXX
sudo systemctl status pocketbase
```

### View Logs
```bash
ssh root@XXX.XXX.XXX.XXX
sudo journalctl -u pocketbase -f
# Real-time logs (Ctrl+C to exit)
```

### Restart Service
```bash
ssh root@XXX.XXX.XXX.XXX
sudo systemctl restart pocketbase
```

### Update PocketBase
```bash
ssh root@XXX.XXX.XXX.XXX
cd /root/pocketbase

# Stop service
sudo systemctl stop pocketbase

# Download new version
wget https://github.com/pocketbase/pocketbase/releases/download/v0.NEW/pocketbase_0.NEW_linux_amd64.zip
unzip -o pocketbase_0.NEW_linux_amd64.zip

# Start service
sudo systemctl start pocketbase
```

---

## 🆘 Troubleshooting

### "Cannot reach api.yourdomain.com"
```bash
# 1. Check PocketBase running
ssh root@XXX.XXX.XXX.XXX
sudo systemctl status pocketbase

# 2. Check port listening
netstat -an | grep 8090

# 3. Check nginx config
sudo nginx -t

# 4. Check firewall
sudo ufw status
# Port 443 should be allowed

# 5. Check DNS
nslookup api.yourdomain.com
# Should resolve to VPS IP
```

### "SSL certificate error"
```bash
# Check certificate
sudo certbot certificates

# Renew if needed
sudo certbot renew --force-renewal

# View logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### "Frontend loads but API calls fail"
```bash
# 1. Check CORS (PocketBase allows all CORS by default)
# 2. Verify API URL in frontend
# 3. Check network tab in DevTools for 403/404 errors
# 4. Restart PocketBase:
ssh root@XXX.XXX.XXX.XXX
sudo systemctl restart pocketbase
```

### "Notifications not appearing"
```bash
# 1. Check permissions in PocketBase admin
# Collections → notifications → Rules
# 2. Check browser notification permission
# 3. Check service worker in DevTools
# 4. Check backend logs:
sudo journalctl -u pocketbase -n 100 | grep -i notif
```

---

## ✨ Success Indicators

- [x] Frontend loads at https://yourdomain.com (with lock icon)
- [x] PocketBase admin accessible at https://api.yourdomain.com/_/
- [x] Service worker registered (checked via DevTools)
- [x] Can login to app
- [x] Notification bell visible
- [x] Order status update triggers notification in real-time
- [x] Push notification permission asked
- [x] SSL certificates auto-renew
- [x] Backups running daily

---

## 📞 Hostinger Support Info

If you need help from Hostinger:

**Email Support:**
- Subject: "VPS Setup - Production API Server"
- Details:
  - Domain: yourdomain.com
  - Subdomain: api.yourdomain.com
  - Backend: PocketBase on port 8090
  - Need: Reverse proxy + SSL setup confirmation

**Or Access hPanel:**
- Support → Contact Support
- Choose: VPS category

---

## 📋 Setup Checklist

- [ ] VPS upgraded ($5-10/mo)
- [ ] SSH access obtained
- [ ] SSH connection tested
- [ ] PocketBase directory created
- [ ] PocketBase files uploaded
- [ ] .env file created
- [ ] PocketBase running (systemd service)
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate obtained
- [ ] api.yourdomain.com accessible via HTTPS
- [ ] Frontend built with production .env
- [ ] Frontend uploaded to public_html
- [ ] yourdomain.com loads successfully
- [ ] Backend & frontend communication verified
- [ ] Admin password changed
- [ ] Collection rules configured
- [ ] Firewall enabled
- [ ] Backups configured
- [ ] All features tested

---

## 🎉 You're Live in Production!

Everything is now running 24/7 on Hostinger VPS.

**Next:** Monitor regularly, backup data, keep systems updated.

Need help? Check troubleshooting section or contact Hostinger support.
