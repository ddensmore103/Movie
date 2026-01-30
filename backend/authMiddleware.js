/**
 * Authentication Middleware
 * Verifies Firebase ID tokens and attaches user info to request
 */

const admin = require('./firebaseAdmin');

/**
 * Middleware to verify Firebase authentication token
 * Extracts token from Authorization header, verifies it, and attaches user info to req.user
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get the Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized: No token provided'
            });
        }

        // Extract the token
        const token = authHeader.split('Bearer ')[1];

        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized: Invalid token format'
            });
        }

        // Verify the token with Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Attach user info to request object
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified
        };

        // Continue to the next middleware/route handler
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);

        // Handle specific Firebase errors
        if (error.code === 'auth/id-token-expired') {
            return res.status(403).json({
                error: 'Forbidden: Token expired'
            });
        }

        if (error.code === 'auth/argument-error') {
            return res.status(401).json({
                error: 'Unauthorized: Invalid token'
            });
        }

        // Generic error
        return res.status(401).json({
            error: 'Unauthorized: Token verification failed'
        });
    }
};

module.exports = authMiddleware;
