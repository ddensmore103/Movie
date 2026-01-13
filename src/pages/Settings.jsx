import { useState } from 'react';
import './Settings.css';

const Settings = () => {
    const [settings, setSettings] = useState({
        emailNotifications: true,
        friendRequests: true,
        activityUpdates: false,
        darkMode: true,
        publicProfile: true
    });

    const handleToggle = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
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

                <section className="settings-section">
                    <h2 className="section-title">Appearance</h2>
                    <div className="settings-group">
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3 className="setting-label">Dark Mode</h3>
                                <p className="setting-description">Use dark theme across the app</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.darkMode}
                                    onChange={() => handleToggle('darkMode')}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <section className="settings-section danger-zone">
                    <h2 className="section-title">Danger Zone</h2>
                    <div className="settings-group">
                        <button className="btn-danger">Delete Account</button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
