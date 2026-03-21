/// <reference path="../pb_data/types.d.ts" />
// pb_hooks/rsvp-notifications.pb.js (PB v0.36)

onRecordAfterCreateSuccess((e) => {
  const rsvp = e.record;
  const userId = rsvp.get("userId");
  const eventId = rsvp.get("eventId");

  if (userId && eventId) {
    try {
      const event = $app.findRecordById("events", eventId);
      const eventName = event ? event.get("name") : "Event";
      sendNotification(
        userId,
        "event:registered",
        "Registrasi event dikonfirmasi",
        "Kamu terdaftar di " + eventName,
        "/community/events/" + eventId,
        { eventId: eventId, eventName: eventName }
      );
    } catch (err) {
      console.log("rsvp-notification error:", err);
    }
  }
  e.next();
}, "eventRegistrations");
