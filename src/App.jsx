import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setAuthToken } from './services/api';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Lists from './pages/Lists';
import ListDetail from './pages/ListDetail';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import MovieDetail from './pages/MovieDetail';
import AllActivity from './pages/AllActivity';
import AllMovies from './pages/AllMovies';
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

          {/* Routes */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/activity" element={<AllActivity />} />
            <Route path="/movies" element={<AllMovies />} />
            <Route path="/lists" element={<Lists />} />
            <Route path="/lists/:listId" element={<ListDetail />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/profile/:userId" element={<Profile />} />
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
