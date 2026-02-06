import { getImageUrl } from '../services/tmdb';
import './ActivityCard.css';

const ActivityCard = ({ activity, onClick }) => {
    // Handle both old mock data structure and new API structure
    const user = activity.user || { username: 'Unknown', avatar: '👤' };
    const movieTitle = activity.movieTitle || activity.movie?.title || 'Unknown Movie';
    const posterPath = activity.posterPath || activity.movie?.poster_path;
    const rating = activity.rating;
    const reviewText = activity.reviewText;

    // Format timestamp
    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Recently';

        const now = new Date();
        const activityDate = new Date(timestamp);
        const diffMs = now - activityDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return activityDate.toLocaleDateString();
    };

    const timestamp = getTimeAgo(activity.createdAt || activity.timestamp);

    const getActivityBadge = () => {
        if (reviewText && reviewText.trim()) {
            return '✍️ Reviewed';
        }
        return '⭐ Rated';
    };

    return (
        <div className="activity-card-new" onClick={onClick}>
            <div className="activity-movie-poster">
                <img
                    src={posterPath ? getImageUrl(posterPath, 'medium', 'poster') : '/placeholder-poster.png'}
                    alt={movieTitle}
                    loading="lazy"
                />
                <div className="activity-overlay">
                    <div className="activity-user-badge">
                        <span className="user-avatar-small">{user.avatar || '👤'}</span>
                        <span className="user-name-small">{user.username || user.name || 'Unknown'}</span>
                    </div>
                </div>
            </div>
            <div className="activity-movie-info">
                <div className="activity-badge">{getActivityBadge()}</div>
                <h3 className="activity-movie-title">{movieTitle}</h3>
                <div className="activity-movie-meta">
                    <span className="activity-timestamp">{timestamp}</span>
                    {rating && (
                        <span className="activity-rating">
                            <span className="star-icon">⭐</span>
                            {rating}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityCard;
