// ============================================
// CẤU HÌNH DATABASE - SỬA THÔNG TIN Ở ĐÂY
// ============================================

module.exports = {
  // Thông tin kết nối MySQL
  DB_HOST: 'localhost',
  DB_USER: 'root',
  DB_PASSWORD: 'bi148139nh207',        // ← NHẬP PASSWORD MYSQL CỦA BẠN VÀO ĐÂY
  DB_NAME: 'elec_web',
  
  // JWT Secret (có thể giữ nguyên)
  JWT_SECRET: 'your-secret-key-2024'
};

// ============================================
// HƯỚNG DẪN:
// 1. Mở XAMPP và start MySQL
// 2. Sửa DB_PASSWORD ở trên thành password MySQL của bạn
//    - Nếu không có password, để trống: DB_PASSWORD: ''
//    - Nếu có password: DB_PASSWORD: 'matkhaucuaban'
// 3. Lưu file này
// 4. Chạy: node server.js
// ============================================

