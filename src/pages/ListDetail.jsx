import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getListById, removeMovieFromList, starList, unstarList, starMovieInList, unstarMovieInList } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../services/tmdb';
import AddMovieToListModal from '../components/AddMovieToListModal';
import ManageCollaboratorsModal from '../components/ManageCollaboratorsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import UserAvatar from '../components/UserAvatar';
import './ListDetail.css';

const ListDetail = () => {
    const { listId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [removingMovieId, setRemovingMovieId] = useState(null);
    const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState(false);
    const [isManageCollaboratorsOpen, setIsManageCollaboratorsOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [movieToDelete, setMovieToDelete] = useState(null);
    const [seriesToDelete, setSeriesToDelete] = useState(null);
    const [removingSeries, setRemovingSeries] = useState(false);

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
        setSeriesToDelete(null);
        setIsConfirmModalOpen(true);
    };

    const handleRemoveSeriesClick = (collectionId, movies) => {
        setSeriesToDelete({ collectionId, movies });
        setMovieToDelete(null);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmRemove = async () => {
        if (seriesToDelete) {
            // Remove entire series
            setRemovingSeries(true);
            try {
                for (const movie of seriesToDelete.movies) {
                    await removeMovieFromList(listId, movie.movieId);
                }
                setList({
                    ...list,
                    movies: list.movies.filter(m => m.collectionId !== seriesToDelete.collectionId)
                });
            } catch (err) {
                console.error('Error removing series:', err);
                alert('Failed to remove series. Please try again.');
            } finally {
                setRemovingSeries(false);
                setSeriesToDelete(null);
                setIsConfirmModalOpen(false);
            }
        } else if (movieToDelete) {
            // Remove single movie
            setRemovingMovieId(movieToDelete.movieId);
            try {
                await removeMovieFromList(listId, movieToDelete.movieId);
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

    const handleToggleStar = async () => {
        try {
            if (list.isStarred) {
                // Prevent unstarring Favorites
                if (list.name === 'Favorites') return;
                await unstarList(listId);
                setList({ ...list, isStarred: false });
            } else {
                await starList(listId);
                setList({ ...list, isStarred: true });
            }
        } catch (err) {
            console.error('Error toggling star:', err);
        }
    };

    // Toggle star on a movie within a collaborative list
    const handleToggleMovieStar = async (movie) => {
        const isStarredByMe = (movie.starredBy || []).includes(currentUser?.uid);
        try {
            // Optimistic update
            const updatedStarredBy = isStarredByMe
                ? (movie.starredBy || []).filter(id => id !== currentUser.uid)
                : [...(movie.starredBy || []), currentUser.uid];

            setList(prev => ({
                ...prev,
                movies: prev.movies.map(m =>
                    m.movieId === movie.movieId ? { ...m, starredBy: updatedStarredBy } : m
                ),
            }));

            if (isStarredByMe) {
                await unstarMovieInList(listId, movie.movieId);
            } else {
                await starMovieInList(listId, movie.movieId);
            }
        } catch (err) {
            console.error('Error toggling movie star:', err);
            loadListDetails(); // Revert on error
        }
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

    // ... existing code ...

    // ... existing code ...

    return (
        <div className="list-detail-page">
            <div className="list-detail-header">
                <button
                    className="back-button"
                    onClick={() => {
                        if (location.state?.from === 'profile') {
                            navigate(`/profile/${location.state.userId}`);
                        } else {
                            navigate('/lists');
                        }
                    }}
                >
                    {location.state?.from === 'profile' ? '← Back to Profile' : '← Back to Lists'}
                </button>
                <div className="list-detail-title">
                    <div className="title-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h1>{list.name}</h1>
                            {list.isOwner && (
                                <button
                                    onClick={handleToggleStar}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '1.5rem',
                                        cursor: list.name === 'Favorites' ? 'default' : 'pointer',
                                        opacity: list.name === 'Favorites' ? 1 : 0.8,
                                        transition: 'transform 0.2s',
                                        padding: 0
                                    }}
                                    title={list.isStarred ? (list.name === 'Favorites' ? 'Favorites are always starred' : 'Unstar list') : 'Star list'}
                                    disabled={list.name === 'Favorites'}
                                >
                                    {list.isStarred ? '⭐' : '☆'}
                                </button>
                            )}
                        </div>
                        <div className="header-buttons">
                            {(list.isOwner || list.isCollaborator) && (
                                <button
                                    className="manage-collaborators-btn"
                                    onClick={() => setIsManageCollaboratorsOpen(true)}
                                >
                                    {list.isOwner ? '👥 Manage Collaborators' : '👥 View Collaborators'}
                                </button>
                            )}
                            {(list.isOwner || list.isCollaborator) && (
                                <button className="add-movies-btn" onClick={handleOpenAddMovieModal}>
                                    ➕ Add Movies
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="list-detail-meta">
                        {list.movies?.length || 0} {list.movies?.length === 1 ? 'movie' : 'movies'}
                        {list.name !== 'Favorites' && (
                            <>
                                {' • '}
                                Created {new Date(list.createdAt).toLocaleDateString()}
                            </>
                        )}
                    </p>
                </div>
            </div>

            <div className="list-movies-container">
                {list.movies && list.movies.length > 0 ? (
                    (() => {
                        // Sort all movies: starred first (by star count desc), then by addedAt newest first
                        const isCollabList = list.collaborators?.length > 0;
                        const sortedMovies = [...list.movies].sort((a, b) => {
                            if (isCollabList) {
                                const aStars = (a.starredBy || []).length;
                                const bStars = (b.starredBy || []).length;
                                if (aStars !== bStars) return bStars - aStars;
                            }
                            // Then by addedAt newest first
                            return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
                        });

                        // Group movies: collections together, ungrouped separate
                        const collectionMap = {};
                        const ungrouped = [];
                        sortedMovies.forEach((movie) => {
                            if (movie.collectionId) {
                                if (!collectionMap[movie.collectionId]) {
                                    collectionMap[movie.collectionId] = [];
                                }
                                collectionMap[movie.collectionId].push(movie);
                            } else {
                                ungrouped.push(movie);
                            }
                        });

                        // Sort collection movies by release date
                        Object.values(collectionMap).forEach((movies) => {
                            movies.sort((a, b) => new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0));
                        });

                        // Build render order preserving sorted positions
                        const renderItems = [];
                        const processedCollections = new Set();
                        sortedMovies.forEach((movie) => {
                            if (movie.collectionId) {
                                if (!processedCollections.has(movie.collectionId)) {
                                    processedCollections.add(movie.collectionId);
                                    renderItems.push({
                                        type: 'collection',
                                        collectionId: movie.collectionId,
                                        movies: collectionMap[movie.collectionId],
                                    });
                                }
                            } else {
                                renderItems.push({ type: 'single', movie });
                            }
                        });

                        const renderMovieCard = (movie) => {
                            const isCollabList = list.collaborators?.length > 0;
                            const starCount = (movie.starredBy || []).length;
                            const isStarredByMe = (movie.starredBy || []).includes(currentUser?.uid);
                            return (
                                <div key={movie.movieId} className="movie-card-wrapper">
                                    {movie.addedByUser && list.collaborators?.length > 0 && (
                                        <div className="added-by-bubble" title={`Added by ${movie.addedByUser.username || movie.addedByUser.email || 'Unknown'}`}>
                                            <UserAvatar user={movie.addedByUser} size="small" />
                                            <span className="added-by-tooltip">
                                                Added by {movie.addedByUser.username || movie.addedByUser.email || 'Unknown'}
                                            </span>
                                        </div>
                                    )}
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
                                    {/* Star button for collaborative lists */}
                                    {isCollabList && (list.isOwner || list.isCollaborator) && (
                                        <button
                                            className={`movie-star-btn ${isStarredByMe ? 'starred' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleMovieStar(movie);
                                            }}
                                            title={isStarredByMe ? 'Unstar this movie' : 'Star this movie'}
                                        >
                                            {isStarredByMe ? '★' : '☆'}
                                            {starCount > 0 && <span className="star-count">{starCount}</span>}
                                        </button>
                                    )}
                                    {(list.isOwner || list.isCollaborator) && (
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
                                    )}
                                </div>
                            );
                        };

                        return (
                            <div className="movies-list-container">
                                {renderItems.map((item, idx) => {
                                    if (item.type === 'collection') {
                                        return (
                                            <div key={`col-${item.collectionId}`} className="collection-group">
                                                <div className="collection-group-label">🎬 Series</div>
                                                {(list.isOwner || list.isCollaborator) && (
                                                    <button
                                                        className="remove-series-btn"
                                                        onClick={() => handleRemoveSeriesClick(item.collectionId, item.movies)}
                                                        disabled={removingSeries}
                                                        title="Remove entire series"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                                <div className="movies-grid">
                                                    {item.movies.map(renderMovieCard)}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={item.movie.movieId} className="movies-grid single-movie-row">
                                            {renderMovieCard(item.movie)}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()
                ) : (
                    <div className="empty-list">
                        {(list.isOwner || list.isCollaborator) ? (
                            <>
                                <div className="empty-list-icon" onClick={handleOpenAddMovieModal}>
                                    ➕
                                </div>
                                <h2>No movies yet! Go ahead and add some</h2>
                            </>
                        ) : (
                            <h2>No movies in this list yet</h2>
                        )}
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
                    setSeriesToDelete(null);
                }}
                onConfirm={handleConfirmRemove}
                title={seriesToDelete ? 'Remove Series' : 'Remove Movie'}
                message={seriesToDelete
                    ? `Remove all ${seriesToDelete.movies.length} movies in this series from the list?`
                    : `Remove "${movieToDelete?.title}" from this list?`
                }
                confirmText="Remove"
                confirmStyle="danger"
            />

            {isManageCollaboratorsOpen && (
                <ManageCollaboratorsModal
                    listId={listId}
                    isOwner={list?.isOwner}
                    onClose={() => {
                        setIsManageCollaboratorsOpen(false);
                        loadListDetails(); // Refresh list to show updated collaborators
                    }}
                />
            )}
        </div>
    );
};

export default ListDetail;
