/**
 * EXPORT GAMES SCRIPT (CHỈ DÀNH CHO ADMIN)
 * 
 * Chạy script này để xuất danh sách games ra file JSON:
 * node export-games.js
 * 
 * Sau đó commit và push file data/games.json lên Git
 * Các thành viên khác pull về và chạy: node sync-db.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const dbConfig = {
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
};

async function exportGames() {
  console.log('📤 Bắt đầu export games...\n');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Lấy tất cả games
    const [games] = await connection.execute(
      'SELECT name, category, price, description, publisher, image FROM games ORDER BY id'
    );
    
    // Tạo thư mục data nếu chưa có
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    
    // Ghi ra file JSON
    const outputFile = path.join(dataDir, 'games.json');
    fs.writeFileSync(outputFile, JSON.stringify(games, null, 2), 'utf8');
    
    console.log(`✅ Đã export ${games.length} games ra file data/games.json`);
    console.log('\n📋 Bước tiếp theo:');
    console.log('   1. git add data/games.json');
    console.log('   2. git commit -m "Update games data"');
    console.log('   3. git push');
    console.log('   4. Bảo thành viên khác: git pull && node sync-db.js\n');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

exportGames();




