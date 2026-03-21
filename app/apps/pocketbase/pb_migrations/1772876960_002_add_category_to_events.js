/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("events");

  const existing = collection.fields.getByName("category");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("category"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "category",
    values: ["Coffee Cupping", "Creative Talks", "Open Mic Night", "Startup Meetups", "Acoustic Night"]
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("events");
  collection.fields.removeByName("category");
  return app.save(collection);
})