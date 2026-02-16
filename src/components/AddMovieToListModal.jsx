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

    // Series prompt state
    const [seriesPrompt, setSeriesPrompt] = useState(null);
    const [addingSeries, setAddingSeries] = useState(false);

    // Navigate to movie details page
    const handleMovieClick = (movieId) => {
        onClose();
        navigate(`/movie/${movieId}`);
    };

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setSearchResults([]);
            setError(null);
            setSeriesPrompt(null);
            setAddingSeries(false);
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
            // Check if movie belongs to a collection/series
            const movieDetails = await tmdbAPI.getMovieDetails(movie.id);

            if (movieDetails.belongs_to_collection) {
                const collection = movieDetails.belongs_to_collection;
                // Fetch full collection details to get all movies
                const collectionDetails = await tmdbAPI.getCollection(collection.id);

                // Sort by release date
                const sortedParts = (collectionDetails.parts || [])
                    .filter(p => p.release_date)
                    .sort((a, b) => new Date(a.release_date) - new Date(b.release_date));

                setSeriesPrompt({
                    collection: collectionDetails,
                    selectedMovie: movie,
                    movies: sortedParts,
                });
                setAddingMovieId(null);
                return;
            }

            // No collection — just add the single movie
            await addSingleMovie(movie);
        } catch (err) {
            console.error('Error adding movie:', err);
            setError('Failed to add movie. It may already be in the list.');
            setAddingMovieId(null);
        }
    };

    const addSingleMovie = async (movie, collectionId = null) => {
        const movieData = {
            tmdbId: movie.id,
            title: movie.title,
            posterPath: movie.poster_path,
            releaseDate: movie.release_date,
            rating: movie.vote_average,
            collectionId: collectionId,
        };

        await addMovieToList(listId, movieData);

        if (onMovieAdded) onMovieAdded();

        setTimeout(() => {
            setAddingMovieId(null);
        }, 1000);
    };

    const handleAddJustOne = async () => {
        if (!seriesPrompt) return;
        setAddingSeries(true);
        try {
            await addSingleMovie(seriesPrompt.selectedMovie);
            setSeriesPrompt(null);
        } catch (err) {
            console.error('Error adding movie:', err);
            setError('Failed to add movie.');
        } finally {
            setAddingSeries(false);
        }
    };

    const handleAddEntireSeries = async () => {
        if (!seriesPrompt) return;
        setAddingSeries(true);
        setError(null);
        try {
            const { movies, collection } = seriesPrompt;
            for (let i = 0; i < movies.length; i++) {
                const movie = movies[i];
                try {
                    await addSingleMovie(movie, collection.id);
                } catch (err) {
                    console.error(`Error adding "${movie.title}":`, err);
                    // Continue with next movie even if one fails
                }
            }
            setSeriesPrompt(null);
        } catch (err) {
            console.error('Error adding series:', err);
            setError('Failed to add some movies from the series.');
        } finally {
            setAddingSeries(false);
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

                {/* Series prompt overlay */}
                {seriesPrompt && (
                    <div className="series-prompt">
                        <div className="series-prompt-header">
                            <span className="series-icon">🎬</span>
                            <h3>Part of a Series!</h3>
                        </div>
                        <p className="series-name">{seriesPrompt.collection.name}</p>
                        <p className="series-count">{seriesPrompt.movies.length} movies in this series</p>
                        <div className="series-movies-preview">
                            {seriesPrompt.movies.map((movie) => (
                                <div key={movie.id} className="series-movie-thumb">
                                    <img
                                        src={getImageUrl(movie.poster_path, 'small', 'poster')}
                                        alt={movie.title}
                                    />
                                    <span className="series-movie-year">
                                        {movie.release_date ? new Date(movie.release_date).getFullYear() : '?'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="series-prompt-actions">
                            <button
                                className="btn btn-series-all"
                                onClick={handleAddEntireSeries}
                                disabled={addingSeries}
                            >
                                {addingSeries ? '⏳ Adding...' : `🎬 Add All ${seriesPrompt.movies.length} Movies`}
                            </button>
                            <button
                                className="btn btn-series-one"
                                onClick={handleAddJustOne}
                                disabled={addingSeries}
                            >
                                Add Just "{seriesPrompt.selectedMovie.title}"
                            </button>
                            <button
                                className="btn btn-series-cancel"
                                onClick={() => setSeriesPrompt(null)}
                                disabled={addingSeries}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {!seriesPrompt && (
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
                )}
            </div>
        </div>
    );
};

export default AddMovieToListModal;
