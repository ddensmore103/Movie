import { useState, useRef } from 'react';
import { tmdbAPI } from '../services/tmdb';
import { addMovieToList } from '../services/api';
import './CreateListModal.css';

const CreateListModal = ({ isOpen, onClose, onSubmit, isCreating }) => {
    const [listName, setListName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [importProgress, setImportProgress] = useState(null);
    const fileInputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (listName.trim()) {
            // Pass file along with name so parent can get the listId back
            await onSubmit(listName.trim(), selectedFile);
            setListName('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        setListName('');
        setSelectedFile(null);
        setImportProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.endsWith('.txt')) {
                alert('Please select a .txt file');
                e.target.value = '';
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content create-list-modal" onClick={(e) => e.stopPropagation()}>
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

                        <div className="file-upload-section">
                            <label className="file-upload-label">
                                Import movies from text file <span className="optional-tag">(optional)</span>
                            </label>
                            <p className="file-upload-hint">
                                One movie title per line. The most popular match will be added.
                            </p>
                            {!selectedFile ? (
                                <button
                                    type="button"
                                    className="file-upload-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isCreating}
                                >
                                    📄 Choose .txt File
                                </button>
                            ) : (
                                <div className="selected-file">
                                    <span className="file-name">📄 {selectedFile.name}</span>
                                    <button
                                        type="button"
                                        className="remove-file-btn"
                                        onClick={handleRemoveFile}
                                        disabled={isCreating}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {importProgress && (
                            <div className="import-progress">
                                <div className="progress-header">
                                    <span>Importing movies...</span>
                                    <span>{importProgress.current}/{importProgress.total}</span>
                                </div>
                                <div className="progress-bar-track">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                                    />
                                </div>
                                {importProgress.currentTitle && (
                                    <div className="progress-current">
                                        🔍 {importProgress.currentTitle}
                                    </div>
                                )}
                                {importProgress.results && (
                                    <div className="import-results">
                                        <span className="result-success">✅ {importProgress.results.found} found</span>
                                        {importProgress.results.notFound > 0 && (
                                            <span className="result-fail">❌ {importProgress.results.notFound} not found</span>
                                        )}
                                        {importProgress.results.notFoundTitles?.length > 0 && (
                                            <div className="not-found-list">
                                                <span className="not-found-label">Not found:</span>
                                                {importProgress.results.notFoundTitles.map((t, i) => (
                                                    <span key={i} className="not-found-title">{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
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
                            {isCreating ? 'Creating...' : selectedFile ? 'Create & Import' : 'Create List'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/**
 * Utility: Parse a text file and bulk-import movies to a list.
 * Called by the parent after creating the list.
 */
export const importMoviesFromFile = async (file, listId, onProgress) => {
    const text = await file.text();
    const titles = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (titles.length === 0) return { found: 0, notFound: 0, notFoundTitles: [] };

    let found = 0;
    let notFound = 0;
    const notFoundTitles = [];

    for (let i = 0; i < titles.length; i++) {
        const title = titles[i];
        onProgress?.({
            current: i + 1,
            total: titles.length,
            currentTitle: title,
        });

        try {
            const results = await tmdbAPI.searchMovies(title);
            if (results.results && results.results.length > 0) {
                // TMDB returns results sorted by popularity by default
                // Pick the most popular one (highest popularity score)
                const bestMatch = results.results.reduce((best, current) =>
                    (current.popularity > best.popularity) ? current : best
                    , results.results[0]);

                await addMovieToList(listId, {
                    tmdbId: bestMatch.id,
                    title: bestMatch.title,
                    posterPath: bestMatch.poster_path,
                    releaseDate: bestMatch.release_date,
                    rating: bestMatch.vote_average,
                });
                found++;
            } else {
                notFound++;
                notFoundTitles.push(title);
            }
        } catch (err) {
            console.error(`Error importing "${title}":`, err);
            notFound++;
            notFoundTitles.push(title);
        }
    }

    return { found, notFound, notFoundTitles };
};

export default CreateListModal;
