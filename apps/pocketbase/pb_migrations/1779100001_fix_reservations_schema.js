/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("reservations");

  // Add customerName if missing
  if (!collection.fields.getByName("customerName")) {
    collection.fields.add(new TextField({
      name: "customerName",
      required: false,
    }));
  }

  // Add customerEmail if missing
  if (!collection.fields.getByName("customerEmail")) {
    collection.fields.add(new TextField({
      name: "customerEmail",
      required: false,
    }));
  }

  // Add table_id if missing
  if (!collection.fields.getByName("table_id")) {
    collection.fields.add(new TextField({
      name: "table_id",
      required: false,
    }));
  }

  // Update seatType to include new zone values
  const seatTypeField = collection.fields.getByName("seatType");
  if (seatTypeField) {
    seatTypeField.values = [
      "Solo Seat",
      "Couple Seat",
      "Group Table",
      "Smoking Indoor",
      "Smoking Outdoor",
      "Indoor (Non-Smoking)",
    ];
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("reservations");
  collection.fields.removeByName("customerName");
  collection.fields.removeByName("customerEmail");
  collection.fields.removeByName("table_id");

  const seatTypeField = collection.fields.getByName("seatType");
  if (seatTypeField) {
    seatTypeField.values = ["Solo Seat", "Couple Seat", "Group Table"];
  }

  return app.save(collection);
});
