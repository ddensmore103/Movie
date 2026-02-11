import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import SelectListModal from '../components/SelectListModal';
import { getRecommendedMovies } from '../services/api';
import './AllRecommendations.css';

const AllRecommendations = () => {
    const navigate = useNavigate();
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSelectListModal, setShowSelectListModal] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);

    useEffect(() => {
        const loadRecommendations = async () => {
            setIsLoading(true);
            try {
                const recs = await getRecommendedMovies();
                setMovies(recs);
            } catch (error) {
                console.error('Error loading recommendations:', error);
                setMovies([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadRecommendations();
    }, []);

    const handleMovieClick = (movie) => {
        navigate(`/movie/${movie.id}`);
    };

    const handleAddToList = (movie) => {
        setSelectedMovie(movie);
        setShowSelectListModal(true);
    };

    const handleListModalClose = () => {
        setShowSelectListModal(false);
        setSelectedMovie(null);
    };

    return (
        <div className="all-recommendations-page">
            <div className="page-header-with-back">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h1 className="page-title">Recommended For You</h1>
            </div>

            {isLoading ? (
                <div className="loading-message">Finding movies you'll love...</div>
            ) : movies.length > 0 ? (
                <div className="movies-grid-large">
                    {movies.map((movie) => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            onClick={() => handleMovieClick(movie)}
                            onAddToList={handleAddToList}
                        />
                    ))}
                </div>
            ) : (
                <div className="recommendations-empty">
                    <div className="recommendations-empty-icon">🎬</div>
                    <p>Watch and rate some movies to get personalized recommendations!</p>
                </div>
            )}

            <SelectListModal
                isOpen={showSelectListModal}
                onClose={handleListModalClose}
                movie={selectedMovie}
                onSuccess={() => console.log('Movie added to list successfully')}
                allowMultiple={true}
            />
        </div>
    );
};

export default AllRecommendations;
