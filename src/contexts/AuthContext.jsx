import { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from '../firebase';

// Create Auth Context
export const AuthContext = createContext();

/**
 * Custom hook to use the Auth context
 * @returns {Object} Auth context value with user, token, and loading state
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * AuthProvider component that wraps the app and provides auth state
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [idToken, setIdToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in
                setCurrentUser({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                });

                // Get the ID token
                try {
                    const token = await user.getIdToken();
                    setIdToken(token);

                    // Create user in DynamoDB if they don't exist
                    // This ensures users appear in search
                    try {
                        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/users`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                userId: user.uid,
                                username: user.displayName || user.email.split('@')[0],
                                email: user.email,
                            }),
                        });

                        // Ignore errors if user already exists
                        if (response.ok) {
                            console.log('User created in DynamoDB');
                        }
                    } catch (dbError) {
                        // Silently fail - user might already exist
                        console.log('User may already exist in DynamoDB');
                    }
                } catch (error) {
                    console.error('Error getting ID token:', error);
                    setIdToken(null);
                }
            } else {
                // User is signed out
                setCurrentUser(null);
                setIdToken(null);
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    // Refresh token every 55 minutes (tokens expire after 1 hour)
    useEffect(() => {
        if (!currentUser) return;

        const refreshToken = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const token = await user.getIdToken(true); // Force refresh
                    setIdToken(token);
                }
            } catch (error) {
                console.error('Error refreshing token:', error);
            }
        };

        // Refresh token every 55 minutes
        const interval = setInterval(refreshToken, 55 * 60 * 1000);

        return () => clearInterval(interval);
    }, [currentUser]);

    const value = {
        currentUser,
        idToken,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
