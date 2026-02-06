import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityCard from '../components/ActivityCard';
import { getActivityFeed } from '../services/api';
import './AllActivity.css';

const AllActivity = () => {
    const navigate = useNavigate();
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                setLoading(true);
                const activityData = await getActivityFeed();
                setActivity(activityData);
            } catch (error) {
                console.error('Error loading activity feed:', error);
                setActivity([]);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, []);

    return (
        <div className="all-activity-page">
            <div className="page-header-with-back">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h1 className="page-title">All Recent Activity</h1>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-secondary)' }}>
                    Loading activity...
                </div>
            ) : activity.length > 0 ? (
                <div className="activity-grid">
                    {activity.map((item) => (
                        <ActivityCard
                            key={item.reviewId}
                            activity={item}
                            onClick={() => {
                                if (item.tmdbId) {
                                    navigate(`/movie/${item.tmdbId}`);
                                }
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--color-secondary)',
                    fontSize: '1.2rem'
                }}>
                    No recent activity, go watch some movies!
                </div>
            )}
        </div>
    );
};

export default AllActivity;
