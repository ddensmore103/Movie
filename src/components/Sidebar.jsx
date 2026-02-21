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

    // Tooltip state
    const [hoveredItem, setHoveredItem] = useState(null);

    const handleMouseEnter = (e, label) => {
        if (isOpen) return; // No tooltip when expanded
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredItem({
            label,
            top: rect.top + (rect.height / 2),
            left: rect.right + 10
        });
    };

    const handleMouseLeave = () => {
        setHoveredItem(null);
    };

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
                        <img src="/favicon.png" alt="C" className="sidebar-logo-img" />
                        <span className="logo-text">inemarkd</span>
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
                            onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                            onMouseLeave={handleMouseLeave}
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
                        onMouseEnter={(e) => handleMouseEnter(e, 'Logout')}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span className="nav-icon"><FiLogOut /></span>
                        <span className="nav-label">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Portal Tooltip */}
            {hoveredItem && !isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: hoveredItem.top,
                        left: hoveredItem.left,
                        transform: 'translateY(-50%)',
                        background: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)',
                        padding: 'var(--space-xs) var(--space-md)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 9999,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                    }}
                >
                    {hoveredItem.label}
                </div>
            )}
        </>
    );
};

export default Sidebar;
