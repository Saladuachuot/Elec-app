const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { verifyToken } = require('./auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user.is_admin) {
      return res.json({ items: [], total: 0 });
    }

    const items = await db.all(`
      SELECT c.*, g.name, g.price, g.image, g.category
      FROM cart c
      JOIN games g ON c.game_id = g.id
      WHERE c.user_id = ?
    `, [req.user.id]);

    const formattedItems = items.map(item => ({
      ...item,
      price: parseFloat(item.price)
    }));

    const total = formattedItems.reduce((sum, item) => sum + item.price, 0);

    res.json({ items: formattedItems, total });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

router.post('/add', verifyToken, async (req, res) => {
  try {
    if (req.user.is_admin) {
      return res.status(403).json({ message: 'Admin không thể mua game!' });
    }

    const { game_id } = req.body;

    const game = await db.get('SELECT id FROM games WHERE id = ?', [game_id]);
    if (!game) {
      return res.status(404).json({ message: 'Game không tồn tại!' });
    }

    const inLibrary = await db.get('SELECT id FROM user_library WHERE user_id = ? AND game_id = ?', [req.user.id, game_id]);
    if (inLibrary) {
      return res.status(400).json({ message: 'Bạn đã sở hữu game này!' });
    }

    const inCart = await db.get('SELECT id FROM cart WHERE user_id = ? AND game_id = ?', [req.user.id, game_id]);
    if (inCart) {
      return res.status(400).json({ message: 'Game đã có trong giỏ hàng!' });
    }

    await db.run('INSERT INTO cart (user_id, game_id) VALUES (?, ?)', [req.user.id, game_id]);

    res.json({ message: 'Đã thêm vào giỏ hàng!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

router.delete('/remove/:gameId', verifyToken, async (req, res) => {
  try {
    await db.run('DELETE FROM cart WHERE user_id = ? AND game_id = ?', [req.user.id, req.params.gameId]);
    res.json({ message: 'Đã xóa khỏi giỏ hàng!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

router.post('/checkout', verifyToken, async (req, res) => {
  try {
    if (req.user.is_admin) {
      return res.status(403).json({ message: 'Admin không thể mua game!' });
    }

    const user = await db.get('SELECT wallet_balance FROM users WHERE id = ?', [req.user.id]);
    const cartItems = await db.all(`
      SELECT c.game_id, g.price, g.name
      FROM cart c
      JOIN games g ON c.game_id = g.id
      WHERE c.user_id = ?
    `, [req.user.id]);

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống!' });
    }

    const total = cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);

    if (parseFloat(user.wallet_balance) < total) {
      return res.status(400).json({ message: 'Số dư không đủ! Vui lòng nạp thêm tiền.' });
    }

    await db.run('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?', [total, req.user.id]);

    for (const item of cartItems) {
      await db.run('INSERT INTO user_library (user_id, game_id) VALUES (?, ?)', [req.user.id, item.game_id]);
      
      await db.run('UPDATE games SET sales_count = sales_count + 1 WHERE id = ?', [item.game_id]);
      
      await db.run(`
        INSERT INTO transactions (user_id, type, amount, game_id, description)
        VALUES (?, 'purchase', ?, ?, ?)
      `, [req.user.id, parseFloat(item.price), item.game_id, `Mua game: ${item.name}`]);
    }

    await db.run('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

    const newBalance = await db.get('SELECT wallet_balance FROM users WHERE id = ?', [req.user.id]);

    res.json({ 
      message: 'Mua hàng thành công!',
      new_balance: parseFloat(newBalance.wallet_balance)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

module.exports = router;
