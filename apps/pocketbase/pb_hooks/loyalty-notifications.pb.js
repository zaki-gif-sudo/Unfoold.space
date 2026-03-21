/// <reference path="../pb_data/types.d.ts" />
// pb_hooks/loyalty-notifications.pb.js (PB v0.36)

onRecordAfterUpdateSuccess((e) => {
  const user = e.record;
  const orig = user.original();
  if (!orig) { e.next(); return; }

  const oldPoints = orig.get("loyaltyPoints") || 0;
  const newPoints = user.get("loyaltyPoints") || 0;

  if (newPoints > oldPoints) {
    const diff = newPoints - oldPoints;
    sendNotification(
      user.id,
      "loyalty:points-earned",
      "Poin didapatkan!",
      "Kamu mendapatkan " + diff + " coffee points",
      "/dashboard",
      { points: diff, totalPoints: newPoints }
    );
  }

  const oldLevel = orig.get("membershipLevel") || "";
  const newLevel = user.get("membershipLevel") || "";

  if (oldLevel && newLevel && oldLevel !== newLevel) {
    const benefits = {
      "Bronze": "Selamat datang di program loyalti Unfoold!",
      "Silver": "Nikmati diskon 5% untuk semua pesanan",
      "Gold": "Dapatkan kopi gratis setiap 10 pembelian + prioritas reservasi",
      "Platinum": "Akses VIP eksklusif + diskon 15% + reservasi prioritas"
    };
    sendNotification(
      user.id,
      "loyalty:tier-up",
      "Selamat! Level naik ke " + newLevel,
      benefits[newLevel] || "Level baru!",
      "/dashboard",
      { newLevel: newLevel, oldLevel: oldLevel }
    );
  }
  e.next();
}, "users");
