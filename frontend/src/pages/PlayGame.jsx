import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './PlayGame.css';

const PlayGame = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownsGame, setOwnsGame] = useState(false);

  useEffect(() => {
    fetchGame();
    checkOwnership();
  }, [id]);

  const fetchGame = async () => {
    try {
      const response = await axios.get(`/api/games/${id}`);
      setGame(response.data);
    } catch (error) {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkOwnership = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/library/owns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOwnsGame(response.data.owns);
      if (!response.data.owns) {
        navigate(`/game/${id}`);
      }
    } catch (error) {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="play-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!ownsGame || !game) {
    return null;
  }

  return (
    <div className="play-page">
      <div className="play-header">
        <Link to="/library" className="play-back">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Thư viện
        </Link>
        <div className="play-game-info">
          <span className="play-icon">🎮</span>
          <span className="play-title">{game.name}</span>
        </div>
        <div className="play-controls">
          <button className="control-btn" title="Toàn màn hình">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="play-content">
        <div className="play-placeholder">
          <div className="play-placeholder-bg"></div>
          <div className="play-placeholder-content">
            <div className="play-placeholder-icon">🎮</div>
            <h2 className="play-placeholder-title">{game.name}</h2>
            <p className="play-placeholder-text">Game đang tải...</p>
            <div className="play-loading-bar">
              <div className="play-loading-progress"></div>
            </div>
            <div className="play-placeholder-info">
              <p>Đây là placeholder cho game.</p>
              <p>Trong phiên bản thực tế, game sẽ được nhúng và chơi tại đây.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayGame;

