#!/usr/bin/env node
// generate-vapid.js

const webpush = require('web-push');

console.log('\n🔐 Generating VAPID Keys...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys Generated:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📢 PUBLIC KEY (add to .env.local):');
console.log(vapidKeys.publicKey);
console.log('\n🔒 PRIVATE KEY (keep safe, for backend only):');
console.log(vapidKeys.privateKey);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📝 Add this to apps/web/.env.local:\n');
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\n`);

console.log('✨ Done! Keys are ready to use.\n');
