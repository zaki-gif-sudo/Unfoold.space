/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("reservations");

  const existing = collection.fields.getByName("bookingReference");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("bookingReference"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "bookingReference"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("reservations");
  collection.fields.removeByName("bookingReference");
  return app.save(collection);
})