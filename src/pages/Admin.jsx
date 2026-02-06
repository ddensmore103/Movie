import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, adminDeleteUser } from '../services/api';
import './Admin.css';

const Admin = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // userId to confirm

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error("Failed to load users:", err);
            setError("Failed to load users. Are you an admin?");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (userId) => {
        setDeleteConfirm(userId);
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            await adminDeleteUser(deleteConfirm);
            // Remove from local state
            setUsers(users.filter(u => u.userId !== deleteConfirm));
            setDeleteConfirm(null);
        } catch (err) {
            console.error("Failed to delete user:", err);
            alert("Failed to delete user: " + err.message);
        }
    };

    return (
        <div className="admin-page">
            <h1 className="page-title">Admin Dashboard</h1>

            {error && <div className="error-message">{error}</div>}

            <div className="admin-stats">
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <p>{users.length}</p>
                </div>
            </div>

            <div className="users-table-container">
                {loading ? (
                    <p>Loading users...</p>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>User ID</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.userId}>
                                    <td className="user-cell">
                                        <div className="user-avatar-small">
                                            {user.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <Link to={`/profile/${user.userId}`} className="admin-user-link">
                                            {user.username}
                                        </Link>
                                    </td>
                                    <td>{user.email}</td>
                                    <td className="monospace">{user.userId}</td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        {user.email === 'dldensmore1@gmail.com' ? (
                                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9em', fontStyle: 'italic' }}>
                                                Protected
                                            </span>
                                        ) : deleteConfirm === user.userId ? (
                                            <div className="confirm-actions">
                                                <button
                                                    className="btn-confirm-delete"
                                                    onClick={handleConfirmDelete}
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    className="btn-cancel"
                                                    onClick={() => setDeleteConfirm(null)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="btn-delete-user"
                                                onClick={() => handleDeleteClick(user.userId)}
                                                title="Delete User"
                                            >
                                                🗑️ Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Admin;
