import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Library.css';

const Library = () => {
  const { updateUserBalance } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [refundingId, setRefundingId] = useState(null);

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/library', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGames(response.data);
    } catch (error) {
      console.error('Error fetching library:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (gameId) => {
    if (!window.confirm('Bạn có chắc muốn hoàn tiền game này?')) {
      return;
    }

    setRefundingId(gameId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/library/refund/${gameId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateUserBalance(response.data.new_balance);
      setMessage({ type: 'success', text: 'Hoàn tiền thành công!' });
      fetchLibrary();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra!' });
    } finally {
      setRefundingId(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Sinh tồn': return 'category-survival';
      case 'Kinh dị': return 'category-horror';
      case 'Giải đố': return 'category-puzzle';
      default: return 'category-other';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page library-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Thư Viện</h1>
          <p className="page-subtitle">{games.length} game trong thư viện của bạn</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        {games.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h3 className="empty-state-title">Thư viện trống</h3>
            <p className="empty-state-text">Bạn chưa sở hữu game nào. Hãy mua game để thêm vào thư viện!</p>
            <Link to="/" className="btn btn-primary">Khám phá cửa hàng</Link>
          </div>
        ) : (
          <div className="library-grid">
            {games.map(game => (
              <div key={game.game_id} className="library-card">
                <Link to={`/game/${game.game_id}`} className="library-card-image">
                  {game.image && game.image !== 'default-game.png' ? (
                    <img src={`http://localhost:5000/uploads/games/${game.image}`} alt={game.name} className="library-img" />
                  ) : (
                    <div className="library-placeholder">
                      <span className="library-placeholder-icon">🎮</span>
                      <span className="library-placeholder-letter">{game.name[0]}</span>
                    </div>
                  )}
                  <div className="library-card-overlay">
                    <span className={`library-category ${getCategoryColor(game.category)}`}>
                      {game.category}
                    </span>
                  </div>
                </Link>

                <div className="library-card-content">
                  <Link to={`/game/${game.game_id}`} className="library-card-title">
                    {game.name}
                  </Link>
                  <p className="library-card-publisher">{game.publisher}</p>
                  <p className="library-card-date">
                    Mua ngày: {formatDate(game.purchased_at)}
                  </p>

                  <div className="library-card-actions">
                    <Link to={`/play/${game.game_id}`} className="btn btn-primary btn-play-library">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      Chơi
                    </Link>

                    {game.can_refund === 1 && (
                      <button 
                        onClick={() => handleRefund(game.game_id)}
                        disabled={refundingId === game.game_id}
                        className="btn btn-secondary btn-refund"
                        title="Hoàn tiền trong vòng 2 ngày"
                      >
                        {refundingId === game.game_id ? (
                          <span className="spinner-small"></span>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="1 4 1 10 7 10"></polyline>
                              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                            </svg>
                            Hoàn tiền
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {game.can_refund === 1 && (
                    <p className="refund-notice">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      Có thể hoàn tiền {formatCurrency(game.price)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


