# Hướng Dẫn Cấu Hình Bắt Thông Báo Ngân Hàng Trên Android

Khác với iOS, hệ điều hành Android cung cấp API chính thức `NotificationListenerService` cho phép ứng dụng đọc nội dung thông báo đẩy từ các ứng dụng ngân hàng và ví điện tử.

---

## 1. Cơ Chế Hoạt Động

```
[App Ngân hàng VN (MB, VCB, Momo...)]
           │
           ▼ (Bắn thông báo biến động số dư)
[Android System Notification Tray]
           │
           ▼
[NotificationListenerService của App]
           │
           ▼ (Trích xuất: 45.000 VND, MB Bank, Nội dung)
[Gửi API lên Backend: /api/v1/transactions hoặc /api/v1/webhooks/capture/:secretKey]
           │
           ▼
[Tạo giao dịch PENDING & Thông báo chọn danh mục nhanh]
```

---

## 2. Các Ứng Dụng Ngân Hàng Hỗ Trợ Mặc Định

Bộ phân tích Regex của Backend đã được cấu hình nhận diện:
- **MB Bank** (`MBBANK`, `MB: GD -...`)
- **Techcombank** (`TCB`, `TECHCOMBANK`)
- **Vietcombank** (`VCB`, `VIETCOMBANK`)
- **TPBank** (`TPBANK`, `TPB`)
- **VPBank** (`VPBANK`)
- **ACB** (`ACB`)
- **Ví MoMo** (`MOMO`)
- **ZaloPay**
- **Apple Pay / Google Wallet**

---

## 3. Cấp Quyền Trên Thiết Bị Android

Khi cài đặt ứng dụng Android từ Expo (hoặc file APK):
1. Mở ứng dụng lần đầu.
2. Ứng dụng sẽ yêu cầu quyền: **Truy cập thông báo (Notification Access)**.
3. Chọn **Saving Money** trong danh sách và gạt sang **Cho phép (Allow)**.
4. Đảm bảo tắt tính năng "Tối ưu hóa pin" (Battery Optimization) cho app Saving Money để hệ thống Android không ngắt tiến trình chạy ngầm.
