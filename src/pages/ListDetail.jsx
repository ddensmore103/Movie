import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListById, removeMovieFromList } from '../services/api';
import { getImageUrl } from '../services/tmdb';
import AddMovieToListModal from '../components/AddMovieToListModal';
import ConfirmationModal from '../components/ConfirmationModal';
import './ListDetail.css';

const ListDetail = () => {
    const { listId } = useParams();
    const navigate = useNavigate();
    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [removingMovieId, setRemovingMovieId] = useState(null);
    const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [movieToDelete, setMovieToDelete] = useState(null);

    useEffect(() => {
        loadListDetails();
    }, [listId]);

    const loadListDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getListById(listId);
            setList(data);
        } catch (err) {
            console.error('Error loading list:', err);
            setError('Failed to load list. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMovieClick = (movie) => {
        setMovieToDelete(movie);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmRemoveMovie = async () => {
        if (!movieToDelete) return;

        setRemovingMovieId(movieToDelete.movieId);
        try {
            await removeMovieFromList(listId, movieToDelete.movieId);
            // Update local state to remove the movie
            setList({
                ...list,
                movies: list.movies.filter(movie => movie.movieId !== movieToDelete.movieId)
            });
        } catch (err) {
            console.error('Error removing movie:', err);
            alert('Failed to remove movie. Please try again.');
        } finally {
            setRemovingMovieId(null);
            setMovieToDelete(null);
        }
    };

    const handleMovieClick = (tmdbId) => {
        navigate(`/movie/${tmdbId}`);
    };

    const handleOpenAddMovieModal = () => {
        setIsAddMovieModalOpen(true);
    };

    const handleCloseAddMovieModal = () => {
        setIsAddMovieModalOpen(false);
    };

    const handleMovieAdded = () => {
        // Refresh the list to show the newly added movie
        loadListDetails();
    };

    if (loading) {
        return (
            <div className="list-detail-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading list...</p>
                </div>
            </div>
        );
    }

    if (error || !list) {
        return (
            <div className="list-detail-page">
                <div className="error-container">
                    <p className="error-message">{error || 'List not found'}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/lists')}>
                        ← Back to Lists
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="list-detail-page">
            <div className="list-detail-header">
                <button className="back-button" onClick={() => navigate('/lists')}>
                    ← Back to Lists
                </button>
                <div className="list-detail-title">
                    <div className="title-row">
                        <h1>{list.name}</h1>
                        <button className="add-movies-btn" onClick={handleOpenAddMovieModal}>
                            ➕ Add Movies
                        </button>
                    </div>
                    <p className="list-detail-meta">
                        {list.movies?.length || 0} {list.movies?.length === 1 ? 'movie' : 'movies'}
                        {' • '}
                        Created {new Date(list.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="list-movies-container">
                {list.movies && list.movies.length > 0 ? (
                    <div className="movies-grid">
                        {list.movies.map((movie) => (
                            <div key={movie.movieId} className="movie-card-wrapper">
                                <div
                                    className="movie-card"
                                    onClick={() => handleMovieClick(movie.tmdbId)}
                                >
                                    <img
                                        src={getImageUrl(movie.posterPath, 'medium', 'poster')}
                                        alt={movie.title}
                                        className="movie-poster"
                                    />
                                    <div className="movie-info">
                                        <h3 className="movie-title">{movie.title}</h3>
                                        <div className="movie-meta">
                                            {movie.releaseDate && (
                                                <span className="movie-year">
                                                    {new Date(movie.releaseDate).getFullYear()}
                                                </span>
                                            )}
                                            {movie.rating && (
                                                <span className="movie-rating">
                                                    ⭐ {movie.rating.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="remove-movie-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveMovieClick(movie);
                                    }}
                                    disabled={removingMovieId === movie.movieId}
                                    title="Remove from list"
                                >
                                    {removingMovieId === movie.movieId ? '⏳' : '✕'}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-list">
                        <div className="empty-list-icon" onClick={handleOpenAddMovieModal}>
                            ➕
                        </div>
                        <h2>No movies yet! Go ahead and add some</h2>
                    </div>
                )}
            </div>

            {/* Add Movie Modal */}
            <AddMovieToListModal
                isOpen={isAddMovieModalOpen}
                onClose={handleCloseAddMovieModal}
                listId={listId}
                listName={list?.name}
                onMovieAdded={handleMovieAdded}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setMovieToDelete(null);
                }}
                onConfirm={handleConfirmRemoveMovie}
                title="Remove Movie"
                message={`Remove "${movieToDelete?.title}" from this list?`}
                confirmText="Remove"
                confirmStyle="danger"
            />
        </div>
    );
};

export default ListDetail;
