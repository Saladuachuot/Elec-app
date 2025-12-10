const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { verifyToken } = require('./auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const transactions = await db.all(`
      SELECT t.*, g.name as game_name
      FROM transactions t
      LEFT JOIN games g ON t.game_id = g.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [req.user.id]);

    const formattedTransactions = transactions.map(t => ({
      ...t,
      amount: parseFloat(t.amount)
    }));

    res.json(formattedTransactions);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

module.exports = router;
