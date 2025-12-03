/**
 * SYNC DATABASE SCRIPT
 * 
 * Chạy script này để đồng bộ dữ liệu từ Admin:
 * node sync-db.js
 * 
 * Script sẽ:
 * 1. Xóa tất cả games cũ
 * 2. Thêm games mới từ file data/games.json
 * 3. Tạo tài khoản admin mặc định nếu chưa có
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const dbConfig = {
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
};

async function syncDatabase() {
  console.log('🔄 Bắt đầu đồng bộ database...\n');
  
  let connection;
  try {
    // Kết nối MySQL
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    // Tạo database nếu chưa có
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.changeUser({ database: dbConfig.database });
    
    console.log('✅ Kết nối database thành công');
    
    // Tạo bảng nếu chưa có
    await connection.execute(`
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
    
    await connection.execute(`
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
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_library (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        game_id INT NOT NULL,
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        can_refund TINYINT DEFAULT 1,
        UNIQUE KEY unique_user_game (user_id, game_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        game_id INT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_cart_item (user_id, game_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        game_id INT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tạo bảng thành công');
    
    // Đọc file games.json
    const gamesFile = path.join(__dirname, 'data', 'games.json');
    if (!fs.existsSync(gamesFile)) {
      console.log('❌ Không tìm thấy file data/games.json');
      return;
    }
    
    const gamesData = JSON.parse(fs.readFileSync(gamesFile, 'utf8'));
    console.log(`📦 Đọc được ${gamesData.length} games từ file`);
    
    // Xóa games cũ và thêm mới
    await connection.execute('DELETE FROM cart');
    await connection.execute('DELETE FROM user_library');
    await connection.execute('DELETE FROM transactions');
    await connection.execute('DELETE FROM games');
    console.log('🗑️  Đã xóa dữ liệu cũ');
    
    // Thêm games mới
    for (const game of gamesData) {
      await connection.execute(
        `INSERT INTO games (name, category, price, description, publisher, image) VALUES (?, ?, ?, ?, ?, ?)`,
        [game.name, game.category, game.price, game.description, game.publisher, game.image || 'default-game.png']
      );
    }
    console.log(`✅ Đã thêm ${gamesData.length} games`);
    
    // Tạo tài khoản admin mặc định
    const [adminRows] = await connection.execute("SELECT id FROM users WHERE username = ?", ['admin']);
    if (adminRows.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await connection.execute(
        `INSERT INTO users (username, email, password, display_name, is_admin, wallet_balance) VALUES (?, ?, ?, ?, ?, ?)`,
        ['admin', 'admin@gamestore.com', hashedPassword, 'Administrator', 1, 10000]
      );
      console.log('✅ Đã tạo tài khoản admin: admin / admin123');
    } else {
      console.log('ℹ️  Tài khoản admin đã tồn tại');
    }
    
    console.log('\n🎉 ĐỒNG BỘ HOÀN TẤT!\n');
    
  } catch (error) {
    console.error('\n❌ LỖI:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n👉 Sai mật khẩu MySQL! Sửa DB_PASSWORD trong config.js');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n👉 MySQL chưa chạy! Mở XAMPP và Start MySQL');
    }
  } finally {
    if (connection) await connection.end();
  }
}

syncDatabase();


