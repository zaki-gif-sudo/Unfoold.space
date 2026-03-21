/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text8288860753",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567890",
        "name": "user_id",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567891",
        "name": "type",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567892",
        "name": "title",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1234567893",
        "name": "body",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "json1234567894",
        "name": "payload",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "text1234567895",
        "name": "url",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "bool1234567896",
        "name": "is_read",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "bool",
        "default": false
      },
      {
        "hidden": false,
        "id": "autodate1234567897",
        "name": "created_at",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": true,
        "type": "autodate"
      }
    ],
    "id": "notifications",
    "listRule": "@request.auth.id = user_id",
    "name": "notifications",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id = user_id",
    "viewRule": "@request.auth.id = user_id"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("notifications");
  return app.delete(collection);
});
