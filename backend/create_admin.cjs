const admin = require("firebase-admin");

// Initialize Firebase Admin (reuse env vars from server env or assume local run)
// Initialize Firebase Admin (reuse env vars from server env or assume local run)
require("dotenv").config();

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    });
}

const createAdminUser = async () => {
    const email = "dldensmore1@gmail.com";
    const password = "M@vieAdm1n";
    const username = "Admin";

    try {
        // Check if user exists
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            console.log("Admin user already exists:", userRecord.uid);
            return;
        } catch (error) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }

        // Create user
        const userRecord = await admin.auth().createUser({
            email: email,
            emailVerified: true,
            password: password,
            displayName: username,
            disabled: false,
        });

        console.log("Successfully created admin user:", userRecord.uid);
    } catch (error) {
        console.error("Error creating admin user:", error);
    }
};

createAdminUser();
