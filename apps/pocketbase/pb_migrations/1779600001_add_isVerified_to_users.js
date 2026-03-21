/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");
  collection.fields.addAt(collection.fields.length, new Field({
    system: false,
    id: "bool_isverified",
    name: "isVerified",
    type: "bool",
    required: false,
    presentable: false,
  }));
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");
  collection.fields.removeById("bool_isverified");
  app.save(collection);
});
