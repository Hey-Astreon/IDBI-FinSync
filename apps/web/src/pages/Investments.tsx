import React, { useEffect, useState, useCallback } from 'react';
import { useToastStore } from '../store/toast-store';
import { apiClient } from '../api/client';
import { MutualFund, Goal, Account, SipFrequency } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Skeleton } from '../components/Skeleton';
import {
  TrendingUp,
  Plus,
  X,
  Star,
  AlertTriangle,
  Info,
  Zap,
  BarChart3,
  Wallet,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalMode = 'sip' | 'sweep' | null;

const RISK_META: Record<string, { label: string; color: string; bg: string }> = {
  CONSERVATIVE: { label: 'Conservative', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  MODERATE: { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-500/10' },
  AGGRESSIVE: { label: 'Aggressive', color: 'text-rose-600', bg: 'bg-rose-500/10' },
};

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  EQUITY: { label: 'Equity', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  DEBT: { label: 'Debt', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  HYBRID: { label: 'Hybrid', color: 'text-purple-600', bg: 'bg-purple-500/10' },
  LIQUID: { label: 'Liquid', color: 'text-cyan-600', bg: 'bg-cyan-500/10' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (cents: string | number): string => {
  const val = Number(cents) / 100;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
};

// ─── Create SIP Modal ─────────────────────────────────────────────────────────

const CreateSipModal: React.FC<{
  funds: MutualFund[];
  goals: Goal[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ funds, goals, onClose, onSuccess }) => {
  const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
  const [goalId, setGoalId] = useState(activeGoals[0]?.id ?? '');
  const [fundId, setFundId] = useState(funds[0]?.id ?? '');
  const [amountRupees, setAmountRupees] = useState('');
  const [frequency, setFrequency] = useState<SipFrequency>('MONTHLY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rupees = parseFloat(amountRupees);
    if (isNaN(rupees) || rupees <= 0) {
      addToast('warning', 'Invalid Amount', 'Enter a positive amount.');
      return;
    }
    if (!goalId || !fundId) {
      addToast('warning', 'Missing Selection', 'Select a goal and a fund.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/investments/sip', {
        goalId,
        fundId,
        amountCents: Math.round(rupees * 100),
        frequency,
      });
      addToast('success', 'SIP Created', 'Systematic investment plan has been activated.');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? 'Failed to create SIP.';
      addToast('error', 'SIP Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasGoals = activeGoals.length > 0;
  const hasFunds = funds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md animate-scale-up flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary">Create SIP</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Set up a recurring investment linked to one of your goals.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!hasGoals || !hasFunds ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertTriangle className="h-8 w-8 text-indicator-warning" />
            <p className="text-sm text-text-secondary">
              {!hasGoals
                ? 'No active goals found. Create a goal first.'
                : 'No mutual funds available. Contact support.'}
            </p>
            <Button variant="secondary" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sip-goal"
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                Goal
              </label>
              <select
                id="sip-goal"
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
              >
                {activeGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sip-fund"
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                Mutual Fund
              </label>
              <select
                id="sip-fund"
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
              >
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="sip-amount"
              type="number"
              label="SIP Amount (₹)"
              placeholder="5000"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              min="1"
              step="0.01"
              required
              disabled={isSubmitting}
            />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sip-frequency"
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                Frequency
              </label>
              <select
                id="sip-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as SipFrequency)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
              </select>
            </div>

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
              <Button type="submit" isLoading={isSubmitting} className="text-xs">
                Activate SIP
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

// ─── One-Time Sweep Modal ─────────────────────────────────────────────────────

const SweepModal: React.FC<{
  funds: MutualFund[];
  goals: Goal[];
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ funds, goals, accounts, onClose, onSuccess }) => {
  const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [goalId, setGoalId] = useState(activeGoals[0]?.id ?? '');
  const [fundId, setFundId] = useState(funds[0]?.id ?? '');
  const [amountRupees, setAmountRupees] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToastStore();

  const canProceed = activeGoals.length > 0 && funds.length > 0 && accounts.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rupees = parseFloat(amountRupees);
    if (isNaN(rupees) || rupees <= 0) {
      addToast('warning', 'Invalid Amount', 'Enter a positive amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/investments/sweep', {
        accountId,
        goalId,
        fundId,
        amountCents: Math.round(rupees * 100),
      });
      addToast('success', 'Investment Complete', 'One-time sweep executed successfully.');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? 'Sweep failed.';
      addToast('error', 'Sweep Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md animate-scale-up flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary">One-Time Investment</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Sweep funds from your account into a mutual fund for a specific goal.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!canProceed ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertTriangle className="h-8 w-8 text-indicator-warning" />
            <p className="text-sm text-text-secondary">
              Requires at least one linked account, active goal, and available fund.
            </p>
            <Button variant="secondary" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sweep-account"
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                Debit Account
              </label>
              <select
                id="sweep-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountType} — •••• {a.accountNumber.slice(-4)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sweep-goal"
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                Goal
              </label>
              <select
                id="sweep-goal"
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
              >
                {activeGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sweep-fund"
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
              >
                Mutual Fund
              </label>
              <select
                id="sweep-fund"
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
              >
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="sweep-amount"
              type="number"
              label="Amount (₹)"
              placeholder="10000"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              min="1"
              step="0.01"
              required
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
              <Button type="submit" isLoading={isSubmitting} className="text-xs">
                Execute Sweep
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

// ─── Main Investments Component ───────────────────────────────────────────────

export const Investments: React.FC = () => {
  const [funds, setFunds] = useState<MutualFund[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  const { addToast } = useToastStore();

  const fetchAll = useCallback(async () => {
    try {
      const [fundsRes, goalsRes, accountsRes] = await Promise.all([
        apiClient.get('/investments/recommendations'),
        apiClient.get('/goals'),
        apiClient.get('/accounts'),
      ]);
      setFunds(fundsRes.data.data);
      setGoals(goalsRes.data.data);
      setAccounts(accountsRes.data.data);
    } catch {
      addToast('error', 'Fetch Failed', 'Could not load investment data.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const t = setTimeout(() => fetchAll(), 0);
    return () => clearTimeout(t);
  }, [fetchAll]);

  const displayedFunds = categoryFilter
    ? funds.filter((f) => f.category === categoryFilter)
    : funds;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <Skeleton variant="text" className="w-1/4 h-8" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-text-secondary">
          Invest systematically in mutual funds linked to your savings goals.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => setModalMode('sweep')}
            className="text-xs py-1.5"
          >
            <Zap className="h-4 w-4 mr-1.5" />
            One-Time Invest
          </Button>
          <Button onClick={() => setModalMode('sip')} className="text-xs py-1.5">
            <Plus className="h-4 w-4 mr-1.5" />
            Create SIP
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="py-4 flex flex-col items-center gap-1">
          <BarChart3 className="h-5 w-5 text-brand-primary" />
          <span className="text-2xl font-extrabold text-text-primary">{funds.length}</span>
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            Available Funds
          </span>
        </Card>
        <Card className="py-4 flex flex-col items-center gap-1">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <span className="text-2xl font-extrabold text-text-primary">
            {funds.filter((f) => f.isRecommended).length}
          </span>
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Recommended</span>
        </Card>
        <Card className="py-4 flex flex-col items-center gap-1">
          <Wallet className="h-5 w-5 text-purple-600" />
          <span className="text-2xl font-extrabold text-text-primary">
            {goals.filter((g) => g.status === 'ACTIVE').length}
          </span>
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Active Goals</span>
        </Card>
      </div>

      {/* SIP Notice */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-sq-sm border border-border-light bg-bg-surface text-xs text-text-secondary">
        <Info className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
        <span>
          <strong>SIP Execution</strong>: To execute a pending SIP payment, use the
          <code className="mx-1 px-1 py-0.5 bg-bg-base rounded text-[10px]">
            POST /investments/sip/:id/pay
          </code>
          endpoint via the API. A dedicated SIP management dashboard is planned for a future
          release.
        </span>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Filter:
        </span>
        {['', 'EQUITY', 'DEBT', 'HYBRID', 'LIQUID'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              categoryFilter === cat
                ? 'bg-brand-primary text-white'
                : 'bg-bg-surface border border-border-light text-text-secondary hover:text-text-primary'
            }`}
          >
            {cat === '' ? 'All' : (CATEGORY_META[cat]?.label ?? cat)}
          </button>
        ))}
      </div>

      {/* Fund Cards */}
      {displayedFunds.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <TrendingUp className="h-10 w-10 text-text-muted" />
          <h4 className="text-sm font-bold text-text-secondary">No funds available</h4>
          <p className="text-xs text-text-muted max-w-xs">
            {categoryFilter
              ? 'No funds match this category. Try a different filter.'
              : 'No mutual fund products are available at this time.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedFunds.map((fund) => {
            const catMeta = CATEGORY_META[fund.category] ?? {
              label: fund.category,
              color: 'text-text-muted',
              bg: 'bg-text-muted/10',
            };
            const riskMeta = RISK_META[fund.riskRating] ?? {
              label: fund.riskRating,
              color: 'text-text-muted',
              bg: 'bg-text-muted/10',
            };

            return (
              <Card key={fund.id} className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-text-primary truncate">{fund.name}</h4>
                      {fund.isRecommended && (
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${catMeta.bg} ${catMeta.color}`}
                      >
                        {catMeta.label}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${riskMeta.bg} ${riskMeta.color}`}
                      >
                        {riskMeta.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-brand-primary">
                      {formatINR(fund.navCents)}
                    </div>
                    <span className="text-[10px] text-text-muted">NAV</span>
                  </div>
                </div>

                {/* Returns */}
                <div className="grid grid-cols-3 gap-3 border-t border-border-light pt-3">
                  {[
                    { label: '1Y Return', value: fund.historicalReturn1y },
                    { label: '3Y Return', value: fund.historicalReturn3y },
                    { label: '5Y Return', value: fund.historicalReturn5y },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <div
                        className={`text-sm font-bold ${
                          parseFloat(value) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {parseFloat(value) >= 0 ? '+' : ''}
                        {value}%
                      </div>
                      <span className="text-[10px] text-text-muted">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Expense Ratio */}
                <div className="flex justify-between items-center text-xs pt-1 border-t border-border-light">
                  <span className="text-text-muted">Expense Ratio</span>
                  <span className="font-semibold text-text-primary">
                    {fund.expenseRatioPercentage}%
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modalMode === 'sip' && (
        <CreateSipModal
          funds={funds}
          goals={goals}
          onClose={() => setModalMode(null)}
          onSuccess={fetchAll}
        />
      )}
      {modalMode === 'sweep' && (
        <SweepModal
          funds={funds}
          goals={goals}
          accounts={accounts}
          onClose={() => setModalMode(null)}
          onSuccess={fetchAll}
        />
      )}
    </div>
  );
};
