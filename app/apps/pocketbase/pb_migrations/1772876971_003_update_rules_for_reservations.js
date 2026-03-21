/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("reservations");
  collection.listRule = "userId = @request.auth.id";
  collection.createRule = "@request.auth.id != ''";
  collection.updateRule = "userId = @request.auth.id";
  collection.deleteRule = "userId = @request.auth.id";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("reservations");
  collection.createRule = "@request.auth.id != ''";
  collection.listRule = "userId = @request.auth.id";
  collection.updateRule = "userId = @request.auth.id";
  collection.deleteRule = "userId = @request.auth.id";
  return app.save(collection);
})