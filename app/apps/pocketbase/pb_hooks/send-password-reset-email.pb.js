/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const email = e.record.get("email");
  const token = e.record.get("token");
  
  // Fetch user by email from users collection
  const user = $app.findFirstRecordByData("users", "email", email);
  
  if (!user) {
    // User not found, silently continue (don't reveal if email exists)
    e.next();
    return;
  }
  
  const userName = user.get("name") || "User";
  const resetLink = "https://unfoold.app/reset-password?token=" + token;
  
  const message = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName
    },
    to: [{ address: email }],
    subject: "Reset Your Unfoold Password",
    html: "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">" +
      "<h2>Hello " + userName + ",</h2>" +
      "<p>We received a request to reset your password. Click the link below to create a new password:</p>" +
      "<p style=\"margin: 30px 0;\"><a href=\"" + resetLink + "\" style=\"background-color: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;\">Reset Password</a></p>" +
      "<p><strong>Link expires in:</strong> 20 minutes</p>" +
      "<p style=\"color: #666; font-size: 14px;\"><strong>Security Note:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.</p>" +
      "<hr style=\"border: none; border-top: 1px solid #ddd; margin: 30px 0;\">" +
      "<p style=\"color: #999; font-size: 12px; text-align: center;\">© Unfoold - Your Coffee Community</p>" +
      "</div>"
  });
  
  $app.newMailClient().send(message);
  e.next();
}, "passwordResetTokens");