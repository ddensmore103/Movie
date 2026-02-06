// Firebase Configuration and Initialization
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    sendEmailVerification as firebaseSendEmailVerification,
    deleteUser
} from 'firebase/auth';

// Firebase configuration from environment variables
// You'll need to add these to your .env file after creating a Firebase project
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Auth helper functions

/**
 * Sign up a new user with email and password
 * Automatically sends email verification
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<UserCredential>} Firebase user credential
 */
export const signUpWithEmail = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Send verification email immediately after sign up
        await firebaseSendEmailVerification(userCredential.user);
        return userCredential;
    } catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
};

/**
 * Log in an existing user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<UserCredential>} Firebase user credential
 */
export const loginWithEmail = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};

/**
 * Sign in with Google popup
 * @returns {Promise<UserCredential>} Firebase user credential
 */
export const signInWithGoogle = async () => {
    try {
        const userCredential = await signInWithPopup(auth, googleProvider);
        return userCredential;
    } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
    }
};

/**
 * Send email verification to current user
 * @param {User} user - Firebase user object
 * @returns {Promise<void>}
 */
export const sendEmailVerification = async (user) => {
    try {
        await firebaseSendEmailVerification(user);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
};

/**
 * Delete the current user's account
 * @returns {Promise<void>}
 */
export const deleteAccount = async () => {
    try {
        const user = auth.currentUser;
        if (user) {
            await deleteUser(user);
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
};

/**
 * Log out the current user
 * @returns {Promise<void>}
 */
export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error logging out:', error);
        throw error;
    }
};

// Export onAuthStateChanged for use in AuthContext
export { onAuthStateChanged };
