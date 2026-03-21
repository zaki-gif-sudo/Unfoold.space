/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("users")

    collection.resetPasswordTemplate = {
        subject: "Reset Password Unfoold",
        body: '<p>Halo,</p>\n' +
              '<p>Kami menerima permintaan untuk mereset password akun Unfoold Anda.</p>\n' +
              '<p>Klik tombol di bawah untuk membuat password baru:</p>\n' +
              '<p>\n' +
              '  <a class="btn" href="{APP_URL}/reset-password?token={TOKEN}" target="_blank" rel="noopener" ' +
              'style="background-color:#8B4513;color:#ffffff;padding:12px 30px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">' +
              'Reset Password</a>\n' +
              '</p>\n' +
              '<p><small>Link ini berlaku selama 20 menit.</small></p>\n' +
              '<p><i>Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman.</i></p>\n' +
              '<p>\n  Salam,<br/>\n  Tim Unfoold\n</p>'
    }

    collection.verificationTemplate = {
        subject: "Verifikasi Email Unfoold",
        body: '<p>Halo,</p>\n' +
              '<p>Terima kasih telah mendaftar di Unfoold.</p>\n' +
              '<p>Klik tombol di bawah untuk memverifikasi email Anda:</p>\n' +
              '<p>\n' +
              '  <a class="btn" href="{APP_URL}/verify-email?token={TOKEN}" target="_blank" rel="noopener" ' +
              'style="background-color:#8B4513;color:#ffffff;padding:12px 30px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">' +
              'Verifikasi Email</a>\n' +
              '</p>\n' +
              '<p>\n  Salam,<br/>\n  Tim Unfoold\n</p>'
    }

    app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("users")

    collection.resetPasswordTemplate = {
        subject: "Reset your {APP_NAME} password",
        body: '<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n</p>\n<p><i>If you didn\'t ask to reset your password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>'
    }

    collection.verificationTemplate = {
        subject: "Verify your {APP_NAME} email",
        body: '<p>Hello,</p>\n<p>Thank you for joining us at {APP_NAME}.</p>\n<p>Click on the button below to verify your email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-verification/{TOKEN}" target="_blank" rel="noopener">Verify</a>\n</p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>'
    }

    app.save(collection)
})
