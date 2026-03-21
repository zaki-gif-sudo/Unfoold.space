/// <reference path="../pb_data/types.d.ts" />
// pb_hooks/order-notifications.pb.js - Order status change notifications (PB v0.36)

onRecordAfterUpdateSuccess((e) => {
  const order = e.record;
  const oldRecord = order.original();

  const newStatus = order.get("status");
  const oldStatus = oldRecord ? oldRecord.get("status") : null;

  // Only proceed if status actually changed
  if (!newStatus || !oldStatus || newStatus === oldStatus) {
    e.next();
    return;
  }

  const orderId = order.id;
  const userId = order.get("userId") || order.get("user_id") || "";

  // Send Web Push notification when order is ready
  if (newStatus === "ready" && userId) {
    try {
      const res = $http.send({
        url: "http://127.0.0.1:3001/send-push",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          title: "Pesanan Siap! ☕",
          body: "Pesanan #" + orderId.substring(0, 8).toUpperCase() + " sudah siap diambil",
          url: "/dashboard",
          tag: "order-ready-" + orderId,
        }),
        timeout: 10,
      });
      console.log("Push sent:", res.statusCode, res.raw);
    } catch (err) {
      console.log("Push notification send failed:", err);
    }
  }

  e.next();
}, "orders");
