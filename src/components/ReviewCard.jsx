import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import StarRating from './StarRating';
import ConfirmationModal from './ConfirmationModal';
import './ReviewCard.css';

const ReviewCard = ({ review, onEdit, onDelete }) => {
    const { currentUser } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isOwnReview = currentUser && review.userId === currentUser.uid;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(review.reviewId);
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Failed to delete review. Please try again.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <>
            <div className="review-card">
                <div className="review-header">
                    <div className="review-user-info">
                        <div className="user-avatar">
                            {review.user?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <div className="review-username">
                                {review.user?.username || 'Unknown User'}
                            </div>
                            <div className="review-date">
                                {formatDate(review.createdAt)}
                                {review.updatedAt !== review.createdAt && ' (edited)'}
                            </div>
                        </div>
                    </div>
                    {isOwnReview && (
                        <div className="review-actions">
                            <button
                                className="review-action-btn edit-btn"
                                onClick={() => onEdit(review)}
                                title="Edit review"
                            >
                                ✏️
                            </button>
                            <button
                                className="review-action-btn delete-btn"
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isDeleting}
                                title="Delete review"
                            >
                                {isDeleting ? '⏳' : '🗑️'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="review-rating-section">
                    <StarRating rating={review.rating} size="medium" />
                    {review.watchDate && (
                        <span className="watch-date">
                            Watched on {formatDate(review.watchDate)}
                        </span>
                    )}
                </div>

                {review.reviewText && (
                    <div className="review-text">
                        {review.reviewText}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Review"
                message="Are you sure you want to delete this review? This action cannot be undone."
                confirmText="Delete"
                confirmStyle="danger"
            />
        </>
    );
};

export default ReviewCard;
