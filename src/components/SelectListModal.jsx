import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserLists, addMovieToList, removeMovieFromList, createList, getCollaboratingLists } from '../services/api';
import { tmdbAPI, getImageUrl } from '../services/tmdb';
import CreateListModal from './CreateListModal';
import './SelectListModal.css';

const SelectListModal = ({ isOpen, onClose, movie, onSuccess, allowMultiple = false }) => {
    const { currentUser } = useAuth();
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedListIds, setSelectedListIds] = useState([]);
    const [initiallyChecked, setInitiallyChecked] = useState([]); // lists movie is already in
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Series prompt state
    const [seriesPrompt, setSeriesPrompt] = useState(null);
    const [addingSeries, setAddingSeries] = useState(false);

    // Movie details (for series detection when movie prop lacks belongs_to_collection)
    const [movieDetails, setMovieDetails] = useState(null);

    // Fetch user's lists when modal opens
    useEffect(() => {
        if (isOpen && currentUser) {
            fetchLists();
            setSeriesPrompt(null);
            setMovieDetails(null);
            setSuccess(null);
            setError(null);

            // Fetch full movie details if we don't have belongs_to_collection
            if (movie && !movie.belongs_to_collection && movie.id) {
                tmdbAPI.getMovieDetails(movie.id).then(details => {
                    setMovieDetails(details);
                }).catch(() => { });
            } else if (movie?.belongs_to_collection) {
                setMovieDetails(movie);
            }
        } else {
            setError(null);
            setSuccess(null);
            setSelectedListIds([]);
            setInitiallyChecked([]);
            setSeriesPrompt(null);
            setMovieDetails(null);
        }
    }, [isOpen, currentUser]);

    const fetchLists = async () => {
        if (!currentUser?.uid) {
            setError('User not authenticated');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const [userLists, collabLists] = await Promise.all([
                getUserLists(currentUser.uid),
                getCollaboratingLists()
            ]);
            const allLists = [...userLists, ...collabLists];
            setLists(allLists);

            // Find which lists already contain this movie
            if (movie) {
                const movieTmdbId = String(movie.id);
                const alreadyIn = allLists
                    .filter(list => list.movies?.some(m => String(m.tmdbId) === movieTmdbId))
                    .map(list => list.listId);
                setSelectedListIds(alreadyIn);
                setInitiallyChecked(alreadyIn);
            } else {
                setSelectedListIds([]);
                setInitiallyChecked([]);
            }
        } catch (err) {
            console.error('Error fetching lists:', err);
            setError('Failed to load lists. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getEffectiveMovie = () => movieDetails || movie;

    const toggleListSelection = (listId) => {
        if (!allowMultiple) {
            // Single mode: if already in list, do nothing
            if (initiallyChecked.includes(listId)) return;
            const list = lists.find(l => l.listId === listId);
            handleAddToSingleList(list);
        } else {
            // Multi mode: toggle selection
            setSelectedListIds(prev =>
                prev.includes(listId)
                    ? prev.filter(id => id !== listId)
                    : [...prev, listId]
            );
        }
    };

    // Check if movie belongs to a collection and show series prompt
    const checkForSeries = async (targetListIds, addFn) => {
        const effectiveMovie = getEffectiveMovie();
        if (effectiveMovie?.belongs_to_collection) {
            try {
                const collection = effectiveMovie.belongs_to_collection;
                const collectionDetails = await tmdbAPI.getCollection(collection.id);
                const sortedParts = (collectionDetails.parts || [])
                    .filter(p => p.release_date)
                    .sort((a, b) => new Date(a.release_date) - new Date(b.release_date));

                if (sortedParts.length > 1) {
                    setSeriesPrompt({
                        collection: collectionDetails,
                        movies: sortedParts,
                        targetListIds,
                        addFn,
                    });
                    return true;
                }
            } catch (err) {
                console.error('Error fetching collection:', err);
            }
        }
        return false;
    };

    const addMovieData = async (listId, movieObj, collectionId = null) => {
        const movieData = {
            tmdbId: movieObj.id,
            title: movieObj.title,
            posterPath: movieObj.poster_path,
            releaseDate: movieObj.release_date,
            rating: movieObj.vote_average,
            collectionId: collectionId,
        };
        await addMovieToList(listId, movieData);
    };

    const handleAddToSingleList = async (list) => {
        setIsAdding(true);
        setError(null);
        setSuccess(null);

        try {
            const hasSeries = await checkForSeries([list.listId], async (listIds, includeAllMovies, collectionData) => {
                await performAdd(listIds, includeAllMovies, collectionData);
            });

            if (hasSeries) {
                setIsAdding(false);
                return;
            }

            await addMovieData(list.listId, movie);
            setSuccess(`Added "${movie.title}" to "${list.name}"`);
            if (onSuccess) onSuccess(list);
            setTimeout(() => onClose(), 1500);
        } catch (err) {
            console.error('Error adding movie to list:', err);
            setError(err.message || 'Failed to add movie. It may already be in this list.');
        } finally {
            setIsAdding(false);
        }
    };

    const handleAddToSelectedLists = async () => {
        // Determine which lists to add to and which to remove from
        const listsToAdd = selectedListIds.filter(id => !initiallyChecked.includes(id));
        const listsToRemove = initiallyChecked.filter(id => !selectedListIds.includes(id));

        if (listsToAdd.length === 0 && listsToRemove.length === 0) {
            onClose();
            return;
        }

        setIsAdding(true);
        setError(null);
        setSuccess(null);

        try {
            // Handle removals first
            if (listsToRemove.length > 0) {
                const movieTmdbId = String(movie.id);
                for (const listId of listsToRemove) {
                    const list = lists.find(l => l.listId === listId);
                    const movieEntry = list?.movies?.find(m => String(m.tmdbId) === movieTmdbId);
                    if (movieEntry) {
                        await removeMovieFromList(listId, movieEntry.movieId);
                    }
                }
            }

            // Handle additions
            if (listsToAdd.length > 0) {
                const hasSeries = await checkForSeries(listsToAdd, async (listIds, includeAllMovies, collectionData) => {
                    // Also handle any removals before the series add
                    await performAdd(listIds, includeAllMovies, collectionData, listsToRemove.length);
                });

                if (hasSeries) {
                    setIsAdding(false);
                    return;
                }

                await performAddSingle(listsToAdd, listsToRemove.length);
            } else {
                // Only removals
                setSuccess(`Removed from ${listsToRemove.length} list${listsToRemove.length > 1 ? 's' : ''}`);
                if (onSuccess) onSuccess(selectedListIds);
                setTimeout(() => onClose(), 1500);
            }
        } catch (err) {
            console.error('Error updating lists:', err);
            setError('Failed to update lists. Please try again.');
        } finally {
            setIsAdding(false);
        }
    };

    const performAddSingle = async (listIds, removeCount = 0) => {
        const results = await Promise.allSettled(
            listIds.map(listId => addMovieData(listId, movie))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        let message = '';
        if (successful > 0) {
            const listNames = listIds.slice(0, 2).map(id => lists.find(l => l.listId === id)?.name).filter(Boolean);
            message = listIds.length === 1
                ? `Added to "${listNames[0]}"`
                : listIds.length === 2
                    ? `Added to "${listNames[0]}" and "${listNames[1]}"`
                    : `Added to ${successful} list${successful > 1 ? 's' : ''}`;
        }
        if (removeCount > 0) {
            message += (message ? '. ' : '') + `Removed from ${removeCount} list${removeCount > 1 ? 's' : ''}`;
        }

        if (message) setSuccess(message);
        if (onSuccess) onSuccess(listIds);
        setTimeout(() => onClose(), 1500);

        if (failed > 0) {
            setError(`${failed} list(s) failed (movie may already be in those lists)`);
        }
    };

    const performAdd = async (listIds, includeAllMovies, collectionData, removeCount = 0) => {
        setAddingSeries(true);
        setError(null);
        try {
            if (includeAllMovies && collectionData) {
                for (const listId of listIds) {
                    for (const seriesMovie of collectionData.movies) {
                        try {
                            await addMovieData(listId, seriesMovie, collectionData.collection.id);
                        } catch (err) {
                            console.error(`Error adding "${seriesMovie.title}":`, err);
                        }
                    }
                }
                let msg = `Added ${collectionData.movies.length} movies from "${collectionData.collection.name}"`;
                if (removeCount > 0) msg += `. Removed from ${removeCount} list${removeCount > 1 ? 's' : ''}`;
                setSuccess(msg);
            } else {
                await Promise.allSettled(
                    listIds.map(listId => addMovieData(listId, movie))
                );
                let msg = `Added "${movie.title}"`;
                if (removeCount > 0) msg += `. Removed from ${removeCount} list${removeCount > 1 ? 's' : ''}`;
                setSuccess(msg);
            }

            if (onSuccess) onSuccess(listIds);
            setTimeout(() => onClose(), 1500);
        } catch (err) {
            console.error('Error adding movies:', err);
            setError('Failed to add movies. Please try again.');
        } finally {
            setAddingSeries(false);
            setSeriesPrompt(null);
        }
    };

    const handleSeriesAddAll = () => {
        if (!seriesPrompt) return;
        seriesPrompt.addFn(seriesPrompt.targetListIds, true, {
            collection: seriesPrompt.collection,
            movies: seriesPrompt.movies,
        });
    };

    const handleSeriesAddOne = () => {
        if (!seriesPrompt) return;
        seriesPrompt.addFn(seriesPrompt.targetListIds, false, null);
    };

    const handleCreateList = async (listName) => {
        setIsCreating(true);
        setError(null);
        try {
            const newList = await createList({ name: listName });
            await fetchLists();
            setShowCreateModal(false);

            if (allowMultiple) {
                setSelectedListIds(prev => [...prev, newList.listId]);
                setSuccess(`Created "${listName}". Select it and click "Save Changes".`);
            } else {
                const hasSeries = await checkForSeries([newList.listId], async (listIds, includeAllMovies, collectionData) => {
                    await performAdd(listIds, includeAllMovies, collectionData);
                });

                if (!hasSeries) {
                    await addMovieData(newList.listId, movie);
                    setSuccess(`Created "${listName}" and added "${movie.title}"`);
                    if (onSuccess) onSuccess(newList);
                    setTimeout(() => onClose(), 1500);
                }
            }
        } catch (err) {
            console.error('Error creating list:', err);
            setError('Failed to create list. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    // Check if movie is in ALL lists
    const isInAllLists = !loading && lists.length > 0 && initiallyChecked.length === lists.length;

    // Check if selection changed from initial state
    const hasChanges = allowMultiple && (
        selectedListIds.some(id => !initiallyChecked.includes(id)) ||
        initiallyChecked.some(id => !selectedListIds.includes(id))
    );

    // Build button label
    const getButtonLabel = () => {
        if (isAdding) return 'Saving...';
        const adds = selectedListIds.filter(id => !initiallyChecked.includes(id)).length;
        const removes = initiallyChecked.filter(id => !selectedListIds.includes(id)).length;
        const parts = [];
        if (adds > 0) parts.push(`Add to ${adds}`);
        if (removes > 0) parts.push(`Remove from ${removes}`);
        if (parts.length === 0) return 'No Changes';
        return parts.join(', ');
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content select-list-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Add to List</h2>
                        <button className="modal-close" onClick={onClose}>✕</button>
                    </div>

                    <div className="modal-body">
                        {/* Series prompt */}
                        {seriesPrompt ? (
                            <div className="series-prompt">
                                <div className="series-prompt-header">
                                    <span className="series-icon">🎬</span>
                                    <h3>Part of a Series!</h3>
                                </div>
                                <p className="series-name">{seriesPrompt.collection.name}</p>
                                <p className="series-count">{seriesPrompt.movies.length} movies in this series</p>
                                <div className="series-movies-preview">
                                    {seriesPrompt.movies.map((m) => (
                                        <div key={m.id} className="series-movie-thumb">
                                            <img
                                                src={getImageUrl(m.poster_path, 'small', 'poster')}
                                                alt={m.title}
                                            />
                                            <span className="series-movie-year">
                                                {m.release_date ? new Date(m.release_date).getFullYear() : '?'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="series-prompt-actions">
                                    <button
                                        className="btn btn-series-all"
                                        onClick={handleSeriesAddAll}
                                        disabled={addingSeries}
                                    >
                                        {addingSeries ? '⏳ Adding...' : `🎬 Add All ${seriesPrompt.movies.length} Movies`}
                                    </button>
                                    <button
                                        className="btn btn-series-one"
                                        onClick={handleSeriesAddOne}
                                        disabled={addingSeries}
                                    >
                                        Add Just "{movie.title}"
                                    </button>
                                    <button
                                        className="btn btn-series-cancel"
                                        onClick={() => setSeriesPrompt(null)}
                                        disabled={addingSeries}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {movie && (
                                    <div className="selected-movie-info">
                                        <span className="movie-emoji">🎬</span>
                                        <span className="movie-title-small">{movie.title}</span>
                                    </div>
                                )}

                                <button
                                    className="btn btn-primary create-list-btn"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    + Create New List
                                </button>

                                {error && <div className="modal-error">{error}</div>}
                                {success && <div className="modal-success">{success}</div>}

                                {isInAllLists && !allowMultiple && (
                                    <div className="modal-success">✅ This movie is already in all your lists!</div>
                                )}

                                {loading ? (
                                    <div className="modal-loading">Loading your lists...</div>
                                ) : lists.length > 0 ? (
                                    <div className="lists-container">
                                        <h3 className="lists-heading">
                                            {allowMultiple ? 'Select Lists' : 'Your Lists'}
                                        </h3>
                                        <div className="lists-scroll">
                                            {lists.map((list) => {
                                                const isChecked = selectedListIds.includes(list.listId);
                                                const wasInitiallyIn = initiallyChecked.includes(list.listId);
                                                return (
                                                    <div
                                                        key={list.listId}
                                                        className={`list-item ${isChecked ? 'selected' : ''} ${isAdding ? 'disabled' : ''} ${!allowMultiple && wasInitiallyIn ? 'already-in' : ''}`}
                                                        onClick={() => !isAdding && toggleListSelection(list.listId)}
                                                    >
                                                        {allowMultiple && (
                                                            <div className="list-checkbox">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => toggleListSelection(list.listId)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    disabled={isAdding}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="list-item-icon">{list.emoji || '📋'}</div>
                                                        <div className="list-item-info">
                                                            <div className="list-item-name">
                                                                {list.name}
                                                                {list.isCollaborative && <span className="collab-badge"> 👥</span>}
                                                            </div>
                                                            <div className="list-item-count">
                                                                {list.movies?.length || 0} movies
                                                                {!allowMultiple && wasInitiallyIn && (
                                                                    <span className="already-in-badge"> ✓ Already added</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {allowMultiple && (
                                            <button
                                                className="btn btn-primary add-selected-btn"
                                                onClick={handleAddToSelectedLists}
                                                disabled={isAdding || !hasChanges}
                                            >
                                                {getButtonLabel()}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="modal-empty">
                                        <p>You don't have any lists yet.</p>
                                        <p>Create your first list to get started!</p>
                                    </div>
                                )}
                            </>
                        )}

                        {seriesPrompt && success && <div className="modal-success">{success}</div>}
                        {seriesPrompt && error && <div className="modal-error">{error}</div>}
                    </div>
                </div>
            </div>

            <CreateListModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateList}
                isCreating={isCreating}
            />
        </>
    );
};

export default SelectListModal;
