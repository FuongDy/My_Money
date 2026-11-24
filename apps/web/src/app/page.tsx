'use client';

import React, { useEffect, useState } from 'react';
import {
  Wallet,
  PiggyBank,
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  LogOut,
  Trash2,
  Tag,
  BarChart3,
  ListFilter,
  Plus,
  Play,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { ApiService, parseSmartAmount } from '../lib/api';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryReports, setCategoryReports] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Tab view: 'dashboard' | 'categories' | 'history'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'categories' | 'history'>('dashboard');

  // Auth form modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('thien@savingmoney.app');
  const [authPassword, setAuthPassword] = useState('password123');
  const [authFullName, setAuthFullName] = useState('Thien');
  const [authError, setAuthError] = useState('');

  // Quick Add Transaction Modal (Smart Amount)
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [rawAmountInput, setRawAmountInput] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txNature, setTxNature] = useState('ESSENTIAL');
  const [txNote, setTxNote] = useState('');

  // Category Add Modal
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  // Recurring Rule Modal (Khoản cố định định kỳ)
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleRawAmount, setRuleRawAmount] = useState('');
  const [ruleType, setRuleType] = useState('EXPENSE'); // EXPENSE | INCOME | TRANSFER
  const [ruleFrequency, setRuleFrequency] = useState('MONTHLY'); // DAILY | WEEKLY | MONTHLY | YEARLY
  const [ruleDayOfMonth, setRuleDayOfMonth] = useState('5');
  const [ruleDayOfWeek, setRuleDayOfWeek] = useState('1');
  const [ruleMonthOfYear, setRuleMonthOfYear] = useState('1');

  const loadData = async () => {
    try {
      setLoading(true);
      const [prof, accs, st, txs, cats, reps, rls] = await Promise.all([
        ApiService.getProfile().catch(() => null),
        ApiService.getAccounts().catch(() => []),
        ApiService.getCycleStats().catch(() => null),
        ApiService.getTransactions(selectedCategoryFilter || undefined, 100).catch(() => []),
        ApiService.getCategories().catch(() => []),
        ApiService.getCategoryReports().catch(() => null),
        ApiService.getRecurringRules().catch(() => []),
      ]);

      if (prof) {
        setUser(prof);
      } else {
        setIsAuthModalOpen(true);
      }
      setAccounts(accs);
      setStats(st);
      setTransactions(txs);
      setCategories(cats);
      setCategoryReports(reps);
      setRules(rls);
      if (cats.length > 0 && !txCategory) {
        setTxCategory(cats[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const existingToken = ApiService.getToken();
    if (existingToken) {
      setToken(existingToken);
      loadData();
    } else {
      setIsAuthModalOpen(true);
      setLoading(false);
    }
  }, [selectedCategoryFilter]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      let res;
      if (authMode === 'login') {
        res = await ApiService.login(authEmail, authPassword);
      } else {
        res = await ApiService.register(authEmail, authPassword, authFullName);
      }
      ApiService.setToken(res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
      setIsAuthModalOpen(false);
      loadData();
    } catch (err: any) {
      setAuthError(err.message || 'Lỗi xác thực');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setIsAuthModalOpen(true);
  };

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const dailyAcc = accounts.find((a) => a.type === 'DAILY');
    const finalAmount = parseSmartAmount(rawAmountInput);

    if (!dailyAcc || finalAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ (VD: 45 hoặc 45k)');
      return;
    }

    try {
      await ApiService.createTransaction({
        accountId: dailyAcc.id,
        categoryId: txCategory || (categories[0]?.id ?? undefined),
        amount: finalAmount,
        type: 'EXPENSE',
        nature: txNature,
        note: txNote || 'Chi tiêu',
      });
      setIsAddTxOpen(false);
      setRawAmountInput('');
      setTxNote('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi ghi chi tiêu');
    }
  };

  const handleDeleteTx = async (txId: string) => {
    if (!confirm('Bạn có chắc muốn xóa khoản chi này? Số dư sẽ được hoàn lại.')) return;
    try {
      await ApiService.deleteTransaction(txId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa giao dịch');
    }
  };

  // RECURRING RULE HANDLERS
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const dailyAcc = accounts.find((a) => a.type === 'DAILY');
    const finalAmount = parseSmartAmount(ruleRawAmount);

    if (!ruleTitle.trim() || finalAmount <= 0 || !dailyAcc) {
      alert('Vui lòng nhập tên và số tiền hợp lệ (VD: 30k, 3.5tr)');
      return;
    }

    try {
      await ApiService.createRecurringRule({
        accountId: dailyAcc.id,
        categoryId: txCategory || categories[0]?.id,
        title: ruleTitle.trim(),
        amount: finalAmount,
        type: ruleType,
        frequency: ruleFrequency,
        dayOfMonth: ruleFrequency === 'MONTHLY' || ruleFrequency === 'YEARLY' ? parseInt(ruleDayOfMonth) : undefined,
        dayOfWeek: ruleFrequency === 'WEEKLY' ? parseInt(ruleDayOfWeek) : undefined,
        monthOfYear: ruleFrequency === 'YEARLY' ? parseInt(ruleMonthOfYear) : undefined,
      });

      setIsAddRuleOpen(false);
      setRuleTitle('');
      setRuleRawAmount('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo khoản cố định');
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      await ApiService.toggleRecurringRule(ruleId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi đổi trạng thái');
    }
  };

  const handleRunRuleNow = async (ruleId: string) => {
    try {
      await ApiService.runRecurringRule(ruleId);
      alert('Đã thực thi thành công! Số dư đã được cập nhật.');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi thực thi');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Xóa khoản cố định này?')) return;
    try {
      await ApiService.deleteRecurringRule(ruleId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await ApiService.createCategory({
        name: newCatName.trim(),
        color: newCatColor,
      });
      setNewCatName('');
      setIsAddCatOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo danh mục');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Xóa danh mục này? Các giao dịch cũ sẽ được chuyển về "Chưa phân loại".')) return;
    try {
      await ApiService.deleteCategory(catId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa danh mục');
    }
  };

  const previewAmount = parseSmartAmount(rawAmountInput);
  const previewRuleAmount = parseSmartAmount(ruleRawAmount);
  const dailyAccount = accounts.find((a) => a.type === 'DAILY');
  const savingsAccount = accounts.find((a) => a.type === 'SAVINGS');

  const chartData = [
    { day: 'Ngày 1', mucTieu: 30, thucTe: 30 },
    { day: 'Ngày 5', mucTieu: 150, thucTe: 150 },
    { day: 'Ngày 10', mucTieu: 300, thucTe: 320 },
    { day: 'Ngày 15', mucTieu: 450, thucTe: 480 },
    { day: 'Ngày 20', mucTieu: 600, thucTe: 630 },
    { day: 'Hôm nay', mucTieu: stats?.expectedSavingSoFar ? stats.expectedSavingSoFar / 1000 : 720, thucTe: stats?.actualSavedSoFar ? stats.actualSavedSoFar / 1000 : 750 },
    { day: 'Cuối kỳ', mucTieu: stats?.totalTargetSaving ? stats.totalTargetSaving / 1000 : 900, thucTe: null },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Saving Money Portal</h1>
              <p className="text-xs text-slate-500">Quản lý dòng tiền & Khoản cố định tự động</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <nav className="hidden sm:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'categories' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Danh mục ({categories.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lịch sử ({transactions.length})
              </button>
            </nav>

            {user ? (
              <>
                <button
                  onClick={() => setIsAddTxOpen(true)}
                  className="flex items-center space-x-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl shadow transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Ghi chi tiêu</span>
                </button>
                <div className="text-right pl-2 hidden md:block">
                  <div className="text-xs font-semibold text-slate-800">{user.fullName}</div>
                  <div className="text-[11px] text-slate-500">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {activeTab === 'dashboard' ? (
          <>
            {/* 2 Account Balance Cards & Khoản Cố Định Tự Động */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Daily Account Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tài khoản Hằng ngày
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-slate-900">
                  {dailyAccount ? Number(dailyAccount.currentBalance).toLocaleString('vi-VN') : '0'} đ
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Hạn mức hôm nay: {stats ? Number(stats.dailyLimit).toLocaleString('vi-VN') : '150.000'} đ</span>
                  <span className={stats?.isTodayOverLimit ? 'text-red-500 font-bold' : 'text-emerald-600 font-semibold'}>
                    {stats?.isTodayOverLimit
                      ? `Vượt ${Math.abs(stats.todayRemainingLimit).toLocaleString('vi-VN')} đ`
                      : `Hôm nay còn ${stats?.todayRemainingLimit?.toLocaleString('vi-VN') || 0} đ`}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setIsAddTxOpen(true)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition"
                  >
                    <PlusCircle className="w-4 h-4 text-slate-600" />
                    <span>Ghi nhanh khoản chi</span>
                  </button>
                </div>
              </div>

              {/* Savings Account Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tài khoản Tiết kiệm (Tích lũy)
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <PiggyBank className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black text-indigo-600">
                  {savingsAccount ? Number(savingsAccount.currentBalance).toLocaleString('vi-VN') : '0'} đ
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Tiến độ chu kỳ:</span>
                  <span className="font-bold text-indigo-600">{stats?.savingProgressPercent || 0}% Target</span>
                </div>
                <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, stats?.savingProgressPercent || 0)}%` }}
                  />
                </div>
              </div>

              {/* KHOẢN CỐ ĐỊNH & ĐỊNH KỲ TỰ ĐỘNG (THAY THẾ CHO NÚT BẤM CỨNG) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Khoản Cố Định Tự Động
                    </span>
                    <button
                      onClick={() => setIsAddRuleOpen(true)}
                      className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition"
                    >
                      + Thêm khoản
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Tự động trừ hoặc cộng số dư theo ngày, tuần, tháng, năm.
                  </p>
                </div>

                <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-1">
                  {rules.length === 0 ? (
                    <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl text-center border border-dashed border-slate-200">
                      Chưa có khoản cố định nào. Bấm "+ Thêm khoản" để tạo!
                    </div>
                  ) : (
                    rules.map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{r.title}</div>
                          <div className="text-[10px] text-slate-400">
                            {r.frequency === 'DAILY'
                              ? 'Mỗi ngày'
                              : r.frequency === 'WEEKLY'
                              ? `Thứ ${r.dayOfWeek === 0 ? 'CN' : r.dayOfWeek + 1}`
                              : r.frequency === 'MONTHLY'
                              ? `Ngày ${r.dayOfMonth} hàng tháng`
                              : `Ngày ${r.dayOfMonth}/${r.monthOfYear} hàng năm`}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-extrabold ${
                              r.type === 'INCOME'
                                ? 'text-emerald-600'
                                : r.type === 'TRANSFER'
                                ? 'text-indigo-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {r.type === 'INCOME' ? '+' : r.type === 'TRANSFER' ? '⇄ ' : '-'}
                            {Number(r.amount).toLocaleString('vi-VN')} đ
                          </span>
                          <button
                            onClick={() => handleRunRuleNow(r.id)}
                            className="p-1 text-indigo-600 hover:bg-indigo-100 rounded"
                            title="Thực thi ngay"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(r.id)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Báo cáo theo Danh mục & Lộ trình 30K */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cột 1: Báo cáo chi tiêu theo Danh mục */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Báo cáo theo Danh mục</h3>
                    <p className="text-xs text-slate-500">
                      Tổng chi: {Number(categoryReports?.totalExpense || 0).toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Quản lý
                  </button>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {categoryReports?.report?.map((r: any) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        setSelectedCategoryFilter(r.id === 'uncategorized' ? null : r.id);
                        setActiveTab('history');
                      }}
                      className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 cursor-pointer transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                          <span className="font-bold text-slate-800">{r.name}</span>
                          <span className="text-[10px] text-slate-400">({r.transactionCount} lần)</span>
                        </div>
                        <span className="font-extrabold text-slate-900">
                          {Number(r.totalAmount).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${r.percentage}%`, backgroundColor: r.color }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 text-right">{r.percentage}% chi tiêu</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cột 2 & 3: Biểu đồ Lộ trình tích lũy */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Tiến độ Tích lũy Chu kỳ (Nghìn đồng)</h3>
                    <p className="text-xs text-slate-500">So sánh thực tế tích lũy vs Kỳ vọng</p>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                      <span className="text-slate-600">Thực tế</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                      <span className="text-slate-500">Mục tiêu</span>
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorThucTe" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        formatter={(val: any) => [`${val}K VND`, '']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="mucTieu"
                        stroke="#cbd5e1"
                        strokeDasharray="4 4"
                        fill="none"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="thucTe"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorThucTe)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Confirmed Transactions Table */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Giao dịch gần đây</h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Xem tất cả ({transactions.length})
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5">Thời gian</th>
                      <th className="py-2.5">Khoản chi & Ghi chú</th>
                      <th className="py-2.5">Danh mục</th>
                      <th className="py-2.5 text-right">Số tiền</th>
                      <th className="py-2.5 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Chưa có giao dịch nào.
                        </td>
                      </tr>
                    ) : (
                      transactions.slice(0, 8).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 text-slate-500 whitespace-nowrap">
                            {new Date(t.occurredAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </td>
                          <td className="py-3 font-semibold text-slate-800">{t.note || 'Chi tiêu'}</td>
                          <td className="py-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                              {t.category?.name || 'Chưa phân loại'}
                            </span>
                          </td>
                          <td
                            className={`py-3 text-right font-bold whitespace-nowrap ${
                              t.type === 'INCOME'
                                ? 'text-emerald-600'
                                : t.type === 'TRANSFER'
                                ? 'text-indigo-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {t.type === 'INCOME' ? '+' : t.type === 'TRANSFER' ? '⇄ ' : '-'}
                            {Number(t.amount).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleDeleteTx(t.id)}
                              className="text-slate-400 hover:text-red-500 transition p-1"
                              title="Xóa giao dịch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === 'categories' ? (
          /* TAB QUẢN LÝ DANH MỤC */
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Quản lý Danh mục chi tiêu</h2>
                <p className="text-xs text-slate-500">Tự tạo danh mục riêng, phân loại dòng tiền theo nhu cầu</p>
              </div>
              <button
                onClick={() => setIsAddCatOpen(true)}
                className="flex items-center space-x-1.5 text-xs font-bold bg-indigo-600 text-white px-3.5 py-2 rounded-xl hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm danh mục mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => {
                const reportItem = categoryReports?.report?.find((r: any) => r.id === c.id);
                return (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-200 hover:shadow-sm transition bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="font-bold text-sm text-slate-900">{c.name}</span>
                      </div>
                      {!c.isSystem ? (
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="text-slate-400 hover:text-red-500 transition p-1"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Mặc định</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                      <span>Tổng chi:</span>
                      <span className="font-extrabold text-slate-800">
                        {reportItem ? Number(reportItem.totalAmount).toLocaleString('vi-VN') : '0'} đ
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* TAB LỊCH SỬ GIAO DỊCH TOÀN BỘ */
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {selectedCategoryFilter
                    ? `Lọc theo: ${categories.find((c) => c.id === selectedCategoryFilter)?.name}`
                    : `Lịch sử toàn bộ giao dịch (${transactions.length})`}
                </h2>
                <p className="text-xs text-slate-500">Xem và đối soát toàn bộ thu chi</p>
              </div>
              {selectedCategoryFilter && (
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Xóa bộ lọc danh mục
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5">Thời gian</th>
                    <th className="py-2.5">Khoản chi & Ghi chú</th>
                    <th className="py-2.5">Danh mục</th>
                    <th className="py-2.5 text-right">Số tiền</th>
                    <th className="py-2.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 text-slate-500 whitespace-nowrap">
                        {new Date(t.occurredAt).toLocaleDateString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </td>
                      <td className="py-3 font-semibold text-slate-800">{t.note || 'Chi tiêu'}</td>
                      <td className="py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {t.category?.name || 'Chưa phân loại'}
                        </span>
                      </td>
                      <td
                        className={`py-3 text-right font-bold whitespace-nowrap ${
                          t.type === 'INCOME'
                            ? 'text-emerald-600'
                            : t.type === 'TRANSFER'
                            ? 'text-indigo-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {t.type === 'INCOME' ? '+' : t.type === 'TRANSFER' ? '⇄ ' : '-'}
                        {Number(t.amount).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleDeleteTx(t.id)}
                          className="text-slate-400 hover:text-red-500 transition p-1"
                          title="Xóa giao dịch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Manual Quick Add Modal (Hỗ trợ nhập 45 hoặc 45k) */}
      {isAddTxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateTx} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Ghi chi tiêu nhanh</h3>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Số tiền:
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Nhập số tiền"
                value={rawAmountInput}
                onChange={(e) => setRawAmountInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-lg font-bold outline-none focus:border-indigo-600 bg-white"
              />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">Hệ thống hiểu:</span>
                <span className="font-extrabold text-indigo-600 text-sm">
                  {previewAmount > 0 ? `${previewAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
                </span>
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {['10k', '20k', '30k', '45k', '50k', '100k'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setRawAmountInput(chip)}
                    className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 rounded-md"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Danh mục</label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Tính chất</label>
              <select
                value={txNature}
                onChange={(e) => setTxNature(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
              >
                <option value="ESSENTIAL">Thiết yếu (Cơm, Xăng xe, Tiền nhà)</option>
                <option value="FLEXIBLE">Linh hoạt (Cà phê, Vặt, Giải trí)</option>
                <option value="UNEXPECTED">Phát sinh bất khả kháng (Sửa xe, Đám tiệc)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Ghi chú</label>
              <input
                type="text"
                placeholder="VD: Cơm trưa bò kho"
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddTxOpen(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow"
              >
                Lưu ngay
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Cài Đặt Khoản Cố Định (Ngày / Tuần / Tháng / Năm) */}
      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateRule} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Cài đặt Khoản Cố Định</h3>
              <p className="text-xs text-slate-500">Tự động trừ/cộng số dư theo lịch lặp lại</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Tên khoản</label>
              <input
                type="text"
                required
                placeholder="VD: Tiền trọ, Netflix, Lương..."
                value={ruleTitle}
                onChange={(e) => setRuleTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
              />
            </div>

            {/* Smart Amount */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Số tiền:
              </label>
              <input
                type="text"
                required
                placeholder="Nhập số tiền"
                value={ruleRawAmount}
                onChange={(e) => setRuleRawAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-bold outline-none focus:border-indigo-600 bg-white"
              />
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-slate-500">Hệ thống hiểu:</span>
                <span className="font-extrabold text-indigo-600">
                  {previewRuleAmount > 0 ? `${previewRuleAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
                </span>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-medium text-slate-600">Loại dòng tiền</label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {[
                  { key: 'EXPENSE', label: 'Trừ (Chi)' },
                  { key: 'INCOME', label: 'Cộng (Thu)' },
                  { key: 'TRANSFER', label: 'Tích lũy' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setRuleType(item.key)}
                    className={`text-xs py-2 rounded-lg font-semibold transition ${
                      ruleType === item.key
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="text-xs font-medium text-slate-600">Lặp lại theo</label>
              <div className="grid grid-cols-4 gap-1 mt-1">
                {[
                  { key: 'DAILY', label: 'Mỗi ngày' },
                  { key: 'WEEKLY', label: 'Tuần' },
                  { key: 'MONTHLY', label: 'Tháng' },
                  { key: 'YEARLY', label: 'Năm' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setRuleFrequency(item.key)}
                    className={`text-xs py-1.5 rounded-lg font-semibold transition ${
                      ruleFrequency === item.key
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency parameters */}
            {ruleFrequency === 'MONTHLY' && (
              <div>
                <label className="text-xs font-medium text-slate-600">Vào ngày cố định trong tháng (1 - 31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={ruleDayOfMonth}
                  onChange={(e) => setRuleDayOfMonth(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                />
              </div>
            )}

            {ruleFrequency === 'WEEKLY' && (
              <div>
                <label className="text-xs font-medium text-slate-600">Vào thứ mấy trong tuần</label>
                <select
                  value={ruleDayOfWeek}
                  onChange={(e) => setRuleDayOfWeek(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                >
                  <option value="1">Thứ Hai</option>
                  <option value="2">Thứ Ba</option>
                  <option value="3">Thứ Tư</option>
                  <option value="4">Thứ Năm</option>
                  <option value="5">Thứ Sáu</option>
                  <option value="6">Thứ Bảy</option>
                  <option value="0">Chủ Nhật</option>
                </select>
              </div>
            )}

            {ruleFrequency === 'YEARLY' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600">Ngày (1 - 31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={ruleDayOfMonth}
                    onChange={(e) => setRuleDayOfMonth(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Tháng (1 - 12)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={ruleMonthOfYear}
                    onChange={(e) => setRuleMonthOfYear(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddRuleOpen(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow"
              >
                Lưu khoản
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddCatOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateCategory} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tạo danh mục mới</h3>

            <div>
              <label className="text-xs font-medium text-slate-600">Tên danh mục</label>
              <input
                type="text"
                required
                placeholder="VD: Tiền trọ, Thú cưng, Gym..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Màu đại diện</label>
              <div className="flex gap-2.5 mt-2">
                {['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewCatColor(col)}
                    className={`w-6 h-6 rounded-full transition ${newCatColor === col ? 'ring-2 ring-slate-900 ring-offset-2' : ''}`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddCatOpen(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow"
              >
                Tạo mục
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAuthSubmit} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-2 shadow">
                <PiggyBank className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {authMode === 'login' ? 'Đăng nhập Saving Money' : 'Đăng ký tài khoản'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Dữ liệu cá nhân riêng biệt 100%</p>
            </div>

            {authError && (
              <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200">{authError}</div>
            )}

            {authMode === 'register' && (
              <div>
                <label className="text-xs font-medium text-slate-600">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={authFullName}
                  onChange={(e) => setAuthFullName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-600">Email</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Mật khẩu</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow"
            >
              {authMode === 'login' ? 'Đăng nhập ngay' : 'Đăng ký tài khoản'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                }}
                className="text-xs text-indigo-600 hover:underline"
              >
                {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký tại đây' : 'Đã có tài khoản? Đăng nhập'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
