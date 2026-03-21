/// <reference path="../pb_data/types.d.ts" />

// Auto-cancel reservations that are 30 minutes past their reserved time.
// Runs every 5 minutes via cronAdd.
// Also frees the associated table when auto-cancelling.

cronAdd("autoCancel30minReservations", "*/5 * * * *", () => {
  try {
    const now = new Date();

    // Find all confirmed reservations
    let reservations;
    try {
      reservations = $app.findRecordsByFilter(
        "reservations",
        "status = 'confirmed'",
        "",
        500,
        0
      );
    } catch (e) {
      // No confirmed reservations found
      return;
    }

    for (let i = 0; i < reservations.length; i++) {
      const res = reservations[i];
      const resDate = res.get("date");
      const resTime = res.get("time");

      if (!resDate || !resTime) continue;

      // Parse reservation datetime
      // date format: "2026-03-11" or "2026-03-11 00:00:00.000Z"
      // time format: "14:00" or "14:30"
      const dateStr = String(resDate).substring(0, 10); // "2026-03-11"
      const timeParts = String(resTime).split(":");
      const hour = parseInt(timeParts[0] || "0", 10);
      const minute = parseInt(timeParts[1] || "0", 10);

      // Build reservation datetime in UTC (PB stores dates in UTC)
      const resDateTime = new Date(dateStr + "T" + String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0") + ":00Z");

      // Add 30 minutes
      const cutoff = new Date(resDateTime.getTime() + 30 * 60 * 1000);

      if (now > cutoff) {
        // Auto-cancel this reservation
        res.set("status", "cancelled");
        $app.save(res);

        // Free the associated table
        const tableId = res.get("table_id");
        if (tableId) {
          try {
            const table = $app.findRecordById("tables", tableId);
            if (table.get("status") === "reserved") {
              table.set("status", "available");
              table.set("current_reservation", "");
              $app.save(table);
            }
          } catch (e) {
            // Table not found, skip
          }
        }
      }
    }
  } catch (e) {
    console.log("Auto-cancel cron error:", e);
  }
});
