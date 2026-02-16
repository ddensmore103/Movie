import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUser, getUserLists, getFriends, getUserFriends, getUserReviews, getUserStats, updateUserProfile, sendFriendRequest, getSentFriendRequests, getPendingFriendRequests } from '../services/api';
import { LuVideo, LuStar, LuList, LuUsers, LuLock, LuUserPlus, LuCheck, LuClock } from 'react-icons/lu';
import ActivityCard from '../components/ActivityCard';
import UserAvatar from '../components/UserAvatar';
import UserFriendsModal from '../components/UserFriendsModal';
import ProfileFavorites from '../components/ProfileFavorites';
import './Profile.css';

const Profile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const [user, setUser] = useState(null);
    const [lists, setLists] = useState([]);
    const [friends, setFriends] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState([]);
    const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
    const [friendStatus, setFriendStatus] = useState('none'); // 'none', 'friend', 'sent', 'received'
    const [actionLoading, setActionLoading] = useState(false);

    // Determine if viewing own profile or another user's profile
    const isOwnProfile = !userId || userId === currentUser?.uid;
    const targetUserId = isOwnProfile ? currentUser?.uid : userId;
    // Prefer fetched 'user' data as it contains extra fields like bio
    const displayUser = user || (isOwnProfile ? currentUser : null);

    // Check friend status when viewing another profile
    useEffect(() => {
        const checkStatus = async () => {
            if (isOwnProfile || !currentUser || !targetUserId) return;

            // 1. Check if already friends (using the friends list we just fetched)
            const isFriend = friends.some(f => f.userId === currentUser.uid);
            if (isFriend) {
                setFriendStatus('friend');
                return;
            }

            try {
                // 2. Check for pending requests
                const [sentReqs, receivedReqs] = await Promise.all([
                    getSentFriendRequests(),
                    getPendingFriendRequests()
                ]);

                if (sentReqs.some(req => req.toUserId === targetUserId)) {
                    setFriendStatus('sent');
                } else if (receivedReqs.some(req => req.fromUserId === targetUserId)) {
                    setFriendStatus('received');
                } else {
                    setFriendStatus('none');
                }
            } catch (err) {
                console.error('Error checking friend status:', err);
            }
        };

        if (!loading) {
            checkStatus();
        }
    }, [isOwnProfile, currentUser, targetUserId, friends, loading]);

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            const targetId = isOwnProfile ? currentUser?.uid : userId;

            if (!targetId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const userData = await getUser(targetId);
                setUser(userData);
            } catch (err) {
                console.error('Error fetching user:', err);
                setError('Failed to load user profile');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId, isOwnProfile, currentUser]);

    // Fetch user's lists, friends, reviews, and activity
    useEffect(() => {
        const fetchUserData = async () => {
            const targetUserId = isOwnProfile ? currentUser?.uid : userId;
            if (!targetUserId) return;

            // 1. Fetch Stats (Always visible, independent try-catch)
            let fetchedStats = null;
            try {
                fetchedStats = await getUserStats(targetUserId);
                if (fetchedStats) {
                    setStats([
                        {
                            label: fetchedStats.listsCount === 1 ? 'List Created' : 'Lists Created',
                            value: fetchedStats.listsCount,
                            icon: <LuList />
                        },
                        {
                            label: fetchedStats.reviewsCount === 1 ? 'Movie Watched' : 'Movies Watched',
                            value: fetchedStats.reviewsCount,
                            icon: <LuVideo />
                        },
                        {
                            label: fetchedStats.friendsCount === 1 ? 'Friend' : 'Friends',
                            value: fetchedStats.friendsCount,
                            icon: <LuUsers />,
                            onClick: () => setIsFriendsModalOpen(true),
                            clickable: true
                        },
                        {
                            label: fetchedStats.reviewsCount === 1 ? 'Review' : 'Reviews',
                            value: fetchedStats.reviewsCount,
                            icon: <LuStar />
                        }
                    ]);
                }
            } catch (statsErr) {
                console.error('Error fetching stats:', statsErr);
            }

            // 2. Fetch Content (Lists, Friends, Reviews, Activity)
            try {
                const [userLists, userFriends, userReviews] = await Promise.all([
                    getUserLists(targetUserId),
                    getUserFriends(targetUserId),
                    getUserReviews(targetUserId)
                ]);

                if (userLists) setLists(userLists);
                if (userFriends) setFriends(userFriends);
                if (userReviews) {
                    setReviews(userReviews);
                    // Use user's reviews as their recent activity, limited to 10
                    setActivity(userReviews.slice(0, 10));
                }

                // Fallback for stats if separate fetch failed
                if (!fetchedStats && userLists && userReviews && userFriends) {
                    const reviewCount = userReviews.filter(r => r.reviewText && r.reviewText.trim()).length;
                    setStats([
                        { label: userLists.length === 1 ? 'List Created' : 'Lists Created', value: userLists.length, icon: <LuList /> },
                        { label: userReviews.length === 1 ? 'Movie Watched' : 'Movies Watched', value: userReviews.length, icon: <LuVideo /> },
                        { label: userFriends.length === 1 ? 'Friend' : 'Friends', value: userFriends.length, icon: <LuUsers /> },
                        { label: reviewCount === 1 ? 'Review' : 'Reviews', value: reviewCount, icon: <LuStar /> }
                    ]);
                }

            } catch (err) {
                console.error('Error fetching user content:', err);
            }
        };

        if (userId || isOwnProfile) {
            fetchUserData();
        }
    }, [userId, isOwnProfile, currentUser]);

    const handleUpdateFavorites = async (newFavorites) => {
        try {
            // Optimistic update
            setUser(prev => ({ ...prev, topFavorites: newFavorites }));

            // Backend update
            await updateUserProfile(displayUser.userId, { topFavorites: newFavorites });
        } catch (err) {
            console.error('Error updating favorites:', err);
            // Revert would be nice here, but simplicity for now
        }
    };

    const handleSendFriendRequest = async () => {
        if (!currentUser || actionLoading) return;

        try {
            setActionLoading(true);
            await sendFriendRequest(targetUserId);
            setFriendStatus('sent');
        } catch (err) {
            console.error('Error sending friend request:', err);
            // Optionally show toast/error
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-page">
                <div style={{ textAlign: 'center', padding: '40px', color: '#ff6b6b' }}>{error}</div>
            </div>
        );
    }

    // Extract display name from email or use displayName if available
    const displayName = displayUser?.displayName || displayUser?.username || displayUser?.email?.split('@')[0] || 'User';

    // Check if profile is private and viewer is not a friend (and not owner)
    // If lists are empty and user is private, we assume blocked or empty private profile
    const isPrivateProfile = !isOwnProfile && displayUser?.isPrivate && lists.length === 0;

    // If it's private, we show the lock message instead of content
    const showPrivateMessage = isPrivateProfile;

    return (
        <div className="profile-page">
            {/* Back button when viewing another user's profile */}
            {/* Back button when viewing another user's profile */}
            {(!isOwnProfile || location.state?.fromCollaboratorsModal) && (
                <button
                    className="back-button"
                    onClick={() => {
                        if (location.state?.fromCollaboratorsModal && location.state?.listId) {
                            navigate(`/lists/${location.state.listId}`);
                        } else if (location.state?.from === 'admin') {
                            navigate('/admin');
                        } else {
                            navigate('/friends');
                        }
                    }}
                    style={{
                        marginBottom: '20px',
                        padding: '8px 16px',
                        background: 'rgba(102, 126, 234, 0.1)',
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                        borderRadius: '8px',
                        color: '#667eea',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: 'fit-content'
                    }}
                >
                    {location.state?.fromCollaboratorsModal
                        ? '← Back to List'
                        : location.state?.from === 'admin'
                            ? '← Back to Admin'
                            : '← Back to Friends'}
                </button>
            )}

            <div className="profile-header">
                <div className="profile-header-main">
                    <div className="profile-avatar-large">
                        <UserAvatar user={displayUser} size="xl" />
                    </div>
                    <div className="profile-info">
                        <h1 className="profile-name" style={{ marginBottom: '0px' }}>{displayName}</h1>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '2px', marginBottom: '0' }}>
                            {displayUser?.email}
                        </p>
                        {displayUser?.bio && <p className="profile-bio" style={{ margin: '16px 0' }}>{displayUser.bio}</p>}

                        <div className="profile-actions">
                            {isOwnProfile ? (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate('/profile/edit')}
                                >
                                    Edit Profile
                                </button>
                            ) : (
                                // Add Friend Button Logic
                                <>
                                    {friendStatus === 'none' && (
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleSendFriendRequest}
                                            disabled={actionLoading}
                                        >
                                            <LuUserPlus style={{ marginRight: '8px' }} />
                                            {actionLoading ? 'Sending...' : 'Add Friend'}
                                        </button>
                                    )}
                                    {friendStatus === 'sent' && (
                                        <button className="btn btn-secondary" disabled>
                                            <LuClock style={{ marginRight: '8px' }} />
                                            Request Sent
                                        </button>
                                    )}
                                    {friendStatus === 'received' && (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => navigate('/friends')}
                                        >
                                            <LuUserPlus style={{ marginRight: '8px' }} />
                                            Accept Request
                                        </button>
                                    )}
                                    {friendStatus === 'friend' && (
                                        <button className="btn btn-outline" disabled style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)' }}>
                                            <LuCheck style={{ marginRight: '8px' }} />
                                            Friend
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="profile-header-favorites">
                    <ProfileFavorites
                        user={displayUser}
                        isOwnProfile={isOwnProfile}
                        onUpdate={handleUpdateFavorites}
                    />
                </div>
            </div>

            <div className="profile-stats">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className={`stat-card ${stat.clickable ? 'clickable' : ''}`}
                        onClick={stat.onClick}
                    >
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="profile-content">
                {showPrivateMessage ? (
                    <div className="private-profile-message" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                        <LuLock size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--text-primary)' }}>This account is private</h2>
                        <p>Follow this user to see their lists and activity.</p>
                    </div>
                ) : (
                    <>
                        <section className="profile-section">
                            <h2 className="section-title">Lists ({lists.length})</h2>
                            {lists.length > 0 ? (
                                <div className="recent-movies">
                                    {lists.map((list) => (
                                        <div
                                            key={list.listId}
                                            className="recent-movie-card"
                                            onClick={() => navigate(`/lists/${list.listId}`, {
                                                state: { from: 'profile', userId: targetUserId }
                                            })}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {(list.movies?.length > 0 || list.name === 'Favorites') && <div className="recent-movie-emoji">{list.emoji || '📋'}</div>}
                                            <div className="recent-movie-title">
                                                {list.name}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '4px' }}>
                                                {list.movies?.length || 0} movies
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="activity-placeholder">
                                    <p>{isOwnProfile ? 'You haven\'t created any lists yet' : 'No lists yet'}</p>
                                </div>
                            )}
                        </section>

                        <section className="profile-section">
                            <h2 className="section-title">Recent Activity</h2>
                            {activity.length > 0 ? (
                                <div className="activity-feed">
                                    {activity.map((item, index) => (
                                        <ActivityCard
                                            key={item.reviewId || index}
                                            activity={{ ...item, user: displayUser || item.user }}
                                            onClick={() => {
                                                // Navigate to movie details if needed
                                                if (item.tmdbId) {
                                                    navigate(`/movie/${item.tmdbId}`);
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="activity-placeholder">
                                    <p>{isOwnProfile ? 'Your recent activity will appear here' : 'No recent activity'}</p>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
            <UserFriendsModal
                isOpen={isFriendsModalOpen}
                onClose={() => setIsFriendsModalOpen(false)}
                friends={friends}
                profileUser={displayUser}
            />
        </div>
    );
};

export default Profile;
