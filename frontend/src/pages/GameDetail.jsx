import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './GameDetail.css';

const GameDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUserBalance } = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownsGame, setOwnsGame] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchGame();
    checkOwnership();
    checkCart();
  }, [id]);

  const fetchGame = async () => {
    try {
      const response = await axios.get(`/api/games/${id}`);
      setGame(response.data);
    } catch (error) {
      console.error('Error fetching game:', error);
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
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const checkCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInCart(response.data.items.some(item => item.game_id === parseInt(id)));
    } catch (error) {
      console.error('Error checking cart:', error);
    }
  };

  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/cart/add', { game_id: game.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInCart(true);
      setMessage({ type: 'success', text: 'Đã thêm vào giỏ hàng!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra!' });
    }
  };

  const handleBuyNow = async () => {
    if (user.wallet_balance < game.price) {
      setMessage({ type: 'error', text: 'Số dư không đủ! Vui lòng nạp thêm tiền.' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Add to cart first
      await axios.post('/api/cart/add', { game_id: game.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Then checkout
      const response = await axios.post('/api/cart/checkout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      updateUserBalance(response.data.new_balance);
      setOwnsGame(true);
      setMessage({ type: 'success', text: 'Mua game thành công!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra!' });
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

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <h3 className="empty-state-title">Game không tồn tại</h3>
            <Link to="/" className="btn btn-primary">Về trang chủ</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page game-detail-page">
      <div className="game-detail-bg">
        <div className="game-detail-bg-overlay"></div>
      </div>

      <div className="container">
        <button onClick={() => navigate(-1)} className="back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Quay lại
        </button>

        {message.text && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <div className="game-detail-content">
          <div className="game-detail-image">
            {game.image && game.image !== 'default-game.png' ? (
              <img src={`http://localhost:5000/uploads/games/${game.image}`} alt={game.name} className="game-detail-img" />
            ) : (
              <div className="game-image-placeholder">
                <span className="placeholder-icon">🎮</span>
                <span className="placeholder-letter">{game.name[0]}</span>
              </div>
            )}
          </div>

          <div className="game-detail-info">
            <div className="game-detail-header">
              <span className={`game-detail-category ${getCategoryColor(game.category)}`}>
                {game.category}
              </span>
              <h1 className="game-detail-title">{game.name}</h1>
              <p className="game-detail-publisher">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                {game.publisher}
              </p>
            </div>

            <div className="game-detail-description">
              <h3>Mô tả</h3>
              <p>{game.description}</p>
            </div>

            <div className="game-detail-footer">
              <div className="game-detail-price">
                <span className="price-label">Giá</span>
                <span className="price-value">{formatCurrency(game.price)}</span>
              </div>

              <div className="game-detail-actions">
                {ownsGame ? (
                  <Link to={`/play/${game.id}`} className="btn btn-primary btn-play">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Chơi ngay
                  </Link>
                ) : user?.is_admin ? (
                  <p className="admin-notice">Admin không thể mua game</p>
                ) : (
                  <>
                    <button 
                      onClick={handleAddToCart} 
                      className="btn btn-secondary"
                      disabled={inCart}
                    >
                      {inCart ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Đã trong giỏ
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                          </svg>
                          Thêm vào giỏ
                        </>
                      )}
                    </button>
                    <button onClick={handleBuyNow} className="btn btn-primary" disabled={inCart}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      Mua ngay
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;

