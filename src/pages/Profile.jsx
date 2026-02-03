import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUser, getUserLists } from '../services/api';
import './Profile.css';

const Profile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [user, setUser] = useState(null);
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Determine if viewing own profile or another user's profile
    const isOwnProfile = !userId || userId === currentUser?.uid;
    const displayUser = isOwnProfile ? currentUser : user;

    // Fetch user data if viewing another user's profile
    useEffect(() => {
        const fetchUserData = async () => {
            if (isOwnProfile) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const userData = await getUser(userId);
                setUser(userData);
            } catch (err) {
                console.error('Error fetching user:', err);
                setError('Failed to load user profile');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId, isOwnProfile]);

    // Fetch user's lists
    useEffect(() => {
        const fetchLists = async () => {
            try {
                const targetUserId = isOwnProfile ? currentUser?.uid : userId;
                if (targetUserId) {
                    const userLists = await getUserLists(targetUserId);
                    setLists(userLists);
                }
            } catch (err) {
                console.error('Error fetching lists:', err);
            }
        };

        if (!loading && displayUser) {
            fetchLists();
        }
    }, [userId, isOwnProfile, currentUser, loading, displayUser]);

    const stats = [
        { label: 'Lists Created', value: lists.length, icon: '📋' },
        { label: 'Movies', value: lists.reduce((sum, list) => sum + (list.movies?.length || 0), 0), icon: '🎬' },
        { label: 'Friends', value: 0, icon: '👥' },
        { label: 'Reviews', value: 0, icon: '✍️' }
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
                    <h1 className="profile-name">{displayName}</h1>
                    <p className="profile-bio">Movie enthusiast | Sci-fi lover | Always looking for hidden gems</p>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '8px' }}>
                        {displayUser?.email}
                    </p>
                    {isOwnProfile && (
                        <button className="btn btn-primary">Edit Profile</button>
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
                                    <div className="recent-movie-title">{list.name}</div>
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
                    <h2 className="section-title">Activity</h2>
                    <div className="activity-placeholder">
                        <p>{isOwnProfile ? 'Your recent activity will appear here' : 'Recent activity will appear here'}</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Profile;
