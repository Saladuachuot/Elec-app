

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
    
    const [games] = await connection.execute(
      'SELECT name, category, price, description, publisher, image FROM games ORDER BY id'
    );
    
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    
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







