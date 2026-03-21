/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("reservations");

  const existing = collection.fields.getByName("specialRequests");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("specialRequests"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "specialRequests"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("reservations");
  collection.fields.removeByName("specialRequests");
  return app.save(collection);
})