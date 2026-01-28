import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ActivityCard from '../components/ActivityCard';
import MovieCard from '../components/MovieCard';
import { tmdbAPI, mockMovies, mockActivity } from '../services/tmdb';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [recentActivity, setRecentActivity] = useState([]);
    const [recommendedMovies, setRecommendedMovies] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resetTrigger, setResetTrigger] = useState(0);

    useEffect(() => {
        // Load initial data
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
            setRecommendedMovies(trendingData.results || mockMovies);
        } catch (error) {
            console.error('Error loading trending movies, using mock data:', error);
            setRecommendedMovies(mockMovies);
        }

        // Activity feed uses mock data (requires backend)
        setRecentActivity(mockActivity);
        setIsLoading(false);
    };

    const resetSearch = () => {
        setIsSearching(false);
        setSearchResults([]);
        setSearchQuery('');
        setResetTrigger(prev => prev + 1); // Trigger SearchBar reset
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

    // Add navigate function to search handler
    handleSearch.navigate = navigate;

    const handleMovieClick = (movie) => {
        navigate(`/movie/${movie.id}`);
    };

    const displayedMovies = isSearching ? searchResults : recommendedMovies;
    const sectionTitle = isSearching
        ? `Search Results for "${searchQuery}"`
        : 'Trending This Week';

    return (
        <div className="home-page">
            {/* Sticky Search Bar */}
            <div className="sticky-search-container">
                <SearchBar onSearch={handleSearch} resetTrigger={resetTrigger} />
            </div>

            <div className="home-content">
                {/* Only show activity section when not searching */}
                {!isSearching && (
                    <section className="activity-section">
                        <div className="section-header">
                            <h2 className="section-title">Recent Activity</h2>
                            <button className="section-link" onClick={() => navigate('/activity')}>
                                View All →
                            </button>
                        </div>
                        <div className="activity-feed">
                            {recentActivity.map((activity) => (
                                <ActivityCard key={activity.id} activity={activity} />
                            ))}
                        </div>
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
        </div>
    );
};

export default Home;

