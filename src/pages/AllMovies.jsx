import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { tmdbAPI, mockMovies } from '../services/tmdb';
import './AllMovies.css';

const AllMovies = () => {
    const navigate = useNavigate();
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadMovies();
        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    const loadMovies = async () => {
        setIsLoading(true);
        try {
            // Fetch popular movies from TMDB with current page number
            const data = await tmdbAPI.getPopular(page);
            if (data.results && data.results.length > 0) {
                setMovies(data.results);
            } else {
                // Fallback to mock data only if API fails
                setMovies(mockMovies);
            }
        } catch (error) {
            console.error('Error loading movies:', error);
            setMovies(mockMovies);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMovieClick = (movie) => {
        navigate(`/movie/${movie.id}`);
    };

    return (
        <div className="all-movies-page">
            <div className="page-header-with-back">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h1 className="page-title">Popular Movies</h1>
            </div>

            {isLoading ? (
                <div className="loading-message">Loading movies...</div>
            ) : (
                <div className="movies-grid-large">
                    {movies.map((movie) => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            onClick={() => handleMovieClick(movie)}
                        />
                    ))}
                </div>
            )}

            <div className="pagination">
                {page > 1 && (
                    <button
                        className="btn btn-secondary"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        ← Previous
                    </button>
                )}
                <span className="page-number">Page {page} of 10</span>
                {page < 10 && (
                    <button
                        className="btn btn-secondary"
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next →
                    </button>
                )}
            </div>
        </div>
    );
};

export default AllMovies;
