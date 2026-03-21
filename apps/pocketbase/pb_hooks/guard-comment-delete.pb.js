/// <reference path="../pb_data/types.d.ts" />

// Guard comment deletion: only comment author or post owner can delete
onRecordDeleteRequest((e) => {
  const authId = e.auth?.id;
  if (!authId) {
    throw new ForbiddenError("Tidak diizinkan");
  }

  const comment = e.record;
  
  // Allow if user is the comment author
  if (comment.getString("userId") === authId) {
    return e.next();
  }

  // Allow if user is the post owner
  const momentId = comment.getString("momentId");
  try {
    const moment = e.app.findRecordById("moments", momentId);
    if (moment.getString("userId") === authId) {
      return e.next();
    }
  } catch (err) {
    // moment not found, deny
  }

  throw new ForbiddenError("Kamu tidak bisa menghapus komentar ini");
}, "momentComments");
