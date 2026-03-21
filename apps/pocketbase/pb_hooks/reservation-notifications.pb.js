/// <reference path="../pb_data/types.d.ts" />
// pb_hooks/reservation-notifications.pb.js (PB v0.36)

onRecordAfterCreateSuccess((e) => {
  const reservation = e.record;
  const userId = reservation.get("userId");
  const area = reservation.get("seatType") || "Table";

  if (userId) {
    sendNotification(
      userId,
      "reservation:confirmed",
      "Reservasi dikonfirmasi",
      area + " sudah direservasi untuk Anda",
      "/dashboard",
      { reservationId: reservation.id, area: area }
    );
  }
  e.next();
}, "reservations");

onRecordAfterUpdateSuccess((e) => {
  const reservation = e.record;
  const oldStatus = reservation.original() ? reservation.original().get("status") : null;
  const newStatus = reservation.get("status");

  if (oldStatus && newStatus && oldStatus !== newStatus) {
    const userId = reservation.get("userId");
    if (userId) {
      const labels = { pending: "Pending", confirmed: "Dikonfirmasi", completed: "Selesai", cancelled: "Dibatalkan" };
      sendNotification(
        userId,
        "reservation:updated",
        "Status reservasi diperbarui",
        "Status berubah ke " + (labels[newStatus] || newStatus),
        "/dashboard",
        { reservationId: reservation.id, status: newStatus }
      );
    }
  }
  e.next();
}, "reservations");
