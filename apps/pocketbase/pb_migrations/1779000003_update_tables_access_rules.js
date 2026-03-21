/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("tables");
  // Allow public read for seat map visibility
  collection.listRule = "";
  collection.viewRule = "";
  // Only authenticated users (kasir) can update table status
  collection.updateRule = "@request.auth.id != ''";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("tables");
  collection.listRule = null;
  collection.viewRule = null;
  collection.updateRule = null;
  return app.save(collection);
});
