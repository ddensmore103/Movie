import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setAuthToken } from './services/api';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Lists from './pages/Lists';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import MovieDetail from './pages/MovieDetail';
import AllActivity from './pages/AllActivity';
import AllMovies from './pages/AllMovies';
import { logout } from './firebase';
import './App.css';

/**
 * Main App Content - Only shown when user is authenticated
 */
function AppContent() {
  const { currentUser, idToken, loading } = useAuth();

  // Update API service with current token whenever it changes
  useEffect(() => {
    setAuthToken(idToken);
  }, [idToken]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '24px',
        color: '#667eea'
      }}>
        Loading...
      </div>
    );
  }

  // Show Auth component if user is not logged in
  if (!currentUser) {
    return <Auth />;
  }

  // Show main app if user is logged in
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          {/* User Info Bar */}
          <div style={{
            padding: '12px 20px',
            margin: '20px 20px 0 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong>👤 Logged in as:</strong> {currentUser.email}
              <br />
              <small style={{ opacity: 0.9 }}>UID: {currentUser.uid}</small>
            </div>
            <button
              onClick={logout}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              Logout
            </button>
          </div>

          {/* Routes */}
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

/**
 * Root App Component - Wraps everything with AuthProvider
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
