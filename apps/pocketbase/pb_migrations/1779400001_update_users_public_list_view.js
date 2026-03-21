/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Make users collection publicly listable and viewable
  // so the Social feature can search users and display names/avatars.
  // PocketBase automatically hides email for non-owner requests (emailVisibility=false by default).
  const users = app.findCollectionByNameOrId("users");
  users.listRule = "";
  users.viewRule = "";
  app.save(users);
}, (app) => {
  // Rollback: restrict list/view to own record only
  const users = app.findCollectionByNameOrId("users");
  users.listRule = "id = @request.auth.id";
  users.viewRule = "id = @request.auth.id";
  app.save(users);
});
