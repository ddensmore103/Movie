import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import UserSearchBar from '../components/UserSearchBar';
import {
    sendFriendRequest,
    getPendingFriendRequests,
    getSentFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriends
} from '../services/api';
import './Friends.css';

const Friends = () => {
    const navigate = useNavigate();
    const { currentUser } = useContext(AuthContext);
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [sentPendingRequests, setSentPendingRequests] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [sentRequests, setSentRequests] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load friends and pending requests
    useEffect(() => {
        if (currentUser) {
            loadFriendsData();
        }
    }, [currentUser]);

    const loadFriendsData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [friendsList, requests, sentReqs] = await Promise.all([
                getFriends(),
                getPendingFriendRequests(),
                getSentFriendRequests()
            ]);
            setFriends(friendsList);
            setPendingRequests(requests);
            setSentPendingRequests(sentReqs);
        } catch (err) {
            console.error('Error loading friends data:', err);
            setError('Failed to load friends. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUserSelect = (user) => {
        // Add to search results if not already there
        if (!searchResults.find(u => u.userId === user.userId)) {
            setSearchResults([user, ...searchResults]);
        }
    };

    const handleSendRequest = async (userId) => {
        try {
            await sendFriendRequest(userId);
            setSentRequests(new Set([...sentRequests, userId]));
        } catch (err) {
            console.error('Error sending friend request:', err);
            alert(err.message || 'Failed to send friend request');
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            await acceptFriendRequest(requestId);
            // Reload friends data to update both lists
            await loadFriendsData();
        } catch (err) {
            console.error('Error accepting friend request:', err);
            alert('Failed to accept friend request');
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            await rejectFriendRequest(requestId);
            // Remove from pending requests
            setPendingRequests(pendingRequests.filter(req => req.requestId !== requestId));
        } catch (err) {
            console.error('Error rejecting friend request:', err);
            alert('Failed to reject friend request');
        }
    };

    // Get list of user IDs to exclude from search (current user + existing friends)
    const excludeUserIds = [
        currentUser?.uid,
        ...friends.map(f => f.userId)
    ].filter(Boolean);

    if (loading) {
        return (
            <div className="friends-page">
                <div className="loading-state">Loading friends...</div>
            </div>
        );
    }

    return (
        <div className="friends-page">
            <div className="page-header">
                <h1 className="page-title">Friends</h1>
                <div className="header-search">
                    <UserSearchBar
                        onUserSelect={handleUserSelect}
                        excludeUserIds={excludeUserIds}
                    />
                </div>
                <div className="header-placeholder"></div>
            </div>

            {error && (
                <div className="error-message">{error}</div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
                <section className="search-section">
                    <div className="search-results-list">
                        {searchResults.map((user) => {
                            const alreadySent = sentRequests.has(user.userId);
                            return (
                                <div key={user.userId} className="user-result-card">
                                    <div className="user-avatar">👤</div>
                                    <div className="user-info">
                                        <h3 className="user-name">{user.username || 'Unknown'}</h3>
                                        <p className="user-email">{user.email}</p>
                                    </div>
                                    <button
                                        className={`btn ${alreadySent ? 'btn-disabled' : 'btn-primary'}`}
                                        onClick={() => handleSendRequest(user.userId)}
                                        disabled={alreadySent}
                                    >
                                        {alreadySent ? '✓ Request Sent' : '➕ Send Request'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}



            {/* Friends List Section */}
            <section className="friends-section">
                <h2 className="section-title">Your Friends ({friends.length})</h2>
                {friends.length > 0 ? (
                    <div className="friends-grid">
                        {friends.map((friend) => (
                            <div
                                key={friend.userId}
                                className="friend-card"
                                onClick={() => navigate(`/profile/${friend.userId}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="friend-avatar">👤</div>
                                <h3 className="friend-name">{friend.username || 'Unknown'}</h3>
                                <p className="friend-email">{friend.email}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>No friends yet. Search for users above to send friend requests!</p>
                    </div>
                )}
            </section>

            {/* Pending Requests Section */}
            {(pendingRequests.length > 0 || sentPendingRequests.length > 0) && (
                <section className="friends-section pending-section" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
                    <h2 className="section-title">
                        Pending Requests
                        <span className="notification-badge">{pendingRequests.length + sentPendingRequests.length}</span>
                    </h2>
                    <div className="pending-requests-list">
                        {/* Received Requests */}
                        {pendingRequests.map((request) => (
                            <div key={request.requestId} className="pending-request-card">
                                <div className="user-avatar">👤</div>
                                <div className="user-info">
                                    <h3 className="user-name">
                                        {request.fromUser?.username || 'Unknown User'}
                                    </h3>
                                    <p className="user-email">{request.fromUser?.email}</p>
                                </div>
                                <div className="request-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleAcceptRequest(request.requestId)}
                                    >
                                        ✓ Accept
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleRejectRequest(request.requestId)}
                                    >
                                        ✕ Reject
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Sent Requests */}
                        {sentPendingRequests.map((request) => (
                            <div key={request.requestId} className="pending-request-card" style={{ borderColor: 'var(--color-border)' }}>
                                <div className="user-avatar">👤</div>
                                <div className="user-info">
                                    <h3 className="user-name">
                                        {request.toUser?.username || 'Unknown User'}
                                    </h3>
                                    <p className="user-email">{request.toUser?.email}</p>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Sent Request</span>
                                </div>
                                <div className="request-actions">
                                    <span style={{
                                        padding: '6px 12px',
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.9rem',
                                        color: 'var(--color-text-secondary)'
                                    }}>
                                        Waiting for approval...
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}


        </div>
    );
};

export default Friends;
