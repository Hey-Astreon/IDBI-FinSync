import React, { useEffect, useState } from 'react';
import { useToastStore } from '../store/toast-store';
import { useAuthStore } from '../store/auth-store';
import { apiClient } from '../api/client';
import { Account, Transaction } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { DashboardSkeleton } from '../components/Skeleton';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Bot,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Account Link Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkAccountNumber, setLinkAccountNumber] = useState('');
  const [linkAccountType, setLinkAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [isLinking, setIsLinking] = useState(false);

  // Quick AI Widget State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSendingAi, setIsSendingAi] = useState(false);

  const { addToast } = useToastStore();
  const { setScreen } = useAuthStore();

  const fetchDashboardData = React.useCallback(async () => {
    try {
      const [accountsRes, transactionsRes] = await Promise.all([
        apiClient.get('/accounts'),
        apiClient.get('/transactions?limit=5'),
      ]);
      setAccounts(accountsRes.data.data);
      setTransactions(transactionsRes.data.data.transactions);
    } catch {
      addToast('error', 'Sync Failed', 'Failed to retrieve ledger data.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

  const formatINR = (cents: string | number) => {
    const val = Number(cents) / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Aggregations
  const totalBalanceCents = accounts.reduce((sum, acc) => sum + BigInt(acc.balanceCents), 0n);

  // Calculate income (inflow) vs expenses (outflow) from recent items for demonstration
  // In a full application, this would be computed from a larger window, but client-side transaction aggregation works perfectly here.
  const monthlyInflowCents = transactions
    .filter((t) => t.type === 'INFLOW')
    .reduce((sum, t) => sum + BigInt(t.amountCents), 0n);
  const monthlyOutflowCents = transactions
    .filter((t) => t.type === 'OUTFLOW')
    .reduce((sum, t) => sum + BigInt(t.amountCents), 0n);

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (linkAccountNumber.length < 10) {
      addToast('warning', 'Validation Error', 'Account number must be at least 10 digits.');
      return;
    }

    setIsLinking(true);
    try {
      await apiClient.post('/accounts/link', {
        accountNumber: linkAccountNumber,
        accountType: linkAccountType,
      });
      addToast('success', 'Account Connected', 'IDBI ledger linked successfully.');
      setIsLinkModalOpen(false);
      setLinkAccountNumber('');
      fetchDashboardData();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to link account.';
      addToast('error', 'Link Failure', msg);
    } finally {
      setIsLinking(false);
    }
  };

  const handleAskMitra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsSendingAi(true);
    try {
      // 1. Send the quick message to instantiate the chat session
      await apiClient.post('/ai/chat', {
        conversationId: null,
        text: aiPrompt,
      });
      addToast('success', 'Advisor Online', 'Message dispatched to Mitra.');
      // 2. Redirect to Mitra screen
      setScreen('ai');
    } catch {
      addToast('error', 'Advisor Offline', 'Failed to reach AI Core.');
    } finally {
      setIsSendingAi(false);
    }
  };

  // Formulate mock dataset for AreaChart showing cashflow based on recent transactions
  const generateChartData = () => {
    if (transactions.length === 0) {
      return [
        { name: 'Jan', Balance: 10000 },
        { name: 'Feb', Balance: 15000 },
        { name: 'Mar', Balance: 12000 },
        { name: 'Apr', Balance: 24000 },
        { name: 'May', Balance: 30000 },
      ];
    }
    // Aggregate historical points based on recent transactions
    let cumulative = Number(totalBalanceCents) / 100;
    return [...transactions].reverse().map((t) => {
      const amount = Number(t.amountCents) / 100;
      cumulative = t.type === 'INFLOW' ? cumulative - amount : cumulative + amount;
      return {
        name: new Date(t.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        Balance: Math.round(cumulative),
      };
    });
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in">
      {/* Upper Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance Card */}
        <Card hoverable className="relative overflow-hidden flex flex-col justify-between h-44">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Total Connection Balance
            </span>
            <CreditCard className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="my-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-primary">
              {formatINR(totalBalanceCents.toString())}
            </h1>
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted mt-2 border-t border-border-light pt-2">
            <span>{accounts.length} active IDBI ledgers connected</span>
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="text-brand-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Link Ledger
            </button>
          </div>
        </Card>

        {/* Monthly Income Card */}
        <Card hoverable className="flex flex-col justify-between h-44">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Recent Monthly Inflows
            </span>
            <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {formatINR(monthlyInflowCents.toString())}
            </h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Sum of recent positive bank deposits
            </p>
          </div>
          <div className="text-xs text-text-muted border-t border-border-light pt-2 mt-2">
            Updated just now
          </div>
        </Card>

        {/* Monthly Expense Card */}
        <Card hoverable className="flex flex-col justify-between h-44">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Recent Monthly Outflows
            </span>
            <div className="p-1.5 rounded-full bg-rose-500/10 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {formatINR(monthlyOutflowCents.toString())}
            </h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Sum of recent payments & investment sweeps
            </p>
          </div>
          <div className="text-xs text-text-muted border-t border-border-light pt-2 mt-2">
            Updated just now
          </div>
        </Card>
      </div>

      {/* Main Analysis Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ledger Balance Flow Chart */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-text-primary">Connection Balance Trend</h3>
            <span className="text-xs text-text-muted">Balance over recent activities (INR)</span>
          </div>
          <Card className="p-4 h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={generateChartData()}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-brand-primary-light)"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-brand-primary-light)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border-light)"
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-text-muted)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border-light)',
                    color: 'var(--color-text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Balance"
                  stroke="var(--color-brand-primary-light)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Mitra AI Insights & Prompt Widget */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-brand-primary" />
            <h3 className="text-base font-bold text-text-primary">Mitra AI Advisor</h3>
          </div>
          <Card className="flex flex-col justify-between h-80 bg-brand-primary/5 border border-brand-primary/10">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-brand-primary font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Insight of the Day</span>
              </div>
              <p className="text-xs leading-relaxed text-text-secondary">
                {totalBalanceCents > 5000000n
                  ? 'You have a solid cash reserve. Sweep ₹10,000 to your Car Purchase Goal using a manual investment to start earning compound interest.'
                  : 'Start a monthly SIP of ₹1,000 to build your saving habits. Even small contributions accumulate rapidly over time.'}
              </p>
            </div>

            <form onSubmit={handleAskMitra} className="flex flex-col gap-2.5 mt-4">
              <Input
                id="aiPrompt"
                type="text"
                placeholder="Ask Mitra about your cashflow..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isSendingAi}
                className="text-xs bg-bg-surface border-border-light"
              />
              <Button type="submit" isLoading={isSendingAi} className="w-full text-xs py-1.5">
                Analyze Surplus <ArrowRight className="h-3 w-3 ml-1.5" />
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Ledger Accounts and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Linked Accounts section */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-text-primary">Connected Ledgers</h3>
            <Button
              variant="secondary"
              onClick={() => setIsLinkModalOpen(true)}
              className="text-xs py-1 px-3"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Connect Account
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {accounts.length === 0 ? (
              <Card className="text-center py-8 text-text-secondary flex flex-col items-center gap-3">
                <CreditCard className="h-10 w-10 text-text-muted" />
                <div>
                  <h4 className="font-bold text-sm">No accounts connected yet</h4>
                  <p className="text-xs text-text-muted mt-1">
                    Link an IDBI bank account to activate features.
                  </p>
                </div>
                <Button onClick={() => setIsLinkModalOpen(true)} className="text-xs py-1.5">
                  Link Account
                </Button>
              </Card>
            ) : (
              accounts.map((acc) => (
                <Card key={acc.id} hoverable className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-brand-primary/5 text-brand-primary flex items-center justify-center">
                      <CreditCard className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                        {acc.accountType} Account
                      </h4>
                      <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                        IDBI •••• {acc.accountNumber.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-brand-primary">
                      {formatINR(acc.balanceCents.toString())}
                    </div>
                    <span className="text-[9px] text-text-muted">{acc.currency}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions section */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-text-primary">Recent Transactions</h3>
            <button
              onClick={() => setScreen('transactions')}
              className="text-xs text-brand-primary font-semibold hover:underline cursor-pointer"
            >
              View Full Ledger
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {transactions.length === 0 ? (
              <Card className="text-center py-10 text-text-muted text-xs">
                No recent transaction transactions found.
              </Card>
            ) : (
              transactions.map((t) => (
                <Card key={t.id} hoverable className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center ${
                        t.type === 'INFLOW'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-text-muted/10 text-text-secondary'
                      }`}
                    >
                      {t.type === 'INFLOW' ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-text-primary truncate max-w-[180px]">
                        {t.merchantName || 'Bank Transfer'}
                      </h4>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {t.category} •{' '}
                        {new Date(t.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs font-bold ${
                        t.type === 'INFLOW' ? 'text-emerald-600' : 'text-text-primary'
                      }`}
                    >
                      {t.type === 'INFLOW' ? '+' : '-'} {formatINR(t.amountCents.toString())}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Account Link Modal Dialog */}
      {isLinkModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsLinkModalOpen(false)}
          />

          <Card className="relative w-full max-w-sm bg-bg-surface border-border-light shadow-ambient flex flex-col gap-4 z-10 animate-scale-up">
            <div>
              <h3 className="text-base font-bold text-text-primary">Link IDBI Bank Account</h3>
              <p className="text-xs text-text-secondary mt-1">
                Enter your bank details to synchronize balance ledger records.
              </p>
            </div>

            <form onSubmit={handleLinkAccount} className="flex flex-col gap-4">
              <Input
                id="linkAccountNumber"
                type="text"
                label="Account Number"
                placeholder="Enter 10+ digit number"
                value={linkAccountNumber}
                onChange={(e) => setLinkAccountNumber(e.target.value.replace(/\D/g, ''))}
                required
                disabled={isLinking}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Account Type
                </label>
                <select
                  value={linkAccountType}
                  onChange={(e) => setLinkAccountType(e.target.value as 'SAVINGS' | 'CURRENT')}
                  disabled={isLinking}
                  className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-light text-text-primary rounded-sq-sm transition-all focus:outline-none focus:border-border-focus"
                >
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsLinkModalOpen(false)}
                  disabled={isLinking}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLinking} className="text-xs">
                  Link Account
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
};
