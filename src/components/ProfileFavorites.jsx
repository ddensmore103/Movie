import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../services/tmdb';
import MoviePickerModal from './MoviePickerModal';
import './ProfileFavorites.css';

const ProfileFavorites = ({ user, isOwnProfile, onUpdate }) => {
    const navigate = useNavigate();
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState(null);

    // Ensure we always have an array of 5 items (filled or null)
    const favorites = Array(5).fill(null).map((_, i) =>
        (user?.topFavorites && user.topFavorites[i]) || null
    );

    const handleAddClick = (index) => {
        setActiveSlot(index);
        setIsPickerOpen(true);
    };

    const handleRemoveClick = (index, e) => {
        e.stopPropagation();
        const newFavorites = [...(user?.topFavorites || [])];
        // Filter out the movie at the specific index (or rather, the movie that matches the one in that slot)
        // But since we just store a list, we need to be careful. 
        // Strategy: The profile stores an array. We are displaying 4 items max.
        // If we remove item at index 1, the array shrinks. 
        // But the UI shows slots. 
        // Let's assume the backend array is just the list of movies.
        // So removal means removing that item from the array.

        newFavorites.splice(index, 1);
        onUpdate(newFavorites);
    };

    const handleMovieSelect = (movie) => {
        const newFavorites = [...(user?.topFavorites || [])];

        const movieData = {
            tmdbId: movie.id,
            title: movie.title,
            posterPath: movie.poster_path,
            releaseDate: movie.release_date
        };

        // If activeSlot is beyond the current array length, just push
        // If it's replacing an existing one, splice
        if (activeSlot < newFavorites.length) {
            newFavorites[activeSlot] = movieData;
        } else {
            newFavorites.push(movieData);
        }

        onUpdate(newFavorites);
        setIsPickerOpen(false);
    };

    return (
        <div className="profile-favorites">
            <h3 className="favorites-heading">Top Favorites</h3>
            <div className="favorites-grid">
                {favorites.map((movie, index) => (
                    <div key={index} className="favorite-slot">
                        {movie ? (
                            <div
                                className="favorite-card"
                                onClick={() => navigate(`/movie/${movie.tmdbId}`)}
                            >
                                <img
                                    src={getImageUrl(movie.posterPath, 'medium', 'poster')}
                                    alt={movie.title}
                                    className="favorite-poster"
                                />
                                {isOwnProfile && (
                                    <button
                                        className="remove-favorite-btn"
                                        onClick={(e) => handleRemoveClick(index, e)}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="empty-slot">
                                {isOwnProfile ? (
                                    <button
                                        className="add-favorite-btn"
                                        onClick={() => handleAddClick(index)}
                                    >
                                        +
                                    </button>
                                ) : (
                                    <div className="empty-slot-placeholder" />
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <MoviePickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={handleMovieSelect}
            />
        </div>
    );
};

export default ProfileFavorites;
