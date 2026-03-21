/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // === Add isPrivate field to users collection ===
  const users = app.findCollectionByNameOrId("_pb_users_auth_");
  users.fields.addAt(users.fields.length, new Field({
    "hidden": false,
    "id": "bool_isPrivate_001",
    "name": "isPrivate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }));
  app.save(users);

  // === followRequests collection ===
  const followRequests = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "requesterId = @request.auth.id || targetId = @request.auth.id",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3970098721",
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
        "id": "text7293940001",
        "name": "requesterId",
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
        "id": "text7293940002",
        "name": "targetId",
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
        "id": "text7293940003",
        "name": "status",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 20,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "autodate7293940004",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate7293940005",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_7293940000",
    "indexes": [],
    "listRule": "requesterId = @request.auth.id || targetId = @request.auth.id",
    "name": "followRequests",
    "system": false,
    "type": "base",
    "updateRule": "targetId = @request.auth.id",
    "viewRule": "requesterId = @request.auth.id || targetId = @request.auth.id"
  });

  try {
    app.save(followRequests);
  } catch (e) {
    if (e.message.includes("Collection name must be unique")) {
      console.log("followRequests collection already exists, skipping");
    } else { throw e; }
  }

  // === storyViews collection (to track viewed stories) ===
  const storyViews = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3980098721",
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
        "id": "text7294940001",
        "name": "storyUserId",
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
        "id": "text7294940002",
        "name": "viewerId",
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
        "id": "autodate7294940003",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate7294940004",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_7294940000",
    "indexes": [],
    "listRule": "",
    "name": "storyViews",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": ""
  });

  try {
    app.save(storyViews);
  } catch (e) {
    if (e.message.includes("Collection name must be unique")) {
      console.log("storyViews collection already exists, skipping");
    } else { throw e; }
  }

}, (app) => {
  // Rollback
  try { const c = app.findCollectionByNameOrId("storyViews"); app.delete(c); } catch (e) { console.log("storyViews not found"); }
  try { const c = app.findCollectionByNameOrId("followRequests"); app.delete(c); } catch (e) { console.log("followRequests not found"); }

  try {
    const users = app.findCollectionByNameOrId("_pb_users_auth_");
    const field = users.fields.find(f => f.name === "isPrivate");
    if (field) {
      users.fields.removeById(field.id);
      app.save(users);
    }
  } catch (e) { console.log("Could not remove isPrivate field"); }
})
