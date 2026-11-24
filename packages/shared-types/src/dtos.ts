import {
  AccountType,
  TransactionType,
  TransactionNature,
  TransactionSource,
  TransactionStatus,
  RecurringFrequency,
  DevicePlatform
} from './enums';

// Auth
export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    webhookSecretKey: string;
  };
}

// Transactions
export interface CreateTransactionDto {
  accountId: string;
  categoryId?: string;
  toAccountId?: string;
  type: TransactionType;
  amount: number;
  occurredAt?: string;
  nature?: TransactionNature;
  note?: string;
  source?: TransactionSource;
  status?: TransactionStatus;
}

export interface QuickSave30kDto {
  dailyAccountId: string;
  savingsAccountId: string;
  amount?: number; // Mặc định 30,000; có thể cộng thêm tiền dư (VD 30,000 + 20,000 = 50,000)
  note?: string;
}

export interface ConfirmPendingTransactionDto {
  categoryId: string;
  nature: TransactionNature;
  note?: string;
}

// Webhook payload from iOS Shortcuts or Android Notification Listener
export interface IngestNotificationDto {
  rawMessage: string;
  sender?: string;       // Tên ngân hàng / app (VD: MB Bank, Techcombank, Vietcombank)
  detectedAmount?: number;
  occurredAt?: string;
}

// Device registration for Push
export interface RegisterDeviceDto {
  platform: DevicePlatform;
  deviceName: string;
  fcmToken: string;
}

// Cycles
export interface CreateCycleDto {
  name: string;
  startDate: string;
  endDate: string;
  dailySpendLimit?: number;
  dailySavingTarget?: number;
}

// Recurring
export interface CreateRecurringRuleDto {
  accountId: string;
  categoryId?: string;
  title: string;
  amount: number;
  type: TransactionType;
  nature?: TransactionNature;
  frequency: RecurringFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  monthOfYear?: number;
}
