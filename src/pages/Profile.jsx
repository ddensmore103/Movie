import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
    const { currentUser } = useAuth();

    const stats = [
        { label: 'Movies Watched', value: 142, icon: '🎬' },
        { label: 'Reviews Written', value: 38, icon: '✍️' },
        { label: 'Lists Created', value: 12, icon: '📋' },
        { label: 'Friends', value: 24, icon: '👥' }
    ];

    const recentlyWatched = [
        { id: 1, title: 'Inception', emoji: '🌀' },
        { id: 2, title: 'The Matrix', emoji: '💊' },
        { id: 3, title: 'Interstellar', emoji: '🌌' }
    ];

    // Extract display name from email or use displayName if available
    const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
    const userAvatar = currentUser?.photoURL ? (
        <img src={currentUser.photoURL} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
    ) : '👨‍🚀';

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="profile-avatar-large">{userAvatar}</div>
                <div className="profile-info">
                    <h1 className="profile-name">{displayName}</h1>
                    <p className="profile-bio">Movie enthusiast | Sci-fi lover | Always looking for hidden gems</p>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '8px' }}>
                        {currentUser?.email}
                    </p>
                    <button className="btn btn-primary">Edit Profile</button>
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
                    <h2 className="section-title">Recently Watched</h2>
                    <div className="recent-movies">
                        {recentlyWatched.map((movie) => (
                            <div key={movie.id} className="recent-movie-card">
                                <div className="recent-movie-emoji">{movie.emoji}</div>
                                <div className="recent-movie-title">{movie.title}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="profile-section">
                    <h2 className="section-title">Activity</h2>
                    <div className="activity-placeholder">
                        <p>Your recent activity will appear here</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Profile;
