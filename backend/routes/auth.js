const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { db } = require('../database');

const JWT_SECRET = config.JWT_SECRET;

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, display_name, birthdate } = req.body;

    // Check if email exists
    const emailExists = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (emailExists) {
      return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống!' });
    }

    // Check if password is unique (as per requirement)
    const passwordHash = bcrypt.hashSync(password, 10);
    const allUsers = await db.all('SELECT password FROM users');
    for (const user of allUsers) {
      if (bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ message: 'Mật khẩu này đã được sử dụng, vui lòng chọn mật khẩu khác!' });
      }
    }

    // Create user
    const result = await db.run(`
      INSERT INTO users (username, email, password, display_name, birthdate, wallet_balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [username, email, passwordHash, display_name, birthdate, 0]);

    res.status(201).json({ 
      message: 'Đăng ký thành công!',
      userId: result.lastInsertRowid 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(400).json({ message: 'Tài khoản không tồn tại!' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Mật khẩu không đúng!' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        wallet_balance: parseFloat(user.wallet_balance),
        is_admin: user.is_admin,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Không có token!' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ!' });
  }
};

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại!' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      birthdate: user.birthdate,
      wallet_balance: parseFloat(user.wallet_balance),
      is_admin: user.is_admin,
      avatar: user.avatar
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

module.exports = router;
module.exports.verifyToken = verifyToken;
