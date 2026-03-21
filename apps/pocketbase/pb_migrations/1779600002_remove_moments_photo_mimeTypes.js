/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("moments");

  const photoField = collection.fields.getByName("photo");
  if (photoField) {
    photoField.mimeTypes = [];
    app.save(collection);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("moments");

  const photoField = collection.fields.getByName("photo");
  if (photoField) {
    photoField.mimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    app.save(collection);
  }
})
