import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Lists from './pages/Lists';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import MovieDetail from './pages/MovieDetail';
import AllActivity from './pages/AllActivity';
import AllMovies from './pages/AllMovies';
import './App.css';

function App() {
  // State to store the userId returned from creating a test user
  const [userId, setUserId] = useState(null);

  // State to store the list response
  const [listResponse, setListResponse] = useState(null);

  // Loading and error states
  const [userLoading, setUserLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handler for "Create Test User" button
   * Calls POST http://localhost:5000/users with hardcoded username and email
   * Stores the returned userId in state
   */
  const handleCreateUser = async () => {
    setUserLoading(true);
    setError(null);

    try {
      // Call the backend API to create a user
      const response = await fetch('http://localhost:5000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser123',
          email: 'testuser@example.com'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('User created:', data);

      // Store the userId from the response
      setUserId(data.userId);

    } catch (err) {
      console.error('Error creating user:', err);
      setError(`Failed to create user: ${err.message}`);
    } finally {
      setUserLoading(false);
    }
  };

  /**
   * Handler for "Create Test List" button
   * Uses the stored userId to call POST http://localhost:5000/lists
   * Creates a list named "My First Watchlist"
   */
  const handleCreateList = async () => {
    if (!userId) {
      setError('Please create a user first!');
      return;
    }

    setListLoading(true);
    setError(null);

    try {
      // Call the backend API to create a list
      const response = await fetch('http://localhost:5000/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerId: userId,
          name: 'My First Watchlist'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('List created:', data);

      // Store the list response to display on page
      setListResponse(data);

    } catch (err) {
      console.error('Error creating list:', err);
      setError(`Failed to create list: ${err.message}`);
    } finally {
      setListLoading(false);
    }
  };

  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          {/* Dev Testing Section - Remove this in production */}
          <div style={{
            padding: '20px',
            margin: '20px',
            border: '2px solid #ccc',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }}>
            <h2 style={{ marginTop: 0 }}>🧪 Dev Testing - Backend Connection</h2>

            <div style={{ marginBottom: '15px' }}>
              <button
                onClick={handleCreateUser}
                disabled={userLoading}
                style={{
                  padding: '10px 20px',
                  marginRight: '10px',
                  fontSize: '16px',
                  cursor: userLoading ? 'not-allowed' : 'pointer',
                  backgroundColor: userLoading ? '#ccc' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                {userLoading ? 'Creating...' : 'Create Test User'}
              </button>

              <button
                onClick={handleCreateList}
                disabled={listLoading || !userId}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  cursor: (listLoading || !userId) ? 'not-allowed' : 'pointer',
                  backgroundColor: (listLoading || !userId) ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                {listLoading ? 'Creating...' : 'Create Test List'}
              </button>
            </div>

            {/* Display error messages */}
            {error && (
              <div style={{
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#ffebee',
                color: '#c62828',
                borderRadius: '4px'
              }}>
                ❌ {error}
              </div>
            )}

            {/* Display userId when user is created */}
            {userId && (
              <div style={{
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#e8f5e9',
                borderRadius: '4px'
              }}>
                ✅ <strong>User Created!</strong> userId: <code>{userId}</code>
              </div>
            )}

            {/* Display list response when list is created */}
            {listResponse && (
              <div style={{
                padding: '10px',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px'
              }}>
                ✅ <strong>List Created!</strong>
                <pre style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(listResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Original Routes */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/activity" element={<AllActivity />} />
            <Route path="/movies" element={<AllMovies />} />
            <Route path="/lists" element={<Lists />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
