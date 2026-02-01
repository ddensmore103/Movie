/**
 * API Service Layer
 * Centralizes all backend API calls and automatically attaches Firebase auth tokens
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Get the current Firebase ID token
 * This should be called from components that have access to AuthContext
 * @returns {string|null} The current ID token or null
 */
let currentToken = null;

export const setAuthToken = (token) => {
    currentToken = token;
};

/**
 * Generic fetch wrapper that adds auth token to requests
 * @param {string} endpoint - API endpoint (e.g., '/users')
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} Response data
 */
const apiFetch = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add auth token if available
    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);

        // Handle non-OK responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

// ==================== USER ENDPOINTS ====================

/**
 * Get user by ID
 * @param {string} userId - User ID (Firebase UID)
 * @returns {Promise<Object>} User data
 */
export const getUser = async (userId) => {
    return apiFetch(`/users/${userId}`);
};

/**
 * Create a new user (legacy - may not be needed with auto-creation)
 * @param {Object} userData - User data (username, email)
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData) => {
    return apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
};

// ==================== LIST ENDPOINTS ====================

/**
 * Create a new list (requires authentication)
 * @param {Object} listData - List data (name)
 * @returns {Promise<Object>} Created list
 */
export const createList = async (listData) => {
    return apiFetch('/lists', {
        method: 'POST',
        body: JSON.stringify(listData),
    });
};

/**
 * Get lists for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} User's lists
 */
export const getUserLists = async (userId) => {
    return apiFetch(`/lists/user/${userId}`);
};

/**
 * Get list by ID with all movies
 * @param {string} listId - List ID
 * @returns {Promise<Object>} List with movies
 */
export const getListById = async (listId) => {
    return apiFetch(`/lists/${listId}`);
};

/**
 * Delete a list
 * @param {string} listId - List ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteList = async (listId) => {
    return apiFetch(`/lists/${listId}`, {
        method: 'DELETE',
    });
};

/**
 * Add movie to a list
 * @param {string} listId - List ID
 * @param {Object} movieData - Movie data (tmdbId, title, posterPath, releaseDate, rating)
 * @returns {Promise<Object>} Added movie entry
 */
export const addMovieToList = async (listId, movieData) => {
    return apiFetch(`/lists/${listId}/movies`, {
        method: 'POST',
        body: JSON.stringify(movieData),
    });
};

/**
 * Remove movie from a list
 * @param {string} listId - List ID
 * @param {string} movieId - Movie ID (internal ID, not TMDB ID)
 * @returns {Promise<Object>} Removal confirmation
 */
export const removeMovieFromList = async (listId, movieId) => {
    return apiFetch(`/lists/${listId}/movies/${movieId}`, {
        method: 'DELETE',
    });
};

// ==================== TEST ENDPOINTS ====================

/**
 * Test database connection
 * @returns {Promise<Object>} Test result
 */
export const testDatabase = async () => {
    return apiFetch('/test-db');
};

/**
 * Test protected route (auth middleware check)
 * @returns {Promise<Object>} Test result
 */
export const testProtected = async () => {
    return apiFetch('/protected');
};

/* =========================
   FRIENDS & USER SEARCH
========================= */

/**
 * Search for users by username or email
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching users
 */
export const searchUsers = async (query) => {
    return apiFetch(`/users/search?q=${encodeURIComponent(query)}`);
};

/**
 * Send a friend request to another user
 * @param {string} toUserId - User ID to send request to
 * @returns {Promise<Object>} Created friend request
 */
export const sendFriendRequest = async (toUserId) => {
    return apiFetch('/friend-requests', {
        method: 'POST',
        body: JSON.stringify({ toUserId }),
    });
};

/**
 * Get pending incoming friend requests
 * @returns {Promise<Array>} Array of pending requests with user details
 */
export const getPendingFriendRequests = async () => {
    return apiFetch('/friend-requests/pending');
};

/**
 * Accept a friend request
 * @param {string} requestId - Request ID to accept
 * @returns {Promise<Object>} Success message
 */
export const acceptFriendRequest = async (requestId) => {
    return apiFetch(`/friend-requests/${requestId}/accept`, {
        method: 'PUT',
    });
};

/**
 * Reject a friend request
 * @param {string} requestId - Request ID to reject
 * @returns {Promise<Object>} Success message
 */
export const rejectFriendRequest = async (requestId) => {
    return apiFetch(`/friend-requests/${requestId}/reject`, {
        method: 'PUT',
    });
};

/**
 * Get the current user's friends list
 * @returns {Promise<Array>} Array of friends
 */
export const getFriends = async () => {
    return apiFetch('/friends');
};

export default {
    setAuthToken,
    getUser,
    createUser,
    createList,
    getUserLists,
    getListById,
    deleteList,
    addMovieToList,
    removeMovieFromList,
    testDatabase,
};
