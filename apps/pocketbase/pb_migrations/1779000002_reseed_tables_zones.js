/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Update the tables collection area values
  const collection = app.findCollectionByNameOrId("tables");
  const areaField = collection.fields.getByName("area");
  areaField.values = ["smoking_indoor", "smoking_outdoor", "indoor"];
  
  // Increase max capacity to 30
  const capField = collection.fields.getByName("capacity");
  capField.max = 30;
  
  app.save(collection);

  // Delete all existing tables (wrap in try-catch in case there are none)
  try {
    const existing = app.findRecordsByFilter("tables", "id != ''", "", 200, 0);
    for (let i = 0; i < existing.length; i++) {
      app.delete(existing[i]);
    }
  } catch (e) {
    // No existing tables - that's fine
  }

  // Seed: Smoking Indoor - 20 seats (10 tables x 2 seats each)
  for (let i = 1; i <= 10; i++) {
    const record = new Record(collection);
    record.set("table_number", "SI-" + String(i).padStart(2, "0"));
    record.set("area", "smoking_indoor");
    record.set("capacity", 2);
    record.set("status", "available");
    app.save(record);
  }

  // Seed: Smoking Outdoor - 30 seats (10 tables x 3 seats each)
  for (let i = 1; i <= 10; i++) {
    const record = new Record(collection);
    record.set("table_number", "SO-" + String(i).padStart(2, "0"));
    record.set("area", "smoking_outdoor");
    record.set("capacity", 3);
    record.set("status", "available");
    app.save(record);
  }

  // Seed: Indoor (Non-Smoking) - 20 seats (10 tables x 2 seats each)
  for (let i = 1; i <= 10; i++) {
    const record = new Record(collection);
    record.set("table_number", "IN-" + String(i).padStart(2, "0"));
    record.set("area", "indoor");
    record.set("capacity", 2);
    record.set("status", "available");
    app.save(record);
  }
}, (app) => {
  // Revert area values
  const collection = app.findCollectionByNameOrId("tables");
  const areaField = collection.fields.getByName("area");
  areaField.values = ["indoor", "outdoor", "vip", "bar"];
  app.save(collection);
});
