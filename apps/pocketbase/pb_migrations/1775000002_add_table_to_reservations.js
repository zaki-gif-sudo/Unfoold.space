/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("reservations");

  // Add table_id field if it doesn't exist
  const existingTableId = collection.fields.getByName("table_id");
  if (!existingTableId) {
    collection.fields.add(new TextField({
      name: "table_id",
      required: false,
    }));
  }

  // Add notes field for special requests
  const existingSpecialReqs = collection.fields.getByName("special_requests");
  if (!existingSpecialReqs) {
    collection.fields.add(new EditorField({
      name: "special_requests",
      required: false,
    }));
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("reservations");
  
  // Revert changes
  collection.fields.removeByName("table_id");
  collection.fields.removeByName("special_requests");
  
  return app.save(collection);
});
