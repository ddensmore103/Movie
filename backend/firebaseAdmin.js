/**
 * Firebase Admin SDK Initialization
 * Used for verifying Firebase ID tokens on the backend
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    });
}

// Export the admin instance
module.exports = admin;
