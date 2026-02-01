import { useState, useEffect, useRef } from 'react';
import { searchUsers } from '../services/api';
import './UserSearchBar.css';

const UserSearchBar = ({ onUserSelect, excludeUserIds = [] }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeoutRef = useRef(null);
    const searchBarRef = useRef(null);

    // Debounced search
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set new timeout for debounced search
        searchTimeoutRef.current = setTimeout(async () => {
            console.log('[UserSearchBar] Starting search for:', searchQuery);
            setIsSearching(true);
            try {
                const results = await searchUsers(searchQuery);
                console.log('[UserSearchBar] Search results:', results);
                // Filter out excluded users
                const filteredResults = results.filter(
                    user => !excludeUserIds.includes(user.userId)
                );
                console.log('[UserSearchBar] Filtered results:', filteredResults);
                setSearchResults(filteredResults);
                setShowResults(true);
            } catch (err) {
                console.error('[UserSearchBar] Error searching users:', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300); // 300ms debounce

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, excludeUserIds]);

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUserClick = (user) => {
        onUserSelect(user);
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
    };

    return (
        <div className="user-search-bar" ref={searchBarRef}>
            <div className="search-input-container">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                />
                {isSearching && <span className="loading-spinner">⏳</span>}
            </div>

            {showResults && searchResults.length > 0 && (
                <div className="search-results-dropdown">
                    {searchResults.map((user) => (
                        <div
                            key={user.userId}
                            className="search-result-item"
                            onClick={() => handleUserClick(user)}
                        >
                            <div className="user-info">
                                <div className="user-avatar">👤</div>
                                <div className="user-details">
                                    <div className="user-name">{user.username || 'Unknown'}</div>
                                    <div className="user-email">{user.email}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
                <div className="search-results-dropdown">
                    <div className="no-results">No users found</div>
                </div>
            )}
        </div>
    );
};

export default UserSearchBar;
