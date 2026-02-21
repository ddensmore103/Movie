import { getImageUrl } from '../services/tmdb';
import UserAvatar from './UserAvatar';
import './MovieCard.css';

const MovieCard = ({ movie, onClick, onAddToList, onToggleStar, currentUserId, isCollaborative }) => {
    if (!movie) return null; // Defensive check

    const {
        title = 'Unknown Title',
        poster_path,
        release_date,
        vote_average
    } = movie;

    const year = release_date ? new Date(release_date).getFullYear() : 'N/A';
    // Handle cases where vote_average might be 0, undefined, or null
    const rating = (typeof vote_average === 'number') ? vote_average.toFixed(1) : 'N/A';

    const handleStar = (e) => {
        e.stopPropagation();
        if (onToggleStar) {
            onToggleStar(movie);
        }
    };

    const handleAddToList = (e) => {
        e.stopPropagation();
        if (onAddToList) {
            onAddToList(movie);
        }
    };

    const isStarred = onToggleStar && movie.starredBy && currentUserId ? movie.starredBy.some(id => id === currentUserId) : false;
    const starCount = (isCollaborative && movie.starredBy) ? movie.starredBy.length : 0;

    return (
        <div className="movie-card" onClick={onClick}>
            <div className="movie-poster">
                {poster_path ? (
                    <img
                        src={getImageUrl(poster_path, 'medium', 'poster')}
                        alt={title}
                        loading="lazy"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling && (e.target.nextElementSibling.style.display = 'flex');
                        }}
                    />
                ) : null}
                <div className="movie-poster-placeholder" style={poster_path ? { display: 'none' } : {}}>
                    <span className="poster-placeholder-icon">🎬</span>
                    <span className="poster-placeholder-text">{title}</span>
                </div>
                <div className="movie-overlay">
                    <button className="play-btn">▶</button>

                    {/* Added By User - Bottom Left */}
                    {movie.addedByUser && (
                        <div className="movie-added-by">
                            <div style={{ position: 'relative', display: 'flex' }}>
                                <UserAvatar user={movie.addedByUser} size="small" />
                                <span className="added-by-tooltip">
                                    Added by {movie.addedByUser.username || 'User'}
                                </span>
                            </div>
                        </div>
                    )}

                    {onAddToList && (
                        <button className="add-to-list-btn" onClick={handleAddToList}>
                            <span className="add-icon">+</span>
                            <span className="add-text">Add to List</span>
                        </button>
                    )}
                </div>
            </div>
            <div className="movie-info">
                <h3 className="movie-title">{title}</h3>
                <div className="movie-meta">
                    <span className="movie-year">{year}</span>
                    <span className="movie-rating">
                        <span className="star-icon">⭐</span>
                        {rating}
                    </span>
                    {onToggleStar && (
                        <button
                            className={`movie-star-btn ${isStarred ? 'starred' : ''}`}
                            onClick={handleStar}
                            title={isStarred ? "Unstar" : "Star"}
                        >
                            {isStarred ? '★' : '☆'}
                            {isCollaborative && starCount > 0 && <span className="star-count">{starCount}</span>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
