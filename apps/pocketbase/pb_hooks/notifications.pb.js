/// <reference path="../pb_data/types.d.ts" />
// pb_hooks/notifications.pb.js - Central notification helper (PB v0.36)

function sendNotification(userId, type, title, body, url, payload) {
  try {
    const collection = $app.findCollectionByNameOrId("notifications");
    const record = new Record(collection);
    record.set("user_id", userId);
    record.set("type", type);
    record.set("title", title);
    record.set("body", body || "");
    record.set("url", url || "");
    record.set("payload", payload || {});
    record.set("is_read", false);
    $app.save(record);
    return record;
  } catch (err) {
    console.log("sendNotification error:", err);
  }
}
