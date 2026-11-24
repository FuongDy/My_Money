const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function parseSmartAmount(input: string): number {
  if (!input) return 0;
  const raw = input.trim().toLowerCase();
  
  if (raw.endsWith('k')) {
    const num = parseFloat(raw.replace('k', '').replace(/,/g, '.'));
    return isNaN(num) ? 0 : Math.round(num * 1000);
  }
  
  if (raw.endsWith('tr') || raw.endsWith('m')) {
    const num = parseFloat(raw.replace(/(tr|m)/g, '').replace(/,/g, '.'));
    return isNaN(num) ? 0 : Math.round(num * 1000000);
  }

  const clean = raw.replace(/[.,\s]/g, '');
  const num = parseFloat(clean);
  if (isNaN(num) || num <= 0) return 0;

  // Nếu người dùng nhập 1, 2, 45, 120 (< 1000), tự động quy về nghìn đồng (45 -> 45.000 đ)
  if (num < 1000) {
    return num * 1000;
  }

  return num;
}

export class ApiService {
  private static token: string | null = null;

  static setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  static getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'API request failed');
    }

    return res.json();
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
