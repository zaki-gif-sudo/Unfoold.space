/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("reservations");

  const existing = collection.fields.getByName("numberOfGuests");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("numberOfGuests"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "numberOfGuests",
    required: true,
    min: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("reservations");
  collection.fields.removeByName("numberOfGuests");
  return app.save(collection);
})