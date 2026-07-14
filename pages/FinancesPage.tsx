import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Finance } from '../types';
import { fetchFinances, createFinance, updateFinance, deleteFinance } from '../api';
import { useI18n } from '../i18n';

// Default categories seeded into each user's pool on first use. These are
// canonical keys stored in the database; display labels come from the
// financeCategories section of i18n/translations.ts, so they follow the app
// language. User-created categories are stored and displayed as literal text.
const DEFAULT_CATEGORIES = [
  'Salary',
  'Groceries',
  'Rent',
  'Utilities',
  'Transport',
  'Health',
  'Education',
  'Leisure',
  'Dining',
  'Shopping',
  'Savings',
  'Other',
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const INCOME_COLOR = '#4CAF50';
const EXPENSE_COLOR = '#ff6b6b';
const ACCENT_COLOR = '#FF8C42';

// --- Helpers ---

function formatBRL(n?: number): string {
  const value = typeof n === 'number' && isFinite(n) ? n : 0;
  if (typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function') {
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    } catch {}
  }
  // Manual pt-BR fallback: "." thousands, "," decimals
  const sign = value < 0 ? '-' : '';
  const [int, dec] = Math.abs(value).toFixed(2).split('.');
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}R$ ${intFmt},${dec}`;
}

// Accepts both "," and "." as decimal separator; returns a positive number or null
function parseAmount(input: string): number | null {
  let s = (input || '').trim().replace(/R\$\s?/i, '').replace(/\s/g, '');
  if (!s) return null;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  if (isNaN(n) || n < 0) return null;
  return n;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function currentMonthKey(): string {
  return todayStr().slice(0, 7);
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

function monthLabel(ym: string, locale: string): string {
  const [y, m] = ym.split('-').map(Number);
  try {
    const name = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(y, m - 1, 1));
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
  } catch {
    return `${MONTH_NAMES[m - 1]} ${y}`;
  }
}

function monthShortLabel(ym: string, locale: string): string {
  const m = Number(ym.split('-')[1]);
  try {
    const name = new Intl.DateTimeFormat(locale, { month: 'short' })
      .format(new Date(2000, m - 1, 1))
      .replace('.', '');
    return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  } catch {
    return MONTH_SHORT[m - 1];
  }
}

// Canonical category keys are stored in the database; translate for display,
// falling back to the raw value for categories not in the dictionary.
function categoryLabel(t: (key: string) => string, category: string): string {
  const key = `financeCategories.${category}`;
  const translated = t(key);
  return translated === key ? category : translated;
}

// --- Small shared controls ---

function KindToggle({ kind, onChange }: { kind: 'income' | 'expense'; onChange: (k: 'income' | 'expense') => void }) {
  const { t } = useI18n();
  return (
    <View style={styles.kindToggle}>
      <Pressable
        onPress={() => onChange('income')}
        style={[styles.kindOption, kind === 'income' && { backgroundColor: INCOME_COLOR }]}
      >
        <Text style={[styles.kindText, kind === 'income' && styles.kindTextSelected]}>{t('finances.income')}</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('expense')}
        style={[styles.kindOption, kind === 'expense' && { backgroundColor: EXPENSE_COLOR }]}
      >
        <Text style={[styles.kindText, kind === 'expense' && styles.kindTextSelected]}>{t('finances.expense')}</Text>
      </Pressable>
    </View>
  );
}

function CategoryChips({
  selected,
  onSelect,
  categories,
  onManage,
}: {
  selected: string | null;
  onSelect: (c: string) => void;
  categories: string[];
  onManage?: () => void;
}) {
  const { t } = useI18n();
  return (
    <View style={styles.chipsRow}>
      {categories.map(c => (
        <Pressable
          key={c}
          onPress={() => onSelect(c)}
          style={[styles.chip, selected === c && styles.chipSelected]}
        >
          <Text style={[styles.chipText, selected === c && styles.chipTextSelected]}>{categoryLabel(t, c)}</Text>
        </Pressable>
      ))}
      {onManage ? (
        <Pressable onPress={onManage} style={[styles.chip, styles.manageChip]}>
          <Ionicons name="pencil" size={14} color="#ccc" />
        </Pressable>
      ) : null}
    </View>
  );
}

type FinancesPageProps = {
  onBack?: () => void;
};

export default function FinancesPage({ onBack }: FinancesPageProps) {
  const { t, locale } = useI18n();
  const [finances, setFinances] = useState<Finance[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey());
  const [refreshing, setRefreshing] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  // New transaction form
  const [newText, setNewText] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newKind, setNewKind] = useState<'income' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState('Groceries');
  const [newDate, setNewDate] = useState(todayStr());
  const [newNotes, setNewNotes] = useState('');

  // Transaction edit-in-place
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editKind, setEditKind] = useState<'income' | 'expense'>('expense');
  const [editCategory, setEditCategory] = useState('Other');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Budgets
  const [newBudgetCategory, setNewBudgetCategory] = useState<string | null>(null);
  const [newBudgetLimit, setNewBudgetLimit] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editBudgetLimit, setEditBudgetLimit] = useState('');

  // Category pool management
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const seedingRef = useRef(false);
  const returnToItemModalRef = useRef(false);

  useEffect(() => {
    loadFinances();
  }, []);

  const loadFinances = async () => {
    try {
      const apiFinances = await fetchFinances();
      setFinances(apiFinances);
      await AsyncStorage.setItem('finances', JSON.stringify(apiFinances));
      seedDefaultCategoriesIfNeeded(apiFinances);
    } catch (error) {
      const stored = await AsyncStorage.getItem('finances');
      if (stored) setFinances(JSON.parse(stored));
    }
  };

  // First use only: give the user their own pool of categories, starting with
  // the generic defaults. Runs only after a successful API fetch (never from
  // the offline cache) and only when the user has no category records at all.
  const seedDefaultCategoriesIfNeeded = async (current: Finance[]) => {
    if (seedingRef.current) return;
    if (current.some(f => f.dynamics?.recordType === 'category')) return;
    seedingRef.current = true;
    const created: Finance[] = [];
    try {
      for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
        const name = DEFAULT_CATEGORIES[i];
        created.push(
          await createFinance({
            text: name,
            completed: false,
            createdAt: Date.now(),
            type: 'finance',
            category: 'FINANCE',
            color: 'BLUE',
            dynamics: { recordType: 'category', name, isDefault: true, order: i },
          })
        );
      }
    } catch {
      // Partial seed is fine — the user can add the rest manually.
    }
    if (created.length > 0) {
      setFinances(prev => {
        const next = [...prev, ...created];
        saveFinancesToCache(next);
        return next;
      });
    }
    seedingRef.current = false;
  };

  const saveFinancesToCache = async (newFinances: Finance[]) => {
    try {
      await AsyncStorage.setItem('finances', JSON.stringify(newFinances));
    } catch {}
  };

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const confirmDelete = (message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(message)) onConfirm();
    } else {
      Alert.alert(
        t('common.delete'),
        message,
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.delete'), style: 'destructive', onPress: onConfirm },
        ],
        { cancelable: true }
      );
    }
  };

  // --- Derived data ---

  const transactions = useMemo(
    () => finances.filter(f => f.dynamics?.recordType === 'transaction'),
    [finances]
  );
  const budgets = useMemo(
    () =>
      finances
        .filter(f => f.dynamics?.recordType === 'budget')
        .sort((a, b) => (a.dynamics?.category || '').localeCompare(b.dynamics?.category || '')),
    [finances]
  );

  const categoryRecords = useMemo(
    () =>
      finances
        .filter(f => f.dynamics?.recordType === 'category')
        .sort((a, b) => (a.dynamics?.order ?? 0) - (b.dynamics?.order ?? 0)),
    [finances]
  );
  // The user's category pool. Falls back to the defaults while the pool has
  // not been seeded yet (first load or offline first run).
  const categories = useMemo(
    () =>
      categoryRecords.length > 0
        ? Array.from(new Set(categoryRecords.map(r => r.dynamics?.name || r.text)))
        : DEFAULT_CATEGORIES,
    [categoryRecords]
  );

  // Keep the selected category valid when the pool changes (e.g. deletion).
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(newCategory)) {
      setNewCategory(categories[0]);
    }
  }, [categories, newCategory]);

  const monthTransactions = useMemo(
    () =>
      transactions
        .filter(t => (t.dynamics?.date || '').startsWith(selectedMonth))
        .sort((a, b) => {
          const byDate = (b.dynamics?.date || '').localeCompare(a.dynamics?.date || '');
          if (byDate !== 0) return byDate;
          return (b.createdAt || 0) - (a.createdAt || 0);
        }),
    [transactions, selectedMonth]
  );

  const monthIncome = useMemo(
    () =>
      monthTransactions.reduce(
        (sum, t) => (t.dynamics?.kind === 'income' ? sum + (t.dynamics?.amount || 0) : sum),
        0
      ),
    [monthTransactions]
  );
  const monthExpenses = useMemo(
    () =>
      monthTransactions.reduce(
        (sum, t) => (t.dynamics?.kind === 'expense' ? sum + (t.dynamics?.amount || 0) : sum),
        0
      ),
    [monthTransactions]
  );
  const balance = monthIncome - monthExpenses;
  const balanceColor = balance >= 0 ? INCOME_COLOR : EXPENSE_COLOR;

  const spendByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTransactions) {
      if (t.dynamics?.kind !== 'expense') continue;
      const cat = t.dynamics?.category || 'Other';
      map.set(cat, (map.get(cat) || 0) + (t.dynamics?.amount || 0));
    }
    return map;
  }, [monthTransactions]);

  const categorySpend = useMemo(
    () =>
      Array.from(spendByCategory.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
    [spendByCategory]
  );
  const maxCategorySpend = categorySpend.length > 0 ? categorySpend[0].amount : 0;

  // Last 6 calendar months ending at the device's current month (independent of selectedMonth)
  const trendData = useMemo(() => {
    const cur = currentMonthKey();
    return Array.from({ length: 6 }, (_, i) => shiftMonth(cur, i - 5)).map(ym => {
      let income = 0;
      let expense = 0;
      for (const t of transactions) {
        if (!(t.dynamics?.date || '').startsWith(ym)) continue;
        if (t.dynamics?.kind === 'income') income += t.dynamics?.amount || 0;
        else if (t.dynamics?.kind === 'expense') expense += t.dynamics?.amount || 0;
      }
      return { ym, income, expense };
    });
  }, [transactions]);
  const maxTrend = Math.max(...trendData.map(d => Math.max(d.income, d.expense)), 0);

  const budgetedCategories = useMemo(
    () => budgets.map(b => b.dynamics?.category || ''),
    [budgets]
  );
  const availableBudgetCategories = useMemo(
    () => categories.filter(c => !budgetedCategories.includes(c)),
    [categories, budgetedCategories]
  );

  // --- Transaction handlers ---

  const openNewItemModal = () => {
    if (Platform.OS !== 'web') {
      setShowItemModal(true);
    }
  };

  const closeNewItemModal = () => {
    setShowItemModal(false);
  };

  const handleAddTransaction = async (): Promise<boolean> => {
    const text = newText.trim();
    if (!text) return false;
    const amount = parseAmount(newAmount);
    if (amount === null || amount <= 0) {
      notify(t('common.error'), t('finances.invalidAmount'));
      return false;
    }
    const date = newDate.trim() || todayStr();
    if (!DATE_RE.test(date)) {
      notify(t('common.error'), t('finances.invalidDate'));
      return false;
    }
    const newTransaction = {
      text,
      completed: false,
      createdAt: Date.now(),
      type: 'finance',
      category: 'FINANCE',
      color: newKind === 'income' ? 'GREEN' : 'PINK',
      dynamics: {
        recordType: 'transaction' as const,
        kind: newKind,
        amount,
        category: newCategory,
        date,
        notes: newNotes.trim() || undefined,
      },
    };
    try {
      const created = await createFinance(newTransaction);
      const updated = [...finances, created];
      setFinances(updated);
      saveFinancesToCache(updated);
    } catch {
      notify(t('common.error'), t('finances.createTransactionFailed'));
      return false;
    }
    setNewText('');
    setNewAmount('');
    setNewNotes('');
    setNewDate(todayStr());
    return true;
  };

  const handleAddItem = async () => {
    const ok = await handleAddTransaction();
    if (ok && Platform.OS !== 'web') closeNewItemModal();
  };

  const togglePaid = async (id: string) => {
    const item = finances.find(f => f.id === id);
    if (!item) return;
    const updated = { ...item, completed: !item.completed };
    try {
      const apiItem = await updateFinance(updated);
      const updatedList = finances.map(f => (f.id === id ? apiItem : f));
      setFinances(updatedList);
      saveFinancesToCache(updatedList);
    } catch {
      notify(t('common.error'), t('finances.updateTransactionFailed'));
    }
  };

  const removeFinance = async (id: string) => {
    try {
      await deleteFinance(id);
      const updated = finances.filter(f => f.id !== id);
      setFinances(updated);
      saveFinancesToCache(updated);
    } catch {
      notify(t('common.error'), t('finances.deleteFailed'));
    }
  };

  const startEdit = (item: Finance) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditAmount(item.dynamics?.amount !== undefined ? String(item.dynamics.amount) : '');
    setEditKind(item.dynamics?.kind === 'income' ? 'income' : 'expense');
    setEditCategory(item.dynamics?.category || 'Other');
    setEditDate(item.dynamics?.date || todayStr());
    setEditNotes(item.dynamics?.notes || '');
  };

  const saveEdit = async (item: Finance) => {
    const text = editText.trim();
    if (!text) {
      notify(t('common.error'), t('finances.descriptionRequired'));
      return;
    }
    const amount = parseAmount(editAmount);
    if (amount === null || amount <= 0) {
      notify(t('common.error'), t('finances.invalidAmount'));
      return;
    }
    const date = editDate.trim();
    if (!DATE_RE.test(date)) {
      notify(t('common.error'), t('finances.invalidDate'));
      return;
    }
    const updatedTransaction: Finance = {
      ...item,
      text,
      color: editKind === 'income' ? 'GREEN' : 'PINK',
      dynamics: {
        recordType: 'transaction',
        kind: editKind,
        amount,
        category: editCategory,
        date,
        notes: editNotes.trim() || undefined,
      },
    };
    try {
      const apiItem = await updateFinance(updatedTransaction);
      const updatedList = finances.map(f => (f.id === item.id ? apiItem : f));
      setFinances(updatedList);
      saveFinancesToCache(updatedList);
    } catch {
      notify(t('common.error'), t('finances.updateTransactionFailed'));
    }
    setEditingId(null);
  };

  // --- Budget handlers ---

  const handleAddBudget = async () => {
    if (!newBudgetCategory) {
      notify(t('common.error'), t('finances.pickBudgetCategory'));
      return;
    }
    const limit = parseAmount(newBudgetLimit);
    if (limit === null || limit <= 0) {
      notify(t('common.error'), t('finances.invalidLimit'));
      return;
    }
    const newBudget = {
      text: t('finances.budgetItem', { category: newBudgetCategory }),
      completed: false,
      createdAt: Date.now(),
      type: 'finance',
      category: 'FINANCE',
      color: 'BLUE',
      dynamics: {
        recordType: 'budget' as const,
        category: newBudgetCategory,
        limit,
      },
    };
    try {
      const created = await createFinance(newBudget);
      const updated = [...finances, created];
      setFinances(updated);
      saveFinancesToCache(updated);
      setNewBudgetCategory(null);
      setNewBudgetLimit('');
    } catch {
      notify(t('common.error'), t('finances.createBudgetFailed'));
    }
  };

  const saveBudgetEdit = async (budget: Finance) => {
    const limit = parseAmount(editBudgetLimit);
    if (limit === null || limit <= 0) {
      notify(t('common.error'), t('finances.invalidLimit'));
      return;
    }
    const updatedBudget: Finance = {
      ...budget,
      dynamics: { ...budget.dynamics, recordType: 'budget', limit },
    };
    try {
      const apiItem = await updateFinance(updatedBudget);
      const updatedList = finances.map(f => (f.id === budget.id ? apiItem : f));
      setFinances(updatedList);
      saveFinancesToCache(updatedList);
    } catch {
      notify(t('common.error'), t('finances.updateBudgetFailed'));
    }
    setEditingBudgetId(null);
  };

  // --- Category pool handlers ---

  // On mobile the manager is opened from inside the add-transaction modal;
  // iOS can't present two modals at once, so swap them and restore after.
  const openCategoryManager = (fromItemModal = false) => {
    returnToItemModalRef.current = fromItemModal && Platform.OS !== 'web';
    if (returnToItemModalRef.current) setShowItemModal(false);
    setShowCategoryModal(true);
  };

  const closeCategoryManager = () => {
    setShowCategoryModal(false);
    setNewCategoryName('');
    if (returnToItemModalRef.current) {
      returnToItemModalRef.current = false;
      setShowItemModal(true);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const lower = name.toLowerCase();
    // Compare against both canonical keys and translated labels so e.g.
    // "Mercado" is caught as a duplicate of "Groceries" in pt-BR.
    const exists = categories.some(
      c => c.toLowerCase() === lower || categoryLabel(t, c).toLowerCase() === lower
    );
    if (exists) {
      notify(t('common.error'), t('finances.categoryExists'));
      return;
    }
    try {
      const created = await createFinance({
        text: name,
        completed: false,
        createdAt: Date.now(),
        type: 'finance',
        category: 'FINANCE',
        color: 'BLUE',
        dynamics: { recordType: 'category', name, order: Date.now() },
      });
      const updated = [...finances, created];
      setFinances(updated);
      saveFinancesToCache(updated);
      setNewCategoryName('');
    } catch {
      notify(t('common.error'), t('finances.createCategoryFailed'));
    }
  };

  const handleDeleteCategory = (record: Finance) => {
    if (categoryRecords.length <= 1) {
      notify(t('common.error'), t('finances.lastCategoryError'));
      return;
    }
    confirmDelete(t('finances.deleteCategoryConfirm'), () => removeFinance(record.id));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFinances();
    setRefreshing(false);
  };

  // --- Renderers ---

  const renderTransaction = ({ item }: { item: Finance }) => {
    const isEditing = editingId === item.id;
    const isIncome = item.dynamics?.kind === 'income';
    const amount = item.dynamics?.amount || 0;
    const category = item.dynamics?.category || 'Other';
    const date = item.dynamics?.date || '';
    const notes = item.dynamics?.notes;

    return (
      <View style={styles.itemContainer}>
        <Pressable onPress={() => togglePaid(item.id)}>
          <Ionicons
            name={item.completed ? 'checkbox' : 'square-outline'}
            size={24}
            color={item.completed ? INCOME_COLOR : '#ccc'}
          />
        </Pressable>
        {isEditing ? (
          <View style={{ flex: 1, flexDirection: 'column', marginLeft: 12, pointerEvents: 'box-none' }}>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              autoFocus
              placeholder={t('finances.description')}
              placeholderTextColor="#888"
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <TextInput
                style={[styles.editInput, { flex: 1 }]}
                value={editAmount}
                onChangeText={setEditAmount}
                placeholder={t('finances.amount')}
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.editInput, { flex: 1 }]}
                value={editDate}
                onChangeText={setEditDate}
                placeholder={t('finances.datePlaceholder')}
                placeholderTextColor="#888"
              />
            </View>
            <View style={{ marginTop: 6 }}>
              <KindToggle kind={editKind} onChange={setEditKind} />
            </View>
            <CategoryChips selected={editCategory} onSelect={setEditCategory} categories={categories} />
            <TextInput
              style={[styles.editInput, { marginTop: 6 }]}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder={t('common.notes')}
              placeholderTextColor="#888"
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <Pressable
                style={[styles.addButton, { backgroundColor: INCOME_COLOR, width: 40, height: 40 }]}
                onPress={() => saveEdit(item)}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </Pressable>
              <Pressable
                style={[styles.addButton, { backgroundColor: EXPENSE_COLOR, width: 40, height: 40 }]}
                onPress={() => setEditingId(null)}
              >
                <Ionicons name="close" size={20} color="white" />
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => {
                if (!item.completed) startEdit(item);
              }}
              disabled={item.completed}
            >
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.itemText}>{item.text}</Text>
                <Text style={styles.itemSub}>
                  {categoryLabel(t, category)} • {date}
                </Text>
                {notes?.trim() ? <Text style={styles.itemSub}>{notes.trim()}</Text> : null}
              </View>
            </Pressable>
            <Text style={[styles.amountText, { color: isIncome ? INCOME_COLOR : EXPENSE_COLOR }]}>
              {isIncome ? '+' : '−'}{formatBRL(amount)}
            </Text>
          </>
        )}
        <Pressable
          style={{ marginLeft: 10 }}
          onPress={() =>
            confirmDelete(t('finances.deleteTransactionConfirm'), () => removeFinance(item.id))
          }
        >
          <Ionicons name="trash" size={20} color={EXPENSE_COLOR} />
        </Pressable>
      </View>
    );
  };

  const renderListHeader = () => (
    <View>
      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderColor: INCOME_COLOR }]}>
          <Text style={styles.summaryLabel}>{t('finances.income')}</Text>
          <Text style={[styles.summaryValue, { color: INCOME_COLOR }]}>{formatBRL(monthIncome)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: EXPENSE_COLOR }]}>
          <Text style={styles.summaryLabel}>{t('finances.expenses')}</Text>
          <Text style={[styles.summaryValue, { color: EXPENSE_COLOR }]}>{formatBRL(monthExpenses)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: balanceColor }]}>
          <Text style={styles.summaryLabel}>{t('finances.balance')}</Text>
          <Text style={[styles.summaryValue, { color: balanceColor }]}>{formatBRL(balance)}</Text>
        </View>
      </View>

      {/* Add transaction */}
      {Platform.OS === 'web' ? (
        <View style={styles.addSection}>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 2, minWidth: 140, marginRight: 8 }]}
              placeholder={t('finances.addTransactionPlaceholder')}
              placeholderTextColor="#888"
              value={newText}
              onChangeText={setNewText}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <TextInput
              style={[styles.input, { width: 110, marginRight: 8 }]}
              placeholder={t('finances.amount')}
              placeholderTextColor="#888"
              value={newAmount}
              onChangeText={setNewAmount}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { width: 120, marginRight: 8 }]}
              placeholder={t('finances.datePlaceholder')}
              placeholderTextColor="#888"
              value={newDate}
              onChangeText={setNewDate}
            />
            <TextInput
              style={[styles.input, { flex: 1, minWidth: 120, marginRight: 8 }]}
              placeholder={t('common.notes')}
              placeholderTextColor="#888"
              value={newNotes}
              onChangeText={setNewNotes}
            />
            <Pressable style={styles.addButton} onPress={handleAddItem}>
              <Ionicons name="add" size={24} color="white" />
            </Pressable>
          </View>
          <View style={{ marginTop: 10 }}>
            <KindToggle kind={newKind} onChange={setNewKind} />
          </View>
          <CategoryChips
            selected={newCategory}
            onSelect={setNewCategory}
            categories={categories}
            onManage={() => openCategoryManager()}
          />
        </View>
      ) : (
        <View style={styles.addSection}>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={t('finances.addTransactionPlaceholder')}
              placeholderTextColor="#888"
              value={newText}
              onChangeText={setNewText}
              onFocus={openNewItemModal}
              returnKeyType="done"
            />
            <Pressable style={[styles.addButton, { marginLeft: 8 }]} onPress={openNewItemModal}>
              <Ionicons name="add" size={24} color="white" />
            </Pressable>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>{t('finances.transactions')}</Text>
    </View>
  );

  const renderListFooter = () => (
    <View>
      {/* Budgets */}
      <Text style={styles.sectionTitle}>{t('finances.budgets')}</Text>
      {budgets.length === 0 ? (
        <Text style={styles.emptyText}>{t('finances.noBudgets')}</Text>
      ) : (
        budgets.map(b => {
          const cat = b.dynamics?.category || 'Other';
          const limit = b.dynamics?.limit || 0;
          const spent = spendByCategory.get(cat) || 0;
          const over = limit > 0 && spent > limit;
          const ratio = limit > 0 ? Math.min(spent / limit, 1) : 1;
          const isEditingBudget = editingBudgetId === b.id;
          return (
            <View key={b.id} style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetCategory}>{categoryLabel(t, cat)}</Text>
                {isEditingBudget ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TextInput
                      style={[styles.editInput, { width: 110, height: 36, paddingVertical: 4 }]}
                      value={editBudgetLimit}
                      onChangeText={setEditBudgetLimit}
                      keyboardType="numeric"
                      autoFocus
                      placeholder={t('finances.limit')}
                      placeholderTextColor="#888"
                    />
                    <Pressable onPress={() => saveBudgetEdit(b)} hitSlop={8}>
                      <Ionicons name="checkmark" size={22} color={INCOME_COLOR} />
                    </Pressable>
                    <Pressable onPress={() => setEditingBudgetId(null)} hitSlop={8}>
                      <Ionicons name="close" size={22} color={EXPENSE_COLOR} />
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Pressable
                      onPress={() => {
                        setEditingBudgetId(b.id);
                        setEditBudgetLimit(String(limit));
                      }}
                      hitSlop={8}
                    >
                      <Text style={styles.budgetLimitText}>{formatBRL(limit)}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        confirmDelete(t('finances.deleteBudgetConfirm'), () => removeFinance(b.id))
                      }
                      hitSlop={8}
                    >
                      <Ionicons name="trash" size={18} color={EXPENSE_COLOR} />
                    </Pressable>
                  </View>
                )}
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { flex: Math.max(ratio, 0.02), backgroundColor: over ? EXPENSE_COLOR : ACCENT_COLOR },
                  ]}
                />
                <View style={{ flex: Math.max(1 - ratio, 0) }} />
              </View>
              <Text style={[styles.budgetStatus, over && { color: EXPENSE_COLOR, fontWeight: '700' }]}>
                {over
                  ? t('finances.overBudgetBy', { amount: formatBRL(spent - limit) })
                  : t('finances.budgetStatus', { spent: formatBRL(spent), left: formatBRL(limit - spent) })}
              </Text>
            </View>
          );
        })
      )}
      {availableBudgetCategories.length > 0 ? (
        <View style={styles.addBudgetBox}>
          <Text style={styles.label}>{t('finances.addBudget')}</Text>
          <CategoryChips
            selected={newBudgetCategory}
            onSelect={setNewBudgetCategory}
            categories={availableBudgetCategories}
            onManage={() => openCategoryManager()}
          />
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={t('finances.monthlyLimit')}
              placeholderTextColor="#888"
              value={newBudgetLimit}
              onChangeText={setNewBudgetLimit}
              keyboardType="numeric"
            />
            <Pressable style={[styles.addButton, { marginLeft: 8 }]} onPress={handleAddBudget}>
              <Ionicons name="add" size={24} color="white" />
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Spending by category */}
      <Text style={styles.sectionTitle}>{t('finances.spendingByCategory')}</Text>
      {categorySpend.length === 0 ? (
        <Text style={styles.emptyText}>{t('finances.noExpenses')}</Text>
      ) : (
        <View style={styles.chartCard}>
          {categorySpend.map(({ category, amount }) => (
            <View key={category} style={styles.hBarRow}>
              <Text style={styles.hBarLabel} numberOfLines={1}>
                {categoryLabel(t, category)}
              </Text>
              <View style={styles.hBarTrack}>
                <View
                  style={[
                    styles.hBarFill,
                    { flex: Math.max(maxCategorySpend > 0 ? amount / maxCategorySpend : 0, 0.02) },
                  ]}
                />
                <View style={{ flex: Math.max(maxCategorySpend > 0 ? 1 - amount / maxCategorySpend : 1, 0) }} />
              </View>
              <Text style={styles.hBarValue}>{formatBRL(amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 6-month trend */}
      <Text style={styles.sectionTitle}>{t('finances.trend')}</Text>
      <View style={styles.chartCard}>
        <View style={styles.trendChart}>
          {trendData.map(({ ym, income, expense }) => {
            const barHeight = (v: number) =>
              maxTrend > 0 ? Math.max(Math.round((v / maxTrend) * 110), v > 0 ? 3 : 1) : 1;
            return (
              <View key={ym} style={styles.trendCol}>
                <View style={styles.trendBars}>
                  <View style={[styles.trendBar, { height: barHeight(income), backgroundColor: INCOME_COLOR }]} />
                  <View style={[styles.trendBar, { height: barHeight(expense), backgroundColor: EXPENSE_COLOR }]} />
                </View>
                <Text style={styles.trendLabel}>{monthShortLabel(ym, locale)}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: INCOME_COLOR }]} />
          <Text style={styles.legendText}>{t('finances.income')}</Text>
          <View style={[styles.legendDot, { backgroundColor: EXPENSE_COLOR, marginLeft: 16 }]} />
          <Text style={styles.legendText}>{t('finances.expenses')}</Text>
        </View>
      </View>
      <View style={{ height: 30 }} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Month selector */}
      <View style={styles.monthSelector}>
        <Pressable
          onPress={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
          style={styles.monthArrow}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={ACCENT_COLOR} />
        </Pressable>
        <Pressable onPress={() => setSelectedMonth(currentMonthKey())}>
          <Text style={styles.monthTitle}>{monthLabel(selectedMonth, locale)}</Text>
        </Pressable>
        <Pressable
          onPress={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
          style={styles.monthArrow}
          hitSlop={10}
        >
          <Ionicons name="chevron-forward" size={22} color={ACCENT_COLOR} />
        </Pressable>
      </View>

      {/* New Transaction Modal for Mobile */}
      <Modal
        visible={showItemModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeNewItemModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('finances.addTransaction')}</Text>
              <Pressable onPress={closeNewItemModal}>
                <Ionicons name="close" size={24} color={ACCENT_COLOR} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('finances.description')}</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={t('finances.enterDescription')}
                  placeholderTextColor="#888"
                  value={newText}
                  onChangeText={setNewText}
                  autoFocus
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('finances.type')}</Text>
                <KindToggle kind={newKind} onChange={setNewKind} />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>{t('finances.amountBRL')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="0,00"
                    placeholderTextColor="#888"
                    value={newAmount}
                    onChangeText={setNewAmount}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>{t('finances.date')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={t('finances.datePlaceholder')}
                    placeholderTextColor="#888"
                    value={newDate}
                    onChangeText={setNewDate}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('finances.category')}</Text>
                <CategoryChips
                  selected={newCategory}
                  onSelect={setNewCategory}
                  categories={categories}
                  onManage={() => openCategoryManager(true)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('common.notesOptional')}</Text>
                <TextInput
                  style={[styles.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                  placeholder={t('common.additionalNotes')}
                  placeholderTextColor="#888"
                  value={newNotes}
                  onChangeText={setNewNotes}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={[styles.button, styles.cancelButton]} onPress={closeNewItemModal}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.saveButton]} onPress={handleAddItem}>
                <Text style={styles.saveButtonText}>{t('finances.addTransaction')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category manager modal (web + mobile) */}
      <Modal
        visible={showCategoryModal}
        animationType={Platform.OS === 'web' ? 'none' : 'slide'}
        transparent={true}
        onRequestClose={closeCategoryManager}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('finances.manageCategories')}</Text>
              <Pressable onPress={closeCategoryManager}>
                <Ionicons name="close" size={24} color={ACCENT_COLOR} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {categoryRecords.length === 0 ? (
                <Text style={styles.emptyText}>{t('common.loading')}</Text>
              ) : (
                categoryRecords.map(record => (
                  <View key={record.id} style={styles.categoryRow}>
                    <Text style={styles.categoryRowText}>
                      {categoryLabel(t, record.dynamics?.name || record.text)}
                    </Text>
                    <Pressable onPress={() => handleDeleteCategory(record)} hitSlop={8}>
                      <Ionicons name="trash" size={18} color={EXPENSE_COLOR} />
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('finances.newCategoryPlaceholder')}
                placeholderTextColor="#888"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                maxLength={40}
                onSubmitEditing={handleAddCategory}
                returnKeyType="done"
              />
              <Pressable style={[styles.addButton, { marginLeft: 8 }]} onPress={handleAddCategory}>
                <Ionicons name="add" size={24} color="white" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={monthTransactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={renderListHeader()}
        ListFooterComponent={renderListFooter()}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('finances.noTransactions')}</Text>}
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Modal styles (mirrors SupermarketPage)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#2a2a2a',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#FF6B35',
  },
  cancelButtonText: {
    color: '#aaa',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  // Page layout
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    backgroundColor: '#252525',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  monthArrow: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    minWidth: 150,
    textAlign: 'center',
  },
  list: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ACCENT_COLOR,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 10,
  },

  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#252525',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Add transaction
  addSection: {
    backgroundColor: '#252525',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    padding: 14,
    marginTop: 16,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#444',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Kind toggle
  kindToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  kindOption: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#2a2a2a',
  },
  kindText: {
    color: '#ccc',
    fontWeight: '600',
    fontSize: 14,
  },
  kindTextSelected: {
    color: '#fff',
  },

  // Category chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  chipSelected: {
    backgroundColor: ACCENT_COLOR,
    borderColor: ACCENT_COLOR,
  },
  chipText: {
    color: '#ccc',
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  manageChip: {
    borderStyle: 'dashed',
    justifyContent: 'center',
  },

  // Category manager modal rows
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  categoryRowText: {
    color: '#e0e0e0',
    fontSize: 15,
  },

  // Transaction rows
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 4px rgba(0,0,0,0.3)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }),
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
    color: '#e0e0e0',
  },
  itemSub: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  editInput: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 15,
  },

  // Budgets
  budgetCard: {
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetCategory: {
    color: '#e0e0e0',
    fontSize: 15,
    fontWeight: '600',
  },
  budgetLimitText: {
    color: ACCENT_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 4,
  },
  budgetStatus: {
    color: '#888',
    fontSize: 13,
    marginTop: 6,
  },
  addBudgetBox: {
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },

  // Charts
  chartCard: {
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  hBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hBarLabel: {
    width: 90,
    color: '#ccc',
    fontSize: 13,
  },
  hBarTrack: {
    flex: 1,
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#333',
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  hBarFill: {
    backgroundColor: EXPENSE_COLOR,
    borderRadius: 7,
  },
  hBarValue: {
    color: '#e0e0e0',
    fontSize: 13,
    minWidth: 90,
    textAlign: 'right',
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
  },
  trendCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 110,
  },
  trendBar: {
    width: 12,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  trendLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    color: '#aaa',
    fontSize: 13,
  },
});
