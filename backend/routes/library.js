const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { verifyToken } = require('./auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const games = await db.all(`
      SELECT ul.*, g.name, g.category, g.price, g.image, g.description, g.publisher,
        CASE 
          WHEN ul.purchased_at > DATE_SUB(NOW(), INTERVAL 2 DAY) THEN 1 
          ELSE 0 
        END as can_refund
      FROM user_library ul
      JOIN games g ON ul.game_id = g.id
      WHERE ul.user_id = ?
      ORDER BY ul.purchased_at DESC
    `, [req.user.id]);

    const formattedGames = games.map(g => ({
      ...g,
      price: parseFloat(g.price)
    }));

    res.json(formattedGames);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

router.get('/owns/:gameId', verifyToken, async (req, res) => {
  try {
    const owns = await db.get('SELECT id FROM user_library WHERE user_id = ? AND game_id = ?', [req.user.id, req.params.gameId]);
    res.json({ owns: !!owns });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

router.post('/refund/:gameId', verifyToken, async (req, res) => {
  try {
    const purchase = await db.get(`
      SELECT ul.*, g.price, g.name
      FROM user_library ul
      JOIN games g ON ul.game_id = g.id
      WHERE ul.user_id = ? AND ul.game_id = ?
    `, [req.user.id, req.params.gameId]);

    if (!purchase) {
      return res.status(404).json({ message: 'Bạn không sở hữu game này!' });
    }

    const purchaseDate = new Date(purchase.purchased_at);
    const now = new Date();
    const diffDays = (now - purchaseDate) / (1000 * 60 * 60 * 24);

    if (diffDays > 2) {
      return res.status(400).json({ message: 'Đã quá thời hạn hoàn tiền (2 ngày)!' });
    }

    const refundAmount = parseFloat(purchase.price);

    await db.run('DELETE FROM user_library WHERE user_id = ? AND game_id = ?', [req.user.id, req.params.gameId]);
    await db.run('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [refundAmount, req.user.id]);
    await db.run('UPDATE games SET sales_count = sales_count - 1 WHERE id = ?', [req.params.gameId]);

    await db.run(`
      INSERT INTO transactions (user_id, type, amount, game_id, description)
      VALUES (?, 'refund', ?, ?, ?)
    `, [req.user.id, refundAmount, req.params.gameId, `Hoàn tiền game: ${purchase.name}`]);

    const newBalance = await db.get('SELECT wallet_balance FROM users WHERE id = ?', [req.user.id]);

    res.json({ 
      message: 'Hoàn tiền thành công!',
      new_balance: parseFloat(newBalance.wallet_balance)
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

module.exports = router;
