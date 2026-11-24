export enum AccountType {
  DAILY = 'DAILY',       // Tài khoản chi tiêu hằng ngày
  SAVINGS = 'SAVINGS'    // Tài khoản tiết kiệm mục tiêu 30K
}

export enum TransactionType {
  EXPENSE = 'EXPENSE',   // Chi tiêu
  INCOME = 'INCOME',     // Thu nhập
  TRANSFER = 'TRANSFER'  // Chuyển khoản nội bộ (VD: Daily -> Savings)
}

export enum TransactionNature {
  ESSENTIAL = 'ESSENTIAL',     // Khoản thiết yếu (Cơm, tiền nhà, xăng xe, điện nước)
  FLEXIBLE = 'FLEXIBLE',       // Khoản linh hoạt (Cà phê, trà sữa, ăn vặt, giải trí)
  UNEXPECTED = 'UNEXPECTED'    // Khoản phát sinh bất khả kháng (Sửa xe, đám tiệc, khám bệnh)
}

export enum TransactionSource {
  MANUAL = 'MANUAL',                       // Nhập tay qua Mobile/Web
  AUTO_ANDROID_NOTIF = 'AUTO_ANDROID_NOTIF', // Bắt tự động qua Notification Listener (Android)
  AUTO_IOS_SHORTCUT = 'AUTO_IOS_SHORTCUT',   // Bắt tự động qua Apple Shortcuts Webhook (iOS)
  BANK_WEBHOOK = 'BANK_WEBHOOK',             // Webhook từ SePay/Casso
  RECURRING = 'RECURRING'                    // Sinh tự động từ Cron Job
}

export enum TransactionStatus {
  PENDING = 'PENDING',       // Giao dịch tự động bắt được, chờ người dùng gán danh mục & xác nhận
  CONFIRMED = 'CONFIRMED',   // Đã xác nhận & tính vào số dư
  CANCELLED = 'CANCELLED'    // Đã hủy / bỏ qua
}

export enum RecurringFrequency {
  DAILY = 'DAILY',       // Hằng ngày
  WEEKDAY = 'WEEKDAY',   // Thứ 2 đến Thứ 6
  WEEKEND = 'WEEKEND',   // Thứ 7 & Chủ Nhật
  WEEKLY = 'WEEKLY',     // Hằng tuần (chọn thứ)
  MONTHLY = 'MONTHLY',   // Ngày cố định trong tháng (1 - 31)
  YEARLY = 'YEARLY'      // Hàng năm
}

export enum DevicePlatform {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB'
}

export enum CycleStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}
