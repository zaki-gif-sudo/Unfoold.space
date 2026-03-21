/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  const field = collection.fields.getByName("avatar");
  field.maxSize = 20971520;
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  const field = collection.fields.getByName("avatar");
  field.maxSize = 0;
  return app.save(collection);
})