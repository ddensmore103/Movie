import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteAccount, auth } from '../firebase';
import { deleteUserData } from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        emailNotifications: true,
        friendRequests: true,
        activityUpdates: false,
        publicProfile: true
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

    const handleToggle = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
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

                        <div className="setting-item">
                            <div className="setting-info">
                                <h3 className="setting-label">Friend Requests</h3>
                                <p className="setting-description">Get notified when someone sends you a friend request</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.friendRequests}
                                    onChange={() => handleToggle('friendRequests')}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <h3 className="setting-label">Activity Updates</h3>
                                <p className="setting-description">Receive updates when friends watch or review movies</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.activityUpdates}
                                    onChange={() => handleToggle('activityUpdates')}
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
                                <h3 className="setting-label">Public Profile</h3>
                                <p className="setting-description">Allow others to view your profile and activity</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.publicProfile}
                                    onChange={() => handleToggle('publicProfile')}
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
