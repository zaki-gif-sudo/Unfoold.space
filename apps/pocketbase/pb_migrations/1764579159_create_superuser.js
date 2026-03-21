/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const encryptionKey = $os.getenv("PB_ENCRYPTION_KEY")
    
    let email, password;
    
    if (encryptionKey) {
        const emailEncrypted = $os.getenv("PB_SUPERUSER_EMAIL")
        const passwordEncrypted = $os.getenv("PB_SUPERUSER_PASSWORD")
        email = $security.decrypt(emailEncrypted, encryptionKey)
        password = $security.decrypt(passwordEncrypted, encryptionKey)
    } else {
        // Local dev fallback - create default superuser
        email = $os.getenv("PB_SUPERUSER_EMAIL") || "admin@unfoold.local"
        password = $os.getenv("PB_SUPERUSER_PASSWORD") || "admin12345678"
    }
    
    const superusers = app.findCollectionByNameOrId("_superusers")
    const record = new Record(superusers)
    
    record.set("email", email)
    record.set("password", password)
    
    app.save(record)
})
