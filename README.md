# Saving Money — Hệ Thống Quản Lý Chi Tiêu & Tiết Kiệm 30K/Ngày

Hệ thống quản lý tài chính cá nhân đa nền tảng (**React Native Expo (iOS & Android) + Next.js Web Portal + NestJS Backend API + Neon DB Serverless PostgreSQL**), hỗ trợ **Multi-user** (mỗi người dùng có tài khoản & dữ liệu riêng biệt 100%) và **Đồng bộ đa thiết bị**.

---

## 1. Cấu Trúc Monorepo

```
SavingMoney/
├── apps/
│   ├── backend/         # NestJS API (Port 3001) - Auth, 2 Accounts, Cycles, Cron Job 00:05, Webhooks
│   ├── web/             # Next.js 14 Web Portal (Port 3000) - Dashboard, Recharts, Quản lý chu kỳ
│   └── mobile/          # React Native (Expo) - Chạy trên cả Android & iOS, 1 chạm chốt 30K
├── packages/
│   ├── database/        # Prisma Schema & Client cấu hình sẵn cho Neon DB PostgreSQL
│   └── shared-types/    # TypeScript Enums, Interfaces, DTOs dùng chung cho cả 3 apps
└── docs/
    ├── ios-shortcuts-setup.md           # Hướng dẫn chi tiết Apple Shortcuts trên iPhone
    ├── android-notification-listener.md  # Hướng dẫn quyền Notification Listener trên Android
    └── neon-db-setup.md                 # Hướng dẫn tạo tài khoản & lấy connection string Neon DB
```

---

## 2. Hướng Dẫn Cài Đặt Nhanh (Getting Started)

### Bước 1: Kết nối Neon DB (PostgreSQL)
1. Đăng ký tài khoản miễn phí tại [Neon.tech](https://neon.tech).
2. Tạo project mới (ví dụ: `saving-money-db`).
3. Copy chuỗi kết nối **Pooled Connection**:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
4. Dán vào file `.env` ở:
   - `packages/database/.env`
   - `apps/backend/.env`

5. Đẩy schema lên Neon DB & nạp danh mục mặc định:
   ```bash
   npm run db:push
   npm run db:seed
   ```

---

### Bước 2: Chạy Backend API (NestJS)
```bash
npm run dev:backend
```
- API chạy tại: `http://localhost:3001/api/v1`
- Tài liệu Swagger tương tác: `http://localhost:3001/docs`

---

### Bước 3: Chạy Web Portal (Next.js)
```bash
npm run dev:web
```
- Truy cập trình duyệt: `http://localhost:3000`
- Giao diện Dashboard gồm 2 tài khoản, thanh tiến độ 30K/ngày, biểu đồ chi tiêu và duyệt giao dịch chờ.

---

### Bước 4: Chạy Mobile App (React Native Expo)
```bash
npm run dev:mobile
```
- Quét mã QR bằng app **Expo Go** trên iPhone hoặc điện thoại Android để trải nghiệm ngay lập tức.
- Thao tác 1 chạm chốt tiết kiệm 30.000 đ hoặc cộng dư `+10K`, `+20K`, `+50K`.

---

## 3. Cơ Chế Bắt Biến Động Số Dư Khi Dùng Song Song Android & iOS

### Trên iPhone (iOS):
Do iOS bảo mật không cho app đọc thông báo app khác, hệ thống dùng **Apple Shortcuts (Phím tắt)**:
1. Vào Web Portal hoặc App Mobile, copy link Webhook riêng của bạn:
   `http://localhost:3001/api/v1/webhooks/capture/[YOUR_SECRET_KEY]`
2. Mở app **Phím tắt** trên iPhone → Tab **Tự động hóa** → Chọn *"Khi nhận tin nhắn"* (từ MB, Vietcombank, Momo...) hoặc *"Khi dùng Apple Pay"*.
3. Thêm tác vụ **Lấy nội dung của URL (POST)**, truyền nội dung tin nhắn vào body JSON.
4. Tắt *"Hỏi trước khi chạy"* → Tự động chạy ngầm 100%!

### Trên Android:
App tích hợp dịch vụ `NotificationListenerService` đọc trực tiếp thông báo từ ngân hàng, trích xuất số tiền qua Regex và đẩy lên mục **Chờ duyệt (Pending)**.

---

## 4. Scripts Lệnh Tiện Ích

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run dev:backend` | Khởi động Backend API chế độ watch |
| `npm run dev:web` | Khởi động Next.js Web Portal |
| `npm run dev:mobile` | Khởi động Expo Mobile App |
| `npm run db:generate` | Tạo lại Prisma Client khi cập nhật schema |
| `npm run db:push` | Đồng bộ cấu trúc bảng lên Neon DB |
| `npm run db:seed` | Nạp các danh mục chi tiêu chuẩn |
| `npm run db:studio` | Mở giao diện trực quan quản lý dữ liệu Prisma Studio |
