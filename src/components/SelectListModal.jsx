import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserLists, addMovieToList, createList } from '../services/api';
import CreateListModal from './CreateListModal';
import './SelectListModal.css';

const SelectListModal = ({ isOpen, onClose, movie, onSuccess, allowMultiple = false }) => {
    const { currentUser } = useAuth();
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedListIds, setSelectedListIds] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Fetch user's lists when modal opens
    useEffect(() => {
        if (isOpen && currentUser) {
            fetchLists();
            setSelectedListIds([]); // Reset selection when modal opens
        } else {
            // Reset state when modal closes
            setError(null);
            setSuccess(null);
            setSelectedListIds([]);
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
            const userLists = await getUserLists(currentUser.uid);
            setLists(userLists);
        } catch (err) {
            console.error('Error fetching lists:', err);
            setError('Failed to load lists. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleListSelection = (listId) => {
        if (!allowMultiple) {
            // Single selection mode - add immediately
            const list = lists.find(l => l.listId === listId);
            handleAddToSingleList(list);
        } else {
            // Multi-selection mode - toggle selection
            setSelectedListIds(prev =>
                prev.includes(listId)
                    ? prev.filter(id => id !== listId)
                    : [...prev, listId]
            );
        }
    };

    const handleAddToSingleList = async (list) => {
        setIsAdding(true);
        setError(null);
        setSuccess(null);

        try {
            const movieData = {
                tmdbId: movie.id,
                title: movie.title,
                posterPath: movie.poster_path,
                releaseDate: movie.release_date,
                rating: movie.vote_average,
            };

            await addMovieToList(list.listId, movieData);
            setSuccess(`Added "${movie.title}" to "${list.name}"`);

            // Call success callback if provided
            if (onSuccess) {
                onSuccess(list);
            }

            // Close modal after a brief delay
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Error adding movie to list:', err);
            setError(err.message || 'Failed to add movie. It may already be in this list.');
        } finally {
            setIsAdding(false);
        }
    };

    const handleAddToSelectedLists = async () => {
        if (selectedListIds.length === 0) {
            setError('Please select at least one list');
            return;
        }

        setIsAdding(true);
        setError(null);
        setSuccess(null);

        try {
            const movieData = {
                tmdbId: movie.id,
                title: movie.title,
                posterPath: movie.poster_path,
                releaseDate: movie.release_date,
                rating: movie.vote_average,
            };

            // Add to all selected lists
            const results = await Promise.allSettled(
                selectedListIds.map(listId => addMovieToList(listId, movieData))
            );

            // Count successes and failures
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (successful > 0) {
                const listNames = selectedListIds
                    .slice(0, 2)
                    .map(id => lists.find(l => l.listId === id)?.name)
                    .filter(Boolean);

                const message = selectedListIds.length === 1
                    ? `Added to "${listNames[0]}"`
                    : selectedListIds.length === 2
                        ? `Added to "${listNames[0]}" and "${listNames[1]}"`
                        : `Added to ${successful} lists`;

                setSuccess(message);

                // Call success callback if provided
                if (onSuccess) {
                    onSuccess(selectedListIds);
                }

                // Close modal after a brief delay
                setTimeout(() => {
                    onClose();
                }, 1500);
            }

            if (failed > 0) {
                setError(`${failed} list(s) failed (movie may already be in those lists)`);
            }
        } catch (err) {
            console.error('Error adding movie to lists:', err);
            setError('Failed to add movie to lists. Please try again.');
        } finally {
            setIsAdding(false);
        }
    };

    const handleCreateList = async (listName) => {
        setIsCreating(true);
        setError(null);
        try {
            const newList = await createList({ name: listName });

            // Refresh the lists
            await fetchLists();

            setShowCreateModal(false);

            if (allowMultiple) {
                // In multi-select mode, add the new list to selection
                setSelectedListIds(prev => [...prev, newList.listId]);
                setSuccess(`Created "${listName}". Select lists and click "Add to Selected Lists".`);
            } else {
                // In single-select mode, add the movie to the new list immediately
                const movieData = {
                    tmdbId: movie.id,
                    title: movie.title,
                    posterPath: movie.poster_path,
                    releaseDate: movie.release_date,
                    rating: movie.vote_average,
                };

                await addMovieToList(newList.listId, movieData);
                setSuccess(`Created "${listName}" and added "${movie.title}"`);

                // Call success callback if provided
                if (onSuccess) {
                    onSuccess(newList);
                }

                // Close modal after a brief delay
                setTimeout(() => {
                    onClose();
                }, 1500);
            }
        } catch (err) {
            console.error('Error creating list:', err);
            setError('Failed to create list. Please try again.');
        } finally {
            setIsCreating(false);
        }
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

                        {error && (
                            <div className="modal-error">{error}</div>
                        )}

                        {success && (
                            <div className="modal-success">{success}</div>
                        )}

                        {loading ? (
                            <div className="modal-loading">Loading your lists...</div>
                        ) : lists.length > 0 ? (
                            <div className="lists-container">
                                <h3 className="lists-heading">
                                    {allowMultiple ? 'Select Lists' : 'Your Lists'}
                                </h3>
                                <div className="lists-scroll">
                                    {lists.map((list) => (
                                        <div
                                            key={list.listId}
                                            className={`list-item ${selectedListIds.includes(list.listId) ? 'selected' : ''} ${isAdding ? 'disabled' : ''}`}
                                            onClick={() => !isAdding && toggleListSelection(list.listId)}
                                        >
                                            {allowMultiple && (
                                                <div className="list-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedListIds.includes(list.listId)}
                                                        onChange={() => { }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            )}
                                            <div className="list-item-icon">{list.emoji || '📋'}</div>
                                            <div className="list-item-info">
                                                <div className="list-item-name">{list.name}</div>
                                                <div className="list-item-count">
                                                    {list.movies?.length || 0} movies
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {allowMultiple && (
                                    <button
                                        className="btn btn-primary add-selected-btn"
                                        onClick={handleAddToSelectedLists}
                                        disabled={isAdding || selectedListIds.length === 0}
                                    >
                                        {isAdding
                                            ? 'Adding...'
                                            : selectedListIds.length === 0
                                                ? 'Select Lists to Add'
                                                : `Add to ${selectedListIds.length} List${selectedListIds.length > 1 ? 's' : ''}`
                                        }
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="modal-empty">
                                <p>You don't have any lists yet.</p>
                                <p>Create your first list to get started!</p>
                            </div>
                        )}
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
