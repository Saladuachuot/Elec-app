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
- ✅ Tất cả chức năng của User
- ✅ Quản lý danh sách game (Thêm/Sửa/Xóa)
- ✅ Tìm kiếm game theo tên hoặc ID
- ✅ Quản lý người dùng (Xem/Xóa)
- ✅ Tìm kiếm người dùng theo tên hoặc ID
- ✅ Xem thống kê doanh thu từng game

## Công nghệ sử dụng

- **Frontend**: React 18, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT, bcryptjs

## Cài đặt

```bash
# Cài đặt tất cả dependencies
npm run install-all

# Hoặc cài thủ công
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Chạy ứng dụng

```bash
# Chạy cả frontend và backend
npm run dev

# Hoặc chạy riêng
npm run server  # Backend trên port 5000
npm run client  # Frontend trên port 3000
```

## Tài khoản mặc định

**Admin:**
- Username: `admin`
- Password: `admin123`

## Cấu trúc thư mục

```
elec-web/
├── backend/
│   ├── routes/
│   │   ├── auth.js      # Đăng nhập/Đăng ký
│   │   ├── games.js     # Quản lý game
│   │   ├── users.js     # Quản lý user
│   │   ├── cart.js      # Giỏ hàng
│   │   ├── library.js   # Thư viện game
│   │   └── transactions.js # Lịch sử giao dịch
│   ├── database.js      # SQLite database
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── Navbar.css
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Store.jsx
│   │   │   ├── GameDetail.jsx
│   │   │   ├── PlayGame.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Library.jsx
│   │   │   └── Settings.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
└── package.json
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Games
- `GET /api/games` - Danh sách game (có phân trang, search, filter)
- `GET /api/games/:id` - Chi tiết game
- `POST /api/games` - Thêm game (Admin)
- `PUT /api/games/:id` - Sửa game (Admin)
- `DELETE /api/games/:id` - Xóa game (Admin)
- `GET /api/games/admin/statistics` - Thống kê doanh thu (Admin)

### Users
- `GET /api/users` - Danh sách user (Admin)
- `PUT /api/users/profile` - Cập nhật profile
- `PUT /api/users/password` - Đổi mật khẩu
- `POST /api/users/wallet/deposit` - Nạp tiền
- `DELETE /api/users/:id` - Xóa user (Admin)

### Cart
- `GET /api/cart` - Xem giỏ hàng
- `POST /api/cart/add` - Thêm vào giỏ
- `DELETE /api/cart/remove/:gameId` - Xóa khỏi giỏ
- `POST /api/cart/checkout` - Thanh toán

### Library
- `GET /api/library` - Xem thư viện
- `GET /api/library/owns/:gameId` - Kiểm tra sở hữu game
- `POST /api/library/refund/:gameId` - Hoàn tiền game

### Transactions
- `GET /api/transactions` - Lịch sử giao dịch

## Screenshots

Ứng dụng có giao diện Cyberpunk với:
- Theme tối với màu neon (cyan, magenta)
- Font Orbitron và Rajdhani
- Hiệu ứng glow và gradient
- Responsive design

