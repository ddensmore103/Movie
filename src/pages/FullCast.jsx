import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdbAPI, getImageUrl } from '../services/tmdb';
import './FullCast.css';

const FullCast = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cast, setCast] = useState([]);
    const [movieTitle, setMovieTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCast();
    }, [id]);

    const loadCast = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [credits, details] = await Promise.all([
                tmdbAPI.getMovieCredits(id),
                tmdbAPI.getMovieDetails(id)
            ]);
            setCast(credits.cast || []);
            setMovieTitle(details.title || 'Unknown Movie');
        } catch (err) {
            console.error('Error loading cast:', err);
            setError('Failed to load cast');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="full-cast-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading cast...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="full-cast-page">
                <div className="error-container">
                    <h2>😕 Oops!</h2>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => navigate(-1)}>
                        ← Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="full-cast-page">
            <div className="page-header-with-back">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h1 className="page-title">Full Cast — {movieTitle}</h1>
            </div>

            <div className="full-cast-grid">
                {cast.map(actor => (
                    <div
                        key={actor.credit_id || actor.id}
                        className="cast-card clickable"
                        onClick={() => navigate(`/actor/${actor.id}`)}
                    >
                        <div className="cast-photo">
                            {actor.profile_path ? (
                                <img
                                    src={getImageUrl(actor.profile_path, 'medium', 'profile')}
                                    alt={actor.name}
                                    loading="lazy"
                                />
                            ) : (
                                <div className="cast-placeholder">👤</div>
                            )}
                        </div>
                        <div className="cast-info">
                            <div className="cast-name">{actor.name}</div>
                            <div className="cast-character">{actor.character}</div>
                        </div>
                    </div>
                ))}
            </div>

            {cast.length === 0 && (
                <div className="no-cast">
                    <p>No cast information available for this movie.</p>
                </div>
            )}
        </div>
    );
};

export default FullCast;
