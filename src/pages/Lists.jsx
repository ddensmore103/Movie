import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserLists, createList, deleteList, getCollaboratingLists, starList, unstarList } from '../services/api';
import { getImageUrl } from '../services/tmdb';
import CreateListModal from '../components/CreateListModal';
import AddMovieToListModal from '../components/AddMovieToListModal';
import ConfirmationModal from '../components/ConfirmationModal';
import './Lists.css';

const Lists = () => {
    const navigate = useNavigate();
    const { currentUser, idToken, loading: authLoading } = useAuth();
    const [userLists, setUserLists] = useState([]);
    const [collaboratingLists, setCollaboratingLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState(false);
    const [selectedList, setSelectedList] = useState(null);
    const [deletingListId, setDeletingListId] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [listToDelete, setListToDelete] = useState(null);

    useEffect(() => {
        loadUserLists();
    }, [currentUser, idToken, authLoading]);

    const loadUserLists = async () => {
        // Wait for auth to finish loading before attempting to fetch
        if (authLoading) {
            return;
        }

        if (!currentUser || !idToken) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Fetch both owned lists and collaborating lists in parallel
            const [ownedLists, collabLists] = await Promise.all([
                getUserLists(currentUser.uid),
                getCollaboratingLists()
            ]);

            // Sort: Favorites first, then StarredByDate (oldest first), then CreatedByDate (oldest first)
            const sortedLists = ownedLists.sort((a, b) => {
                // 1. Favorites always first
                if (a.name === 'Favorites') return -1;
                if (b.name === 'Favorites') return 1;

                // 2. Starred vs Unstarred
                if (a.isStarred !== b.isStarred) {
                    return a.isStarred ? -1 : 1;
                }

                // 3. Both Starred: Sort by starredAt ascending (oldest first)
                if (a.isStarred) {
                    return new Date(a.starredAt || a.createdAt) - new Date(b.starredAt || b.createdAt);
                }

                // 4. Both Unstarred: Sort by createdAt ascending (oldest first)
                return new Date(a.createdAt) - new Date(b.createdAt);
            });

            setUserLists(sortedLists);
            setCollaboratingLists(collabLists);
        } catch (err) {
            console.error('Error loading lists:', err);
            setError('Failed to load lists. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateList = async (listName) => {
        setIsCreating(true);
        try {
            const newList = await createList({ name: listName });
            setUserLists([...userLists, newList]);
            setIsCreateModalOpen(false);
        } catch (err) {
            console.error('Error creating list:', err);
            alert('Failed to create list. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteListClick = (list, e) => {
        e.stopPropagation();
        setListToDelete(list);
        setIsConfirmModalOpen(true);
    };

    const handleToggleStar = async (list, e) => {
        e.stopPropagation();
        if (list.name === 'Favorites') return;

        try {
            if (list.isStarred) {
                await unstarList(list.listId);
                // Update local state
                setUserLists(prev => prev.map(l =>
                    l.listId === list.listId ? { ...l, isStarred: false, starredAt: null } : l
                ));
            } else {
                await starList(list.listId);
                // Update local state
                setUserLists(prev => prev.map(l =>
                    l.listId === list.listId ? { ...l, isStarred: true, starredAt: new Date().toISOString() } : l
                ));
            }
            // Re-sort handled by subsequent render if we mutate, but simpler to just reload or let effect handle specific sort if we want instant jump.
            // For now, let's just update property. The sort might not auto-trigger unless we shallow copy.
            // Actually, we are mapping to new array, so state update will trigger re-render.
            // However, `userLists` is sorted in `loadUserLists`. We might want to re-sort here too.
            // Let's rely on standard state update re-render, but we need to re-apply sort logic if we want them to jump instantly.
            // For simplicity in this step, I'll just update state.
            loadUserLists(); // Reload to get proper sort
        } catch (err) {
            console.error('Error toggling star:', err);
        }
    };

    const handleConfirmDelete = async () => {
        if (!listToDelete) return;

        setDeletingListId(listToDelete.listId);
        try {
            await deleteList(listToDelete.listId);
            setUserLists(userLists.filter(list => list.listId !== listToDelete.listId));
        } catch (err) {
            console.error('Error deleting list:', err);
            alert('Failed to delete list. Please try again.');
        } finally {
            setDeletingListId(null);
            setListToDelete(null);
        }
    };

    const handleOpenAddMovieModal = (list, e) => {
        e.stopPropagation(); // Prevent navigation to list detail
        setSelectedList(list);
        setIsAddMovieModalOpen(true);
    };

    const handleListClick = (listId) => {
        navigate(`/lists/${listId}`);
    };

    return (
        <div className="lists-page">
            <div className="page-header">
                <h1 className="page-title">My Lists</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <span>➕</span>
                    <span>Create New List</span>
                </button>
            </div>

            <div className="lists-content">
                <section className="lists-section">
                    <h2 className="section-title">Your Lists</h2>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            Loading your lists...
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
                            {error}
                        </div>
                    ) : userLists.length > 0 ? (
                        <div className="lists-grid">
                            {userLists.map((list) => (
                                <div
                                    key={list.listId}
                                    className="list-card"
                                    onClick={() => handleListClick(list.listId)}
                                >
                                    <div className="list-card-header">
                                        <div className="list-actions" style={{ width: '100%' }}>
                                            <button
                                                className="list-action-btn add-btn"
                                                onClick={(e) => handleOpenAddMovieModal(list, e)}
                                                title="Add movies"
                                            >
                                                ➕
                                            </button>

                                            {list.name !== 'Favorites' && (
                                                <button
                                                    className="list-action-btn star-btn"
                                                    onClick={(e) => handleToggleStar(list, e)}
                                                    title={list.isStarred ? "Unstar list" : "Star list"}
                                                    style={{
                                                        marginLeft: '4px',
                                                        color: list.isStarred ? 'gold' : 'white', // Gold for starred, White for unstarred
                                                        fontSize: '1.2rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        paddingBottom: '2px'
                                                    }}
                                                >
                                                    {list.isStarred ? '⭐' : '☆'}
                                                </button>
                                            )}

                                            <button
                                                className="list-action-btn delete-btn"
                                                onClick={(e) => handleDeleteListClick(list, e)}
                                                disabled={deletingListId === list.listId}
                                                title="Delete list"
                                                style={{ marginLeft: 'auto' }}
                                            >
                                                {deletingListId === list.listId ? '⏳' : '🗑️'}
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="list-name">
                                        {list.name}
                                    </h3>
                                    <p className="list-count">
                                        {list.movies?.length || 0} {list.movies?.length === 1 ? 'movie' : 'movies'}
                                    </p>

                                    {/* Movie Posters Preview */}
                                    {list.movies && list.movies.length > 0 && (
                                        <div className="list-posters-preview">
                                            {list.movies.slice(0, 4).map((movie) => (
                                                <div key={movie.movieId} className="poster-thumbnail">
                                                    <img
                                                        src={getImageUrl(movie.posterPath, 'small', 'poster')}
                                                        alt={movie.title}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {list.name !== 'Favorites' && (
                                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '8px' }}>
                                            Created {new Date(list.createdAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            No lists yet. Create your first list!
                        </div>
                    )}
                </section>

                {/* Collaborating Lists Section */}
                {collaboratingLists.length > 0 && (
                    <section className="lists-section">
                        <h2 className="section-title">🤝 Collaborating</h2>
                        <div className="lists-grid">
                            {collaboratingLists.map((list) => (
                                <div
                                    key={list.listId}
                                    className="list-card collaborative"
                                    onClick={() => handleListClick(list.listId)}
                                >
                                    <div className="list-card-header">
                                        <div className="list-actions" style={{ width: '100%' }}>
                                            <button
                                                className="list-action-btn add-btn"
                                                onClick={(e) => handleOpenAddMovieModal(list, e)}
                                                title="Add movies"
                                            >
                                                ➕
                                            </button>

                                            <button
                                                className="list-action-btn star-btn"
                                                onClick={(e) => handleToggleStar(list, e)}
                                                title={list.isStarred ? "Unstar list" : "Star list"}
                                                style={{
                                                    marginLeft: '4px',
                                                    color: list.isStarred ? 'gold' : 'white', // Gold for starred, White for unstarred
                                                    fontSize: '1.2rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    paddingBottom: '2px'
                                                }}
                                            >
                                                {list.isStarred ? '⭐' : '☆'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="list-badge collaborating-badge">Collaborating</div>
                                    <h3 className="list-name">{list.name}</h3>
                                    <p className="list-count">
                                        {list.movies?.length || 0} {list.movies?.length === 1 ? 'movie' : 'movies'}
                                    </p>

                                    {/* Movie Posters Preview */}
                                    {list.movies && list.movies.length > 0 && (
                                        <div className="list-posters-preview">
                                            {list.movies.slice(0, 4).map((movie) => (
                                                <div key={movie.movieId} className="poster-thumbnail">
                                                    <img
                                                        src={getImageUrl(movie.posterPath, 'small', 'poster')}
                                                        alt={movie.title}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '8px' }}>
                                        Created {new Date(list.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <CreateListModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateList}
                isCreating={isCreating}
            />

            {selectedList && (
                <AddMovieToListModal
                    isOpen={isAddMovieModalOpen}
                    onClose={() => {
                        setIsAddMovieModalOpen(false);
                        setSelectedList(null);
                    }}
                    listId={selectedList.listId}
                    listName={selectedList.name}
                    onMovieAdded={() => {
                        // Optionally refresh the list count here
                        loadUserLists();
                    }}
                />
            )}

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setListToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Delete List"
                message={`Are you sure you want to delete "${listToDelete?.name}"? This will remove all movies from the list.`}
                confirmText="Delete"
                confirmStyle="danger"
            />
        </div>
    );
};

export default Lists;

