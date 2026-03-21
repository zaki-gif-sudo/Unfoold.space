/// <reference path="../pb_data/types.d.ts" />
// pb_hooks/moments-notifications.pb.js (PB v0.36)

/**
 * Send notification when photo is uploaded by someone user follows
 */
onRecordAfterCreateSuccess((e) => {
  const moment = e.record;
  const uploaderId = moment.get("userId");
  const momentId = moment.id;

  try {
    const followers = $app.findRecordsByFilter(
      "follows",
      `followerId != {:uploaderId} && followingId = {:uploaderId}`,
      "-created",
      100,
      0,
      { uploaderId: uploaderId }
    );

    followers.forEach(follow => {
      const followerId = follow.get("followerId");

      sendNotification(
        followerId,
        "moments:upload",
        "New photo shared",
        "Someone you follow uploaded a new moment",
        `/moments/${momentId}`,
        { momentId }
      );
    });
  } catch (err) {
    console.error("Error sending moment upload notifications:", err);
  }

  e.next();
}, "moments");

/**
 * Send notification on like
 */
onRecordAfterCreateSuccess((e) => {
  const like = e.record;
  const likerId = like.get("userId");
  const momentId = like.get("momentId");

  try {
    const moment = $app.findRecordById("moments", momentId);
    const uploaderId = moment.get("userId");

    if (uploaderId && uploaderId !== likerId) {
      sendNotification(
        uploaderId,
        "moments:like",
        "Someone liked your photo",
        "Your moment received a new like",
        `/moments/${momentId}`,
        { momentId }
      );
    }
  } catch (err) {
    console.error("Error sending like notification:", err);
  }

  e.next();
}, "momentLikes");

/**
 * Send notification on comment
 */
onRecordAfterCreateSuccess((e) => {
  const comment = e.record;
  const commenterId = comment.get("userId");
  const momentId = comment.get("momentId");

  try {
    const moment = $app.findRecordById("moments", momentId);
    const uploaderId = moment.get("userId");

    if (uploaderId && uploaderId !== commenterId) {
      sendNotification(
        uploaderId,
        "moments:comment",
        "New comment on your photo",
        `${(comment.get("content") || "").substring(0, 50)}...`,
        `/moments/${momentId}`,
        { momentId }
      );
    }
  } catch (err) {
    console.error("Error sending comment notification:", err);
  }

  e.next();
}, "momentComments");
