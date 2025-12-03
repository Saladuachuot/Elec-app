const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initializeDatabase } = require('./database');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, 'uploads/games');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database and start server
initializeDatabase().then(() => {
  console.log('Database initialized');
  
  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/games', require('./routes/games'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/cart', require('./routes/cart'));
  app.use('/api/library', require('./routes/library'));
  app.use('/api/transactions', require('./routes/transactions'));

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
