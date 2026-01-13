import { getImageUrl } from '../services/tmdb';
import './ActivityCard.css';

const ActivityCard = ({ activity, onClick }) => {
    const { user, type, movie, timestamp, rating } = activity;

    const getActivityBadge = () => {
        switch (type) {
            case 'watched':
                return '👁️ Watched';
            case 'reviewed':
                return '✍️ Reviewed';
            case 'added_to_list':
                return '📋 Added to List';
            default:
                return '📌 Activity';
        }
    };

    return (
        <div className="activity-card-new" onClick={onClick}>
            <div className="activity-movie-poster">
                <img
                    src={getImageUrl(movie.poster_path, 'medium', 'poster')}
                    alt={movie.title}
                    loading="lazy"
                />
                <div className="activity-overlay">
                    <div className="activity-user-badge">
                        <span className="user-avatar-small">{user.avatar}</span>
                        <span className="user-name-small">{user.name}</span>
                    </div>
                </div>
            </div>
            <div className="activity-movie-info">
                <div className="activity-badge">{getActivityBadge()}</div>
                <h3 className="activity-movie-title">{movie.title}</h3>
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
