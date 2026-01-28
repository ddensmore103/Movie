import { useNavigate } from 'react-router-dom';
import ActivityCard from '../components/ActivityCard';
import { mockActivity } from '../services/tmdb';
import './AllActivity.css';

const AllActivity = () => {
    const navigate = useNavigate();

    return (
        <div className="all-activity-page">
            <div className="page-header-with-back">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h1 className="page-title">All Recent Activity</h1>
            </div>

            <div className="activity-grid">
                {mockActivity.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                ))}
                {/* Duplicate for demo purposes */}
                {mockActivity.map((activity, index) => (
                    <ActivityCard key={`dup-${index}`} activity={activity} />
                ))}
            </div>
        </div>
    );
};

export default AllActivity;
