import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteAccount, auth } from '../firebase';
import { deleteUserData, getUser, updateUserProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        emailNotifications: true,
        friendRequests: true,
        activityUpdates: false,
        privateProfile: false // Default to public (not private)
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);
    const { currentUser } = useAuth(); // Get current user

    // Fetch user settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            if (currentUser?.uid) {
                try {
                    const userData = await getUser(currentUser.uid);
                    setSettings(prev => ({
                        ...prev,
                        privateProfile: userData.isPrivate ?? false // isPrivate=true means privateProfile=true
                    }));
                } catch (err) {
                    console.error('Error fetching settings:', err);
                }
            }
        };
        fetchSettings();
    }, [currentUser]);

    const handleToggle = async (key) => {
        const newValue = !settings[key];

        setSettings(prev => ({
            ...prev,
            [key]: newValue
        }));

        // Persist to backend if it's the privacy setting
        if (key === 'privateProfile') {
            try {
                // privateProfile = true => isPrivate = true
                await updateUserProfile(currentUser.uid, { isPrivate: newValue });
            } catch (err) {
                console.error('Error updating privacy setting:', err);
                // Revert on failure
                setSettings(prev => ({
                    ...prev,
                    [key]: !newValue
                }));
            }
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const user = auth.currentUser;
            if (user) {
                // 1. Delete data from backend first (while key is still valid)
                await deleteUserData(user.uid);

                // 2. Delete Firebase account
                await deleteAccount();

                // Account deleted successfully, redirect to home
                navigate('/');
            }
        } catch (err) {
            console.error('Error deleting account:', err);
            if (err.code === 'auth/requires-recent-login') {
                setError('For security reasons, please log out and log back in before deleting your account.');
            } else {
                setError('Failed to delete account data. Please try again.');
            }
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
            </div>

            <div className="settings-content">
                <section className="settings-section">
                    <h2 className="section-title">Notifications</h2>
                    <div className="settings-group">
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3 className="setting-label">Email Notifications</h3>
                                <p className="setting-description">Receive email updates about your activity</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.emailNotifications}
                                    onChange={() => handleToggle('emailNotifications')}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className={`setting-item sub-setting ${!settings.emailNotifications ? 'disabled' : ''}`}>
                            <div className="setting-info">
                                <h3 className="setting-label">Friend Requests</h3>
                                <p className="setting-description">Get notified when someone sends you a friend request</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.emailNotifications && settings.friendRequests}
                                    onChange={() => handleToggle('friendRequests')}
                                    disabled={!settings.emailNotifications}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className={`setting-item sub-setting ${!settings.emailNotifications ? 'disabled' : ''}`}>
                            <div className="setting-info">
                                <h3 className="setting-label">Activity Updates</h3>
                                <p className="setting-description">Receive updates when friends watch or review movies</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.emailNotifications && settings.activityUpdates}
                                    onChange={() => handleToggle('activityUpdates')}
                                    disabled={!settings.emailNotifications}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <section className="settings-section">
                    <h2 className="section-title">Privacy</h2>
                    <div className="settings-group">
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3 className="setting-label">Private Profile</h3>
                                <p className="setting-description">Hide your profile and activity from others</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.privateProfile}
                                    onChange={() => handleToggle('privateProfile')}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <section className="settings-section danger-zone">
                    <h2 className="section-title">Danger Zone</h2>
                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}
                    <div className="settings-group">
                        <button
                            className="btn-danger"
                            onClick={() => setShowDeleteModal(true)}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Account'}
                        </button>
                    </div>
                </section>
            </div>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account"
                message="Are you sure you want to delete your account? This action cannot be undone. All your data, including lists, reviews, and friends will be permanently deleted."
                confirmText="Delete Account"
                confirmStyle="danger"
            />
        </div>
    );
};

export default Settings;
