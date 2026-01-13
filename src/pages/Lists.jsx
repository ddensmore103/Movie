import './Lists.css';

const Lists = () => {
    const userLists = [
        { id: 1, name: 'Favorites', count: 24, emoji: '❤️' },
        { id: 2, name: 'Watchlist', count: 18, emoji: '📌' },
        { id: 3, name: 'Mind-Bending Films', count: 12, emoji: '🧠' },
        { id: 4, name: 'Classic Cinema', count: 31, emoji: '🎭' }
    ];

    const collaborativeLists = [
        { id: 5, name: 'Best Sci-Fi Ever', count: 45, members: 8, emoji: '🚀' },
        { id: 6, name: 'Horror Classics', count: 28, members: 5, emoji: '👻' }
    ];

    return (
        <div className="lists-page">
            <div className="page-header">
                <h1 className="page-title">My Lists</h1>
                <button className="btn btn-primary">
                    <span>➕</span>
                    <span>Create New List</span>
                </button>
            </div>

            <div className="lists-content">
                <section className="lists-section">
                    <h2 className="section-title">Your Lists</h2>
                    <div className="lists-grid">
                        {userLists.map((list) => (
                            <div key={list.id} className="list-card">
                                <div className="list-emoji">{list.emoji}</div>
                                <h3 className="list-name">{list.name}</h3>
                                <p className="list-count">{list.count} movies</p>
                            </div>
                        ))}
                    </div>
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
        </div>
    );
};

export default Lists;
