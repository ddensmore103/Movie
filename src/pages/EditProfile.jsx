import React, { useState, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { getUser, updateUserProfile } from '../services/api';
import './EditProfile.css';

const EditProfile = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Crop State
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    // UI State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (currentUser) {
            loadUserData();
        }
    }, [currentUser]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const userData = await getUser(currentUser.uid);
            setUsername(userData.username || '');
            setBio(userData.bio || '');
            setPhotoURL(userData.photoURL || '');
            setEmail(currentUser.email || ''); // Use Firebase email as source of truth
        } catch (err) {
            console.error("Failed to load user data", err);
            setError("Failed to load user data");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const promises = [];
            const dbUpdates = {};
            let emailChanged = false;

            // 1. Update Firebase Auth Profile (DisplayName/PhotoURL)
            if (username !== currentUser.displayName || photoURL !== currentUser.photoURL) {
                promises.push(updateProfile(auth.currentUser, {
                    displayName: username,
                    photoURL: photoURL
                }));
            }

            // 2. Prepare DynamoDB Updates
            if (username) dbUpdates.username = username;
            if (bio !== undefined) dbUpdates.bio = bio;
            if (photoURL !== undefined) dbUpdates.photoURL = photoURL;
            if (email !== currentUser.email) {
                dbUpdates.email = email;
                emailChanged = true;
            }

            // 3. Update Email (Requires recent login)
            if (emailChanged) {
                promises.push(updateEmail(auth.currentUser, email));
            }

            // 4. Update Password (Requires recent login)
            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                promises.push(updatePassword(auth.currentUser, newPassword));
            }

            // Execute all Firebase updates
            await Promise.all(promises);

            // 5. Update DynamoDB
            if (Object.keys(dbUpdates).length > 0) {
                await updateUserProfile(currentUser.uid, dbUpdates);
            }

            setSuccess("Profile updated successfully!");
            setTimeout(() => navigate('/profile'), 1500); // Redirect after success

        } catch (err) {
            console.error("Update error:", err);
            if (err.code === 'auth/requires-recent-login') {
                setError("Security check failed. Please log out and log in again to change sensitive info (email/password).");
            } else {
                setError("Failed to update profile: " + err.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const fileInputRef = useRef(null);

    // Canvas helper to crop image
    const createCroppedImage = async (imageSrc, pixelCrop) => {
        const image = new Image();
        image.src = imageSrc;
        await new Promise((resolve) => { image.onload = resolve; });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return canvas.toDataURL('image/jpeg');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (initial check)
        if (file.size > 5 * 1024 * 1024) {
            setError("File is too large completely. Please pick something under 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageSrc(reader.result);
            setIsCropping(true);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        });
        reader.readAsDataURL(file);
    };

    const handleCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleSaveCrop = async () => {
        try {
            const croppedImage = await createCroppedImage(imageSrc, croppedAreaPixels);

            // Check output size (approximate)
            if (croppedImage.length * 0.75 > 300 * 1024) {
                setError("Resulting image is still too large. Try zooming in more or picking a smaller image.");
                return;
            }

            setPhotoURL(croppedImage);
            setIsCropping(false);
            setImageSrc(null);
        } catch (e) {
            console.error(e);
            setError("Failed to crop image.");
        }
    };

    const handleCancelCrop = () => {
        setIsCropping(false);
        setImageSrc(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (loading) return <div className="edit-profile-page">Loading...</div>;

    return (
        <div className="edit-profile-page">
            <div className="edit-profile-container">
                <h1 className="page-title">Edit Profile</h1>

                {error && <div className="alert error">{error}</div>}
                {success && <div className="alert success">{success}</div>}

                <form onSubmit={handleSubmit} className="edit-profile-form">

                    {/* Public Info Section */}
                    <section className="form-section">
                        <h2>Public Profile</h2>

                        <div className="form-group">
                            <label>Profile Picture URL</label>
                            <input
                                type="text"
                                value={photoURL}
                                onChange={(e) => setPhotoURL(e.target.value)}
                                placeholder="https://example.com/avatar.jpg"
                            />
                            {photoURL && <img src={photoURL} alt="Preview" className="avatar-preview" />}
                        </div>

                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself..."
                                rows="3"
                            />
                        </div>
                    </section>

                    {/* Security Section */}
                    <section className="form-section security-section">
                        <h2>Security</h2>
                        <div className="info-box">
                            Note: Changing email or password requires a recent login.
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password (Optional)</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Leave blank to keep current"
                            />
                        </div>

                        {newPassword && (
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                    </section>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/profile')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
            {isCropping && (
                <div className="crop-modal-overlay">
                    <div className="crop-modal-content">
                        <div className="crop-container">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={handleCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className="crop-controls">
                            <div className="zoom-slider-container">
                                <span className="zoom-label">Zoom</span>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(e.target.value)}
                                    className="zoom-slider"
                                />
                            </div>
                            <div className="crop-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={handleCancelCrop}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn-save"
                                    onClick={handleSaveCrop}
                                >
                                    Apply Crop
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



export default EditProfile;
