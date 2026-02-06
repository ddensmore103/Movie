import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { path: '/', icon: '🏠', label: 'Home' },
        { path: '/lists', icon: '📋', label: 'Lists' },
        { path: '/friends', icon: '👥', label: 'Friends' },
        { path: '/profile', icon: '👤', label: 'Profile' },
        { path: '/settings', icon: '⚙️', label: 'Settings' }
    ];

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = async () => {
        const { logout } = await import('../firebase');
        await logout();
        navigate('/'); // Redirect to home page
    };

    const { currentUser } = useAuth(); // Create this context hook

    // Add Admin link if user is admin
    const isAdmin = currentUser?.email === 'dldensmore1@gmail.com';
    const displayedNavItems = isAdmin
        ? [...navItems, { path: '/admin', icon: '👑', label: 'Admin' }]
        : navItems;

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button
                className="hamburger-btn"
                onClick={toggleSidebar}
                aria-label="Toggle menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="sidebar-overlay open"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Mini Sidebar (Icon Only - Always Visible) */}
            {!isOpen && (
                <div className="mini-sidebar">
                    {displayedNavItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            state={item.path === '/' ? { resetSearch: true } : undefined}
                            className={`mini-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            data-label={item.label}
                        >
                            {item.icon}
                        </Link>
                    ))}
                    <button
                        className="mini-nav-item"
                        onClick={handleLogout}
                        data-label="Logout"
                        style={{
                            marginTop: 'auto',
                            background: 'transparent',
                            border: 'none',
                            width: '50px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--font-size-2xl)'
                        }}
                        aria-label="Logout"
                    >
                        🚪
                    </button>
                </div>
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h1 className="sidebar-logo">
                        <span className="logo-icon">🎬</span>
                        <span className="logo-text">MovieTrack</span>
                    </h1>
                </div>

                <nav className="sidebar-nav">
                    {displayedNavItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            state={item.path === '/' ? { resetSearch: true } : undefined}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        <span className="nav-icon">🚪</span>
                        <span className="nav-label">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
