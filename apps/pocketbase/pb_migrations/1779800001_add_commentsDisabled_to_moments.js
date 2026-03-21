/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("moments");
  collection.fields.addAt(collection.fields.length, new Field({
    "hidden": false,
    "id": "bool7281940010",
    "name": "commentsDisabled",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }));
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("moments");
  collection.fields.removeById("bool7281940010");
  app.save(collection);
});
