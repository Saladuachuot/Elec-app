const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database');
const { verifyToken } = require('./auth');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/games');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Chỉ cho phép file ảnh (jpeg, jpg, png, gif, webp)!'));
  }
});

// Get all games with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 30, search = '', category = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM games WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM games WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND name LIKE ?';
      countQuery += ' AND name LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    if (category) {
      query += ' AND category = ?';
      countQuery += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }

    query += ` ORDER BY id DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const games = await db.all(query, params);
    const totalResult = await db.get(countQuery, countParams);
    const total = totalResult?.total || 0;

    const formattedGames = games.map(g => ({
      ...g,
      price: parseFloat(g.price)
    }));

    res.json({
      games: formattedGames,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalGames: total,
        gamesPerPage: limitNum
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

// Get game statistics (admin only)
router.get('/admin/statistics', verifyToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Không có quyền truy cập!' });
    }

    const games = await db.all(`
      SELECT g.*, 
        (SELECT COUNT(*) FROM user_library WHERE game_id = g.id) as total_sales
      FROM games g
      ORDER BY total_sales DESC
    `, []);

    const gamesWithRevenue = games.map(game => ({
      ...game,
      price: parseFloat(game.price),
      revenue: game.total_sales * parseFloat(game.price)
    }));

    const totalRevenue = gamesWithRevenue.reduce((sum, game) => sum + game.revenue, 0);
    const totalSales = gamesWithRevenue.reduce((sum, game) => sum + game.total_sales, 0);

    res.json({
      games: gamesWithRevenue,
      summary: {
        totalRevenue,
        totalSales,
        totalGames: games.length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

// Get single game
router.get('/:id', async (req, res) => {
  try {
    const game = await db.get('SELECT * FROM games WHERE id = ?', [req.params.id]);
    if (!game) {
      return res.status(404).json({ message: 'Game không tồn tại!' });
    }
    game.price = parseFloat(game.price);
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

// Add game with image (admin only)
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Không có quyền truy cập!' });
    }

    const { name, category, price, description, publisher } = req.body;
    const image = req.file ? req.file.filename : 'default-game.png';

    const result = await db.run(`
      INSERT INTO games (name, category, price, description, publisher, image)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, category, price, description, publisher, image]);

    res.status(201).json({
      message: 'Thêm game thành công!',
      gameId: result.lastInsertRowid
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

// Update game with image (admin only)
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Không có quyền truy cập!' });
    }

    const { name, category, price, description, publisher } = req.body;
    
    // Get current game to check old image
    const currentGame = await db.get('SELECT image FROM games WHERE id = ?', [req.params.id]);
    
    let image = currentGame?.image || 'default-game.png';
    if (req.file) {
      // Delete old image if it exists and is not default
      if (currentGame?.image && currentGame.image !== 'default-game.png') {
        const oldImagePath = path.join(__dirname, '../uploads/games', currentGame.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image = req.file.filename;
    }

    await db.run(`
      UPDATE games SET name = ?, category = ?, price = ?, description = ?, publisher = ?, image = ?
      WHERE id = ?
    `, [name, category, price, description, publisher, image, req.params.id]);

    res.json({ message: 'Cập nhật game thành công!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

// Delete game (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Không có quyền truy cập!' });
    }

    // Get game image to delete
    const game = await db.get('SELECT image FROM games WHERE id = ?', [req.params.id]);
    if (game?.image && game.image !== 'default-game.png') {
      const imagePath = path.join(__dirname, '../uploads/games', game.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.run('DELETE FROM games WHERE id = ?', [req.params.id]);
    res.json({ message: 'Xóa game thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

// Get categories
router.get('/meta/categories', (req, res) => {
  res.json(['Sinh tồn', 'Kinh dị', 'Giải đố', 'Khác']);
});

module.exports = router;
