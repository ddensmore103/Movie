import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

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
                    {navItems.map((item) => (
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
                    {navItems.map((item) => (
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
                        onClick={() => {
                            import('../firebase').then(({ logout }) => logout());
                        }}
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
