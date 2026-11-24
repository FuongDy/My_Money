# Hướng Dẫn Kết Nối Neon DB (Serverless PostgreSQL)

Hệ thống Saving Money sử dụng **Neon DB** — giải pháp PostgreSQL Serverless hàng đầu với khả năng tự co giãn (scale-to-zero), cực kỳ tiết kiệm chi phí và hỗ trợ Connection Pooling tối ưu cho ứng dụng đa nền tảng.

---

## 1. Đăng ký & Tạo Database

1. Truy cập [https://neon.tech](https://neon.tech) và đăng ký tài khoản (miễn phí).
2. Tạo Project mới:
   - **Name:** `saving-money`
   - **Postgres version:** `16` (mặc định)
   - **Region:** Chọn `Singapore (ap-southeast-1)` hoặc khu vực gần nhất để có độ trễ thấp nhất.
3. Sau khi tạo xong, màn hình sẽ hiển thị **Connection Details**.

---

## 2. Lấy Connection String

Chọn tab **Pooled connection** (Khuyên dùng để tối ưu số lượng kết nối đồng thời từ Web, Mobile và Cron jobs):

Chuỗi kết nối có dạng:
```
postgresql://[user]:[password]@[endpoint-id]-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

---

## 3. Cấu hình vào Dự án

1. Tạo file `.env` tại thư mục gốc hoặc trong `packages/database/.env` và `apps/backend/.env`:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[endpoint-id]-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   ```

2. Chạy lệnh đồng bộ bảng:
   ```bash
   npm run db:push
   ```

3. Nạp các danh mục chi tiêu chuẩn (Ăn uống, Cà phê, Xăng xe, Tiền nhà...):
   ```bash
   npm run db:seed
   ```

4. Quản lý dữ liệu trực quan:
   ```bash
   npm run db:studio
   ```
   Trình duyệt sẽ mở giao diện **Prisma Studio** tại `http://localhost:5555` để bạn xem trực tiếp các bảng `users`, `accounts`, `cycles`, `transactions`.
