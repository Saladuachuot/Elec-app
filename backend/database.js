const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Đọc cấu hình từ file .env hoặc dùng giá trị mặc định
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',  // Mặc định là rỗng
  database: process.env.DB_NAME || 'elec_web',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

async function initializeDatabase() {
  // Tạo connection không có database trước để tạo database
  const tempConnection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password
  });

  // Tạo database nếu chưa tồn tại
  await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await tempConnection.end();

  // Tạo connection pool
  pool = mysql.createPool(dbConfig);

  // Users table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      display_name VARCHAR(255) NOT NULL,
      birthdate DATE,
      wallet_balance DECIMAL(15,2) DEFAULT 0,
      is_admin TINYINT DEFAULT 0,
      avatar VARCHAR(255) DEFAULT 'default-avatar.png',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Games table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS games (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price DECIMAL(15,2) NOT NULL,
      description TEXT,
      publisher VARCHAR(255),
      image VARCHAR(255) DEFAULT 'default-game.png',
      sales_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // User Library (purchased games)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_library (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      game_id INT NOT NULL,
      purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      can_refund TINYINT DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_game (user_id, game_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Shopping Cart
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS cart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      game_id INT NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      UNIQUE KEY unique_cart_item (user_id, game_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Transaction History
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      game_id INT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Create default admin account if not exists
  const [adminRows] = await pool.execute("SELECT id FROM users WHERE username = ?", ['admin']);
  if (adminRows.length === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await pool.execute(`
      INSERT INTO users (username, email, password, display_name, is_admin, wallet_balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['admin', 'admin@gamestore.com', hashedPassword, 'Administrator', 1, 10000]);
    console.log('Default admin account created: admin / admin123');
  }

  // Add sample games if none exist
  const [gamesRows] = await pool.execute("SELECT COUNT(*) as count FROM games");
  if (gamesRows[0].count === 0) {
    const sampleGames = [
      { name: 'Survival Island', category: 'Sinh tồn', price: 299000, description: 'Sinh tồn trên đảo hoang với tài nguyên hạn chế. Xây dựng nơi trú ẩn, tìm kiếm thức ăn và chiến đấu với thiên nhiên.', publisher: 'Survival Studios', image: 'survival-island.jpg' },
      { name: 'Dark Forest', category: 'Kinh dị', price: 199000, description: 'Khám phá khu rừng bị nguyền rủa và tìm đường thoát ra trước khi quá muộn.', publisher: 'Horror Games Inc', image: 'dark-forest.jpg' },
      { name: 'Mind Puzzler', category: 'Giải đố', price: 149000, description: 'Hơn 500 câu đố thử thách trí tuệ của bạn.', publisher: 'Puzzle Masters', image: 'mind-puzzler.jpg' },
      { name: 'Space Survival', category: 'Sinh tồn', price: 349000, description: 'Sinh tồn trong không gian, quản lý oxy và tài nguyên trên trạm vũ trụ bị bỏ hoang.', publisher: 'Cosmic Games', image: 'space-survival.jpg' },
      { name: 'Haunted Manor', category: 'Kinh dị', price: 249000, description: 'Điều tra những bí ẩn trong ngôi biệt thự ma ám.', publisher: 'Spooky Entertainment', image: 'haunted-manor.jpg' },
      { name: 'Logic Quest', category: 'Giải đố', price: 129000, description: 'Phiêu lưu qua các câu đố logic phức tạp.', publisher: 'Brain Games', image: 'logic-quest.jpg' },
      { name: 'Desert Survivor', category: 'Sinh tồn', price: 279000, description: 'Sinh tồn trong sa mạc khắc nghiệt với nguồn nước hạn chế.', publisher: 'Survival Studios', image: 'desert-survivor.jpg' },
      { name: 'Nightmare Realm', category: 'Kinh dị', price: 299000, description: 'Bị mắc kẹt trong cơn ác mộng, tìm cách thức tỉnh.', publisher: 'Horror Games Inc', image: 'nightmare-realm.jpg' },
      { name: 'Riddle Master', category: 'Giải đố', price: 99000, description: 'Giải hàng trăm câu đố để trở thành bậc thầy.', publisher: 'Puzzle Masters', image: 'riddle-master.jpg' },
      { name: 'Ocean Depths', category: 'Sinh tồn', price: 319000, description: 'Sinh tồn dưới đáy đại dương, xây dựng căn cứ ngầm.', publisher: 'Aqua Games', image: 'ocean-depths.jpg' },
      { name: 'Silent Hill Clone', category: 'Kinh dị', price: 349000, description: 'Thành phố bị sương mù bao phủ với những sinh vật kỳ lạ.', publisher: 'Spooky Entertainment', image: 'silent-clone.jpg' },
      { name: 'Portal Puzzles', category: 'Giải đố', price: 199000, description: 'Sử dụng cổng không gian để giải đố.', publisher: 'Brain Games', image: 'portal-puzzles.jpg' },
      { name: 'Racing Thunder', category: 'Khác', price: 259000, description: 'Đua xe tốc độ cao với đồ họa chân thực.', publisher: 'Speed Games', image: 'racing-thunder.jpg' },
      { name: 'Medieval RPG', category: 'Khác', price: 399000, description: 'Nhập vai hiệp sĩ trong thế giới trung cổ.', publisher: 'Fantasy World', image: 'medieval-rpg.jpg' },
      { name: 'Zombie Survival', category: 'Sinh tồn', price: 289000, description: 'Sinh tồn trong thế giới hậu tận thế zombie.', publisher: 'Survival Studios', image: 'zombie-survival.jpg' },
      { name: 'Ghost Hunter', category: 'Kinh dị', price: 179000, description: 'Săn ma với thiết bị chuyên dụng.', publisher: 'Horror Games Inc', image: 'ghost-hunter.jpg' },
      { name: 'Chess Master', category: 'Giải đố', price: 79000, description: 'Chơi cờ vua với AI thông minh.', publisher: 'Board Games Co', image: 'chess-master.jpg' },
      { name: 'Arctic Expedition', category: 'Sinh tồn', price: 269000, description: 'Sinh tồn ở Bắc Cực với nhiệt độ âm.', publisher: 'Polar Games', image: 'arctic-expedition.jpg' },
      { name: 'Asylum Escape', category: 'Kinh dị', price: 229000, description: 'Thoát khỏi bệnh viện tâm thần bị bỏ hoang.', publisher: 'Spooky Entertainment', image: 'asylum-escape.jpg' },
      { name: 'Tetris Ultimate', category: 'Giải đố', price: 89000, description: 'Phiên bản Tetris với nhiều chế độ chơi.', publisher: 'Puzzle Masters', image: 'tetris-ultimate.jpg' },
      { name: 'Jungle Survival', category: 'Sinh tồn', price: 299000, description: 'Sinh tồn trong rừng rậm Amazon.', publisher: 'Wild Games', image: 'jungle-survival.jpg' },
      { name: 'Creepy Doll', category: 'Kinh dị', price: 159000, description: 'Con búp bê ma ám theo dõi bạn.', publisher: 'Horror Games Inc', image: 'creepy-doll.jpg' },
      { name: 'Sudoku Pro', category: 'Giải đố', price: 69000, description: 'Hàng nghìn câu đố Sudoku.', publisher: 'Number Games', image: 'sudoku-pro.jpg' },
      { name: 'City Builder', category: 'Khác', price: 329000, description: 'Xây dựng thành phố mơ ước của bạn.', publisher: 'Builder Games', image: 'city-builder.jpg' },
      { name: 'Sports Champion', category: 'Khác', price: 249000, description: 'Nhiều môn thể thao trong một game.', publisher: 'Sports Inc', image: 'sports-champion.jpg' },
      { name: 'Mountain Survival', category: 'Sinh tồn', price: 279000, description: 'Leo núi và sinh tồn ở độ cao lớn.', publisher: 'Peak Games', image: 'mountain-survival.jpg' },
      { name: 'Paranormal Files', category: 'Kinh dị', price: 219000, description: 'Điều tra các hiện tượng siêu nhiên.', publisher: 'Mystery Games', image: 'paranormal-files.jpg' },
      { name: 'Crossword King', category: 'Giải đố', price: 59000, description: 'Giải ô chữ với nhiều chủ đề.', publisher: 'Word Games Co', image: 'crossword-king.jpg' },
      { name: 'Flight Simulator', category: 'Khác', price: 449000, description: 'Mô phỏng lái máy bay thực tế.', publisher: 'Sky Games', image: 'flight-simulator.jpg' },
      { name: 'Farm Life', category: 'Khác', price: 179000, description: 'Quản lý trang trại của riêng bạn.', publisher: 'Rural Games', image: 'farm-life.jpg' },
      { name: 'Volcano Island', category: 'Sinh tồn', price: 309000, description: 'Sinh tồn trên đảo núi lửa sắp phun trào.', publisher: 'Danger Games', image: 'volcano-island.jpg' },
      { name: 'Puppet Master', category: 'Kinh dị', price: 189000, description: 'Điều khiển con rối... hay bị nó điều khiển?', publisher: 'Spooky Entertainment', image: 'puppet-master.jpg' },
      { name: 'Memory Challenge', category: 'Giải đố', price: 49000, description: 'Thử thách trí nhớ của bạn.', publisher: 'Brain Games', image: 'memory-challenge.jpg' },
      { name: 'Cooking Master', category: 'Khác', price: 159000, description: 'Trở thành đầu bếp hàng đầu.', publisher: 'Food Games', image: 'cooking-master.jpg' },
      { name: 'Music Studio', category: 'Khác', price: 289000, description: 'Sáng tác và mix nhạc chuyên nghiệp.', publisher: 'Sound Games', image: 'music-studio.jpg' },
      { name: 'Post-Apocalypse', category: 'Sinh tồn', price: 359000, description: 'Sinh tồn sau thảm họa hạt nhân.', publisher: 'Doom Games', image: 'post-apocalypse.jpg' },
      { name: 'Witch House', category: 'Kinh dị', price: 239000, description: 'Căn nhà của phù thủy đầy rẫy nguy hiểm.', publisher: 'Horror Games Inc', image: 'witch-house.jpg' },
      { name: 'Jigsaw World', category: 'Giải đố', price: 79000, description: 'Ghép hình với hàng nghìn mảnh.', publisher: 'Puzzle Masters', image: 'jigsaw-world.jpg' },
      { name: 'Dance Revolution', category: 'Khác', price: 199000, description: 'Nhảy theo nhịp nhạc sôi động.', publisher: 'Rhythm Games', image: 'dance-revolution.jpg' },
      { name: 'Pet Simulator', category: 'Khác', price: 139000, description: 'Nuôi và chăm sóc thú cưng ảo.', publisher: 'Cute Games', image: 'pet-simulator.jpg' },
      { name: 'Bunker Survival', category: 'Sinh tồn', price: 329000, description: 'Quản lý hầm trú ẩn sau ngày tận thế.', publisher: 'Survival Studios', image: 'bunker-survival.jpg' },
      { name: 'Demon Slayer', category: 'Kinh dị', price: 279000, description: 'Tiêu diệt quỷ dữ trong thế giới tăm tối.', publisher: 'Dark Games', image: 'demon-slayer.jpg' },
      { name: 'Escape Room VR', category: 'Giải đố', price: 249000, description: 'Thoát khỏi các căn phòng bí ẩn trong VR.', publisher: 'VR Games', image: 'escape-room-vr.jpg' },
      { name: 'Fishing Paradise', category: 'Khác', price: 119000, description: 'Câu cá thư giãn ở nhiều địa điểm.', publisher: 'Relax Games', image: 'fishing-paradise.jpg' },
      { name: 'Golf Pro', category: 'Khác', price: 169000, description: 'Chơi golf trên các sân nổi tiếng.', publisher: 'Sports Inc', image: 'golf-pro.jpg' }
    ];

    for (const game of sampleGames) {
      await pool.execute(`
        INSERT INTO games (name, category, price, description, publisher, image)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [game.name, game.category, game.price, game.description, game.publisher, game.image]);
    }
    console.log('Sample games added to database');
  }

  console.log('MySQL Database initialized successfully');
  return pool;
}

// Database helper functions
const db = {
  get: async (query, params = []) => {
    const [rows] = await pool.execute(query, params);
    return rows[0] || null;
  },
  
  all: async (query, params = []) => {
    const [rows] = await pool.execute(query, params);
    return rows;
  },
  
  run: async (query, params = []) => {
    const [result] = await pool.execute(query, params);
    return { lastInsertRowid: result.insertId, changes: result.affectedRows };
  },

  getPool: () => pool
};

module.exports = { initializeDatabase, db };
