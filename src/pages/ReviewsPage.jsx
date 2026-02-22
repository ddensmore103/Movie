import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTrendingReviews, getActivityFeed, getMovieReviews } from '../services/api';
import { tmdbAPI, getImageUrl } from '../services/tmdb';
import ReviewCard from '../components/ReviewCard';
import './ReviewsPage.css';

const ReviewsPage = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Trending & friend reviews
    const [trendingReviews, setTrendingReviews] = useState([]);
    const [friendReviews, setFriendReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Movie search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [movieReviews, setMovieReviews] = useState([]);
    const [isLoadingMovieReviews, setIsLoadingMovieReviews] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 2) {
                fetchSuggestions(searchQuery);
            } else {
                setSearchSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [trending, feed] = await Promise.all([
                getTrendingReviews(),
                getActivityFeed(),
            ]);
            setTrendingReviews(trending || []);
            setFriendReviews(feed || []);
        } catch (err) {
            console.error('Error loading reviews data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSuggestions = async (query) => {
        try {
            const data = await tmdbAPI.searchMovies(query, 1);
            setSearchSuggestions(data.results?.slice(0, 6) || []);
            setShowSuggestions(true);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
        }
    };

    const handleMovieSelect = async (movie) => {
        setSelectedMovie(movie);
        setSearchQuery(movie.title);
        setShowSuggestions(false);
        setIsLoadingMovieReviews(true);
        try {
            const reviews = await getMovieReviews(String(movie.id));
            setMovieReviews(reviews || []);
        } catch (err) {
            console.error('Error loading movie reviews:', err);
            setMovieReviews([]);
        } finally {
            setIsLoadingMovieReviews(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSelectedMovie(null);
        setMovieReviews([]);
        setSearchSuggestions([]);
        setShowSuggestions(false);
    };

    if (isLoading) {
        return (
            <div className="reviews-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading reviews...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reviews-page">
            {/* Header */}
            <div className="reviews-header">
                <h1 className="reviews-title">Reviews</h1>
                <div className="reviews-header-search">
                    <div className="reviews-search-container" ref={searchRef}>
                        <div className="reviews-search-bar">
                            <span className="reviews-search-icon">🔍</span>
                            <input
                                type="text"
                                className="reviews-search-input"
                                placeholder="Search for a movie to see its reviews..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.trim().length > 2 && setShowSuggestions(true)}
                            />
                            {searchQuery && (
                                <button className="reviews-search-clear" onClick={clearSearch}>✕</button>
                            )}
                        </div>
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <div className="reviews-suggestions">
                                {searchSuggestions.map((movie) => (
                                    <div
                                        key={movie.id}
                                        className="reviews-suggestion-item"
                                        onClick={() => handleMovieSelect(movie)}
                                    >
                                        <img
                                            src={getImageUrl(movie.poster_path, 'small', 'poster')}
                                            alt={movie.title}
                                            className="reviews-suggestion-poster"
                                        />
                                        <div className="reviews-suggestion-info">
                                            <div className="reviews-suggestion-title">{movie.title}</div>
                                            <div className="reviews-suggestion-year">
                                                {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Movie Reviews (search result) */}
            {selectedMovie && (
                <section className="reviews-section movie-reviews-section">
                    <div className="movie-reviews-header">
                        <img
                            src={getImageUrl(selectedMovie.poster_path, 'small', 'poster')}
                            alt={selectedMovie.title}
                            className="movie-reviews-poster"
                        />
                        <div>
                            <h2 className="section-title">
                                Reviews for {selectedMovie.title}
                                {selectedMovie.release_date && (
                                    <span className="movie-reviews-year">
                                        ({new Date(selectedMovie.release_date).getFullYear()})
                                    </span>
                                )}
                            </h2>
                            <button
                                className="view-movie-btn"
                                onClick={() => navigate(`/movie/${selectedMovie.id}`)}
                            >
                                View Movie Details →
                            </button>
                        </div>
                    </div>
                    {isLoadingMovieReviews ? (
                        <div className="loading-container small">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : movieReviews.length > 0 ? (
                        <div className="reviews-list">
                            {movieReviews.map((review) => (
                                <ReviewCard key={review.reviewId} review={review} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-reviews">
                            <p>No reviews yet for this movie. Be the first to review it!</p>
                        </div>
                    )}
                </section>
            )}

            {/* Popular Reviews & Friend Reviews - only shown when no movie is searched */}
            {!selectedMovie && (
                <>
                    <section className="reviews-section">
                        <h2 className="section-title">
                            <span className="section-icon">🔥</span>
                            Popular Reviews
                        </h2>
                        {trendingReviews.length > 0 ? (
                            <div className="reviews-list">
                                {trendingReviews.map((review) => (
                                    <div key={review.reviewId} className="review-with-movie">
                                        <div
                                            className="review-movie-badge"
                                            onClick={() => navigate(`/movie/${review.tmdbId || review.movieId}`)}
                                        >
                                            {review.posterPath && (
                                                <img
                                                    src={getImageUrl(review.posterPath, 'small', 'poster')}
                                                    alt={review.movieTitle}
                                                    className="review-movie-poster-small"
                                                />
                                            )}
                                            <span className="review-movie-title-badge">
                                                {review.movieTitle || 'Unknown Movie'}
                                            </span>
                                        </div>
                                        <ReviewCard review={review} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-reviews">
                                <p>No trending reviews yet. Start liking reviews to help them rise!</p>
                            </div>
                        )}
                    </section>

                    <section className="reviews-section">
                        <h2 className="section-title">
                            <span className="section-icon">👥</span>
                            Friend Reviews
                        </h2>
                        {friendReviews.length > 0 ? (
                            <div className="reviews-list">
                                {friendReviews.slice(0, 5).map((review) => (
                                    <div key={review.reviewId} className="review-with-movie">
                                        <div
                                            className="review-movie-badge"
                                            onClick={() => navigate(`/movie/${review.tmdbId || review.movieId}`)}
                                        >
                                            {review.posterPath && (
                                                <img
                                                    src={getImageUrl(review.posterPath, 'small', 'poster')}
                                                    alt={review.movieTitle}
                                                    className="review-movie-poster-small"
                                                />
                                            )}
                                            <span className="review-movie-title-badge">
                                                {review.movieTitle || 'Unknown Movie'}
                                            </span>
                                        </div>
                                        <ReviewCard review={review} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-reviews">
                                <p>No friend reviews yet. Add some friends to see their reviews here!</p>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
};

export default ReviewsPage;
