import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Store.css';

const Store = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalGames: 0
  });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');

  const categories = ['Sinh tồn', 'Kinh dị', 'Giải đố', 'Khác'];

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchGames();
  }, [pagination.currentPage, searchDebounce, category]);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/games', {
        params: {
          page: pagination.currentPage,
          limit: 30,
          search: searchDebounce,
          category
        }
      });
      setGames(response.data.games);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(pagination.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(
        <button key={1} onClick={() => handlePageChange(1)} className="page-btn">1</button>
      );
      if (start > 2) {
        pages.push(<span key="ellipsis-start" className="page-ellipsis">...</span>);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`page-btn ${pagination.currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    if (end < pagination.totalPages) {
      if (end < pagination.totalPages - 1) {
        pages.push(<span key="ellipsis-end" className="page-ellipsis">...</span>);
      }
      pages.push(
        <button key={pagination.totalPages} onClick={() => handlePageChange(pagination.totalPages)} className="page-btn">
          {pagination.totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="page store-page">
      <div className="container">
        <div className="store-header">
          <div className="store-title-section">
            <h1 className="page-title">Cửa Hàng</h1>
            <p className="page-subtitle">Khám phá {pagination.totalGames} game tuyệt vời</p>
          </div>

          <div className="store-filters">
            <div className="search-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm game..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                className="search-input"
              />
              {search && (
                <button onClick={() => setSearch('')} className="search-clear">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            <div className="category-filters">
              <button
                onClick={() => {
                  setCategory('');
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                className={`category-btn ${category === '' ? 'active' : ''}`}
              >
                Tất cả
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                  className={`category-btn ${category === cat ? 'active' : ''} ${getCategoryColor(cat)}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : games.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎮</div>
            <h3 className="empty-state-title">Không tìm thấy game</h3>
            <p className="empty-state-text">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <>
            <div className="games-grid">
              {games.map((game, index) => (
                <Link 
                  to={`/game/${game.id}`} 
                  key={game.id} 
                  className="game-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="game-image">
                    {game.image && game.image !== 'default-game.png' ? (
                      <img src={`http://localhost:5000/uploads/games/${game.image}`} alt={game.name} className="game-img" />
                    ) : (
                      <div className="game-placeholder">
                        <span className="game-placeholder-icon">🎮</span>
                        <span className="game-placeholder-text">{game.name[0]}</span>
                      </div>
                    )}
                    <div className="game-overlay">
                      <span className={`game-category ${getCategoryColor(game.category)}`}>
                        {game.category}
                      </span>
                      <span className="game-price">{formatCurrency(game.price)}</span>
                    </div>
                  </div>
                  <div className="game-info">
                    <h3 className="game-name">{game.name}</h3>
                  </div>
                </Link>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="page-btn page-nav"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  Previous
                </button>

                <div className="page-numbers">
                  {renderPageNumbers()}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="page-btn page-nav"
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            )}

            <div className="pagination-info">
              Trang {pagination.currentPage} / {pagination.totalPages} • Hiển thị {games.length} / {pagination.totalGames} game
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Store;

