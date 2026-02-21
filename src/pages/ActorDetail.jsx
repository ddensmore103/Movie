import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdbAPI, getImageUrl } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import SelectListModal from '../components/SelectListModal';
import './ActorDetail.css';

const ActorDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [actor, setActor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSelectListModal, setShowSelectListModal] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);

    useEffect(() => {
        loadActorDetails();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    const loadActorDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await tmdbAPI.getPersonDetails(id);
            setActor(data);
        } catch (err) {
            console.error('Error loading actor details:', err);
            setError('Failed to load actor details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMovieClick = (movie) => {
        navigate(`/movie/${movie.id}`);
    };

    const handleAddToList = (movie) => {
        setSelectedMovie(movie);
        setShowSelectListModal(true);
    };

    const handleListModalClose = () => {
        setShowSelectListModal(false);
        setSelectedMovie(null);
    };

    if (isLoading) {
        return (
            <div className="actor-detail-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading actor details...</p>
                </div>
            </div>
        );
    }

    if (error || !actor) {
        return (
            <div className="actor-detail-page">
                <div className="error-container">
                    <h2>😕 Oops!</h2>
                    <p>{error || 'Actor not found'}</p>
                    <button className="btn btn-primary" onClick={() => navigate(-1)}>
                        ← Go Back
                    </button>
                </div>
            </div>
        );
    }

    const {
        name,
        profile_path,
        biography,
        birthday,
        deathday,
        place_of_birth,
        known_for_department,
        movie_credits
    } = actor;

    // Sort movies by popularity (most popular first), with role size as tiebreaker
    const movies = (movie_credits?.cast || [])
        .sort((a, b) => {
            const popDiff = (b.popularity || 0) - (a.popularity || 0);
            // If popularity is roughly equal (within 5%), sort by role size
            const avgPop = ((a.popularity || 0) + (b.popularity || 0)) / 2;
            if (avgPop > 0 && Math.abs(popDiff) / avgPop < 0.05) {
                const orderA = a.order !== undefined ? a.order : 9999;
                const orderB = b.order !== undefined ? b.order : 9999;
                return orderA - orderB;
            }
            return popDiff;
        });

    const age = birthday ? (() => {
        const endDate = deathday ? new Date(deathday) : new Date();
        const birthDate = new Date(birthday);
        let years = endDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = endDate.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
            years--;
        }
        return years;
    })() : null;

    return (
        <div className="actor-detail-page">
            {/* Actor Header */}
            <div className="actor-backdrop">
                <div className="actor-backdrop-overlay">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                </div>
            </div>

            <div className="actor-content">
                <div className="actor-header">
                    <div className="actor-photo-container">
                        {profile_path ? (
                            <img
                                src={getImageUrl(profile_path, 'large', 'profile')}
                                alt={name}
                                className="actor-photo-large"
                            />
                        ) : (
                            <div className="actor-photo-placeholder">👤</div>
                        )}
                    </div>

                    <div className="actor-info">
                        <h1 className="actor-name-large">{name}</h1>

                        <div className="actor-meta-info">
                            {known_for_department && (
                                <span className="meta-item">
                                    <span className="meta-icon">🎬</span>
                                    {known_for_department}
                                </span>
                            )}
                            {birthday && (
                                <span className="meta-item">
                                    <span className="meta-icon">🎂</span>
                                    {new Date(birthday).toLocaleDateString('en-US', {
                                        month: 'long', day: 'numeric', year: 'numeric'
                                    })}
                                    {age !== null && ` (${age} years${deathday ? ' — deceased' : ''})`}
                                </span>
                            )}
                            {place_of_birth && (
                                <span className="meta-item">
                                    <span className="meta-icon">📍</span>
                                    {place_of_birth}
                                </span>
                            )}
                            <span className="meta-item">
                                <span className="meta-icon">🎥</span>
                                {movies.length} {movies.length === 1 ? 'Movie' : 'Movies'}
                            </span>
                        </div>

                        {biography && (
                            <div className="actor-biography">
                                <h2>Biography</h2>
                                <p>{biography}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filmography Section */}
                {movies.length > 0 && (
                    <section className="filmography-section">
                        <h2 className="section-title">Filmography</h2>
                        <div className="filmography-grid">
                            {movies.map((movie, index) => (
                                <MovieCard
                                    key={`${movie.id}-${movie.credit_id || index}`}
                                    movie={movie}
                                    onClick={() => handleMovieClick(movie)}
                                    onAddToList={handleAddToList}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <SelectListModal
                isOpen={showSelectListModal}
                onClose={handleListModalClose}
                movie={selectedMovie}
                onSuccess={() => console.log('Movie added to list successfully')}
                allowMultiple={true}
            />
        </div>
    );
};

export default ActorDetail;
