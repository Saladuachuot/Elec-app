// ============================================
// CẤU HÌNH DATABASE - MỖI NGƯỜI SỬA THEO MÁY MÌNH
// ============================================

module.exports = {
  DB_HOST: 'localhost',
  DB_USER: 'root',
  DB_PASSWORD: '15122006',  // ← SỬA MẬT KHẨU MYSQL CỦA BẠN VÀO ĐÂY
  DB_NAME: 'elec_web',
  JWT_SECRET: 'your-secret-key-2024'
};

// ============================================
// HƯỚNG DẪN SETUP:
// 1. Mở XAMPP → Start MySQL
// 2. Sửa DB_PASSWORD thành password MySQL của bạn
//    - Không có password: DB_PASSWORD: ''
//    - Có password: DB_PASSWORD: 'matkhaucuaban'
// 3. Lưu file
// 4. Chạy: node sync-db.js (lần đầu tiên)
// 5. Chạy: node server.js
// ============================================
