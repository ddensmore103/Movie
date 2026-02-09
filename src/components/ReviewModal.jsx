import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import './ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, onSubmit, movie, existingReview = null }) => {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [reviewText, setReviewText] = useState(existingReview?.reviewText || '');
    const [watchDate, setWatchDate] = useState(existingReview?.watchDate || '');
    const [isRewatch, setIsRewatch] = useState(existingReview?.isRewatch || false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (existingReview) {
            setRating(existingReview.rating || 0);
            setReviewText(existingReview.reviewText || '');
            setWatchDate(existingReview.watchDate || '');
            setIsRewatch(existingReview.isRewatch || false);
        } else {
            setRating(0);
            setReviewText('');
            setWatchDate('');
            setIsRewatch(false);
        }
    }, [existingReview, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                rating,
                reviewText: reviewText.trim() || null,
                watchDate: watchDate || null,
                isRewatch,
            });
            onClose();
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{existingReview ? 'Edit Review' : 'Write a Review'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {movie && (
                            <div className="review-movie-info">
                                {movie.posterPath && (
                                    <img
                                        src={movie.posterPath}
                                        alt={movie.title}
                                        className="review-movie-poster"
                                    />
                                )}
                                <div>
                                    <h3>{movie.title}</h3>
                                    {movie.releaseDate && (
                                        <p className="movie-year">
                                            {new Date(movie.releaseDate).getFullYear()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Your Rating *</label>
                            <StarRating
                                rating={rating}
                                onRatingChange={setRating}
                                interactive={true}
                                size="large"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="watchDate">When did you watch it?</label>
                            <input
                                type="date"
                                id="watchDate"
                                value={watchDate}
                                onChange={(e) => setWatchDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="form-group watch-type-group">
                            <label>Watch type</label>
                            <div className="watch-type-buttons">
                                <button
                                    type="button"
                                    className={`watch-type-btn ${!isRewatch ? 'active' : ''}`}
                                    onClick={() => setIsRewatch(false)}
                                >
                                    🎬 First Watch
                                </button>
                                <button
                                    type="button"
                                    className={`watch-type-btn ${isRewatch ? 'active' : ''}`}
                                    onClick={() => setIsRewatch(true)}
                                >
                                    🔄 Rewatch
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="reviewText">Your Review (Optional)</label>
                            <textarea
                                id="reviewText"
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="Share your thoughts about this movie..."
                                rows={6}
                                maxLength={1000}
                            />
                            <div className="character-count">
                                {reviewText.length} / 1000
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting || rating === 0}
                        >
                            {isSubmitting ? 'Saving...' : existingReview ? 'Update Review' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
