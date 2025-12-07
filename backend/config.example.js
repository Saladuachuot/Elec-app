// ============================================
// CẤU HÌNH DATABASE - COPY FILE NÀY THÀNH config.js
// ============================================
// 
// Bước 1: Copy file này thành config.js
//         copy config.example.js config.js
//
// Bước 2: Sửa DB_PASSWORD theo máy của bạn
//
// ============================================

module.exports = {
  DB_HOST: 'localhost',
  DB_USER: 'root',
  DB_PASSWORD: '',           // ← SỬA MẬT KHẨU MYSQL CỦA BẠN VÀO ĐÂY
  DB_NAME: 'elec_web',
  JWT_SECRET: 'your-secret-key-2024'
};

// ============================================
// HƯỚNG DẪN SETUP:
// 1. Mở XAMPP → Start MySQL
// 2. Sửa DB_PASSWORD thành password MySQL của bạn
//    - Không có password: DB_PASSWORD: ''
//    - Có password: DB_PASSWORD: 'matkhaucuaban'
// 3. Lưu file config.js
// 4. Chạy: npm run sync (lần đầu tiên)
// 5. Chạy: npm run dev
// ============================================




