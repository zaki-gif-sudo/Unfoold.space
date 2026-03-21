/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    let settings = app.settings()

    // Switch SMTP to Hostinger email
    settings.smtp.enabled = true
    settings.smtp.host = "smtp.hostinger.com"
    settings.smtp.port = 465
    settings.smtp.tls = true
    settings.smtp.authMethod = "LOGIN"
    settings.smtp.username = "administrator@unfoold.space"
    settings.smtp.password = "Zakialisapari10!"

    // Update sender to match SMTP account
    settings.meta.senderName = "Unfoold"
    settings.meta.senderAddress = "administrator@unfoold.space"

    app.save(settings)
}, (app) => {
    let settings = app.settings()
    settings.smtp.host = "127.0.0.1"
    settings.smtp.port = 25
    settings.smtp.tls = false
    settings.smtp.authMethod = ""
    settings.smtp.username = ""
    settings.smtp.password = ""
    settings.meta.senderAddress = "noreply@unfoold.space"
    app.save(settings)
})
