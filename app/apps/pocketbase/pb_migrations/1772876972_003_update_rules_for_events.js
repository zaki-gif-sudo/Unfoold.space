/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("events");
  collection.listRule = "";
  collection.viewRule = "";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("events");
  collection.listRule = "";
  collection.viewRule = "";
  collection.createRule = null;
  collection.updateRule = null;
  collection.deleteRule = null;
  return app.save(collection);
})