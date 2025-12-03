# GameVault - Game Store Web Application

Một ứng dụng web bán game với đầy đủ tính năng đăng nhập, mua bán, và quản lý.

## Tính năng

### Người dùng (Users)
- ✅ Đăng ký / Đăng nhập
- ✅ Xem danh sách game với phân trang (30 game/trang, 3 game/dòng)
- ✅ Tìm kiếm real-time theo tên game
- ✅ Lọc theo danh mục (Sinh tồn, Kinh dị, Giải đố, Khác)
- ✅ Xem chi tiết game
- ✅ Thêm game vào giỏ hàng
- ✅ Mua game bằng ví tiền
- ✅ Nạp tiền vào ví
- ✅ Hoàn tiền trong vòng 2 ngày
- ✅ Xem thư viện game đã mua
- ✅ Chơi game (placeholder)
- ✅ Xem lịch sử giao dịch
- ✅ Chỉnh sửa thông tin tài khoản

### Admin
- ✅ Tất cả chức năng của User (trừ mua game)
- ✅ Quản lý danh sách game (Thêm/Sửa/Xóa)
- ✅ Tìm kiếm game theo tên hoặc ID
- ✅ Quản lý người dùng (Xem/Xóa)
- ✅ Tìm kiếm người dùng theo tên hoặc ID
- ✅ Xem thống kê doanh thu từng game

## Công nghệ sử dụng

- **Frontend**: React 18, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MySQL (mỗi người dùng MySQL riêng)
- **Auth**: JWT, bcryptjs

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT CHO THÀNH VIÊN NHÓM

### Bước 1: Clone project
```bash
git clone <repository-url>
cd elec-web
```

### Bước 2: Cài đặt dependencies
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Bước 3: Cấu hình MySQL

1. **Mở XAMPP → Start MySQL**

2. **Tạo file config từ mẫu:**
```bash
cd backend
copy config.example.js config.js
```

3. **Mở file `backend/config.js` và sửa password:**
```javascript
module.exports = {
  DB_HOST: 'localhost',
  DB_USER: 'root',
  DB_PASSWORD: '',    // ← NHẬP MẬT KHẨU MYSQL CỦA BẠN
  DB_NAME: 'elec_web',
  JWT_SECRET: 'your-secret-key-2024'
};
```

**Lưu ý:** Nếu MySQL không có password (XAMPP mặc định), để trống: `DB_PASSWORD: ''`

### Bước 4: Đồng bộ dữ liệu từ Admin
```bash
cd backend
npm run sync
```

Lệnh này sẽ:
- Tạo database `elec_web` nếu chưa có
- Tạo các bảng cần thiết
- Import tất cả games từ Admin
- Tạo tài khoản admin mặc định

### Bước 5: Chạy ứng dụng
```bash
# Từ thư mục gốc
npm run dev
```

---

## 🔄 QUY TRÌNH ĐỒNG BỘ DỮ LIỆU

### ADMIN làm:
1. Thêm/Sửa/Xóa game trên web
2. Export dữ liệu:
```bash
cd backend
npm run export
```
3. Commit và Push:
```bash
git add data/games.json
git commit -m "Update games data"
git push
```

### THÀNH VIÊN làm:
1. Pull code mới:
```bash
git pull
```
2. Đồng bộ database:
```bash
cd backend
npm run sync
```

---

## Tài khoản mặc định

**Admin:**
- Username: `admin`
- Password: `admin123`

---

## Cấu trúc thư mục

```
elec-web/
├── backend/
│   ├── routes/           # API routes
│   ├── data/
│   │   └── games.json    # Dữ liệu games (Admin cập nhật)
│   ├── uploads/          # Ảnh upload
│   ├── database.js       # Database setup
│   ├── config.js         # Cấu hình MySQL (mỗi người sửa riêng)
│   ├── sync-db.js        # Script đồng bộ database
│   ├── export-games.js   # Script export games (Admin dùng)
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       └── pages/
└── package.json
```

---

## Lệnh thường dùng

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy cả frontend và backend |
| `npm run sync` | Đồng bộ database từ games.json (trong backend/) |
| `npm run export` | Export games ra file JSON (Admin dùng, trong backend/) |

---

## Xử lý lỗi thường gặp

### ❌ "Access denied for user 'root'@'localhost'"
→ Sai password MySQL. Sửa `DB_PASSWORD` trong `backend/config.js`

### ❌ "ECONNREFUSED" 
→ MySQL chưa chạy. Mở XAMPP và Start MySQL

### ❌ "Unknown database 'elec_web'"
→ Chạy `npm run sync` trong thư mục backend

---

## Screenshots

Ứng dụng có giao diện Cyberpunk với:
- Theme tối với màu neon (cyan, magenta)
- Font Orbitron và Rajdhani
- Hiệu ứng glow và gradient
- Responsive design
