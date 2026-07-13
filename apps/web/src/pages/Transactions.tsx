import React, { useEffect, useState, useCallback } from 'react';
import { useToastStore } from '../store/toast-store';
import { apiClient } from '../api/client';
import { Account, Transaction, TransactionCategory, TransactionType } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Skeleton } from '../components/Skeleton';
import {
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  X,
  ArrowRight,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: TransactionCategory[] = [
  'FOOD',
  'UTILITIES',
  'RENT',
  'INVESTMENT',
  'ENTERTAINMENT',
  'SALARY',
  'OTHER',
];

const CATEGORY_META: Record<TransactionCategory, { label: string; color: string; bg: string }> = {
  FOOD: { label: 'Food', color: 'text-orange-600', bg: 'bg-orange-500/10' },
  UTILITIES: { label: 'Utilities', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  RENT: { label: 'Rent', color: 'text-purple-600', bg: 'bg-purple-500/10' },
  INVESTMENT: { label: 'Investment', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  ENTERTAINMENT: { label: 'Entertainment', color: 'text-pink-600', bg: 'bg-pink-500/10' },
  SALARY: { label: 'Salary', color: 'text-cyan-600', bg: 'bg-cyan-500/10' },
  OTHER: { label: 'Other', color: 'text-text-secondary', bg: 'bg-text-muted/10' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalMode = 'deposit' | 'withdraw' | null;

interface PaginatedState {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (cents: string | number): string => {
  const val = Number(cents) / 100;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const buildQueryString = (params: Record<string, string | number | undefined>): string => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v));
  }
  return q.toString();
};

const exportCSV = (transactions: Transaction[]): void => {
  const headers = ['Date', 'Type', 'Category', 'Merchant', 'Amount (INR)', 'Account ID'];
  const rows = transactions.map((t) => [
    formatDate(t.timestamp),
    t.type,
    t.category,
    t.merchantName ?? '',
    (Number(t.amountCents) / 100).toFixed(2),
    t.accountId,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `idbi_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const CategoryBadge: React.FC<{ category: TransactionCategory }> = ({ category }) => {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${meta.bg} ${meta.color}`}
    >
      {meta.label}
    </span>
  );
};

const TransactionRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 border-b border-border-light last:border-0">
    <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
    <div className="flex-1 flex flex-col gap-1.5">
      <Skeleton variant="text" className="w-1/3 h-3.5" />
      <Skeleton variant="text" className="w-1/5 h-3" />
    </div>
    <Skeleton variant="text" className="w-20 h-4" />
  </div>
);

// ─── Transaction Modal ────────────────────────────────────────────────────────

interface TransactionModalProps {
  mode: ModalMode;
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  mode,
  accounts,
  onClose,
  onSuccess,
}) => {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [amountRupees, setAmountRupees] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('OTHER');
  const [merchantName, setMerchantName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToastStore();

  const title = mode === 'deposit' ? 'Record Deposit' : 'Record Withdrawal';
  const type: TransactionType = mode === 'deposit' ? 'INFLOW' : 'OUTFLOW';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rupees = parseFloat(amountRupees);
    if (isNaN(rupees) || rupees <= 0) {
      addToast('warning', 'Invalid Amount', 'Please enter a valid positive amount.');
      return;
    }
    if (!accountId) {
      addToast('warning', 'No Account', 'Please select a linked account first.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/transactions', {
        accountId,
        amountCents: Math.round(rupees * 100),
        type,
        category,
        merchantName: merchantName.trim() || undefined,
      });
      addToast(
        'success',
        'Transaction Recorded',
        `${title} of ${formatINR(Math.round(rupees * 100))} saved.`,
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? 'Transaction failed. Please try again.';
      addToast('error', 'Transaction Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md animate-scale-up flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary">{title}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {mode === 'deposit'
                ? 'Record an inflow into your connected account.'
                : 'Record an outflow from your connected account.'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertTriangle className="h-8 w-8 text-indicator-warning" />
            <p className="text-sm text-text-secondary">
              No linked accounts found. Connect a bank account first.
            </p>
            <Button variant="secondary" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Account Selector */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="txn-account"
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                Account
              </label>
              <select
                id="txn-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountType} — •••• {acc.accountNumber.slice(-4)}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <Input
              id="txn-amount"
              type="number"
              label="Amount (₹)"
              placeholder="0.00"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              min="0.01"
              step="0.01"
              required
              disabled={isSubmitting}
            />

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="txn-category"
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                Category
              </label>
              <select
                id="txn-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_META[cat].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Merchant Name (optional) */}
            <Input
              id="txn-merchant"
              type="text"
              label="Merchant / Description (Optional)"
              placeholder="e.g. Swiggy, Amazon, HDFC Bank"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              disabled={isSubmitting}
            />

            <div className="flex gap-3 justify-end pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={mode === 'withdraw' ? 'danger' : 'primary'}
                isLoading={isSubmitting}
                className="text-xs"
              >
                {mode === 'deposit' ? 'Record Deposit' : 'Record Withdrawal'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

// ─── Transaction Detail Drawer ────────────────────────────────────────────────

const TransactionDetail: React.FC<{
  transaction: Transaction;
  onClose: () => void;
}> = ({ transaction, onClose }) => {
  const isInflow = transaction.type === 'INFLOW';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full sm:max-w-sm rounded-t-2xl sm:rounded-sq-md flex flex-col gap-4 animate-scale-up">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary">Transaction Details</h3>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Amount Hero */}
        <div className="flex flex-col items-center gap-2 py-4 border-y border-border-light">
          <div
            className={`h-14 w-14 rounded-full flex items-center justify-center ${
              isInflow ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
            }`}
          >
            {isInflow ? (
              <ArrowDownLeft className="h-7 w-7" />
            ) : (
              <ArrowUpRight className="h-7 w-7" />
            )}
          </div>
          <div
            className={`text-3xl font-extrabold ${isInflow ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            {isInflow ? '+' : '−'} {formatINR(transaction.amountCents)}
          </div>
          <CategoryBadge category={transaction.category} />
        </div>

        {/* Detail Rows */}
        <div className="flex flex-col gap-3 text-xs">
          {[
            { label: 'Transaction ID', value: transaction.id.slice(0, 16) + '…' },
            { label: 'Type', value: isInflow ? 'Inflow (Credit)' : 'Outflow (Debit)' },
            { label: 'Merchant', value: transaction.merchantName ?? '—' },
            { label: 'Date', value: formatDate(transaction.timestamp) },
            {
              label: 'Account ID',
              value: '•••• ' + transaction.accountId.slice(-8),
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-text-muted">{label}</span>
              <span className="font-semibold text-text-primary text-right max-w-[60%] truncate">
                {value}
              </span>
            </div>
          ))}
        </div>

        <Button variant="secondary" onClick={onClose} className="text-xs w-full mt-1">
          Close
        </Button>
      </Card>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const Transactions: React.FC = () => {
  // Data state
  const [state, setState] = useState<PaginatedState>({
    transactions: [],
    total: 0,
    page: 1,
    limit: 15,
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategory | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  const { addToast } = useToastStore();
  const LIMIT = 15;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchTransactions = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const qs = buildQueryString({
          type: typeFilter || undefined,
          category: categoryFilter || undefined,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
          page,
          limit: LIMIT,
        });
        const res = await apiClient.get(`/transactions?${qs}`);
        setState(res.data.data);
      } catch {
        addToast('error', 'Fetch Failed', 'Could not load transactions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [typeFilter, categoryFilter, startDate, endDate, addToast],
  );

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await apiClient.get('/accounts');
      setAccounts(res.data.data);
    } catch {
      // Non-critical; modal will handle gracefully
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchAccounts(), 0);
    return () => clearTimeout(t);
  }, [fetchAccounts]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      fetchTransactions(1);
    }, 0);
    return () => clearTimeout(t);
  }, [fetchTransactions]);

  // ── Client-side search on merchantName ────────────────────────────────────

  const displayedTransactions = searchQuery.trim()
    ? state.transactions.filter((t) =>
        (t.merchantName ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : state.transactions;

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(state.total / LIMIT);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTransactions(page);
  };

  // ── CSV Export (client-side) ───────────────────────────────────────────────

  const handleExport = () => {
    if (state.transactions.length === 0) {
      addToast('warning', 'Nothing to Export', 'No transactions in current view.');
      return;
    }
    exportCSV(state.transactions);
    addToast('success', 'Export Ready', 'CSV file downloaded to your device.');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-text-secondary">
            View, record, and export your banking transactions.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Transfer — disabled: no backend endpoint */}
          <div title="Peer-to-peer transfers are not supported by the current API schema">
            <Button
              variant="ghost"
              disabled
              className="text-xs opacity-40 cursor-not-allowed"
              aria-disabled="true"
            >
              <ArrowRight className="h-4 w-4 mr-1.5" />
              Transfer
            </Button>
          </div>
          <Button
            variant="secondary"
            onClick={handleExport}
            className="text-xs py-1.5"
            aria-label="Export transactions as CSV"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
          <Button
            onClick={() => setModalMode('withdraw')}
            variant="danger"
            className="text-xs py-1.5"
            aria-label="Record withdrawal"
          >
            <ArrowUpRight className="h-4 w-4 mr-1.5" />
            Withdraw
          </Button>
          <Button
            onClick={() => setModalMode('deposit')}
            className="text-xs py-1.5"
            aria-label="Record deposit"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Deposit
          </Button>
        </div>
      </div>

      {/* ── Transfer Notice ──────────────────────────────────────────────── */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-sq-sm border border-border-light bg-bg-surface text-xs text-text-secondary">
        <AlertTriangle className="h-4 w-4 text-indicator-warning shrink-0 mt-0.5" />
        <span>
          <strong>Peer-to-peer transfers</strong> are not exposed by the current API schema. To
          initiate a transfer, use the IDBI NetBanking portal or visit your nearest branch.
        </span>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <Card className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5" />
          Filters &amp; Search
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Merchant Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
            <input
              id="txn-search"
              type="text"
              placeholder="Search merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-bg-base border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus placeholder:text-text-muted"
              aria-label="Search by merchant name"
            />
          </div>

          {/* Type Filter */}
          <select
            id="txn-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TransactionType | '')}
            className="w-full px-3 py-2 text-xs bg-bg-base border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
            aria-label="Filter by transaction type"
          >
            <option value="">All Types</option>
            <option value="INFLOW">Inflow (Credit)</option>
            <option value="OUTFLOW">Outflow (Debit)</option>
          </select>

          {/* Category Filter */}
          <select
            id="txn-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as TransactionCategory | '')}
            className="w-full px-3 py-2 text-xs bg-bg-base border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_META[cat].label}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex gap-2 items-center col-span-1 sm:col-span-2 lg:col-span-1">
            <input
              id="txn-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-bg-base border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
              aria-label="Start date filter"
            />
            <span className="text-text-muted text-xs shrink-0">to</span>
            <input
              id="txn-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-bg-base border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
              aria-label="End date filter"
            />
          </div>
        </div>

        {/* Active filter chips */}
        {(typeFilter || categoryFilter || startDate || endDate) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {typeFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-semibold">
                {typeFilter === 'INFLOW' ? 'Credit' : 'Debit'}
                <button onClick={() => setTypeFilter('')} aria-label="Remove type filter">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {categoryFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-semibold">
                {CATEGORY_META[categoryFilter].label}
                <button onClick={() => setCategoryFilter('')} aria-label="Remove category filter">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(startDate || endDate) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-semibold">
                {startDate || '…'} → {endDate || '…'}
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  aria-label="Remove date filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </Card>

      {/* ── Transaction Table ────────────────────────────────────────────── */}
      <Card className="p-0 overflow-hidden">
        {/* Table Header */}
        <div className="px-5 py-3 border-b border-border-light flex items-center justify-between">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {isLoading ? 'Loading…' : `${state.total} Transaction${state.total !== 1 ? 's' : ''}`}
          </span>
          {searchQuery && !isLoading && (
            <span className="text-[10px] text-text-muted">
              Showing {displayedTransactions.length} match
              {displayedTransactions.length !== 1 ? 'es' : ''} for &quot;{searchQuery}&quot;
            </span>
          )}
        </div>

        {/* Rows */}
        {isLoading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <TransactionRowSkeleton key={i} />
            ))}
          </div>
        ) : displayedTransactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Receipt className="h-10 w-10 text-text-muted" />
            <div>
              <h4 className="text-sm font-bold text-text-secondary">No transactions found</h4>
              <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
                {searchQuery || typeFilter || categoryFilter || startDate || endDate
                  ? 'Try adjusting your filters or clearing the search query.'
                  : 'Record your first deposit or withdrawal to get started.'}
              </p>
            </div>
            {!searchQuery && !typeFilter && !categoryFilter && (
              <Button onClick={() => setModalMode('deposit')} className="text-xs py-1.5">
                <Plus className="h-4 w-4 mr-1.5" />
                Record First Transaction
              </Button>
            )}
          </div>
        ) : (
          <div>
            {displayedTransactions.map((txn, idx) => {
              const isInflow = txn.type === 'INFLOW';
              return (
                <button
                  key={txn.id}
                  onClick={() => setSelectedTxn(txn)}
                  aria-label={`View details for ${txn.merchantName ?? 'transaction'}`}
                  className={`w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-bg-base transition-colors ${
                    idx < displayedTransactions.length - 1 ? 'border-b border-border-light' : ''
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`h-10 w-10 rounded-full shrink-0 flex items-center justify-center ${
                      isInflow
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-rose-500/10 text-rose-600'
                    }`}
                  >
                    {isInflow ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text-primary truncate">
                        {txn.merchantName ?? (isInflow ? 'Received Funds' : 'Sent Funds')}
                      </span>
                      <CategoryBadge category={txn.category} />
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {formatDate(txn.timestamp)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-bold ${
                        isInflow ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isInflow ? '+' : '−'}&nbsp;{formatINR(txn.amountCents)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border-light flex items-center justify-between">
            <span className="text-xs text-text-muted">
              Page {currentPage} of {totalPages} &nbsp;·&nbsp; {state.total} total
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="h-7 w-7 flex items-center justify-center rounded text-text-secondary hover:text-text-primary hover:bg-bg-base disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    aria-label={`Go to page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`h-7 w-7 flex items-center justify-center rounded text-xs font-semibold transition-colors ${
                      currentPage === page
                        ? 'bg-brand-primary text-white'
                        : 'text-text-secondary hover:bg-bg-base'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="h-7 w-7 flex items-center justify-center rounded text-text-secondary hover:text-text-primary hover:bg-bg-base disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {modalMode && (
        <TransactionModal
          mode={modalMode}
          accounts={accounts}
          onClose={() => setModalMode(null)}
          onSuccess={() => fetchTransactions(1)}
        />
      )}

      {selectedTxn && (
        <TransactionDetail transaction={selectedTxn} onClose={() => setSelectedTxn(null)} />
      )}
    </div>
  );
};
