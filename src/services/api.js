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

export default {
    setAuthToken,
    getUser,
    createUser,
    createList,
    getUserLists,
    testDatabase,
};
