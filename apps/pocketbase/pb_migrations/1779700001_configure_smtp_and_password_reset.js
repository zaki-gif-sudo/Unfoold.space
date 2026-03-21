/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    let settings = app.settings()

    // Configure SMTP to use local Postfix
    settings.smtp.enabled = true
    settings.smtp.host = "127.0.0.1"
    settings.smtp.port = 25
    settings.smtp.tls = false
    settings.smtp.authMethod = ""
    settings.smtp.username = ""
    settings.smtp.localName = "unfoold.space"

    // Update app metadata
    settings.meta.appName = "Unfoold"
    settings.meta.appURL = "https://unfoold.space"
    settings.meta.senderName = "Unfoold"
    settings.meta.senderAddress = "noreply@unfoold.space"

    // Configure password reset email template
    settings.meta.resetPasswordTemplate = {
        subject: "Reset Password Unfoold",
        actionUrl: "{APP_URL}/reset-password?token={TOKEN}",
        body: `<p>Halo,</p>
<p>Kami menerima permintaan untuk mereset password akun Unfoold Anda.</p>
<p>Klik tombol di bawah untuk membuat password baru:</p>
<p><a class="btn" href="{ACTION_URL}" target="_blank" rel="noopener" style="background-color:#8B4513;color:#ffffff;padding:12px 30px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">Reset Password</a></p>
<p><small>Link ini berlaku selama 20 menit.</small></p>
<p>Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman.</p>
<p>Salam,<br/>Tim Unfoold</p>`
    }

    // Configure verification email template
    settings.meta.verificationTemplate = {
        subject: "Verifikasi Email Unfoold",
        actionUrl: "{APP_URL}/verify-email?token={TOKEN}",
        body: `<p>Halo,</p>
<p>Terima kasih telah mendaftar di Unfoold.</p>
<p>Klik tombol di bawah untuk memverifikasi email Anda:</p>
<p><a class="btn" href="{ACTION_URL}" target="_blank" rel="noopener" style="background-color:#8B4513;color:#ffffff;padding:12px 30px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">Verifikasi Email</a></p>
<p>Salam,<br/>Tim Unfoold</p>`
    }

    app.save(settings)
}, (app) => {
    // Revert to defaults
    let settings = app.settings()
    settings.smtp.enabled = false
    settings.smtp.host = "smtp.example.com"
    settings.smtp.port = 587
    settings.meta.appURL = "https://13222a4f-1f4e-4729-8f8a-40893789af3d.app-preview.com/hcgi/platform"
    settings.meta.senderAddress = "support@example.com"
    settings.meta.senderName = "Support"
    app.save(settings)
})
