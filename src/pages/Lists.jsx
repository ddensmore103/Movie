import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserLists, createList } from '../services/api';
import CreateListModal from '../components/CreateListModal';
import './Lists.css';

const Lists = () => {
    const { currentUser } = useAuth();
    const [userLists, setUserLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock collaborative lists (backend integration pending)
    const collaborativeLists = [
        { id: 5, name: 'Best Sci-Fi Ever', count: 45, members: 8, emoji: '🚀' },
        { id: 6, name: 'Horror Classics', count: 28, members: 5, emoji: '👻' }
    ];

    useEffect(() => {
        loadUserLists();
    }, [currentUser]);

    const loadUserLists = async () => {
        if (!currentUser) return;

        setLoading(true);
        setError(null);
        try {
            const lists = await getUserLists(currentUser.uid);
            setUserLists(lists);
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
            setIsModalOpen(false);
            // Success notification could be added here if desired
        } catch (err) {
            console.error('Error creating list:', err);
            alert('Failed to create list. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="lists-page">
            <div className="page-header">
                <h1 className="page-title">My Lists</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setIsModalOpen(true)}
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
                                <div key={list.listId} className="list-card">
                                    <div className="list-emoji">📋</div>
                                    <h3 className="list-name">{list.name}</h3>
                                    <p className="list-count">0 movies</p>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '8px' }}>
                                        Created {new Date(list.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            No lists yet. Create your first list!
                        </div>
                    )}
                </section>

                <section className="lists-section">
                    <h2 className="section-title">Collaborative Lists</h2>
                    <div className="lists-grid">
                        {collaborativeLists.map((list) => (
                            <div key={list.id} className="list-card collaborative">
                                <div className="list-emoji">{list.emoji}</div>
                                <h3 className="list-name">{list.name}</h3>
                                <p className="list-count">{list.count} movies</p>
                                <p className="list-members">👥 {list.members} members</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <CreateListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateList}
                isCreating={isCreating}
            />
        </div>
    );
};

export default Lists;
