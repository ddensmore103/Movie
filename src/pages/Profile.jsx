import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUser, getUserLists, getFriends, getUserReviews, getActivityFeed } from '../services/api';
import ActivityCard from '../components/ActivityCard';
import './Profile.css';

const Profile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [user, setUser] = useState(null);
    const [lists, setLists] = useState([]);
    const [friends, setFriends] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Determine if viewing own profile or another user's profile
    const isOwnProfile = !userId || userId === currentUser?.uid;
    // Prefer fetched 'user' data as it contains extra fields like bio
    const displayUser = user || (isOwnProfile ? currentUser : null);

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
            try {
                const targetUserId = isOwnProfile ? currentUser?.uid : userId;
                if (!targetUserId) {
                    console.log('No targetUserId available');
                    return;
                }

                console.log('Fetching data for userId:', targetUserId);

                // Fetch lists, friends, reviews, and activity in parallel
                const [userLists, userFriends, userReviews, userActivity] = await Promise.all([
                    getUserLists(targetUserId),
                    isOwnProfile ? getFriends() : Promise.resolve([]), // Only fetch friends for own profile
                    getUserReviews(targetUserId),
                    isOwnProfile ? getActivityFeed() : getUserReviews(targetUserId).then(reviews => reviews.slice(0, 10)) // Activity feed for own profile, recent reviews for others
                ]);

                console.log('Fetched data:', {
                    lists: userLists.length,
                    friends: userFriends.length,
                    reviews: userReviews.length,
                    activity: userActivity.length
                });

                // Sort: Starred first, then by createdAt desc (or however default sort was)
                // Assuming default order from backend was reliable, but we want starred first
                const sortedLists = userLists.sort((a, b) => {
                    if (a.isStarred === b.isStarred) {
                        // Fallback sort, e.g. newest first
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return a.isStarred ? -1 : 1;
                });

                setLists(sortedLists);
                setFriends(userFriends);
                setReviews(userReviews);
                setActivity(userActivity);
            } catch (err) {
                console.error('Error fetching user data:', err);
            }
        };

        // Fetch data when we have a currentUser (for own profile) or when user data is loaded (for other profiles)
        if (isOwnProfile) {
            if (currentUser?.uid) {
                fetchUserData();
            }
        } else {
            if (!loading && user) {
                fetchUserData();
            }
        }
    }, [userId, isOwnProfile, currentUser, loading, user]);

    const stats = [
        { label: 'Lists Created', value: lists.length, icon: '📋' },
        { label: 'Movies Watched', value: reviews.length, icon: '🎬' },
        { label: 'Friends', value: friends.length, icon: '👥' },
        { label: 'Reviews', value: reviews.filter(r => r.reviewText && r.reviewText.trim()).length, icon: '✍️' }
    ];

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
    const userAvatar = displayUser?.photoURL ? (
        <img src={displayUser.photoURL} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
    ) : '👨‍🚀';

    return (
        <div className="profile-page">
            {/* Back button when viewing another user's profile */}
            {!isOwnProfile && (
                <button
                    className="back-button"
                    onClick={() => navigate('/friends')}
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
                        gap: '8px'
                    }}
                >
                    ← Back to Friends
                </button>
            )}

            <div className="profile-header">
                <div className="profile-avatar-large">{userAvatar}</div>
                <div className="profile-info">
                    <h1 className="profile-name" style={{ marginBottom: '0px' }}>{displayName}</h1>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '2px', marginBottom: '0' }}>
                        {displayUser?.email}
                    </p>
                    {displayUser?.bio && <p className="profile-bio" style={{ margin: '16px 0' }}>{displayUser.bio}</p>}
                    {isOwnProfile && (
                        <div className="profile-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/profile/edit')}
                            >
                                Edit Profile
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="profile-stats">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="profile-content">
                <section className="profile-section">
                    <h2 className="section-title">Lists ({lists.length})</h2>
                    {lists.length > 0 ? (
                        <div className="recent-movies">
                            {lists.map((list) => (
                                <div
                                    key={list.listId}
                                    className="recent-movie-card"
                                    onClick={() => navigate(`/lists/${list.listId}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="recent-movie-emoji">{list.emoji || '📋'}</div>
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
                                    activity={item}
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
            </div>
        </div>
    );
};

export default Profile;
