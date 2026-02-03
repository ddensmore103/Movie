import { useState } from 'react';
import './StarRating.css';

const StarRating = ({ rating = 0, onRatingChange, interactive = false, size = 'medium' }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const handleClick = (value) => {
        if (interactive && onRatingChange) {
            onRatingChange(value);
        }
    };

    const handleMouseEnter = (value) => {
        if (interactive) {
            setHoverRating(value);
        }
    };

    const handleMouseLeave = () => {
        if (interactive) {
            setHoverRating(0);
        }
    };

    const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

    const renderStar = (index) => {
        const starValue = index + 1;
        const fillPercentage = Math.min(Math.max((displayRating - index) * 100, 0), 100);

        return (
            <div
                key={index}
                className={`star-wrapper ${interactive ? 'interactive' : ''} ${size}`}
                onClick={() => handleClick(starValue)}
                onMouseEnter={() => handleMouseEnter(starValue)}
                onMouseLeave={handleMouseLeave}
            >
                <svg
                    className="star-svg"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id={`star-gradient-${index}`}>
                            <stop offset={`${fillPercentage}%`} stopColor="var(--star-filled)" />
                            <stop offset={`${fillPercentage}%`} stopColor="var(--star-empty)" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        fill={`url(#star-gradient-${index})`}
                        stroke="var(--star-stroke)"
                        strokeWidth="1"
                    />
                </svg>
            </div>
        );
    };

    return (
        <div className="star-rating">
            {[0, 1, 2, 3, 4].map(renderStar)}
            {interactive && (
                <span className="rating-value">
                    {displayRating > 0 ? displayRating.toFixed(1) : '—'}
                </span>
            )}
        </div>
    );
};

export default StarRating;
