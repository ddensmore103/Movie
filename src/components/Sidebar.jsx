import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiClipboard, FiUsers, FiUser, FiSettings, FiLogOut, FiShield } from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { path: '/', icon: <FiHome />, label: 'Home' },
        { path: '/lists', icon: <FiClipboard />, label: 'Lists' },
        { path: '/friends', icon: <FiUsers />, label: 'Friends' },
        { path: '/profile', icon: <FiUser />, label: 'Profile' },
        { path: '/settings', icon: <FiSettings />, label: 'Settings' }
    ];

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = async () => {
        const { logout } = await import('../firebase');
        await logout();
        navigate('/'); // Redirect to home page
    };

    const { currentUser } = useAuth();

    // Add Admin link if user is admin
    const isAdmin = currentUser?.email === 'dldensmore1@gmail.com';
    const displayedNavItems = isAdmin
        ? [...navItems, { path: '/admin', icon: <FiShield />, label: 'Admin' }]
        : navItems;

    return (
        <>
            {/* Hamburger Button */}
            <button
                className="hamburger-btn"
                onClick={toggleSidebar}
                aria-label="Toggle menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Overlay for blur backdrop when expanded */}
            {isOpen && (
                <div
                    className="sidebar-overlay open"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Single Sidebar - expands in place */}
            <aside className={`sidebar ${isOpen ? 'expanded' : 'collapsed'}`}>
                {/* Header - only visible when expanded */}
                <div className="sidebar-header">
                    <h1 className="sidebar-logo">
                        <span className="logo-icon">🎬</span>
                        <span className="logo-text">Cinemarkd</span>
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
                            data-label={item.label}
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
                        <span className="nav-icon"><FiLogOut /></span>
                        <span className="nav-label">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
