import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFriends, addCollaborator, removeCollaborator, getListCollaborators, updateCollaboratorPermission } from '../services/api';
import UserAvatar from './UserAvatar';
import './ManageCollaboratorsModal.css';

const ManageCollaboratorsModal = ({ listId, isOwner, onClose }) => {
    const [friends, setFriends] = useState([]);
    const [collaborators, setCollaborators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchData();
    }, [listId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [friendsData, collaboratorsData] = await Promise.all([
                isOwner ? getFriends() : Promise.resolve([]),
                getListCollaborators(listId)
            ]);
            setFriends(friendsData);
            setCollaborators(collaboratorsData);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load collaborators');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCollaborator = async (userId) => {
        try {
            setAdding(true);
            await addCollaborator(listId, userId);
            await fetchData(); // Refresh the lists
        } catch (err) {
            console.error('Error adding collaborator:', err);
            alert(err.message || 'Failed to add collaborator');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveCollaborator = async (userId) => {
        if (!window.confirm('Remove this collaborator from the list?')) return;

        try {
            await removeCollaborator(listId, userId);
            await fetchData(); // Refresh the lists
        } catch (err) {
            console.error('Error removing collaborator:', err);
            alert(err.message || 'Failed to remove collaborator');
        }
    };

    const handleUpdatePermission = async (userId, canEdit) => {
        try {
            // Optimistic update
            setCollaborators(prev => prev.map(c =>
                c.userId === userId ? { ...c, canEdit } : c
            ));
            await updateCollaboratorPermission(listId, userId, canEdit);
        } catch (err) {
            console.error('Error updating permission:', err);
            alert('Failed to update permission');
            await fetchData(); // Revert on error
        }
    };

    // Get friends who aren't already collaborators
    const collaboratorIds = new Set(collaborators.map(c => c.userId));
    const availableFriends = friends.filter(f => !collaboratorIds.has(f.userId));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isOwner ? 'Manage Collaborators' : 'Collaborators'}</h2>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                {loading ? (
                    <div className="modal-loading">Loading...</div>
                ) : error ? (
                    <div className="modal-error">{error}</div>
                ) : (
                    <div className="modal-body">
                        {/* Current Collaborators */}
                        <section className="collaborators-section">
                            <h3>Current Collaborators ({collaborators.length})</h3>
                            {collaborators.length > 0 ? (
                                <div className="collaborators-list">
                                    {collaborators.map((collab) => (
                                        <div key={collab.userId} className="collaborator-item">
                                            <div className="collaborator-avatar-container">
                                                <UserAvatar user={collab.user || collab} size="small" />
                                            </div>
                                            <div className="collaborator-info">
                                                <Link
                                                    to={`/profile/${collab.userId}`}
                                                    className="collaborator-name collaborator-link"
                                                    onClick={onClose}
                                                    state={{ fromCollaboratorsModal: true, listId }}
                                                >
                                                    {collab.user?.username || collab.user?.email || 'Unknown'}
                                                </Link>
                                                <div className="collaborator-email">{collab.user?.email}</div>
                                            </div>
                                            <div className="collaborator-actions">
                                                {isOwner && (
                                                    <div className="can-edit-control">
                                                        <label className="toggle">
                                                            <input
                                                                type="checkbox"
                                                                checked={collab.canEdit !== false}
                                                                onChange={(e) => handleUpdatePermission(collab.userId, e.target.checked)}
                                                            />
                                                            <span className="toggle-slider"></span>
                                                        </label>
                                                        <span className="can-edit-text">Can Edit</span>
                                                    </div>
                                                )}
                                                {isOwner && (
                                                    <button
                                                        className="remove-button"
                                                        onClick={() => handleRemoveCollaborator(collab.userId)}
                                                        title="Remove collaborator"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-collaborators">No collaborators yet.</p>
                            )}
                        </section>

                        {/* Add Collaborators */}
                        {isOwner && (
                            <section className="add-collaborators-section">
                                <h3>Add Friends as Collaborators</h3>
                                {availableFriends.length > 0 ? (
                                    <div className="friends-list">
                                        {availableFriends.map((friend) => (
                                            <div key={friend.userId} className="friend-item">
                                                <div className="friend-avatar-container">
                                                    <UserAvatar user={friend} size="small" />
                                                </div>
                                                <div className="friend-info">
                                                    <div className="friend-name">
                                                        {friend.username || friend.email}
                                                    </div>
                                                    <div className="friend-email">{friend.email}</div>
                                                </div>
                                                <button
                                                    className="add-button"
                                                    onClick={() => handleAddCollaborator(friend.userId)}
                                                    disabled={adding}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-message">
                                        {friends.length === 0
                                            ? 'No friends to add. Add friends first!'
                                            : 'All your friends are already collaborators!'}
                                    </p>
                                )}
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageCollaboratorsModal;
