/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  const field = collection.fields.getByName("membershipLevel");
  field.values = ["Bronze", "Silver", "Gold", "Platinum"];
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  const field = collection.fields.getByName("membershipLevel");
  field.values = ["Coffee Guest", "Coffee Insider", "Unfoold Member"];
  return app.save(collection);
});
