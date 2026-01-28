import { useState, useEffect, useRef } from 'react';
import { tmdbAPI, getImageUrl } from '../services/tmdb';
import './SearchBar.css';

const SearchBar = ({ onSearch, resetTrigger }) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    // Reset search when resetTrigger changes
    useEffect(() => {
        if (resetTrigger) {
            setQuery('');
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [resetTrigger]);

    // Debounce search suggestions
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 2) {
                fetchSuggestions(query);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300); // Wait 300ms after user stops typing

        return () => clearTimeout(timer);
    }, [query]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (searchQuery) => {
        try {
            const data = await tmdbAPI.searchMovies(searchQuery, 1);
            setSuggestions(data.results?.slice(0, 5) || []); // Show top 5 results
            setShowSuggestions(true);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim() && onSearch) {
            onSearch(query);
            setShowSuggestions(false);
            // Remove focus from search input
            if (inputRef.current) {
                inputRef.current.blur();
            }
        }
    };

    const handleSuggestionClick = (movie) => {
        setShowSuggestions(false);
        setQuery('');
        // Navigate directly to movie detail page
        if (onSearch && onSearch.navigate) {
            onSearch.navigate(`/movie/${movie.id}`);
        }
        // Remove focus from search input
        if (inputRef.current) {
            inputRef.current.blur();
        }
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
        if (e.target.value.trim().length > 2) {
            setShowSuggestions(true);
        }
    };

    return (
        <div ref={searchRef} className="search-container">
            <form
                className={`search-bar ${isFocused ? 'focused' : ''}`}
                onSubmit={handleSubmit}
            >
                <div className="search-icon">🔍</div>
                <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    placeholder="Search for movies..."
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                />
                {query && (
                    <button
                        type="button"
                        className="search-clear"
                        onClick={() => {
                            setQuery('');
                            setSuggestions([]);
                            setShowSuggestions(false);
                        }}
                    >
                        ✕
                    </button>
                )}
            </form>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions">
                    {suggestions.map((movie) => (
                        <div
                            key={movie.id}
                            className="suggestion-item"
                            onClick={() => handleSuggestionClick(movie)}
                        >
                            <img
                                src={getImageUrl(movie.poster_path, 'small', 'poster')}
                                alt={movie.title}
                                className="suggestion-poster"
                            />
                            <div className="suggestion-info">
                                <div className="suggestion-title">{movie.title}</div>
                                <div className="suggestion-year">
                                    {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
