import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toggleReviewLike } from '../services/api';
import StarRating from './StarRating';
import ConfirmationModal from './ConfirmationModal';
import UserAvatar from './UserAvatar';
import './ReviewCard.css';

const ReviewCard = ({ review, onEdit, onDelete }) => {
    const { currentUser } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [likedBy, setLikedBy] = useState(review.likedBy || []);
    const [isLiking, setIsLiking] = useState(false);

    const isOwnReview = currentUser && review.userId === currentUser.uid;
    const isLiked = currentUser ? likedBy.includes(currentUser.uid) : false;
    const likeCount = likedBy.length;

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

    const handleLike = async (e) => {
        e.stopPropagation();
        if (!currentUser || isLiking) return;

        // Optimistic update
        const prevLikedBy = [...likedBy];
        setLikedBy(isLiked
            ? likedBy.filter(id => id !== currentUser.uid)
            : [...likedBy, currentUser.uid]
        );
        setIsLiking(true);

        try {
            const result = await toggleReviewLike(review.reviewId);
            setLikedBy(result.likedBy || []);
        } catch (error) {
            console.error('Error toggling like:', error);
            setLikedBy(prevLikedBy); // Revert on error
        } finally {
            setIsLiking(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;

        // Check if it's a date-only string (YYYY-MM-DD format)
        // Parse it manually to avoid timezone issues
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day); // month is 0-indexed
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // For full datetime strings, use regular parsing
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
                        <div className="user-avatar-container">
                            <UserAvatar user={review.user} size="medium" />
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
                            {review.isRewatch ? 'Rewatched' : 'Watched'} on {formatDate(review.watchDate)}
                        </span>
                    )}
                </div>

                {review.reviewText && (
                    <div className="review-text">
                        {review.reviewText}
                    </div>
                )}

                {currentUser && (
                    <div className="review-like-section">
                        <button
                            className={`like-btn ${isLiked ? 'liked' : ''}`}
                            onClick={handleLike}
                            disabled={isLiking}
                            title={isLiked ? 'Unlike' : 'Like'}
                        >
                            <span className="like-icon">{isLiked ? '❤️' : '🤍'}</span>
                            {likeCount > 0 && <span className="like-count">{likeCount}</span>}
                        </button>
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

