import './Friends.css';

const Friends = () => {
    const friends = [
        { id: 1, name: 'Sarah Chen', avatar: '👩‍🎨', moviesWatched: 142, mutualFriends: 8 },
        { id: 2, name: 'Mike Johnson', avatar: '👨‍💼', moviesWatched: 98, mutualFriends: 12 },
        { id: 3, name: 'Emma Wilson', avatar: '👩‍🔬', moviesWatched: 215, mutualFriends: 5 },
        { id: 4, name: 'Alex Rodriguez', avatar: '👨‍🎤', moviesWatched: 167, mutualFriends: 15 }
    ];

    const suggestions = [
        { id: 5, name: 'Lisa Park', avatar: '👩‍💻', mutualFriends: 6 },
        { id: 6, name: 'Tom Anderson', avatar: '👨‍🎨', mutualFriends: 4 }
    ];

    return (
        <div className="friends-page">
            <div className="page-header">
                <h1 className="page-title">Friends</h1>
                <button className="btn btn-primary">
                    <span>➕</span>
                    <span>Add Friends</span>
                </button>
            </div>

            <div className="friends-content">
                <section className="friends-section">
                    <h2 className="section-title">Your Friends ({friends.length})</h2>
                    <div className="friends-grid">
                        {friends.map((friend) => (
                            <div key={friend.id} className="friend-card">
                                <div className="friend-avatar">{friend.avatar}</div>
                                <h3 className="friend-name">{friend.name}</h3>
                                <div className="friend-stats">
                                    <div className="stat">
                                        <span className="stat-value">{friend.moviesWatched}</span>
                                        <span className="stat-label">movies</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{friend.mutualFriends}</span>
                                        <span className="stat-label">mutual</span>
                                    </div>
                                </div>
                                <button className="btn-secondary">View Profile</button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="friends-section">
                    <h2 className="section-title">Suggested Friends</h2>
                    <div className="friends-grid">
                        {suggestions.map((person) => (
                            <div key={person.id} className="friend-card suggestion">
                                <div className="friend-avatar">{person.avatar}</div>
                                <h3 className="friend-name">{person.name}</h3>
                                <p className="mutual-friends">{person.mutualFriends} mutual friends</p>
                                <button className="btn btn-primary">Add Friend</button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Friends;
