/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text2855721679",
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
        "name": "table_number",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "min": 0,
        "max": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "select1234567891",
        "name": "area",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "maxSelect": 1,
        "values": ["indoor", "outdoor", "vip", "bar"]
      },
      {
        "hidden": false,
        "id": "number1234567892",
        "name": "capacity",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number",
        "min": 1,
        "max": 20,
        "onlyInt": true
      },
      {
        "hidden": false,
        "id": "select1234567893",
        "name": "status",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "select",
        "maxSelect": 1,
        "values": ["available", "occupied", "reserved", "maintenance"]
      },
      {
        "hidden": false,
        "id": "text1234567894",
        "name": "current_reservation",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "min": 0,
        "max": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "autodate1234567895",
        "name": "created",
        "presentable": false,
        "system": false,
        "type": "autodate",
        "onCreate": true,
        "onUpdate": false
      },
      {
        "hidden": false,
        "id": "autodate1234567896",
        "name": "updated",
        "presentable": false,
        "system": false,
        "type": "autodate",
        "onCreate": true,
        "onUpdate": true
      }
    ],
    "id": "pbc_tables",
    "indexes": ["CREATE UNIQUE INDEX idx_table_number ON tables (table_number)"],
    "listRule": null,
    "name": "tables",
    "system": false,
    "type": "base",
    "viewRule": null,
    "updateRule": null
  });

  try {
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("already exists")) {
      console.log("Collection already exists, skipping");
      return;
    }
    throw e;
  }
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("pbc_tables");
    return app.delete(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
});
