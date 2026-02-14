import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import MovieCard from '../components/MovieCard';
import SelectListModal from '../components/SelectListModal';
import { tmdbAPI, mockMovies } from '../services/tmdb';
import { getRecommendedMovies } from '../services/api';
import './Home.css';

const VISIBLE_RECOMMENDATIONS_COUNT = 10; // ~2 rows on desktop

const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [personalRecommendations, setPersonalRecommendations] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [recsLoading, setRecsLoading] = useState(true);
    const [resetTrigger, setResetTrigger] = useState(0);
    const [showSelectListModal, setShowSelectListModal] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    // Reset search when navigating to home from elsewhere
    useEffect(() => {
        if (location.state?.resetSearch) {
            resetSearch();
        }
    }, [location.state]);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            // Try to fetch trending movies from TMDB
            const trendingData = await tmdbAPI.getTrending('week', 1);
            setTrendingMovies(trendingData.results || mockMovies);
        } catch (error) {
            console.error('Error loading trending movies, using mock data:', error);
            setTrendingMovies(mockMovies);
        }

        // Fetch personalized recommendations
        try {
            setRecsLoading(true);
            const recs = await getRecommendedMovies();
            setPersonalRecommendations(recs);
        } catch (error) {
            console.error('Error loading recommendations:', error);
            setPersonalRecommendations([]);
        } finally {
            setRecsLoading(false);
        }

        setIsLoading(false);
    };

    const resetSearch = () => {
        setIsSearching(false);
        setSearchResults([]);
        setSearchQuery('');
        setResetTrigger(prev => prev + 1);
    };

    const handleSearch = async (query) => {
        if (!query.trim()) {
            resetSearch();
            return;
        }

        setSearchQuery(query);
        setIsSearching(true);

        try {
            const data = await tmdbAPI.searchMovies(query);
            setSearchResults(data.results || []);
        } catch (error) {
            console.error('Error searching movies:', error);
            setSearchResults([]);
        }
    };

    handleSearch.navigate = navigate;

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

    const displayedMovies = isSearching ? searchResults : trendingMovies;
    const sectionTitle = isSearching
        ? `Search Results for "${searchQuery}"`
        : 'Trending This Week';

    return (
        <div className="home-page">
            {/* Sticky Search Bar */}
            <div className="sticky-search-container">
                <SearchBar onSearch={handleSearch} resetTrigger={resetTrigger} />
                <img src="/logo.png" alt="MovieTrack Logo" className="home-logo" onClick={() => navigate('/')} />
            </div>

            <div className="home-content">
                {/* Recommended For You Section - only when not searching */}
                {!isSearching && (
                    <section className="recommended-section">
                        <div className="section-header">
                            <h2 className="section-title">Recommended For You</h2>
                            {personalRecommendations.length > VISIBLE_RECOMMENDATIONS_COUNT && (
                                <button className="section-link" onClick={() => navigate('/recommendations')}>
                                    See More →
                                </button>
                            )}
                        </div>
                        {recsLoading ? (
                            <div className="loading-message">Finding movies you'll love...</div>
                        ) : personalRecommendations.length > 0 ? (
                            <div className="movies-grid">
                                {personalRecommendations.slice(0, VISIBLE_RECOMMENDATIONS_COUNT).map((movie) => (
                                    <MovieCard
                                        key={movie.id}
                                        movie={movie}
                                        onClick={() => handleMovieClick(movie)}
                                        onAddToList={handleAddToList}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="recommendations-empty">
                                <div className="recommendations-empty-icon">🎬</div>
                                <p>Watch and rate some movies to get personalized recommendations!</p>
                            </div>
                        )}
                    </section>
                )}

                {/* Movies Section - shows search results or trending */}
                <section className="movies-section">
                    <div className="section-header">
                        <h2 className="section-title">{sectionTitle}</h2>
                        {!isSearching && (
                            <button className="section-link" onClick={() => navigate('/movies')}>
                                See More →
                            </button>
                        )}
                        {isSearching && (
                            <button
                                className="section-link"
                                onClick={resetSearch}
                            >
                                ← Back to Home
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="loading-message">Loading movies...</div>
                    ) : displayedMovies.length > 0 ? (
                        <div className="movies-grid">
                            {displayedMovies.map((movie) => (
                                <MovieCard
                                    key={movie.id}
                                    movie={movie}
                                    onClick={() => handleMovieClick(movie)}
                                    onAddToList={handleAddToList}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="no-results">
                            {isSearching
                                ? `No movies found for "${searchQuery}". Try a different search.`
                                : 'No movies available at the moment.'
                            }
                        </div>
                    )}
                </section>
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

export default Home;
