/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("orders");
  
  collection.fields.add(new Field({
    "hidden": false,
    "id": "text_customerName",
    "name": "customerName",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text",
    "autogeneratePattern": "",
    "max": 0,
    "min": 0,
    "pattern": ""
  }));

  collection.fields.add(new Field({
    "hidden": false,
    "id": "text_customerEmail",
    "name": "customerEmail",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text",
    "autogeneratePattern": "",
    "max": 0,
    "min": 0,
    "pattern": ""
  }));

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("orders");
  collection.fields.removeById("text_customerName");
  collection.fields.removeById("text_customerEmail");
  app.save(collection);
});
