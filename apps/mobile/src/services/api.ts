import { Platform } from 'react-native';

export let API_URL = `http://127.0.0.1:3001/api/v1`;

export function parseSmartAmount(input: string): number {
  if (!input) return 0;
  const raw = input.trim().toLowerCase();
  
  const isNegative = raw.startsWith('-');
  const cleanSign = raw.replace(/^-/, '');

  // Xử lý đuôi 'k' (VD: 45k -> 45000)
  if (cleanSign.endsWith('k')) {
    const num = parseFloat(cleanSign.replace('k', '').replace(/,/g, '.'));
    const val = isNaN(num) ? 0 : Math.round(num * 1000);
    return isNegative ? -val : val;
  }
  
  // Xử lý đuôi 'tr' hoặc 'm' (VD: 1.5tr -> 1500000)
  if (cleanSign.endsWith('tr') || cleanSign.endsWith('m')) {
    const num = parseFloat(cleanSign.replace(/(tr|m)/g, '').replace(/,/g, '.'));
    const val = isNaN(num) ? 0 : Math.round(num * 1000000);
    return isNegative ? -val : val;
  }

  // Chuẩn hóa dấu chấm/phẩy nếu người dùng nhập số thường
  const clean = cleanSign.replace(/[.,\s]/g, '');
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;

  // Nếu người dùng nhập số nhỏ hơn 1000 (VD: 1, 2, 45, 150), tự động quy về nghìn đồng (45 -> 45.000 đ)
  if (num > 0 && num < 1000) {
    const val = num * 1000;
    return isNegative ? -val : val;
  }

  return isNegative ? -num : num;
}

export class MobileApiService {
  private static token: string | null = null;

  static setToken(token: string) {
    this.token = token;
  }

  static getToken(): string | null {
    return this.token;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Lỗi kết nối máy chủ');
      }

      return res.json();
    } catch (err: any) {
      if (API_URL.includes('127.0.0.1')) {
        API_URL = 'http://192.168.1.149:3001/api/v1';
        return this.request<T>(endpoint, options);
      }
      throw err;
    }
  }

  // Auth
  static login(email: string, password: string) {
    return this.request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static register(email: string, password: string, fullName: string) {
    return this.request<{ accessToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
  }

  static getProfile() {
    return this.request<any>('/auth/me');
  }

  // Accounts
  static getAccounts() {
    return this.request<any[]>('/accounts');
  }

  static updateAccountBalance(accountId: string, balance: number) {
    return this.request(`/accounts/${accountId}/balance`, {
      method: 'PATCH',
      body: JSON.stringify({ balance }),
    });
  }

  static updateCycleLimits(data: { dailySpendLimit?: number; dailySavingTarget?: number }) {
    return this.request('/cycles/active', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static quickSave30k(dailyAccountId: string, savingsAccountId: string, amount: number = 30000, note?: string) {
    return this.request('/accounts/quick-save-30k', {
      method: 'POST',
      body: JSON.stringify({ dailyAccountId, savingsAccountId, amount, note }),
    });
  }

  // Stats
  static getCycleStats() {
    return this.request<any>('/cycles/stats');
  }

  // Transactions
  static getTransactions(categoryId?: string, limit = 50) {
    const query = categoryId ? `?categoryId=${categoryId}&limit=${limit}` : `?limit=${limit}`;
    return this.request<any[]>(`/transactions${query}`);
  }

  static createTransaction(data: any) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static deleteTransaction(id: string) {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  static getCategories() {
    return this.request<any[]>('/transactions/categories');
  }

  static createCategory(data: { name: string; icon?: string; color?: string }) {
    return this.request('/transactions/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static updateCategory(id: string, data: { name?: string; icon?: string; color?: string }) {
    return this.request(`/transactions/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static deleteCategory(id: string) {
    return this.request(`/transactions/categories/${id}`, {
      method: 'DELETE',
    });
  }

  static getCategoryReports() {
    return this.request<{ totalExpense: number; report: any[] }>('/transactions/category-reports');
  }

  // Recurring
  static getRecurringRules() {
    return this.request<any[]>('/recurring');
  }

  static createRecurringRule(data: any) {
    return this.request('/recurring', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static toggleRecurringRule(id: string) {
    return this.request(`/recurring/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  static runRecurringRule(id: string) {
    return this.request(`/recurring/${id}/run`, {
      method: 'POST',
    });
  }

  static deleteRecurringRule(id: string) {
    return this.request(`/recurring/${id}`, {
      method: 'DELETE',
    });
  }
}
