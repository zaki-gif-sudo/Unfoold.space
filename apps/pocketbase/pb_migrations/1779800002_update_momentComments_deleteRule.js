/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Allow any authenticated user to attempt delete on momentComments.
  // The pb_hook "guard-comment-delete.pb.js" will enforce that only:
  //   1. The comment author, OR
  //   2. The post owner
  // can actually delete.
  const collection = app.findCollectionByNameOrId("momentComments");
  collection.deleteRule = "@request.auth.id != ''";
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("momentComments");
  collection.deleteRule = "userId = @request.auth.id";
  app.save(collection);
});
