import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tmdbAPI, getImageUrl } from '../services/tmdb';
import { getMovieReviews, createReview, updateReview, deleteReview } from '../services/api';
import StarRating from '../components/StarRating';
import ReviewModal from '../components/ReviewModal';
import ReviewCard from '../components/ReviewCard';
import './MovieDetail.css';

const MovieDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [movie, setMovie] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);

    useEffect(() => {
        loadMovieDetails();
        loadReviews();
    }, [id]);

    const loadMovieDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await tmdbAPI.getMovieDetails(id);
            setMovie(data);
        } catch (err) {
            console.error('Error loading movie details:', err);
            setError('Failed to load movie details');
        } finally {
            setIsLoading(false);
        }
    };

    const loadReviews = async () => {
        setIsLoadingReviews(true);
        try {
            const reviewsData = await getMovieReviews(id);
            setReviews(reviewsData);
        } catch (err) {
            console.error('Error loading reviews:', err);
        } finally {
            setIsLoadingReviews(false);
        }
    };

    const handleCreateReview = async (reviewData) => {
        const newReview = await createReview({
            movieId: id,
            tmdbId: id,
            movieTitle: movie.title,
            posterPath: movie.poster_path,
            ...reviewData,
        });
        await loadReviews();
    };

    const handleUpdateReview = async (reviewData) => {
        await updateReview(editingReview.reviewId, reviewData);
        setEditingReview(null);
        await loadReviews();
    };

    const handleDeleteReview = async (reviewId) => {
        await deleteReview(reviewId);
        await loadReviews();
    };

    const handleEditClick = (review) => {
        setEditingReview(review);
        setIsReviewModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsReviewModalOpen(false);
        setEditingReview(null);
    };

    const userReview = currentUser ? reviews.find(r => r.userId === currentUser.uid) : null;
    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;


    if (isLoading) {
        return (
            <div className="movie-detail-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading movie details...</p>
                </div>
            </div>
        );
    }

    if (error || !movie) {
        return (
            <div className="movie-detail-page">
                <div className="error-container">
                    <h2>😕 Oops!</h2>
                    <p>{error || 'Movie not found'}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        ← Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const {
        title,
        backdrop_path,
        poster_path,
        overview,
        release_date,
        vote_average,
        vote_count,
        runtime,
        genres,
        tagline,
        credits,
        videos,
        similar
    } = movie;

    const year = release_date ? new Date(release_date).getFullYear() : 'N/A';
    const rating = vote_average ? vote_average.toFixed(1) : 'N/A';
    const hours = runtime ? Math.floor(runtime / 60) : 0;
    const minutes = runtime ? runtime % 60 : 0;

    const director = credits?.crew?.find(person => person.job === 'Director');
    const cast = credits?.cast?.slice(0, 10) || [];
    const trailer = videos?.results?.find(video => video.type === 'Trailer' && video.site === 'YouTube');
    const similarMovies = similar?.results?.slice(0, 6) || [];

    return (
        <div className="movie-detail-page">
            {/* Backdrop Header */}
            <div
                className="movie-backdrop"
                style={{
                    backgroundImage: backdrop_path
                        ? `url(${getImageUrl(backdrop_path, 'large', 'backdrop')})`
                        : 'none'
                }}
            >
                <div className="backdrop-overlay">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="movie-content">
                <div className="movie-header">
                    <div className="movie-poster-container">
                        <img
                            src={getImageUrl(poster_path, 'large', 'poster')}
                            alt={title}
                            className="movie-poster-large"
                        />
                    </div>

                    <div className="movie-info">
                        <h1 className="movie-title-large">{title}</h1>

                        {tagline && <p className="movie-tagline">"{tagline}"</p>}

                        <div className="movie-meta-info">
                            <span className="meta-item">
                                <span className="meta-icon">📅</span>
                                {year}
                            </span>
                            {runtime > 0 && (
                                <span className="meta-item">
                                    <span className="meta-icon">⏱️</span>
                                    {hours}h {minutes}m
                                </span>
                            )}
                            <span className="meta-item rating-badge">
                                <span className="meta-icon">⭐</span>
                                {rating} <span className="vote-count">({vote_count} votes)</span>
                            </span>
                        </div>

                        {genres && genres.length > 0 && (
                            <div className="movie-genres">
                                {genres.map(genre => (
                                    <span key={genre.id} className="genre-tag">{genre.name}</span>
                                ))}
                            </div>
                        )}

                        <div className="movie-overview">
                            <h2>Overview</h2>
                            <p>{overview || 'No overview available.'}</p>
                        </div>

                        {director && (
                            <div className="movie-director">
                                <strong>Director:</strong> {director.name}
                            </div>
                        )}

                        {trailer && (
                            <div className="movie-actions">
                                <a
                                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                >
                                    ▶ Watch Trailer
                                </a>
                                <button className="btn btn-secondary">
                                    ➕ Add to List
                                </button>
                                <button className="btn btn-secondary">
                                    ❤️ Favorite
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cast Section */}
                {cast.length > 0 && (
                    <section className="cast-section">
                        <h2 className="section-title">Cast</h2>
                        <div className="cast-grid">
                            {cast.map(actor => (
                                <div key={actor.id} className="cast-card">
                                    <div className="cast-photo">
                                        {actor.profile_path ? (
                                            <img
                                                src={getImageUrl(actor.profile_path, 'medium', 'profile')}
                                                alt={actor.name}
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
                    </section>
                )}

                {/* Similar Movies Section */}
                {similarMovies.length > 0 && (
                    <section className="similar-section">
                        <h2 className="section-title">Similar Movies</h2>
                        <div className="similar-grid">
                            {similarMovies.map(similarMovie => (
                                <div
                                    key={similarMovie.id}
                                    className="similar-card"
                                    onClick={() => navigate(`/movie/${similarMovie.id}`)}
                                >
                                    <img
                                        src={getImageUrl(similarMovie.poster_path, 'medium', 'poster')}
                                        alt={similarMovie.title}
                                    />
                                    <div className="similar-title">{similarMovie.title}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Reviews Section */}
                <section className="reviews-section">
                    <div className="reviews-header">
                        <div>
                            <h2 className="section-title">Reviews</h2>
                            {reviews.length > 0 && (
                                <div className="reviews-summary">
                                    <StarRating rating={averageRating} size="medium" />
                                    <span className="average-rating">
                                        {averageRating.toFixed(1)} out of 5
                                    </span>
                                    <span className="review-count">
                                        ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                                    </span>
                                </div>
                            )}
                        </div>
                        {currentUser && (
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    if (userReview) {
                                        handleEditClick(userReview);
                                    } else {
                                        setIsReviewModalOpen(true);
                                    }
                                }}
                            >
                                {userReview ? '✏️ Edit Your Review' : '✍️ Write a Review'}
                            </button>
                        )}
                    </div>

                    {isLoadingReviews ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            Loading reviews...
                        </div>
                    ) : reviews.length > 0 ? (
                        <div className="reviews-list">
                            {reviews.map(review => (
                                <ReviewCard
                                    key={review.reviewId}
                                    review={review}
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteReview}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="no-reviews">
                            <p>No reviews yet. Be the first to review this movie!</p>
                        </div>
                    )}
                </section>
            </div>

            {/* Review Modal */}
            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={handleCloseModal}
                onSubmit={editingReview ? handleUpdateReview : handleCreateReview}
                movie={movie ? {
                    title: movie.title,
                    posterPath: getImageUrl(movie.poster_path, 'small', 'poster'),
                    releaseDate: movie.release_date
                } : null}
                existingReview={editingReview}
            />
        </div>
    );
};

export default MovieDetail;
