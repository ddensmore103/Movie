/**
 * API Service Layer
 * Centralizes all backend API calls and automatically attaches Firebase auth tokens
 */
import { tmdbAPI } from './tmdb';

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
 * Get user statistics (lists, reviews, friends counts)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User stats
 */
export const getUserStats = async (userId) => {
    return apiFetch(`/users/${userId}/stats`);
};

/**
 * Update user profile data
 * @param {string} userId - User ID
 * @param {Object} userData - Data to update (username, bio, photoURL)
 * @returns {Promise<Object>} Success message
 */
export const updateUserProfile = async (userId, userData) => {
    return apiFetch(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
    });
};

/**
 * Delete user data from backend
 * @param {string} userId - User ID (Firebase UID)
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteUserData = async (userId) => {
    return apiFetch(`/users/${userId}`, {
        method: 'DELETE',
    });
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

// ==================== ADMIN ENDPOINTS ====================

/**
 * Get all users (Admin only)
 * @returns {Promise<Array>} List of all users
 */
export const getAllUsers = async () => {
    return apiFetch('/admin/users');
};

/**
 * Delete a user by Admin (deletes DB + Firebase)
 * @param {string} userId - User ID to delete
 * @returns {Promise<Object>} Success message
 */
export const adminDeleteUser = async (userId) => {
    return apiFetch(`/admin/users/${userId}`, {
        method: 'DELETE',
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
    console.log('getUserLists called with userId:', userId);
    const result = await apiFetch(`/lists/user/${userId}`);
    console.log('getUserLists result:', result);
    return result;
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
 * Get pending sent friend requests
 * @returns {Promise<Array>} Array of sent requests with user details
 */
export const getSentFriendRequests = async () => {
    return apiFetch('/friend-requests/sent');
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

/* =========================
   LIST COLLABORATORS
========================= */

/**
 * Add a collaborator to a list
 * @param {string} listId - List ID
 * @param {string} userId - User ID to add as collaborator
 * @returns {Promise<Object>} Collaborator record
 */
export const addCollaborator = async (listId, userId) => {
    return apiFetch(`/lists/${listId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
    });
};

/**
 * Remove a collaborator from a list
 * @param {string} listId - List ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<Object>} Success message
 */
export const removeCollaborator = async (listId, userId) => {
    return apiFetch(`/lists/${listId}/collaborators/${userId}`, {
        method: 'DELETE',
    });
};

/**
 * Get all collaborators for a list
 * @param {string} listId - List ID
 * @returns {Promise<Array>} Array of collaborators with user details
 */
export const getListCollaborators = async (listId) => {
    return apiFetch(`/lists/${listId}/collaborators`);
};

/**
 * Get all lists the current user is collaborating on
 * @returns {Promise<Array>} Array of lists
 */
export const getCollaboratingLists = async () => {
    return apiFetch('/lists/collaborating');
};

/* =========================
   MOVIE REVIEWS
========================= */

/**
 * Create a new review for a movie
 * @param {Object} reviewData - Review data (movieId, tmdbId, rating, reviewText, watchDate, movieTitle, posterPath)
 * @returns {Promise<Object>} Created review
 */
export const createReview = async (reviewData) => {
    return apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewData),
    });
};

/**
 * Update an existing review
 * @param {string} reviewId - Review ID
 * @param {Object} reviewData - Updated review data (rating, reviewText, watchDate)
 * @returns {Promise<Object>} Updated review
 */
export const updateReview = async (reviewId, reviewData) => {
    return apiFetch(`/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify(reviewData),
    });
};

/**
 * Delete a review
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteReview = async (reviewId) => {
    return apiFetch(`/reviews/${reviewId}`, {
        method: 'DELETE',
    });
};

/**
 * Get all reviews for a specific movie
 * @param {string} movieId - Movie ID (internal ID or TMDB ID)
 * @returns {Promise<Array>} Array of reviews with user details
 */
export const getMovieReviews = async (movieId) => {
    return apiFetch(`/reviews/movie/${movieId}`);
};

/**
 * Get all reviews by a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of user's reviews
 */
export const getUserReviews = async (userId) => {
    console.log('getUserReviews called with userId:', userId);
    const result = await apiFetch(`/reviews/user/${userId}`);
    console.log('getUserReviews result:', result);
    return result;
};

/**
 * Get current user's reviews
 * @returns {Promise<Array>} Array of current user's reviews
 */
export const getMyReviews = async () => {
    return apiFetch('/reviews/my-reviews');
};

/**
 * Get the current user's friends list
 * @returns {Promise<Array>} Array of friends
 */
export const getFriends = async () => {
    console.log('getFriends called');
    const result = await apiFetch('/friends');
    console.log('getFriends result:', result);
    return result;
};

/**
 * Get a specific user's friends list
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of friends
 */
export const getUserFriends = async (userId) => {
    console.log('getUserFriends called with userId:', userId);
    const result = await apiFetch(`/friends/user/${userId}`);
    console.log('getUserFriends result:', result);
    return result;
};

/**
 * Get activity feed (reviews from user and friends)
 * @returns {Promise<Array>} Array of reviews with user details
 */
export const getActivityFeed = async () => {
    return apiFetch('/activity/feed');
};

/**
 * Get personalized movie recommendations based on user's review history
 * Fetches user's highest-rated movies and uses TMDB recommendations API
 * @returns {Promise<Array>} Array of recommended TMDB movie objects
 */
export const getRecommendedMovies = async () => {
    try {
        // Get user's reviews sorted by the backend (most recent first)
        const reviews = await getMyReviews();

        if (!reviews || reviews.length === 0) {
            return [];
        }

        // Sort by rating (highest first), then by recency for ties
        const sortedReviews = [...reviews]
            .filter(r => r.tmdbId)
            .sort((a, b) => {
                const ratingDiff = (b.rating || 0) - (a.rating || 0);
                if (ratingDiff !== 0) return ratingDiff;
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });

        // Take top 5 highest-rated movies to seed recommendations
        const seedMovies = sortedReviews.slice(0, 5);
        const reviewedTmdbIds = new Set(sortedReviews.map(r => String(r.tmdbId)));

        // Fetch TMDB recommendations for each seed movie in parallel
        const recommendationResults = await Promise.allSettled(
            seedMovies.map(review =>
                tmdbAPI.getMovieDetails(review.tmdbId)
            )
        );

        // Collect and deduplicate recommendations
        const seenIds = new Set();
        const allRecommendations = [];

        for (const result of recommendationResults) {
            if (result.status === 'fulfilled' && result.value?.recommendations?.results) {
                for (const movie of result.value.recommendations.results) {
                    const movieIdStr = String(movie.id);
                    // Skip if already reviewed or already in recommendations
                    if (!reviewedTmdbIds.has(movieIdStr) && !seenIds.has(movieIdStr)) {
                        seenIds.add(movieIdStr);
                        allRecommendations.push(movie);
                    }
                }
            }
        }

        // Return up to 20 recommendations, sorted by TMDB popularity
        return allRecommendations
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 20);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
    }
};

/**
 * Add movie to favorites
 * @param {Object} movieData - Movie data (tmdbId, title, posterPath, releaseDate, rating)
 * @returns {Promise<Object>} Added favorite
 */
export const addToFavorites = async (movieData) => {
    return apiFetch('/favorites', {
        method: 'POST',
        body: JSON.stringify(movieData),
    });
};

/**
 * Remove movie from favorites
 * @param {string|number} tmdbId - TMDB ID of the movie
 * @returns {Promise<Object>} Success message
 */
export const removeFromFavorites = async (tmdbId) => {
    return apiFetch(`/favorites/${tmdbId}`, {
        method: 'DELETE',
    });
};

/**
 * Check if a movie is in favorites
 * @param {string|number} tmdbId - TMDB ID
 * @returns {Promise<boolean>} True if favorite, false otherwise
 */
export const checkFavoriteStatus = async (tmdbId) => {
    const result = await apiFetch(`/favorites/check/${tmdbId}`);
    return result.isFavorite;
};

/**
 * Star a list
 * @param {string} listId - List ID
 * @returns {Promise<Object>} Success message
 */
export const starList = async (listId) => {
    return apiFetch(`/lists/${listId}/star`, {
        method: 'POST',
    });
};

/**
 * Unstar a list
 * @param {string} listId - List ID
 * @returns {Promise<Object>} Success message
 */
export const unstarList = async (listId) => {
    return apiFetch(`/lists/${listId}/star`, {
        method: 'DELETE',
    });
};

export default {
    setAuthToken,
    getUser,
    getUserStats,
    createUser,
    createList,
    getUserLists,
    getUserFriends,
    getListById,
    deleteList,
    addMovieToList,
    removeMovieFromList,
    testDatabase,
    addToFavorites,
    removeFromFavorites,
    checkFavoriteStatus,
    starList,
    unstarList,
};
