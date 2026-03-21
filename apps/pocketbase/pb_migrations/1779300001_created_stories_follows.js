/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // === stories collection ===
  const stories = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "userId = @request.auth.id",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3950098721",
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
        "id": "text7291940001",
        "name": "userId",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "file7291940002",
        "name": "photo",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "file",
        "maxSelect": 1,
        "maxSize": 10485760,
        "mimeTypes": [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp"
        ],
        "thumbs": ["300x300", "600x600"]
      },
      {
        "hidden": false,
        "id": "text7291940003",
        "name": "caption",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 200,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "autodate7291940004",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate7291940005",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_7291940000",
    "indexes": [],
    "listRule": "",
    "name": "stories",
    "system": false,
    "type": "base",
    "updateRule": "userId = @request.auth.id",
    "viewRule": ""
  });

  try {
    app.save(stories);
  } catch (e) {
    if (e.message.includes("Collection name must be unique")) {
      console.log("stories collection already exists, skipping");
    } else { throw e; }
  }

  // === follows collection ===
  const follows = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "followerId = @request.auth.id",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3960098721",
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
        "id": "text7292940001",
        "name": "followerId",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text7292940002",
        "name": "followingId",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "autodate7292940003",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate7292940004",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_7292940000",
    "indexes": [],
    "listRule": "",
    "name": "follows",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": ""
  });

  try {
    app.save(follows);
  } catch (e) {
    if (e.message.includes("Collection name must be unique")) {
      console.log("follows collection already exists, skipping");
    } else { throw e; }
  }

}, (app) => {
  try { const c = app.findCollectionByNameOrId("follows"); app.delete(c); } catch (e) { console.log("follows not found"); }
  try { const c = app.findCollectionByNameOrId("stories"); app.delete(c); } catch (e) { console.log("stories not found"); }
})
