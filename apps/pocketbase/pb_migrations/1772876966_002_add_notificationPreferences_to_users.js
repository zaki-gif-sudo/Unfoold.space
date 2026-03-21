/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const existing = collection.fields.getByName("notificationPreferences");
  if (existing) {
    if (existing.type === "json") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("notificationPreferences"); // exists with wrong type, remove first
  }

  collection.fields.add(new JSONField({
    name: "notificationPreferences"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("notificationPreferences");
  return app.save(collection);
})