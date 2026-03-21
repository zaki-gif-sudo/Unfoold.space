/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const existing = collection.fields.getByName("loyaltyPoints");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("loyaltyPoints"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "loyaltyPoints",
    required: false,
    min: 0
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("loyaltyPoints");
  return app.save(collection);
})