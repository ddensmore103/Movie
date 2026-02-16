import { useState, useEffect, useRef } from 'react';
import { tmdbAPI, getImageUrl } from '../services/tmdb';
import './MoviePickerModal.css';

const MoviePickerModal = ({ isOpen, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        } else if (!isOpen) {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 2) {
                fetchMovies(query);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const fetchMovies = async (searchQuery) => {
        setLoading(true);
        try {
            const data = await tmdbAPI.searchMovies(searchQuery, 1);
            setResults(data.results || []);
        } catch (error) {
            console.error('Error fetching movies:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="movie-picker-modal" onClick={e => e.stopPropagation()}>
                <div className="picker-header">
                    <h3>Select a Movie</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="picker-search">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search for a movie..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="picker-input"
                    />
                    {loading && <div className="picker-loader"></div>}
                </div>

                <div className="picker-results">
                    {results.length > 0 ? (
                        results.map(movie => (
                            <div
                                key={movie.id}
                                className="picker-item"
                                onClick={() => onSelect(movie)}
                            >
                                <img
                                    src={getImageUrl(movie.poster_path, 'small', 'poster')}
                                    alt={movie.title}
                                    className="picker-poster"
                                />
                                <div className="picker-info">
                                    <div className="picker-title">{movie.title}</div>
                                    <div className="picker-year">
                                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : query.length > 2 && !loading ? (
                        <div className="picker-empty">No movies found</div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default MoviePickerModal;
