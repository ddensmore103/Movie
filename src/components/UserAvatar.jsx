import { LuClapperboard } from 'react-icons/lu';
import './UserAvatar.css';

/**
 * Reusable User Avatar component
 * @param {Object} user - User object containing photoURL, avatar, etc.
 * @param {string} size - Size of avatar: 'small', 'medium', 'large', 'xl' (default: 'medium')
 * @param {string} className - Additional classes
 */
const UserAvatar = ({ user, size = 'medium', className = '' }) => {
    // Check for image URL
    const imageUrl = user?.photoURL || user?.avatarUrl;

    // Check for emoji fallback (legacy) - usually we want to ignore this if we are enforcing the icon, 
    // but the plan is to replace the emoji with the icon, so we only use image or icon.
    // However, if the user explicitly has an 'avatar' field that IS an image URL, we use it.
    // Some mock data uses 'avatar' as an emoji string. We should detect if it looks like a URL.

    const isUrl = (string) => {
        try {
            return Boolean(new URL(string));
        } catch (e) {
            return false;
        }
    };

    // If user.avatar is a URL, use it. If it's an emoji (or undefined), fallback to icon.
    const hasValidImage = imageUrl || (user?.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/')));

    return (
        <div className={`user-avatar size-${size} ${className}`}>
            {hasValidImage ? (
                <img
                    src={imageUrl || user.avatar}
                    alt={user?.username || user?.displayName || 'User'}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('image-error');
                    }}
                />
            ) : (
                <LuClapperboard className="default-avatar-icon" />
            )}
        </div>
    );
};

export default UserAvatar;
