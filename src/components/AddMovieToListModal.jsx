import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdbAPI, getImageUrl } from '../services/tmdb';
import { addMovieToList } from '../services/api';
import './AddMovieToListModal.css';

const AddMovieToListModal = ({ isOpen, onClose, listId, listName, onMovieAdded }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addingMovieId, setAddingMovieId] = useState(null);
    const [error, setError] = useState(null);

    // Navigate to movie details page
    const handleMovieClick = (movieId) => {
        onClose(); // Close the modal first
        navigate(`/movie/${movieId}`);
    };

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setSearchResults([]);
            setError(null);
        }
    }, [isOpen]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 2) {
                searchMovies(query);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const searchMovies = async (searchQuery) => {
        setLoading(true);
        setError(null);
        try {
            const data = await tmdbAPI.searchMovies(searchQuery, 1);
            setSearchResults(data.results?.slice(0, 12) || []);
        } catch (err) {
            console.error('Error searching movies:', err);
            setError('Failed to search movies. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMovie = async (movie) => {
        setAddingMovieId(movie.id);
        setError(null);
        try {
            const movieData = {
                tmdbId: movie.id,
                title: movie.title,
                posterPath: movie.poster_path,
                releaseDate: movie.release_date,
                rating: movie.vote_average,
            };

            await addMovieToList(listId, movieData);

            // Call callback to refresh the list
            if (onMovieAdded) {
                onMovieAdded();
            }

            // Show success feedback briefly
            setTimeout(() => {
                setAddingMovieId(null);
            }, 1000);
        } catch (err) {
            console.error('Error adding movie:', err);
            setError('Failed to add movie. It may already be in the list.');
            setAddingMovieId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Movies to "{listName}"</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-search">
                    <div className="search-icon">🔍</div>
                    <input
                        type="text"
                        placeholder="Search for movies..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="modal-error">{error}</div>
                )}

                <div className="modal-results">
                    {loading ? (
                        <div className="modal-loading">Searching...</div>
                    ) : searchResults.length > 0 ? (
                        <div className="movies-grid">
                            {searchResults.map((movie) => (
                                <div key={movie.id} className="movie-result-card">
                                    <div
                                        className="movie-result-clickable"
                                        onClick={() => handleMovieClick(movie.id)}
                                        title="View movie details"
                                    >
                                        <img
                                            src={getImageUrl(movie.poster_path, 'small', 'poster')}
                                            alt={movie.title}
                                            className="movie-result-poster"
                                        />
                                        <div className="movie-result-info">
                                            <h3 className="movie-result-title">{movie.title}</h3>
                                            <p className="movie-result-year">
                                                {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="movie-result-actions">
                                        <button
                                            className={`add-movie-btn ${addingMovieId === movie.id ? 'added' : ''}`}
                                            onClick={() => handleAddMovie(movie)}
                                            disabled={addingMovieId === movie.id}
                                        >
                                            {addingMovieId === movie.id ? '✓ Added' : '+ Add'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : query.trim().length > 2 ? (
                        <div className="modal-empty">No movies found. Try a different search.</div>
                    ) : (
                        <div className="modal-empty">Start typing to search for movies...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddMovieToListModal;
