/// <reference path="../pb_data/types.d.ts" />
// pb_hooks/loyalty-points.pb.js - Auto award loyalty points (PB v0.36)
// 2 points per cup ordered, 3 points per event registration
// Bronze: 0-99, Silver: 100-199, Gold: 200-299, Platinum: 300+

function getMembershipLevel(points) {
  if (points >= 500) return "Platinum";
  if (points >= 300) return "Gold";
  if (points >= 200) return "Silver";
  if (points >= 100) return "Bronze";
  return "Bronze";
}

function addPoints(userId, pointsToAdd) {
  try {
    const user = $app.findRecordById("users", userId);
    if (!user) return;

    const currentPoints = user.get("loyaltyPoints") || 0;
    const newPoints = currentPoints + pointsToAdd;
    const newLevel = getMembershipLevel(newPoints);

    user.set("loyaltyPoints", newPoints);
    user.set("membershipLevel", newLevel);
    $app.save(user);

    console.log("Loyalty: user=" + userId + " +" + pointsToAdd + "pts, total=" + newPoints + ", level=" + newLevel);
  } catch (err) {
    console.log("loyalty-points addPoints error:", err);
  }
}

// Award 2 points per cup when order is created
onRecordAfterCreateSuccess((e) => {
  const order = e.record;
  const userId = order.get("userId");
  if (!userId) { e.next(); return; }

  const items = order.get("items");
  if (!items || !Array.isArray(items)) { e.next(); return; }

  let totalCups = 0;
  for (let i = 0; i < items.length; i++) {
    totalCups += (items[i].quantity || 1);
  }

  if (totalCups > 0) {
    addPoints(userId, totalCups * 2);
  }

  e.next();
}, "orders");

// Award 3 points when registering for an event
onRecordAfterCreateSuccess((e) => {
  const rsvp = e.record;
  const userId = rsvp.get("userId");
  if (!userId) { e.next(); return; }

  addPoints(userId, 3);

  e.next();
}, "eventRegistrations");
