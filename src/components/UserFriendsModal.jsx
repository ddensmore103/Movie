import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { searchUsers, sendFriendRequest, getFriends, getSentFriendRequests } from '../services/api';
import UserAvatar from './UserAvatar';
import './UserFriendsModal.css';

const UserFriendsModal = ({ isOpen, onClose, friends = [], profileUser }) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredFriends, setFilteredFriends] = useState([]);

    // State to track current user's relationship with the listed friends
    const [myFriendIds, setMyFriendIds] = useState(new Set());
    const [mySentRequestIds, setMySentRequestIds] = useState(new Set());
    const [loadingRelationships, setLoadingRelationships] = useState(false);

    // Initial filter when friends prop changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setFilteredFriends(friends);
            setSearchQuery('');
            if (currentUser) {
                fetchMyRelationships();
            }
        }
    }, [isOpen, friends, currentUser]);

    // Filter logic
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredFriends(friends);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = friends.filter(friend =>
                (friend.username && friend.username.toLowerCase().includes(query)) ||
                (friend.displayName && friend.displayName.toLowerCase().includes(query))
            );
            setFilteredFriends(filtered);
        }
    }, [searchQuery, friends]);

    const fetchMyRelationships = async () => {
        if (!currentUser) return;
        setLoadingRelationships(true);
        try {
            // Fetch my friends and my sent requests to determine button state
            const [myFriends, myRequests] = await Promise.all([
                getFriends(),
                getSentFriendRequests()
            ]);

            setMyFriendIds(new Set(myFriends.map(f => f.userId)));
            setMySentRequestIds(new Set(myRequests.map(r => r.toUserId)));
        } catch (error) {
            console.error("Error fetching relationships:", error);
        } finally {
            setLoadingRelationships(false);
        }
    };

    const handleSendRequest = async (targetUserId) => {
        try {
            await sendFriendRequest(targetUserId);
            // Optimistically update state
            setMySentRequestIds(prev => new Set(prev).add(targetUserId));
        } catch (error) {
            console.error("Error sending friend request:", error);
            alert("Failed to send friend request");
        }
    };

    const handleUserClick = (userId) => {
        onClose();
        navigate(`/profile/${userId}`);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content friends-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{profileUser?.username || 'User'}'s Friends</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="friends-search-container">
                    <input
                        type="text"
                        placeholder="Search friends..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="friends-search-input"
                    />
                </div>

                <div className="friends-list-container">
                    {filteredFriends.length > 0 ? (
                        filteredFriends.map(friend => {
                            const isMe = currentUser && friend.userId === currentUser.uid;
                            const isMyFriend = myFriendIds.has(friend.userId);
                            const isRequested = mySentRequestIds.has(friend.userId);

                            return (
                                <div key={friend.userId} className="friend-list-item">
                                    <div
                                        className="friend-info"
                                        onClick={() => handleUserClick(friend.userId)}
                                    >
                                        <UserAvatar user={friend} size="medium" />
                                        <span className="friend-name">
                                            {friend.displayName || friend.username}
                                        </span>
                                    </div>

                                    {currentUser && !isMe && !isMyFriend && (
                                        <button
                                            className={`friend-action-btn ${isRequested ? 'requested' : ''}`}
                                            onClick={() => !isRequested && handleSendRequest(friend.userId)}
                                            disabled={isRequested || loadingRelationships}
                                        >
                                            {isRequested ? 'Requested' : 'Add Friend'}
                                        </button>
                                    )}
                                    {isMyFriend && !isMe && (
                                        <span className="friend-status-badge">Friends</span>
                                    )}
                                    {isMe && (
                                        <span className="friend-status-badge">You</span>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-friends-found">
                            {searchQuery ? 'No friends match your search' : 'No friends found'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserFriendsModal;
