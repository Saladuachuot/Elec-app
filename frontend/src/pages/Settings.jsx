import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings = () => {
  const { user, updateUserBalance, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile state
  const [profile, setProfile] = useState({
    display_name: '',
    email: '',
    birthdate: ''
  });

  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Wallet state
  const [depositAmount, setDepositAmount] = useState('');

  // Transactions state
  const [transactions, setTransactions] = useState([]);

  // Admin states
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [games, setGames] = useState([]);
  const [gameSearch, setGameSearch] = useState('');
  const [gameStats, setGameStats] = useState({ games: [], summary: {} });
  const [editingGame, setEditingGame] = useState(null);
  const [newGame, setNewGame] = useState({
    name: '',
    category: 'Sinh tồn',
    price: '',
    description: '',
    publisher: ''
  });
  const [newGameImage, setNewGameImage] = useState(null);
  const [editGameImage, setEditGameImage] = useState(null);
  const newImageRef = useRef(null);
  const editImageRef = useRef(null);

  useEffect(() => {
    if (user) {
      setProfile({
        display_name: user.display_name || '',
        email: user.email || '',
        birthdate: user.birthdate || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactions();
    } else if (activeTab === 'users' && user?.is_admin) {
      fetchUsers();
    } else if (activeTab === 'games' && user?.is_admin) {
      fetchGames();
    } else if (activeTab === 'stats' && user?.is_admin) {
      fetchStats();
    }
  }, [activeTab]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users', {
        params: { search: userSearch },
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await axios.get('/api/games', {
        params: { limit: 1000, search: gameSearch }
      });
      setGames(response.data.games);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/games/admin/statistics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGameStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/users/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra!' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/users/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra!' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseInt(depositAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Vui lòng nhập số tiền hợp lệ!' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/users/wallet/deposit', { amount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateUserBalance(response.data.new_balance);
      setDepositAmount('');
      setMessage({ type: 'success', text: 'Nạp tiền thành công!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra!' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
      setMessage({ type: 'success', text: 'Xóa người dùng thành công!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra!' });
    }
  };

  const handleAddGame = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', newGame.name);
      formData.append('category', newGame.category);
      formData.append('price', newGame.price);
      formData.append('description', newGame.description);
      formData.append('publisher', newGame.publisher);
      if (newGameImage) {
        formData.append('image', newGameImage);
      }

      await axios.post('/api/games', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setNewGame({ name: '', category: 'Sinh tồn', price: '', description: '', publisher: '' });
      setNewGameImage(null);
      if (newImageRef.current) newImageRef.current.value = '';
      fetchGames();
      setMessage({ type: 'success', text: 'Thêm game thành công!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra!' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGame = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', editingGame.name);
      formData.append('category', editingGame.category);
      formData.append('price', editingGame.price);
      formData.append('description', editingGame.description);
      formData.append('publisher', editingGame.publisher);
      if (editGameImage) {
        formData.append('image', editGameImage);
      }

      await axios.put(`/api/games/${editingGame.id}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setEditingGame(null);
      setEditGameImage(null);
      if (editImageRef.current) editImageRef.current.value = '';
      fetchGames();
      setMessage({ type: 'success', text: 'Cập nhật game thành công!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra!' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Bạn có chắc muốn xóa game này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/games/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGames();
      setMessage({ type: 'success', text: 'Xóa game thành công!' });
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'profile', label: 'Hồ sơ', icon: '👤' },
    ...(user?.is_admin ? [] : [{ id: 'wallet', label: 'Ví tiền', icon: '💰' }]),
    { id: 'history', label: 'Lịch sử', icon: '📜' },
    ...(user?.is_admin ? [
      { id: 'users', label: 'Người dùng', icon: '👥' },
      { id: 'games', label: 'Quản lý game', icon: '🎮' },
      { id: 'stats', label: 'Thống kê', icon: '📊' }
    ] : [])
  ];

  return (
    <div className="page settings-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Cài Đặt</h1>
          <p className="page-subtitle">Quản lý tài khoản và cài đặt của bạn</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <div className="settings-layout">
          <div className="settings-sidebar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage({ type: '', text: '' });
                }}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="settings-content">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="settings-panel">
                <h2 className="panel-title">Thông tin cá nhân</h2>
                
                <form onSubmit={handleProfileUpdate}>
                  <div className="form-group">
                    <label>Tên tài khoản</label>
                    <input
                      type="text"
                      className="form-input"
                      value={user?.username || ''}
                      disabled
                    />
                    <p className="form-hint">Không thể thay đổi tên tài khoản</p>
                  </div>

                  <div className="form-group">
                    <label>Tên hiển thị</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profile.display_name}
                      onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Ngày sinh</label>
                    <input
                      type="date"
                      className="form-input"
                      value={profile.birthdate}
                      onChange={(e) => setProfile({ ...profile, birthdate: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </form>

                <div className="panel-divider"></div>

                <h2 className="panel-title">Đổi mật khẩu</h2>
                
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label>Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      className="form-input"
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Mật khẩu mới</label>
                      <input
                        type="password"
                        className="form-input"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Xác nhận mật khẩu</label>
                      <input
                        type="password"
                        className="form-input"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-secondary" disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                </form>
              </div>
            )}

            {/* Wallet Tab - Only for non-admin users */}
            {activeTab === 'wallet' && !user?.is_admin && (
              <div className="settings-panel">
                <h2 className="panel-title">Ví tiền</h2>
                
                <div className="wallet-balance-card">
                  <span className="balance-label">Số dư hiện tại</span>
                  <span className="balance-amount">{formatCurrency(user?.wallet_balance || 0)}</span>
                </div>

                <form onSubmit={handleDeposit} className="deposit-form">
                  <h3>Nạp tiền vào ví</h3>
                  
                  <div className="deposit-presets">
                    {[50000, 100000, 200000, 500000, 1000000].map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setDepositAmount(amount.toString())}
                        className={`preset-btn ${depositAmount === amount.toString() ? 'active' : ''}`}
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                  </div>

                  <div className="form-group">
                    <label>Hoặc nhập số tiền</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Nhập số tiền..."
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      min="1000"
                      step="1000"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading || !depositAmount}>
                    {loading ? 'Đang xử lý...' : 'Nạp tiền'}
                  </button>
                </form>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="settings-panel">
                <h2 className="panel-title">Lịch sử giao dịch</h2>
                
                {transactions.length === 0 ? (
                  <div className="empty-state">
                    <p>Chưa có giao dịch nào</p>
                  </div>
                ) : (
                  <div className="transactions-list">
                    {transactions.map(tx => (
                      <div key={tx.id} className={`transaction-item ${tx.type}`}>
                        <div className="tx-icon">
                          {tx.type === 'deposit' && '💰'}
                          {tx.type === 'purchase' && '🎮'}
                          {tx.type === 'refund' && '↩️'}
                        </div>
                        <div className="tx-info">
                          <span className="tx-description">{tx.description}</span>
                          <span className="tx-date">{formatDate(tx.created_at)}</span>
                        </div>
                        <div className={`tx-amount ${tx.type === 'purchase' ? 'negative' : 'positive'}`}>
                          {tx.type === 'purchase' ? '-' : '+'}
                          {formatCurrency(tx.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Users Tab (Admin) */}
            {activeTab === 'users' && user?.is_admin && (
              <div className="settings-panel">
                <h2 className="panel-title">Quản lý người dùng</h2>
                
                <div className="admin-search">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tìm theo tên, ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <button onClick={fetchUsers} className="btn btn-primary">Tìm kiếm</button>
                </div>

                <div className="users-list">
                  {users.map(u => (
                    <div key={u.id} className="user-item">
                      <div className="user-avatar">
                        {u.display_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="user-info">
                        <span className="user-name">
                          {u.display_name}
                          {u.is_admin ? <span className="admin-badge">Admin</span> : null}
                        </span>
                        <span className="user-details">
                          @{u.username} • ID: {u.id} • {u.email}
                        </span>
                        <span className="user-balance">Ví: {formatCurrency(u.wallet_balance)}</span>
                      </div>
                      {!u.is_admin && (
                        <button 
                          onClick={() => handleDeleteUser(u.id)} 
                          className="btn btn-danger btn-small"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Games Tab (Admin) */}
            {activeTab === 'games' && user?.is_admin && (
              <div className="settings-panel">
                <h2 className="panel-title">Quản lý Game</h2>

                {/* Add New Game Form */}
                <div className="add-game-section">
                  <h3>Thêm game mới</h3>
                  <form onSubmit={handleAddGame} className="add-game-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Tên game</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newGame.name}
                          onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Danh mục</label>
                        <select
                          className="form-input"
                          value={newGame.category}
                          onChange={(e) => setNewGame({ ...newGame, category: e.target.value })}
                        >
                          <option value="Sinh tồn">Sinh tồn</option>
                          <option value="Kinh dị">Kinh dị</option>
                          <option value="Giải đố">Giải đố</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Giá (VND)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={newGame.price}
                          onChange={(e) => setNewGame({ ...newGame, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Nhà phát hành</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newGame.publisher}
                          onChange={(e) => setNewGame({ ...newGame, publisher: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Mô tả</label>
                      <textarea
                        className="form-input"
                        rows="3"
                        value={newGame.description}
                        onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Ảnh game</label>
                      <input
                        type="file"
                        ref={newImageRef}
                        className="form-input file-input"
                        accept="image/*"
                        onChange={(e) => setNewGameImage(e.target.files[0])}
                      />
                      {newGameImage && (
                        <div className="image-preview">
                          <img src={URL.createObjectURL(newGameImage)} alt="Preview" />
                          <button type="button" onClick={() => {
                            setNewGameImage(null);
                            if (newImageRef.current) newImageRef.current.value = '';
                          }} className="remove-image">✕</button>
                        </div>
                      )}
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Đang thêm...' : 'Thêm game'}
                    </button>
                  </form>
                </div>

                {/* Search Games */}
                <div className="admin-search">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tìm game theo tên hoặc ID..."
                    value={gameSearch}
                    onChange={(e) => setGameSearch(e.target.value)}
                  />
                  <button onClick={fetchGames} className="btn btn-primary">Tìm kiếm</button>
                </div>

                {/* Games List */}
                <div className="games-list">
                  {games.map(game => (
                    <div key={game.id} className="game-item">
                      {editingGame?.id === game.id ? (
                        <form onSubmit={handleUpdateGame} className="edit-game-form">
                          <input
                            type="text"
                            className="form-input"
                            value={editingGame.name}
                            onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })}
                            placeholder="Tên game"
                          />
                          <select
                            className="form-input"
                            value={editingGame.category}
                            onChange={(e) => setEditingGame({ ...editingGame, category: e.target.value })}
                          >
                            <option value="Sinh tồn">Sinh tồn</option>
                            <option value="Kinh dị">Kinh dị</option>
                            <option value="Giải đố">Giải đố</option>
                            <option value="Khác">Khác</option>
                          </select>
                          <input
                            type="number"
                            className="form-input"
                            value={editingGame.price}
                            onChange={(e) => setEditingGame({ ...editingGame, price: e.target.value })}
                            placeholder="Giá"
                          />
                          <input
                            type="text"
                            className="form-input"
                            value={editingGame.publisher}
                            onChange={(e) => setEditingGame({ ...editingGame, publisher: e.target.value })}
                            placeholder="Nhà phát hành"
                          />
                          <textarea
                            className="form-input"
                            value={editingGame.description}
                            onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })}
                            placeholder="Mô tả"
                          />
                          <div className="form-group">
                            <label>Đổi ảnh game</label>
                            <input
                              type="file"
                              ref={editImageRef}
                              className="form-input file-input"
                              accept="image/*"
                              onChange={(e) => setEditGameImage(e.target.files[0])}
                            />
                          </div>
                          <div className="edit-actions">
                            <button type="submit" className="btn btn-success btn-small">Lưu</button>
                            <button type="button" onClick={() => {
                              setEditingGame(null);
                              setEditGameImage(null);
                            }} className="btn btn-secondary btn-small">Hủy</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="game-item-image">
                            {game.image && game.image !== 'default-game.png' ? (
                              <img src={`http://localhost:5000/uploads/games/${game.image}`} alt={game.name} />
                            ) : (
                              <div className="game-item-placeholder">🎮</div>
                            )}
                          </div>
                          <div className="game-item-info">
                            <span className="game-item-id">#{game.id}</span>
                            <span className="game-item-name">{game.name}</span>
                            <span className="game-item-category">{game.category}</span>
                            <span className="game-item-price">{formatCurrency(game.price)}</span>
                          </div>
                          <div className="game-item-actions">
                            <button onClick={() => setEditingGame(game)} className="btn btn-secondary btn-small">Sửa</button>
                            <button onClick={() => handleDeleteGame(game.id)} className="btn btn-danger btn-small">Xóa</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Tab (Admin) */}
            {activeTab === 'stats' && user?.is_admin && (
              <div className="settings-panel">
                <h2 className="panel-title">Thống kê doanh thu</h2>

                <div className="stats-summary">
                  <div className="stat-card">
                    <span className="stat-icon">💰</span>
                    <span className="stat-value">{formatCurrency(gameStats.summary.totalRevenue || 0)}</span>
                    <span className="stat-label">Tổng doanh thu</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-icon">©️</span>
                    <span className="stat-value copyright-value">{formatCurrency((gameStats.summary.totalRevenue || 0) * 0.7)}</span>
                    <span className="stat-label">Tiền bản quyền</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-icon">🎮</span>
                    <span className="stat-value">{gameStats.summary.totalSales || 0}</span>
                    <span className="stat-label">Tổng lượt bán</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-icon">📦</span>
                    <span className="stat-value">{gameStats.summary.totalGames || 0}</span>
                    <span className="stat-label">Tổng số game</span>
                  </div>
                </div>

                <div className="stat-card-profit">
                  <span className="profit-label">Lợi nhuận</span>
                  <span className="profit-value">{formatCurrency((gameStats.summary.totalRevenue || 0) * 0.3)}</span>
                </div>

                <h3 className="subsection-title">Doanh thu theo game</h3>
                <div className="stats-table">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Game</th>
                        <th>Giá</th>
                        <th>Lượt bán</th>
                        <th>Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameStats.games.map(game => (
                        <tr key={game.id}>
                          <td>{game.name}</td>
                          <td>{formatCurrency(game.price)}</td>
                          <td>{game.total_sales}</td>
                          <td className="revenue">{formatCurrency(game.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
