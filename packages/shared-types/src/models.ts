import {
  AccountType,
  TransactionType,
  TransactionNature,
  TransactionSource,
  TransactionStatus,
  RecurringFrequency,
  DevicePlatform,
  CycleStatus
} from './enums';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  webhookSecretKey: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserDevice {
  id: string;
  userId: string;
  platform: DevicePlatform;
  deviceName: string;
  fcmToken: string;
  isActive: boolean;
  lastActiveAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currentBalance: number;
  bankName?: string;
  accountNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cycle {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  dailySpendLimit: number;
  dailySavingTarget: number; // Mặc định 30,000 VND
  status: CycleStatus;
  createdAt: string;
}

export interface Category {
  id: string;
  userId?: string | null;
  name: string;
  icon: string;
  color: string;
  defaultNature: TransactionNature;
  isSystem: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  toAccountId?: string | null; // Dùng khi type = TRANSFER
  categoryId?: string | null;
  type: TransactionType;
  amount: number;
  occurredAt: string;
  nature: TransactionNature;
  note?: string;
  source: TransactionSource;
  status: TransactionStatus;
  rawPayload?: string; // Nội dung tin nhắn ngân hàng gốc (nếu có)
  createdAt: string;
  category?: Category;
  account?: Account;
}

export interface RecurringRule {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string | null;
  title: string;
  amount: number;
  type: TransactionType;
  nature: TransactionNature;
  frequency: RecurringFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  monthOfYear?: number;
  isActive: boolean;
  lastRunAt?: string;
}

export interface CycleStatistics {
  cycle: Cycle;
  totalDays: number;
  daysPassed: number;
  daysRemaining: number;
  
  // Chi tiêu
  totalSpent: number;
  todaySpent: number;
  dailyLimit: number;
  todayRemainingLimit: number;
  isTodayOverLimit: boolean;
  essentialSpent: number;
  flexibleSpent: number;
  unexpectedSpent: number;
  
  // Tiết kiệm (Lộ trình 30K/ngày)
  dailySavingTarget: number;
  expectedSavingSoFar: number; // daysPassed * 30,000
  actualSavedSoFar: number;    // Tổng số tiền đã chuyển vào TK Savings trong chu kỳ
  savingProgressPercent: number;
  hasSavedToday: boolean;      // Hôm nay đã bấm chuyển 30K chưa
  
  // Số lượng giao dịch chờ duyệt
  pendingCount: number;
}
