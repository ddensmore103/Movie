import { useState } from 'react';
import { signUpWithEmail, loginWithEmail, signInWithGoogle, logout } from '../firebase';
import './Auth.css';

/**
 * Authentication component with sign up, login, Google sign-in, and logout
 */
const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Handle email/password form submission
     */
    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                await signUpWithEmail(email, password);
            } else {
                await loginWithEmail(email, password);
            }
            // Auth state will be updated by onAuthStateChanged in AuthContext
        } catch (err) {
            // Handle Firebase auth errors
            let errorMessage = err.message;

            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please log in instead.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password.';
            } else if (err.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle Google sign-in
     */
    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);

        try {
            await signInWithGoogle();
            // Auth state will be updated by onAuthStateChanged in AuthContext
        } catch (err) {
            let errorMessage = err.message;

            if (err.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign-in popup was closed. Please try again.';
            } else if (err.code === 'auth/cancelled-popup-request') {
                errorMessage = 'Only one popup request is allowed at a time.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Toggle between sign up and login forms
     */
    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError(null);
        setEmail('');
        setPassword('');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">🎬 Movie App</h1>
                <h2 className="auth-subtitle">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>

                {error && (
                    <div className="auth-error">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleEmailAuth} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button primary"
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Log In')}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>OR</span>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    className="auth-button google"
                    disabled={loading}
                >
                    <svg className="google-icon" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                </button>

                <div className="auth-toggle">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button
                        type="button"
                        onClick={toggleMode}
                        className="toggle-button"
                        disabled={loading}
                    >
                        {isSignUp ? 'Log In' : 'Sign Up'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
