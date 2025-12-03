const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { verifyToken } = require('./auth');

// Get all users (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Không có quyền truy cập!' });
    }

    const { search = '' } = req.query;
    let query = 'SELECT id, username, email, display_name, wallet_balance, is_admin, created_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (username LIKE ? OR display_name LIKE ? OR id = ?)';
      params.push(`%${search}%`, `%${search}%`, parseInt(search) || 0);
    }

    const users = await db.all(query, params);
    const formattedUsers = users.map(u => ({
      ...u,
      wallet_balance: parseFloat(u.wallet_balance)
    }));
    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { display_name, email, birthdate } = req.body;

    // Check if email is taken by another user
    const emailExists = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
    if (emailExists) {
      return res.status(400).json({ message: 'Email đã được sử dụng!' });
    }

    await db.run(`
      UPDATE users SET display_name = ?, email = ?, birthdate = ?
      WHERE id = ?
    `, [display_name, email, birthdate, req.user.id]);

    res.json({ message: 'Cập nhật thông tin thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

// Change password
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await db.get('SELECT password FROM users WHERE id = ?', [req.user.id]);
    
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng!' });
    }

    // Check if new password is unique
    const allUsers = await db.all('SELECT password FROM users WHERE id != ?', [req.user.id]);
    for (const u of allUsers) {
      if (bcrypt.compareSync(newPassword, u.password)) {
        return res.status(400).json({ message: 'Mật khẩu này đã được sử dụng!' });
      }
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

// Add money to wallet
router.post('/wallet/deposit', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ message: 'Số tiền không hợp lệ!' });
    }

    await db.run('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [amount, req.user.id]);
    
    // Record transaction
    await db.run(`
      INSERT INTO transactions (user_id, type, amount, description)
      VALUES (?, 'deposit', ?, 'Nạp tiền vào ví')
    `, [req.user.id, amount]);

    const user = await db.get('SELECT wallet_balance FROM users WHERE id = ?', [req.user.id]);

    res.json({ 
      message: 'Nạp tiền thành công!',
      new_balance: parseFloat(user.wallet_balance)
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

// Delete user (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Không có quyền truy cập!' });
    }

    const userId = req.params.id;

    // Don't allow deleting admin
    const user = await db.get('SELECT is_admin FROM users WHERE id = ?', [userId]);
    if (user && user.is_admin) {
      return res.status(400).json({ message: 'Không thể xóa tài khoản admin!' });
    }

    // Delete related data (cascade should handle this, but just in case)
    await db.run('DELETE FROM cart WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM user_library WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM transactions WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'Xóa người dùng thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

module.exports = router;
