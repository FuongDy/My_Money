# Hướng Dẫn Cấu Hình Apple Shortcuts Trên iOS (iPhone)

Apple không cho phép bất kỳ ứng dụng bên thứ ba nào đọc thông báo của ứng dụng ngân hàng. Tuy nhiên, tính năng **Tự động hóa (Automation)** trong ứng dụng **Phím tắt (Shortcuts)** của iOS là công cụ mạnh mẽ để gửi biến động số dư về Backend mà không cần jailbreak máy.

---

## Các Bước Cài Đặt (Chỉ mất 2 phút)

### Bước 1: Lấy Webhook URL của bạn
1. Đăng nhập vào Web Portal (`http://localhost:3000`) hoặc Mobile App.
2. Bấm vào nút **"Cài iOS Shortcuts / Webhook"** ở góc trên.
3. Bấm **Copy** đường dẫn Webhook cá nhân của bạn, có dạng:
   ```
   https://YOUR_DOMAIN/api/v1/webhooks/capture/3f82a1b9-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

---

### Bước 2: Tạo Tự Động Hóa trên iPhone

1. Mở ứng dụng **Phím tắt (Shortcuts)** có sẵn trên iPhone.
2. Chuyển sang tab **Tự động hóa (Automation)** ở thanh dưới cùng.
3. Bấm dấu **+** ở góc trên bên phải → Chọn **Tạo mục tự động hóa cá nhân (New Automation)**.
4. Chọn điều kiện kích hoạt:
   - **Tùy chọn 1 (Khuyên dùng khi nhận SMS biến động số dư):** Chọn **Tin nhắn (Message)**.
     - Người gửi: Chọn các đầu số ngân hàng bạn dùng (VD: *MBBank, Vietcombank, Techcombank, TPBank, MoMo*).
     - Nội dung chứa: Để trống hoặc điền `VND` / `GD`.
     - Chọn: **Chạy ngay lập tức (Run Immediately)** và **Tắt** *"Thông báo khi chạy"*.
   - **Tùy chọn 2 (Khi quẹt Apple Pay):** Chọn **Giao dịch (Transaction)** → Chọn thẻ ngân hàng đã add vào Apple Pay.

---

### Bước 3: Thêm Hành Động Gọi Webhook

1. Chọn **Tác vụ mới (New Blank Automation)**.
2. Bấm **Thêm tác vụ (Add Action)** → Tìm kiếm và chọn **Lấy nội dung của URL (Get Contents of URL)**.
3. Thiết lập chi tiết như sau:
   - **URL:** Dán đường link Webhook bạn đã copy ở Bước 1.
   - Bấm vào mũi tên mở rộng:
     - **Phương thức (Method):** Chọn `POST`.
     - **Tiêu đề (Headers):**
       - Thêm trường: `Content-Type` = `application/json`
     - **Nội dung yêu cầu (Request Body):** Chọn `JSON`.
     - Thêm trường mới:
       - Khóa (Key): `rawMessage`
       - Loại: `Văn bản (Text)`
       - Giá trị: Chọn biến **Nội dung phím tắt (Shortcut Input)** hoặc **Nội dung tin nhắn (Message Content)**.
4. Bấm **Xong (Done)**.

---

## Kết quả hoạt động:
- Ngay khi bạn thanh toán tiền cơm, cà phê qua chuyển khoản hoặc quẹt thẻ:
  1. iPhone nhận tin nhắn ngân hàng.
  2. Shortcut tự động gửi nội dung sang Backend của bạn.
  3. Backend bóc tách số tiền (VD: 45.000 đ) và tạo ngay giao dịch ở trạng thái **Chờ duyệt (Pending)**.
  4. Cả máy Android, iPhone và Web Portal của bạn đều lập tức hiện thông báo hỏi: *"Vừa trừ 45K - Chọn nhanh danh mục: [Ăn uống] [Phát sinh] [Cà phê]"*.
