import { useState } from 'react';
import './CreateListModal.css';

const CreateListModal = ({ isOpen, onClose, onSubmit, isCreating }) => {
    const [listName, setListName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (listName.trim()) {
            onSubmit(listName.trim());
            setListName('');
        }
    };

    const handleClose = () => {
        setListName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create New List</h2>
                    <button className="modal-close" onClick={handleClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <label htmlFor="list-name">List Name:</label>
                        <input
                            id="list-name"
                            type="text"
                            value={listName}
                            onChange={(e) => setListName(e.target.value)}
                            placeholder="Enter list name..."
                            autoFocus
                            disabled={isCreating}
                        />
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClose}
                            disabled={isCreating}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!listName.trim() || isCreating}
                        >
                            {isCreating ? 'Creating...' : 'Create List'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateListModal;
