import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

const Cart = () => {
  const { user, updateUserBalance } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (gameId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/cart/remove/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCart();
      setMessage({ type: 'success', text: 'Đã xóa khỏi giỏ hàng!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra!' });
    }
  };

  const handleCheckout = async () => {
    if (user.wallet_balance < cart.total) {
      setMessage({ type: 'error', text: 'Số dư không đủ! Vui lòng nạp thêm tiền.' });
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/cart/checkout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateUserBalance(response.data.new_balance);
      setMessage({ type: 'success', text: 'Thanh toán thành công!' });
      setTimeout(() => navigate('/library'), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra!' });
    } finally {
      setProcessing(false);
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

  return (
    <div className="page cart-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Giỏ Hàng</h1>
          <p className="page-subtitle">{cart.items.length} sản phẩm trong giỏ hàng</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        {cart.items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <h3 className="empty-state-title">Giỏ hàng trống</h3>
            <p className="empty-state-text">Thêm game vào giỏ hàng để mua nhé!</p>
            <Link to="/" className="btn btn-primary">Khám phá cửa hàng</Link>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cart.items.map(item => (
                <div key={item.game_id} className="cart-item">
                  <Link to={`/game/${item.game_id}`} className="cart-item-image">
                    {item.image && item.image !== 'default-game.png' ? (
                      <img src={`http://localhost:5000/uploads/games/${item.image}`} alt={item.name} />
                    ) : (
                      <div className="cart-item-placeholder">
                        <span>🎮</span>
                      </div>
                    )}
                  </Link>
                  <div className="cart-item-info">
                    <Link to={`/game/${item.game_id}`} className="cart-item-name">
                      {item.name}
                    </Link>
                    <span className={`cart-item-category ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </div>
                  <div className="cart-item-price">
                    {formatCurrency(item.price)}
                  </div>
                  <button 
                    onClick={() => handleRemove(item.game_id)} 
                    className="cart-item-remove"
                    title="Xóa khỏi giỏ hàng"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="cart-summary-card">
                <h3 className="cart-summary-title">Tóm tắt đơn hàng</h3>
                
                <div className="cart-summary-row">
                  <span>Số lượng game</span>
                  <span>{cart.items.length}</span>
                </div>
                
                <div className="cart-summary-row">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(cart.total)}</span>
                </div>

                <div className="cart-summary-divider"></div>

                <div className="cart-summary-row cart-summary-total">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(cart.total)}</span>
                </div>

                <div className="cart-wallet-info">
                  <div className="wallet-row">
                    <span>Số dư ví của bạn</span>
                    <span className={user.wallet_balance >= cart.total ? 'text-success' : 'text-danger'}>
                      {formatCurrency(user.wallet_balance)}
                    </span>
                  </div>
                  {user.wallet_balance < cart.total && (
                    <div className="wallet-warning">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      Số dư không đủ! Cần thêm {formatCurrency(cart.total - user.wallet_balance)}
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={processing || user.wallet_balance < cart.total}
                  className="btn btn-primary btn-checkout"
                >
                  {processing ? (
                    <>
                      <span className="spinner-small"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      Thanh toán
                    </>
                  )}
                </button>

                <Link to="/settings" className="btn btn-secondary btn-deposit">
                  Nạp tiền vào ví
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;

