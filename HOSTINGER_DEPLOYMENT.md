# 🚀 Deploy ke Horizons Hostinger - Complete Guide

## 📋 Overview

Your app memiliki 2 bagian:
1. **Frontend** (React) → Static hosting
2. **Backend** (PocketBase) → Needs server to run

---

## 🎯 Step 1: Build Frontend untuk Production

```bash
cd apps/web
npm run build

# Output:
# dist/ folder siap upload
# (atau ke ../../dist/apps/web sesuai config)
```

---

## 🎯 Step 2: Siapkan Backend PocketBase

PocketBase perlu server untuk run. Ada 2 opsi di Hostinger:

### ✅ Opsi A: Gunakan PocketBase Binary (Recommended)
PocketBase bisa run standalone tanpa Node.js

#### Di Local, siapkan folder:
```bash
# Create deployment folder
mkdir pocketbase-deployment
cd pocketbase-deployment

# Copy PocketBase binary
cp apps/pocketbase/pocketbase ./

# Copy migrations & hooks
cp -r apps/pocketbase/pb_migrations ./
cp -r apps/pocketbase/pb_hooks ./

# Copy requirements
cp apps/pocketbase/package.json ./
```

#### Struktur folder:
```
pocketbase-deployment/
├── pocketbase           (executable binary)
├── pb_migrations/       (all migrations)
├── pb_hooks/            (all hooks)
├── package.json
└── .env                 (untuk secrets)
```

---

## 📤 Step 3: Upload ke Hostinger

### Via SFTP/File Manager:

**Frontend (React):**
```
Local:  /dist/apps/web/*
Upload to: /public_html/
           atau
           /domains/yourdomain.com/public_html/
```

**Backend (PocketBase):**
```
Local:  /pocketbase-deployment/*
Upload to: /home/username/pocketbase/
           (private folder, bukan public_html)
```

---

## ⚙️ Step 4: Configure di Hostinger

### Terminal Akses (SSH)
```bash
ssh username@yourdomain.com

# Navigate to PocketBase folder
cd ~/pocketbase

# Make binary executable
chmod +x ./pocketbase

# Create .env file
cat > .env << 'EOF'
PB_URL=https://yourdomain.com/api
PB_DATA_DIR=./pb_data
EOF

# Test run
./pocketbase serve --http=0.0.0.0:8090
```

### Setup Reverse Proxy (Nginx/Apache)

**Nginx config** (ask Hostinger support untuk help):
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_buffering off;
    }
}
```

---

## 🔄 Step 5: Update Frontend Environment

Update `.env.local` di production:

```bash
# apps/web/.env.local (for production)
VITE_VAPID_PUBLIC_KEY=BCz53E3BrX344cD6fkhzRPlLOMA2Mc84Cnt7Y-z090_BlegkTINsPylD7GMGhO4YAMwNQOGxI7qdpY_ccCVPg_I
VITE_POCKETBASE_URL=https://api.yourdomain.com
VITE_NOTIFICATIONS_OPTIONAL=true
```

Rebuild:
```bash
npm run build

# Upload dist/ folder to Hostinger
```

---

## 🔒 Secure Production Setup

### 1. HTTPS Certificate
```bash
# Hostinger usually provides free SSL
# Enable it in control panel
```

### 2. Protect PocketBase
```bash
# Create strong admin password
./pocketbase serve

# Access: http://localhost:8090/_/
# Set admin password
```

### 3. Environment Variables
```bash
# Create .env file
cat > .env << 'EOF'
PB_URL=https://api.yourdomain.com
PB_API_KEY=your_secret_key_here
EOF

chmod 600 .env
```

---

## ✅ Verification Checklist

- [ ] Frontend loads at https://yourdomain.com
- [ ] Shows "Unfoold" homepage
- [ ] Can access PocketBase admin at https://api.yourdomain.com/_/
- [ ] Collections exist: notifications, push_subscriptions
- [ ] Service worker registers at https://yourdomain.com/service-worker.js
- [ ] Can login + notifications work
- [ ] Push notifications trigger

---

## 🆘 Troubleshooting

### ❌ "Cannot connect to PocketBase"
```bash
# 1. Check if running
ps aux | grep pocketbase

# 2. Check logs
./pocketbase serve 2>&1 | tee pocketbase.log

# 3. Check port
netstat -an | grep 8090
```

### ❌ "Reverse proxy not working"
```bash
# Contact Hostinger support:
# - Ask to setup reverse proxy for api.yourdomain.com → localhost:8090
# - Or use cPanel if available
```

### ❌ "SSL certificate error"
```bash
# PocketBase needs to serve HTTPS
# Use Let's Encrypt (free)

# Option 1: Via Hostinger (auto)
# Option 2: Manual certbot
sudo certbot certonly --webroot -w /var/www/html -d api.yourdomain.com
```

---

## 🔧 Alternative: Use Hostinger's Node.js Support

Jika Hostinger support Node.js:

```bash
# 1. Upload semua project
# 2. SSH into server
# 3. Install dependencies
npm install

# 4. Build frontend
npm run build

# 5. Create startup script
cat > start.sh << 'EOF'
#!/bin/bash
cd /home/username/myapp
npm start &
cd apps/web
npm run start
EOF

chmod +x start.sh

# 6. Setup with forever/pm2
npm install -g pm2
pm2 start start.sh
pm2 startup
pm2 save
```

---

## 📊 Recommended Setup (Simplest)

1. **Frontend (React)** → Hostinger Static Hosting
   - Upload `/dist/apps/web` to `public_html`
   - Auto SSL + CDN included

2. **Backend (PocketBase)** → Separate VPS
   - Keep PocketBase running on VPS
   - Frontend calls `https://api.yourdomain.com`
   - Easier to maintain

3. **Database** → PocketBase built-in SQLite
   - Auto backed up
   - No extra DB needed

---

## 🚀 Quick Deploy Script

Buat file `deploy.sh` untuk automated deployment:

```bash
#!/bin/bash

# Build
npm run build

# Copy to deployment folder
mkdir -p deployment/frontend
mkdir -p deployment/backend

# Frontend
cp -r dist/apps/web/* deployment/frontend/

# Backend
cp apps/pocketbase/pocketbase deployment/backend/
cp -r apps/pocketbase/pb_migrations deployment/backend/
cp -r apps/pocketbase/pb_hooks deployment/backend/

echo "✅ Ready to deploy:"
echo "- Frontend: deployment/frontend/"
echo "- Backend: deployment/backend/"
echo ""
echo "Upload frontend to /public_html"
echo "Upload backend to /home/username/pocketbase"
```

Run:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📞 Hostinger Support Info

Minta ticket support dengan:
- Domain: yourdomain.com
- Request: Setup reverse proxy untuk api.yourdomain.com → localhost:8090
- Atau: Deploy Node.js app di folder `/home/username/`
- HTTPS certificate: Let's Encrypt (free)

---

**Status: Ready to deploy! 🎉**

Butuh bantuan dengan step spesifik?
