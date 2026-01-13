import { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim() && onSearch) {
            onSearch(query);
        }
    };

    return (
        <form
            className={`search-bar ${isFocused ? 'focused' : ''}`}
            onSubmit={handleSubmit}
        >
            <div className="search-icon">🔍</div>
            <input
                type="text"
                className="search-input"
                placeholder="Search for movies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
            {query && (
                <button
                    type="button"
                    className="search-clear"
                    onClick={() => setQuery('')}
                >
                    ✕
                </button>
            )}
        </form>
    );
};

export default SearchBar;
