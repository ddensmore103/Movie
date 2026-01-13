// TMDB API Configuration
// Note: API key is stored in .env file for security
// Get your free API key at: https://www.themoviedb.org/settings/api

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Image sizes
export const IMAGE_SIZES = {
  poster: {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
    original: 'original'
  },
  backdrop: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original'
  },
  profile: {
    small: 'w45',
    medium: 'w185',
    large: 'h632',
    original: 'original'
  }
};

// Helper function to build image URL
export const getImageUrl = (path, size = 'medium', type = 'poster') => {
  if (!path) return '/placeholder-movie.jpg';
  const sizeString = IMAGE_SIZES[type][size];
  return `${TMDB_IMAGE_BASE_URL}/${sizeString}${path}`;
};

// Generic fetch function
const fetchFromTMDB = async (endpoint, params = {}) => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', TMDB_API_KEY);

  Object.keys(params).forEach(key => {
    url.searchParams.append(key, params[key]);
  });

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB API Error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    throw error;
  }
};

// API Methods
export const tmdbAPI = {
  // Search movies
  searchMovies: async (query, page = 1) => {
    return fetchFromTMDB('/search/movie', { query, page });
  },

  // Get trending movies
  getTrending: async (timeWindow = 'week', page = 1) => {
    return fetchFromTMDB(`/trending/movie/${timeWindow}`, { page });
  },

  // Get popular movies
  getPopular: async (page = 1) => {
    return fetchFromTMDB('/movie/popular', { page });
  },

  // Get top rated movies
  getTopRated: async (page = 1) => {
    return fetchFromTMDB('/movie/top_rated', { page });
  },

  // Get now playing movies
  getNowPlaying: async (page = 1) => {
    return fetchFromTMDB('/movie/now_playing', { page });
  },

  // Get upcoming movies
  getUpcoming: async (page = 1) => {
    return fetchFromTMDB('/movie/upcoming', { page });
  },

  // Get movie details
  getMovieDetails: async (movieId) => {
    return fetchFromTMDB(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,similar,recommendations'
    });
  },

  // Get movie credits
  getMovieCredits: async (movieId) => {
    return fetchFromTMDB(`/movie/${movieId}/credits`);
  },

  // Discover movies with filters
  discoverMovies: async (filters = {}, page = 1) => {
    return fetchFromTMDB('/discover/movie', { ...filters, page });
  },

  // Get genres
  getGenres: async () => {
    return fetchFromTMDB('/genre/movie/list');
  }
};

// Mock data for development (when API key is not set)
export const mockMovies = [
  {
    id: 1,
    title: 'The Shawshank Redemption',
    poster_path: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    backdrop_path: '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    release_date: '1994-09-23',
    vote_average: 8.7,
    overview: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.'
  },
  {
    id: 2,
    title: 'The Godfather',
    poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    backdrop_path: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    release_date: '1972-03-14',
    vote_average: 8.7,
    overview: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.'
  },
  {
    id: 3,
    title: 'The Dark Knight',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_path: '/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg',
    release_date: '2008-07-16',
    vote_average: 8.5,
    overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.'
  },
  {
    id: 4,
    title: 'Pulp Fiction',
    poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdrop_path: '/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg',
    release_date: '1994-09-10',
    vote_average: 8.5,
    overview: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.'
  },
  {
    id: 5,
    title: 'Inception',
    poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdrop_path: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    release_date: '2010-07-15',
    vote_average: 8.4,
    overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.'
  },
  {
    id: 6,
    title: 'Interstellar',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/xu9zaAevzQ5nnrsXN6JcahLnG4i.jpg',
    release_date: '2014-11-05',
    vote_average: 8.4,
    overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.'
  }
];

export const mockActivity = [
  {
    id: 1,
    user: { name: 'Sarah Chen', avatar: '👩‍🎨' },
    type: 'watched',
    movie: mockMovies[0],
    timestamp: '2 hours ago',
    rating: 5
  },
  {
    id: 2,
    user: { name: 'Mike Johnson', avatar: '👨‍💼' },
    type: 'reviewed',
    movie: mockMovies[2],
    timestamp: '5 hours ago',
    rating: 4.5,
    review: 'An absolute masterpiece! Heath Ledger\'s performance is unforgettable.'
  },
  {
    id: 3,
    user: { name: 'Emma Wilson', avatar: '👩‍🔬' },
    type: 'added_to_list',
    movie: mockMovies[4],
    timestamp: '1 day ago',
    listName: 'Mind-Bending Films'
  },
  {
    id: 4,
    user: { name: 'Alex Rodriguez', avatar: '👨‍🎤' },
    type: 'watched',
    movie: mockMovies[5],
    timestamp: '1 day ago',
    rating: 5
  }
];
