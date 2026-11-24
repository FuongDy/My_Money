import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { MobileApiService, parseSmartAmount } from './src/services/api';

export default function App() {
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

  // Tabs: 'home' | 'reports' | 'categories' | 'history'
  const [activeTab, setActiveTab] = useState<'home' | 'reports' | 'categories' | 'history'>('home');

  // Auth modal
  const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState('thien@savingmoney.app');
  const [authPassword, setAuthPassword] = useState('password123');
  const [authFullName, setAuthFullName] = useState('Thien');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Quick Add Modal
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [rawAmountInput, setRawAmountInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [newNature, setNewNature] = useState('ESSENTIAL');
  const [newNote, setNewNote] = useState('');

  // Category Manage Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  // Recurring Rule Modal (Khoản cố định / định kỳ)
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleRawAmount, setRuleRawAmount] = useState('');
  const [ruleType, setRuleType] = useState('EXPENSE'); // EXPENSE | INCOME | TRANSFER
  const [ruleAccountId, setRuleAccountId] = useState(''); // Chọn tài khoản nào (Daily hay Savings)
  const [ruleFrequency, setRuleFrequency] = useState('MONTHLY'); // DAILY | WEEKLY | MONTHLY | YEARLY
  const [ruleDayOfMonth, setRuleDayOfMonth] = useState('5');
  const [ruleDayOfWeek, setRuleDayOfWeek] = useState('1'); // 1: T2
  const [ruleMonthOfYear, setRuleMonthOfYear] = useState('1');

  // Account Balance / Limit Setting Modal
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<any>(null);
  const [accountBalanceInput, setAccountBalanceInput] = useState('');
  const [accountLimitInput, setAccountLimitInput] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      let currentToken = MobileApiService.getToken();
      if (!currentToken) {
        try {
          const autoRes = await MobileApiService.login('thien@savingmoney.app', 'password123');
          MobileApiService.setToken(autoRes.accessToken);
          currentToken = autoRes.accessToken;
          setUser(autoRes.user);
        } catch {
          setIsAuthModalVisible(true);
          setLoading(false);
          return;
        }
      }

      const [prof, accs, st, txs, cats, reps, rls] = await Promise.all([
        MobileApiService.getProfile().catch(() => null),
        MobileApiService.getAccounts().catch(() => []),
        MobileApiService.getCycleStats().catch(() => null),
        MobileApiService.getTransactions(selectedCategoryFilter || undefined, 100).catch(() => []),
        MobileApiService.getCategories().catch(() => []),
        MobileApiService.getCategoryReports().catch(() => null),
        MobileApiService.getRecurringRules().catch(() => []),
      ]);

      if (prof) {
        setUser(prof);
      }
      setAccounts(accs);
      setStats(st);
      setTransactions(txs);
      setCategories(cats);
      setCategoryReports(reps);
      setRules(rls);
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, selectedCategoryFilter]);

  const handleAuth = async () => {
    try {
      setLoading(true);
      let res;
      if (authMode === 'login') {
        res = await MobileApiService.login(authEmail, authPassword);
      } else {
        res = await MobileApiService.register(authEmail, authPassword, authFullName);
      }
      MobileApiService.setToken(res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
      setIsAuthModalVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Lỗi xác thực', err.message || 'Không thể đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTx = async () => {
    const dailyAcc = accounts.find((a) => a.type === 'DAILY');
    const finalAmount = parseSmartAmount(rawAmountInput);

    if (!dailyAcc || finalAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ (VD: 45 hoặc 45k)');
      return;
    }

    try {
      await MobileApiService.createTransaction({
        accountId: dailyAcc.id,
        categoryId: selectedCategory || categories[0]?.id,
        amount: finalAmount,
        type: 'EXPENSE',
        nature: newNature,
        note: newNote || 'Chi tiêu',
      });
      setIsAddTxOpen(false);
      setRawAmountInput('');
      setNewNote('');
      loadData();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Ghi chi tiêu thất bại');
    }
  };

  const handleDeleteTx = async (txId: string) => {
    try {
      await MobileApiService.deleteTransaction(txId);
      loadData();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể xóa giao dịch');
    }
  };

  // ACCOUNT BALANCE & LIMIT HANDLERS
  const openAccountEdit = (acc: any) => {
    if (!acc) return;
    setSelectedAccountForEdit(acc);
    setAccountBalanceInput(String(Math.round(Number(acc.currentBalance))));
    if (acc.type === 'DAILY') {
      setAccountLimitInput(String(stats?.dailyLimit ? Math.round(Number(stats.dailyLimit)) : 150000));
    } else {
      setAccountLimitInput(String(stats?.dailySavingTarget ? Math.round(Number(stats.dailySavingTarget)) : 30000));
    }
    setIsAccountModalOpen(true);
  };

  const handleSaveAccountSettings = async () => {
    if (!selectedAccountForEdit) return;
    const newBalance = parseSmartAmount(accountBalanceInput);
    const newLimit = parseSmartAmount(accountLimitInput);

    try {
      await MobileApiService.updateAccountBalance(selectedAccountForEdit.id, newBalance);
      if (newLimit > 0) {
        if (selectedAccountForEdit.type === 'DAILY') {
          await MobileApiService.updateCycleLimits({ dailySpendLimit: newLimit });
        } else {
          await MobileApiService.updateCycleLimits({ dailySavingTarget: newLimit });
        }
      }
      setIsAccountModalOpen(false);
      loadData();
      Alert.alert('Thành công 🎉', `Đã cập nhật ${selectedAccountForEdit.name || (selectedAccountForEdit.type === 'DAILY' ? 'TK Hằng ngày' : 'TK Tiết kiệm')}`);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật số dư');
    }
  };

  // RECURRING RULE HANDLERS
  const handleCreateRule = async () => {
    const targetAccId = ruleAccountId || accounts.find((a) => a.type === 'DAILY')?.id || accounts[0]?.id;
    const finalAmount = parseSmartAmount(ruleRawAmount);

    if (!ruleTitle.trim() || finalAmount <= 0 || !targetAccId) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và số tiền hợp lệ (VD: 30k, 3.5tr)');
      return;
    }

    try {
      await MobileApiService.createRecurringRule({
        accountId: targetAccId,
        categoryId: selectedCategory || categories[0]?.id,
        title: ruleTitle.trim(),
        amount: finalAmount,
        type: ruleType,
        frequency: ruleFrequency,
        dayOfMonth: ruleFrequency === 'MONTHLY' || ruleFrequency === 'YEARLY' ? parseInt(ruleDayOfMonth) : undefined,
        dayOfWeek: ruleFrequency === 'WEEKLY' ? parseInt(ruleDayOfWeek) : undefined,
        monthOfYear: ruleFrequency === 'YEARLY' ? parseInt(ruleMonthOfYear) : undefined,
      });

      setIsAddRuleModalOpen(false);
      setRuleTitle('');
      setRuleRawAmount('');
      Alert.alert('Thành công 🎉', `Đã cài đặt khoản "${ruleTitle}"`);
      loadData();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo khoản cố định');
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      await MobileApiService.toggleRecurringRule(ruleId);
      loadData();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể đổi trạng thái');
    }
  };

  const handleRunRuleNow = async (ruleId: string, title: string) => {
    try {
      await MobileApiService.runRecurringRule(ruleId);
      Alert.alert('Đã thực thi!', `Khoản "${title}" đã được ghi nhận vào số dư.`);
      loadData();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể thực thi');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await MobileApiService.deleteRecurringRule(ruleId);
      loadData();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể xóa');
    }
  };

  const previewAmount = parseSmartAmount(rawAmountInput);
  const previewRuleAmount = parseSmartAmount(ruleRawAmount);
  const dailyAccount = accounts.find((a) => a.type === 'DAILY');
  const savingsAccount = accounts.find((a) => a.type === 'SAVINGS');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Saving Money</Text>
          <Text style={styles.headerSubtitle}>
            {user ? `${user.fullName} • Quản lý dòng tiền & Khoản cố định` : 'Chưa đăng nhập'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsAddTxOpen(true)}
          style={styles.headerAddBtn}
        >
          <Text style={styles.headerAddBtnText}>+ Ghi chi tiêu</Text>
        </TouchableOpacity>
      </View>

      {/* Body Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Đang đồng bộ dữ liệu...</Text>
        </View>
      ) : activeTab === 'home' ? (
        /* TAB 1: HÔM NAY (SỐ DƯ & KHOẢN CỐ ĐỊNH TỰ ĐỘNG) */
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* 2 Account Cards (Bấm để cài đặt số dư & hạn mức) */}
          <View style={styles.cardsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openAccountEdit(dailyAccount)}
              style={[styles.accountCard, styles.dailyCard]}
            >
              <View style={styles.accountCardHeaderRow}>
                <Text style={styles.accountCardLabel}>TK HẰNG NGÀY</Text>
                <View style={styles.editAccountPill}>
                  <Text style={styles.editAccountPillText}>✏️ Đổi số dư</Text>
                </View>
              </View>
              <Text style={styles.accountBalance}>
                {dailyAccount ? Number(dailyAccount.currentBalance).toLocaleString('vi-VN') : '0'} đ
              </Text>
              <Text style={styles.limitText}>
                Hạn mức ngày: {stats ? Number(stats.dailyLimit).toLocaleString('vi-VN') : '150.000'} đ
              </Text>
              <Text style={[styles.spentText, stats?.isTodayOverLimit ? styles.overLimit : styles.underLimit]}>
                {stats?.isTodayOverLimit
                  ? `Vượt: ${Math.abs(stats.todayRemainingLimit).toLocaleString('vi-VN')} đ`
                  : `Hôm nay còn: ${stats?.todayRemainingLimit?.toLocaleString('vi-VN') || 0} đ`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openAccountEdit(savingsAccount)}
              style={[styles.accountCard, styles.savingsCard]}
            >
              <View style={styles.accountCardHeaderRow}>
                <Text style={styles.accountCardLabel}>TIẾT KIỆM TÍCH LŨY</Text>
                <View style={styles.editAccountPill}>
                  <Text style={styles.editAccountPillText}>✏️ Đổi số dư</Text>
                </View>
              </View>
              <Text style={[styles.accountBalance, { color: '#4f46e5' }]}>
                {savingsAccount ? Number(savingsAccount.currentBalance).toLocaleString('vi-VN') : '0'} đ
              </Text>
              <Text style={styles.limitText}>
                Mục tiêu chu kỳ: {stats ? Number(stats.totalTargetSaving).toLocaleString('vi-VN') : '900.000'} đ
              </Text>
              <Text style={[styles.spentText, { color: '#4f46e5' }]}>
                Đạt: {stats?.savingProgressPercent || 0}% Target
              </Text>
            </TouchableOpacity>
          </View>

          {/* KHOẢN CỐ ĐỊNH & ĐỊNH KỲ TỰ ĐỘNG (THAY CHO NÚT BẤM CỨNG) */}
          <View style={styles.fixedRulesSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.fixedRulesSectionTitle}>KHOẢN CỐ ĐỊNH & TỰ ĐỘNG</Text>
                <Text style={styles.fixedRulesSectionSub} numberOfLines={1} ellipsizeMode="tail">
                  Tự động trừ/cộng tiền theo chu kỳ
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddRuleModalOpen(true)}
                style={styles.addRuleBtn}
              >
                <Text style={styles.addRuleBtnText}>+ Thêm khoản</Text>
              </TouchableOpacity>
            </View>

            {rules.length === 0 ? (
              <View style={styles.emptyRulesCard}>
                <Text style={styles.emptyRulesText}>
                  Bạn chưa tạo khoản cố định nào. Bấm "+ Thêm khoản" để tạo (VD: Tiền nhà, Netflix, Lương, Trích tiết kiệm 30K...).
                </Text>
              </View>
            ) : (
              <View style={styles.rulesListContainer}>
                {rules.map((r) => (
                  <View key={r.id} style={styles.ruleCardItem}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.ruleItemTitle}>{r.title}</Text>
                        <Text
                          style={[
                            styles.frequencyBadge,
                            r.type === 'TRANSFER'
                              ? styles.badgeTransfer
                              : r.type === 'INCOME'
                              ? styles.badgeIncome
                              : styles.badgeExpense,
                          ]}
                        >
                          {r.frequency === 'DAILY'
                            ? 'Mỗi ngày'
                            : r.frequency === 'WEEKLY'
                            ? `Thứ ${r.dayOfWeek === 0 ? 'CN' : r.dayOfWeek + 1}`
                            : r.frequency === 'MONTHLY'
                            ? `Ngày ${r.dayOfMonth} hàng tháng`
                            : `Ngày ${r.dayOfMonth}/${r.monthOfYear} hàng năm`}
                        </Text>
                        <Text
                          style={[
                            styles.ruleAccountTag,
                            r.type === 'TRANSFER'
                              ? styles.tagTransfer
                              : r.account?.type === 'SAVINGS'
                              ? styles.tagSavings
                              : styles.tagDaily,
                          ]}
                        >
                          {r.type === 'TRANSFER'
                            ? '⇄ Ví Ngày ➔ Tiết kiệm'
                            : r.account?.type === 'SAVINGS'
                            ? '💰 TK Tiết kiệm'
                            : '💳 TK Hằng ngày'}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.ruleItemAmount,
                          r.type === 'INCOME'
                            ? styles.txIncome
                            : r.type === 'TRANSFER'
                            ? styles.txTransfer
                            : styles.txExpense,
                        ]}
                      >
                        {r.type === 'INCOME' ? '+' : r.type === 'TRANSFER' ? '⇄ ' : '-'}
                        {Number(r.amount).toLocaleString('vi-VN')} đ
                      </Text>
                    </View>

                    {/* Actions */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleRunRuleNow(r.id, r.title)}
                        style={styles.runRuleNowBtn}
                      >
                        <Text style={styles.runRuleNowText}>Chạy ngay</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleToggleRule(r.id)}
                        style={[styles.toggleRuleBtn, r.isActive ? styles.toggleOn : styles.toggleOff]}
                      >
                        <Text style={[styles.toggleRuleText, r.isActive ? styles.toggleOnText : styles.toggleOffText]}>
                          {r.isActive ? 'Bật' : 'Tắt'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteRule(r.id)}
                        style={styles.deleteRuleBtn}
                      >
                        <Text style={styles.deleteRuleText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Recent History */}
          <View style={styles.historySection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Khoản chi gần đây</Text>
              <TouchableOpacity onPress={() => setActiveTab('history')}>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có khoản chi nào.</Text>
            ) : (
              transactions.slice(0, 6).map((t) => (
                <View key={t.id} style={styles.txRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txNote}>{t.note || 'Chi tiêu'}</Text>
                    <Text style={styles.txCategory}>
                      {t.category?.name || 'Khác'} • {new Date(t.occurredAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={[
                        styles.txAmount,
                        t.type === 'INCOME' ? styles.txIncome : t.type === 'TRANSFER' ? styles.txTransfer : styles.txExpense,
                      ]}
                    >
                      {t.type === 'INCOME' ? '+' : t.type === 'TRANSFER' ? '⇄ ' : '-'}
                      {Number(t.amount).toLocaleString('vi-VN')} đ
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteTx(t.id)}>
                      <Text style={styles.deleteTxBtn}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      ) : activeTab === 'reports' ? (
        /* TAB 2: BÁO CÁO THEO DANH MỤC */
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Báo cáo chi tiêu theo Danh mục</Text>
          <Text style={styles.sectionSub}>
            Tổng chi tiêu chu kỳ: {Number(categoryReports?.totalExpense || 0).toLocaleString('vi-VN')} đ
          </Text>

          {categoryReports?.report?.map((r: any) => (
            <TouchableOpacity
              key={r.id}
              onPress={() => {
                setSelectedCategoryFilter(selectedCategoryFilter === r.id ? null : r.id);
                setActiveTab('history');
              }}
              style={styles.categoryReportCard}
            >
              <View style={styles.reportRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.categoryColorDot, { backgroundColor: r.color || '#6366f1' }]} />
                  <Text style={styles.reportCatName}>{r.name}</Text>
                  <Text style={styles.reportCatCount}>({r.transactionCount} lần)</Text>
                </View>
                <Text style={styles.reportAmount}>{Number(r.totalAmount).toLocaleString('vi-VN')} đ</Text>
              </View>

              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${r.percentage}%`, backgroundColor: r.color || '#6366f1' },
                  ]}
                />
              </View>
              <Text style={styles.percentageText}>{r.percentage}% tổng chi tiêu</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : activeTab === 'categories' ? (
        /* TAB 3: QUẢN LÝ DANH MỤC (THÊM / XÓA) */
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Quản lý Danh mục</Text>
              <Text style={styles.sectionSub}>Tự tạo, đổi tên hoặc xóa các danh mục chi tiêu</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsCategoryModalOpen(true)}
              style={styles.addCategoryBtn}
            >
              <Text style={styles.addCategoryBtnText}>+ Thêm mục</Text>
            </TouchableOpacity>
          </View>

          {categories.map((c) => (
            <View key={c.id} style={styles.categoryManageItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.categoryColorDot, { backgroundColor: c.color || '#6366f1' }]} />
                <View>
                  <Text style={styles.categoryManageName}>{c.name}</Text>
                  <Text style={styles.categoryManageSub}>
                    {c.isSystem ? 'Danh mục mẫu' : 'Danh mục riêng của bạn'}
                  </Text>
                </View>
              </View>

              {!c.isSystem ? (
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Xác nhận', `Xóa danh mục "${c.name}"?`, [
                      { text: 'Hủy' },
                      {
                        text: 'Xóa',
                        style: 'destructive',
                        onPress: async () => {
                          await MobileApiService.deleteCategory(c.id);
                          loadData();
                        },
                      },
                    ]);
                  }}
                  style={styles.deleteCategoryBtn}
                >
                  <Text style={styles.deleteCategoryBtnText}>Xóa</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.systemTag}>Mặc định</Text>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        /* TAB 4: LỊCH SỬ GIAO DỊCH */
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              {selectedCategoryFilter
                ? `Lọc theo: ${categories.find((c) => c.id === selectedCategoryFilter)?.name || 'Danh mục'}`
                : `Tất cả lịch sử (${transactions.length})`}
            </Text>
            {selectedCategoryFilter && (
              <TouchableOpacity onPress={() => setSelectedCategoryFilter(null)}>
                <Text style={styles.clearFilterText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyPending}>
              <Text style={styles.emptyText}>Chưa có giao dịch nào.</Text>
            </View>
          ) : (
            transactions.map((t) => (
              <View key={t.id} style={styles.historyCard}>
                <View style={styles.txRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txNote}>{t.note || 'Chi tiêu'}</Text>
                    <Text style={styles.txCategory}>
                      {t.category?.name || 'Khác'} • {new Date(t.occurredAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={[
                        styles.txAmount,
                        t.type === 'INCOME' ? styles.txIncome : t.type === 'TRANSFER' ? styles.txTransfer : styles.txExpense,
                      ]}
                    >
                      {t.type === 'INCOME' ? '+' : t.type === 'TRANSFER' ? '⇄ ' : '-'}
                      {Number(t.amount).toLocaleString('vi-VN')} đ
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteTx(t.id)}>
                      <Text style={styles.deleteTxBtn}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* HyperOS Frosted Glass Floating Dock */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setActiveTab('home')}
            style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconBadge, activeTab === 'home' && styles.tabIconBadgeActive]}>
              <Text style={styles.tabEmoji}>🏠</Text>
            </View>
            <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>Hôm nay</Text>
            {activeTab === 'home' && <View style={styles.activeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('reports')}
            style={[styles.tabItem, activeTab === 'reports' && styles.tabItemActive]}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconBadge, activeTab === 'reports' && styles.tabIconBadgeActive]}>
              <Text style={styles.tabEmoji}>📊</Text>
            </View>
            <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>Báo cáo</Text>
            {activeTab === 'reports' && <View style={styles.activeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('categories')}
            style={[styles.tabItem, activeTab === 'categories' && styles.tabItemActive]}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconBadge, activeTab === 'categories' && styles.tabIconBadgeActive]}>
              <Text style={styles.tabEmoji}>🏷️</Text>
            </View>
            <Text style={[styles.tabText, activeTab === 'categories' && styles.tabTextActive]}>Danh mục</Text>
            {activeTab === 'categories' && <View style={styles.activeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconBadge, activeTab === 'history' && styles.tabIconBadgeActive]}>
              <Text style={styles.tabEmoji}>🕒</Text>
            </View>
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Lịch sử</Text>
            {activeTab === 'history' && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Add Modal (Nhập số tiền thông minh 45 -> 45.000 đ) */}
      <Modal visible={isAddTxOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ghi nhanh chi tiêu</Text>

            <View style={styles.amountInputContainer}>
              <Text style={styles.inputLabel}>Số tiền:</Text>
              <TextInput
                placeholder="Nhập số tiền"
                value={rawAmountInput}
                onChangeText={setRawAmountInput}
                autoFocus
                style={styles.amountInput}
              />
              <View style={styles.amountPreviewRow}>
                <Text style={styles.previewLabel}>Hệ thống hiểu là:</Text>
                <Text style={styles.previewAmountText}>
                  {previewAmount > 0 ? `${previewAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
                </Text>
              </View>

              <View style={styles.quickAddChipsRow}>
                {['10k', '20k', '30k', '45k', '50k', '100k'].map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => setRawAmountInput(chip)}
                    style={styles.chipBtn}
                  >
                    <Text style={styles.chipBtnText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category selection Dropdown */}
            <Text style={styles.inputLabel}>Danh mục:</Text>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                onPress={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                style={styles.dropdownHeader}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={[
                      styles.categoryColorDot,
                      { backgroundColor: categories.find((c) => c.id === selectedCategory)?.color || '#6366f1' },
                    ]}
                  />
                  <Text style={styles.dropdownHeaderText}>
                    {categories.find((c) => c.id === selectedCategory)?.name || 'Chọn danh mục'}
                  </Text>
                </View>
                <Text style={styles.dropdownChevron}>{isCatDropdownOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {isCatDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
                    {categories.map((c) => {
                      const isSelected = selectedCategory === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => {
                            setSelectedCategory(c.id);
                            setIsCatDropdownOpen(false);
                          }}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={[styles.categoryColorDot, { backgroundColor: c.color || '#6366f1' }]} />
                            <Text
                              style={[
                                styles.dropdownMenuItemText,
                                isSelected && styles.dropdownMenuItemTextActive,
                              ]}
                            >
                              {c.name}
                            </Text>
                          </View>
                          {isSelected && <Text style={styles.dropdownCheckmark}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <TextInput
              placeholder="Ghi chú (VD: Cơm trưa, Xăng xe...)"
              value={newNote}
              onChangeText={setNewNote}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsAddTxOpen(false)}
                style={[styles.modalBtn, styles.cancelBtn]}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddTx}
                style={[styles.modalBtn, styles.saveBtn]}
              >
                <Text style={styles.saveBtnText}>Lưu ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL THÊM KHOẢN CỐ ĐỊNH / ĐỊNH KỲ (Mỗi ngày, Tuần, Tháng, Năm) */}
      <Modal visible={isAddRuleModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cài đặt Khoản Cố Định</Text>
              <Text style={styles.modalSub}>
                Tự động trừ hoặc cộng số dư theo lịch bạn chọn
              </Text>

              {/* Title */}
              <TextInput
                placeholder="Tên khoản (VD: Tiền nhà, Lương, Netflix, Tiết kiệm...)"
                value={ruleTitle}
                onChangeText={setRuleTitle}
                style={styles.input}
              />

              {/* Smart Amount */}
              <View style={styles.amountInputContainer}>
                <Text style={styles.inputLabel}>Số tiền:</Text>
                <TextInput
                  placeholder="Nhập số tiền"
                  value={ruleRawAmount}
                  onChangeText={setRuleRawAmount}
                  style={styles.amountInput}
                />
                <View style={styles.amountPreviewRow}>
                  <Text style={styles.previewLabel}>Hệ thống hiểu là:</Text>
                  <Text style={styles.previewAmountText}>
                    {previewRuleAmount > 0 ? `${previewRuleAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
                  </Text>
                </View>
              </View>

              {/* Chọn tài khoản áp dụng */}
              <Text style={styles.inputLabel}>
                {ruleType === 'TRANSFER' ? 'Tài khoản trích tiền (Nguồn):' : 'Tính cho tài khoản nào:'}
              </Text>
              <View style={styles.accountChoiceRow}>
                {accounts.map((acc) => {
                  const isSelected = (ruleAccountId || dailyAccount?.id) === acc.id;
                  const isDaily = acc.type === 'DAILY';
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setRuleAccountId(acc.id)}
                      style={[
                        styles.accountChoiceCard,
                        isSelected && styles.accountChoiceCardActive,
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.accountChoiceEmoji}>{isDaily ? '💳' : '💰'}</Text>
                        <Text style={[styles.accountChoiceName, isSelected && styles.accountChoiceNameActive]}>
                          {isDaily ? 'TK Hằng ngày' : 'TK Tiết kiệm'}
                        </Text>
                      </View>
                      <Text style={[styles.accountChoiceBalance, isSelected && styles.accountChoiceBalanceActive]}>
                        Số dư: {Number(acc.currentBalance).toLocaleString('vi-VN')} đ
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {ruleType === 'TRANSFER' && (
                <View style={styles.transferFlowBanner}>
                  <Text style={styles.transferFlowText}>
                    🔄 Luân chuyển: Trích từ{' '}
                    <Text style={{ fontWeight: '800', color: '#4f46e5' }}>
                      {accounts.find(a => a.id === (ruleAccountId || dailyAccount?.id))?.type === 'DAILY' ? 'TK Hằng ngày' : 'TK Tiết kiệm'}
                    </Text>{' '}
                    ➔ Chuyển vào{' '}
                    <Text style={{ fontWeight: '800', color: '#16a34a' }}>
                      {accounts.find(a => a.id !== (ruleAccountId || dailyAccount?.id))?.type === 'DAILY' ? 'TK Hằng ngày' : 'TK Tiết kiệm'}
                    </Text>
                  </Text>
                </View>
              )}

              {/* Type (Chi tiêu / Thu nhập / Tích lũy) */}
              <Text style={styles.inputLabel}>Loại dòng tiền:</Text>
              <View style={styles.segmentedRow}>
                {[
                  { key: 'EXPENSE', label: 'Trừ tiền (Chi)' },
                  { key: 'INCOME', label: 'Cộng tiền (Thu)' },
                  { key: 'TRANSFER', label: 'Tích lũy (Tiết kiệm)' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setRuleType(item.key)}
                    style={[
                      styles.segmentBtn,
                      ruleType === item.key && styles.segmentBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        ruleType === item.key && styles.segmentTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Frequency (DAILY / WEEKLY / MONTHLY / YEARLY) */}
              <Text style={styles.inputLabel}>Lặp lại theo:</Text>
              <View style={styles.segmentedRow}>
                {[
                  { key: 'DAILY', label: 'Mỗi ngày' },
                  { key: 'WEEKLY', label: 'Hằng tuần' },
                  { key: 'MONTHLY', label: 'Hằng tháng' },
                  { key: 'YEARLY', label: 'Hàng năm' },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setRuleFrequency(f.key)}
                    style={[
                      styles.segmentBtn,
                      ruleFrequency === f.key && styles.segmentBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        ruleFrequency === f.key && styles.segmentTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Additional parameters depending on frequency */}
              {ruleFrequency === 'MONTHLY' && (
                <View style={{ marginVertical: 8 }}>
                  <Text style={styles.inputLabel}>Vào ngày cố định trong tháng (1 - 31):</Text>
                  <TextInput
                    keyboardType="numeric"
                    placeholder="VD: 5 (nghĩa là ngày 5 mỗi tháng)"
                    value={ruleDayOfMonth}
                    onChangeText={setRuleDayOfMonth}
                    style={styles.input}
                  />
                </View>
              )}

              {ruleFrequency === 'WEEKLY' && (
                <View style={{ marginVertical: 8 }}>
                  <Text style={styles.inputLabel}>Vào thứ mấy trong tuần:</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, idx) => {
                      const dayVal = idx === 6 ? 0 : idx + 1;
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => setRuleDayOfWeek(dayVal.toString())}
                          style={[
                            styles.chipBtn,
                            ruleDayOfWeek === dayVal.toString() && { backgroundColor: '#4f46e5' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipBtnText,
                              ruleDayOfWeek === dayVal.toString() && { color: '#ffffff' },
                            ]}
                          >
                            {d}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {ruleFrequency === 'YEARLY' && (
                <View style={{ marginVertical: 8, flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Ngày (1 - 31):</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={ruleDayOfMonth}
                      onChangeText={setRuleDayOfMonth}
                      style={styles.input}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Tháng (1 - 12):</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={ruleMonthOfYear}
                      onChangeText={setRuleMonthOfYear}
                      style={styles.input}
                    />
                  </View>
                </View>
              )}

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setIsAddRuleModalOpen(false)}
                  style={[styles.modalBtn, styles.cancelBtn]}
                >
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateRule}
                  style={[styles.modalBtn, styles.saveBtn]}
                >
                  <Text style={styles.saveBtnText}>Lưu khoản</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Category Creation Modal */}
      <Modal visible={isCategoryModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tạo danh mục mới</Text>

            <TextInput
              placeholder="Tên danh mục (VD: Tiền trọ, Thú cưng, Gym...)"
              value={newCatName}
              onChangeText={setNewCatName}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Màu đại diện:</Text>
            <View style={styles.colorPaletteRow}>
              {['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'].map((col) => (
                <TouchableOpacity
                  key={col}
                  onPress={() => setNewCatColor(col)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: col },
                    newCatColor === col && styles.colorCircleActive,
                  ]}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsCategoryModalOpen(false)}
                style={[styles.modalBtn, styles.cancelBtn]}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!newCatName.trim()) return;
                  await MobileApiService.createCategory({ name: newCatName.trim(), color: newCatColor });
                  setNewCatName('');
                  setIsCategoryModalOpen(false);
                  loadData();
                }}
                style={[styles.modalBtn, styles.saveBtn]}
              >
                <Text style={styles.saveBtnText}>Tạo mục</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      

      {/* Modal Cài đặt Số dư & Hạn mức Tài khoản */}
      <Modal visible={isAccountModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              ⚙️ Cài đặt {selectedAccountForEdit?.type === 'SAVINGS' ? 'Tài khoản Tiết kiệm' : 'Tài khoản Hằng ngày'}
            </Text>
            <Text style={styles.modalSub}>Cài đặt số dư thực tế và định mức chu kỳ</Text>

            {/* Smart Amount for Account Balance */}
            <View style={styles.amountInputContainer}>
              <Text style={styles.inputLabel}>Số dư thực tế mới:</Text>
              <TextInput
                placeholder="Nhập số dư (VD: 5tr, 500k, 1500000...)"
                value={accountBalanceInput}
                onChangeText={setAccountBalanceInput}
                keyboardType="numeric"
                style={styles.amountInput}
              />
              <View style={styles.amountPreviewRow}>
                <Text style={styles.previewLabel}>Hệ thống hiểu là:</Text>
                <Text style={styles.previewAmountText}>
                  {parseSmartAmount(accountBalanceInput).toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>

            {/* Daily Limit or Daily Saving Target */}
            <View style={styles.amountInputContainer}>
              <Text style={styles.inputLabel}>
                {selectedAccountForEdit?.type === 'SAVINGS'
                  ? 'Mục tiêu tích lũy mỗi ngày (VD: 30k, 50k):'
                  : 'Hạn mức chi tiêu mỗi ngày (VD: 150k, 200k):'}
              </Text>
              <TextInput
                placeholder="Nhập định mức (VD: 150k, 30k...)"
                value={accountLimitInput}
                onChangeText={setAccountLimitInput}
                keyboardType="numeric"
                style={styles.amountInput}
              />
              <View style={styles.amountPreviewRow}>
                <Text style={styles.previewLabel}>Hệ thống hiểu là:</Text>
                <Text style={styles.previewAmountText}>
                  {parseSmartAmount(accountLimitInput).toLocaleString('vi-VN')} đ/ngày
                </Text>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsAccountModalOpen(false)}
                style={[styles.modalBtn, styles.cancelBtn]}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveAccountSettings}
                style={[styles.modalBtn, styles.saveBtn]}
              >
                <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Auth Modal */}
      <Modal visible={isAuthModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {authMode === 'login' ? 'Đăng nhập Saving Money' : 'Đăng ký tài khoản'}
            </Text>

            {authMode === 'register' && (
              <TextInput
                placeholder="Họ và tên"
                value={authFullName}
                onChangeText={setAuthFullName}
                style={styles.input}
              />
            )}

            <TextInput
              placeholder="Email"
              autoCapitalize="none"
              value={authEmail}
              onChangeText={setAuthEmail}
              style={styles.input}
            />

            <TextInput
              placeholder="Mật khẩu"
              secureTextEntry
              value={authPassword}
              onChangeText={setAuthPassword}
              style={styles.input}
            />

            <TouchableOpacity onPress={handleAuth} style={styles.authSubmitBtn}>
              <Text style={styles.authSubmitBtnText}>
                {authMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              style={styles.toggleAuthModeBtn}
            >
              <Text style={styles.toggleAuthModeText}>
                {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 35 : 10,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  headerAddBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerAddBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748b',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  accountCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  dailyCard: {},
  savingsCard: {},
  accountCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  accountBalance: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 6,
  },
  limitText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  spentText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  overLimit: {
    color: '#ef4444',
  },
  underLimit: {
    color: '#16a34a',
  },
  fixedRulesSection: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  fixedRulesSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  fixedRulesSectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  addRuleBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    flexShrink: 0,
  },
  addRuleBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyRulesCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyRulesText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
  },
  rulesListContainer: {
    marginTop: 10,
    gap: 8,
  },
  ruleCardItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  ruleItemAmount: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  frequencyBadge: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeExpense: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  badgeIncome: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  badgeTransfer: {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
  },
  runRuleNowBtn: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  runRuleNowText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4f46e5',
  },
  toggleRuleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  toggleRuleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  toggleOn: {
    backgroundColor: '#dcfce7',
  },
  toggleOff: {
    backgroundColor: '#f1f5f9',
  },
  toggleOnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  toggleOffText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  deleteRuleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  deleteRuleText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '700',
  },
  historySection: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 40,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 14,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  txNote: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  txCategory: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txExpense: {
    color: '#0f172a',
  },
  txIncome: {
    color: '#16a34a',
  },
  txTransfer: {
    color: '#4f46e5',
  },
  deleteTxBtn: {
    fontSize: 10,
    color: '#ef4444',
    marginTop: 3,
    fontWeight: '600',
  },
  categoryReportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reportCatName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  reportCatCount: {
    fontSize: 11,
    color: '#94a3b8',
  },
  reportAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'right',
  },
  categoryManageItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryManageName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  categoryManageSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  deleteCategoryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  deleteCategoryBtnText: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: '700',
  },
  systemTag: {
    fontSize: 10,
    color: '#94a3b8',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addCategoryBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addCategoryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  clearFilterText: {
    fontSize: 11,
    color: '#4f46e5',
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  scrollContainer: {
    paddingBottom: 110,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 36,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabItemActive: {},
  tabIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabIconBadgeActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.12)',
  },
  tabEmoji: {
    fontSize: 18,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  tabTextActive: {
    color: '#4f46e5',
    fontWeight: '800',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4f46e5',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 14,
    marginTop: 2,
  },
  amountInputContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  amountInput: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  amountPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  previewAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4f46e5',
  },
  quickAddChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  chipBtn: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipBtnText: {
    fontSize: 10,
    color: '#4338ca',
    fontWeight: '700',
  },
  dropdownWrapper: {
    marginBottom: 12,
    zIndex: 10,
  },
  dropdownHeader: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  dropdownChevron: {
    fontSize: 11,
    color: '#64748b',
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f8fafc',
  },
  dropdownMenuItemActive: {
    backgroundColor: '#f1f5f9',
  },
  dropdownMenuItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  dropdownMenuItemTextActive: {
    color: '#4f46e5',
    fontWeight: '800',
  },
  dropdownCheckmark: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#4f46e5',
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  colorPaletteRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  authSubmitBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  authSubmitBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  toggleAuthModeBtn: {
    marginTop: 12,
    alignItems: 'center',
  },
  toggleAuthModeText: {
    color: '#4f46e5',
    fontSize: 11,
  },
  emptyPending: {
    padding: 30,
    alignItems: 'center',
  },
    accountCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  editAccountPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  editAccountPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4f46e5',
  },
  accountChoiceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  accountChoiceCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
  },
  accountChoiceCardActive: {
    borderColor: '#4f46e5',
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
  },
  accountChoiceEmoji: {
    fontSize: 14,
  },
  accountChoiceName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  accountChoiceNameActive: {
    color: '#4f46e5',
    fontWeight: '800',
  },
  accountChoiceBalance: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  accountChoiceBalanceActive: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  transferFlowBanner: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  transferFlowText: {
    fontSize: 11,
    color: '#1e40af',
  },
  ruleAccountTag: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagDaily: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
  },
  tagSavings: {
    backgroundColor: '#f3e8ff',
    color: '#7e22ce',
  },
  tagTransfer: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
