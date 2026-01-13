import { getImageUrl } from '../services/tmdb';
import './MovieCard.css';

const MovieCard = ({ movie, onClick }) => {
    const {
        title,
        poster_path,
        release_date,
        vote_average
    } = movie;

    const year = release_date ? new Date(release_date).getFullYear() : 'N/A';
    const rating = vote_average ? vote_average.toFixed(1) : 'N/A';

    return (
        <div className="movie-card" onClick={onClick}>
            <div className="movie-poster">
                <img
                    src={getImageUrl(poster_path, 'medium', 'poster')}
                    alt={title}
                    loading="lazy"
                />
                <div className="movie-overlay">
                    <button className="play-btn">▶</button>
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
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
