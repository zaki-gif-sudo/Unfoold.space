/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // === moments collection ===
  const moments = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "userId = @request.auth.id",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3910098721",
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
        "id": "text7281940001",
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
        "id": "text7281940002",
        "name": "caption",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 500,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "file7281940003",
        "name": "photo",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "file",
        "maxSelect": 5,
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
        "id": "number7281940004",
        "name": "likes",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "number",
        "max": null,
        "min": 0,
        "onlyInt": true
      },
      {
        "hidden": false,
        "id": "autodate7281940005",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate7281940006",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_7281940000",
    "indexes": [],
    "listRule": "",
    "name": "moments",
    "system": false,
    "type": "base",
    "updateRule": "userId = @request.auth.id",
    "viewRule": ""
  });

  try {
    app.save(moments);
  } catch (e) {
    if (e.message.includes("Collection name must be unique")) {
      console.log("moments collection already exists, skipping");
    } else {
      throw e;
    }
  }

  // === momentLikes collection ===
  const momentLikes = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "userId = @request.auth.id",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3920098721",
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
        "id": "text7282940001",
        "name": "momentId",
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
        "id": "text7282940002",
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
        "id": "autodate7282940003",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate7282940004",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_7282940000",
    "indexes": [],
    "listRule": "",
    "name": "momentLikes",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": ""
  });

  try {
    app.save(momentLikes);
  } catch (e) {
    if (e.message.includes("Collection name must be unique")) {
      console.log("momentLikes collection already exists, skipping");
    } else {
      throw e;
    }
  }

  // === momentComments collection ===
  const momentComments = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "userId = @request.auth.id",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3930098721",
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
        "id": "text7283940001",
        "name": "momentId",
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
        "id": "text7283940002",
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
        "id": "text7283940003",
        "name": "content",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 500,
        "min": 1,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "autodate7283940004",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate7283940005",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_7283940000",
    "indexes": [],
    "listRule": "",
    "name": "momentComments",
    "system": false,
    "type": "base",
    "updateRule": "userId = @request.auth.id",
    "viewRule": ""
  });

  try {
    app.save(momentComments);
  } catch (e) {
    if (e.message.includes("Collection name must be unique")) {
      console.log("momentComments collection already exists, skipping");
    } else {
      throw e;
    }
  }

}, (app) => {
  // Rollback
  try {
    const c1 = app.findCollectionByNameOrId("momentComments");
    app.delete(c1);
  } catch (e) { console.log("momentComments not found, skipping"); }
  
  try {
    const c2 = app.findCollectionByNameOrId("momentLikes");
    app.delete(c2);
  } catch (e) { console.log("momentLikes not found, skipping"); }
  
  try {
    const c3 = app.findCollectionByNameOrId("moments");
    app.delete(c3);
  } catch (e) { console.log("moments not found, skipping"); }
})
