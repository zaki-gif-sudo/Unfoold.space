/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("passwordResetTokens");
  collection.indexes.push("CREATE UNIQUE INDEX idx_passwordResetTokens_token ON passwordResetTokens (token)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("passwordResetTokens");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_passwordResetTokens_token"));
  return app.save(collection);
})