/// <reference path="../pb_data/types.d.ts" />
onRecordCreateRequest((e) => {
  const email = e.record.get("email");
  
  if (!email) {
    throw new BadRequestError("Email is required");
  }
  
  // Get current time and 1 hour ago
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Format dates for PocketBase filter (YYYY-MM-DD HH:mm:ss)
  const oneHourAgoStr = oneHourAgo.toISOString().replace('T', ' ').substring(0, 19);
  
  // Count reset requests for this email in the last hour
  const filter = "email = '" + email + "' && created >= '" + oneHourAgoStr + "'";
  
  try {
    const records = $app.findRecordsByFilter("passwordResetTokens", filter, "-created", 100);
    
    if (records && records.length >= 3) {
      throw new BadRequestError("Too many password reset requests. Please try again in 1 hour.");
    }
  } catch (err) {
    // If error is our rate limit error, re-throw it
    if (err.message && err.message.includes("Too many password reset requests")) {
      throw err;
    }
    // Otherwise continue (might be no records found, which is fine)
  }
  
  e.next();
}, "passwordResetTokens");