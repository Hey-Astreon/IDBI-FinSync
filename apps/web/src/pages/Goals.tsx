import React, { useEffect, useState, useCallback } from 'react';
import { useToastStore } from '../store/toast-store';
import { apiClient } from '../api/client';
import { Goal, GoalStatus } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Skeleton } from '../components/Skeleton';
import {
  Target,
  Plus,
  ArrowLeft,
  Search,
  Filter,
  X,
  Pause,
  Play,
  Sparkles,
  Clock,
  TrendingUp,
  Info,
  CheckCircle2,
  Circle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GoalMilestone {
  id: string;
  goalId: string;
  percentage: number;
  isAchieved: boolean;
}

interface GoalDetails {
  goal: Goal;
  percentageCompleted: number;
  milestones: GoalMilestone[];
}

type SortMode = 'newest' | 'progress' | 'deadline';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (cents: string | number): string => {
  const val = Number(cents) / 100;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const daysRemaining = (deadline: string): number => {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const pct = (current: string | number, target: string | number): number => {
  const t = Number(target);
  if (t <= 0) return 0;
  return Math.min(Math.round((Number(current) / t) * 100), 100);
};

const STATUS_META: Record<GoalStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Draft', color: 'text-text-muted', bg: 'bg-text-muted/10' },
  ACTIVE: { label: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  PAUSED: { label: 'Paused', color: 'text-amber-600', bg: 'bg-amber-500/10' },
  COMPLETED: { label: 'Completed', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-600', bg: 'bg-rose-500/10' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: GoalStatus }> = ({ status }) => {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${meta.bg} ${meta.color}`}
    >
      {meta.label}
    </span>
  );
};

const ProgressBar: React.FC<{ percentage: number; status: GoalStatus }> = ({
  percentage,
  status,
}) => {
  const barColor =
    status === 'COMPLETED'
      ? 'bg-brand-primary'
      : status === 'PAUSED'
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  return (
    <div className="w-full h-2 rounded-full bg-text-muted/10 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const GoalCardSkeleton: React.FC = () => (
  <div className="rounded-sq-md border border-border-light bg-bg-surface p-6 flex flex-col gap-4">
    <Skeleton variant="text" className="w-2/3 h-5" />
    <Skeleton className="w-full h-2" />
    <div className="flex justify-between">
      <Skeleton variant="text" className="w-1/4 h-3" />
      <Skeleton variant="text" className="w-1/4 h-3" />
    </div>
  </div>
);

// ─── Create Goal Modal ────────────────────────────────────────────────────────

const CreateGoalModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [targetRupees, setTargetRupees] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rupees = parseFloat(targetRupees);
    if (isNaN(rupees) || rupees <= 0) {
      addToast('warning', 'Invalid Amount', 'Target must be a positive amount.');
      return;
    }
    if (!deadline) {
      addToast('warning', 'Missing Deadline', 'Please set a target date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/goals', {
        title,
        targetCents: Math.round(rupees * 100),
        deadline: new Date(deadline).toISOString(),
      });
      addToast('success', 'Goal Created', `"${title}" has been added to your tracker.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? 'Failed to create goal.';
      addToast('error', 'Creation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Minimum deadline = tomorrow
  const [minDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md animate-scale-up flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary">Create Financial Goal</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Set a savings target with a deadline. Milestones at 25%, 50%, 75%, 100% are created
              automatically.
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="goal-title"
            type="text"
            label="Goal Title"
            placeholder="e.g. Emergency Fund, House Down Payment"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={3}
            required
            disabled={isSubmitting}
          />
          <Input
            id="goal-target"
            type="number"
            label="Target Amount (₹)"
            placeholder="100000"
            value={targetRupees}
            onChange={(e) => setTargetRupees(e.target.value)}
            min="1"
            step="0.01"
            required
            disabled={isSubmitting}
          />
          <Input
            id="goal-deadline"
            type="date"
            label="Deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={minDate}
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
              Create Goal
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// ─── Add Funds Modal ──────────────────────────────────────────────────────────

const AddFundsModal: React.FC<{
  goal: Goal;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ goal, onClose, onSuccess }) => {
  const [amountRupees, setAmountRupees] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToastStore();

  const remaining = Number(goal.targetCents) - Number(goal.currentCents);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rupees = parseFloat(amountRupees);
    if (isNaN(rupees) || rupees <= 0) {
      addToast('warning', 'Invalid Amount', 'Enter a positive amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(`/goals/${goal.id}/funds`, {
        amountCents: Math.round(rupees * 100),
      });
      addToast(
        'success',
        'Funds Added',
        `${formatINR(Math.round(rupees * 100))} added to "${goal.title}".`,
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? 'Failed to add funds.';
      addToast('error', 'Fund Failure', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-sm animate-scale-up flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary">Add Funds</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-xs text-text-secondary border-b border-border-light pb-3">
          <span className="font-semibold text-text-primary">{goal.title}</span>
          <br />
          Remaining: <span className="font-bold text-brand-primary">{formatINR(remaining)}</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="fund-amount"
            type="number"
            label="Amount (₹)"
            placeholder={(remaining / 100).toFixed(2)}
            value={amountRupees}
            onChange={(e) => setAmountRupees(e.target.value)}
            min="0.01"
            step="0.01"
            required
            disabled={isSubmitting}
          />
          <div className="flex gap-3 justify-end">
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
              Add Funds
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// ─── Goal Detail View ─────────────────────────────────────────────────────────

const GoalDetailView: React.FC<{
  goalId: string;
  onBack: () => void;
  onRefreshList: () => void;
}> = ({ goalId, onBack, onRefreshList }) => {
  const [details, setDetails] = useState<GoalDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const { addToast } = useToastStore();

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/goals/${goalId}`);
      setDetails(res.data.data);
    } catch {
      addToast('error', 'Fetch Failed', 'Could not load goal details.');
    } finally {
      setIsLoading(false);
    }
  }, [goalId, addToast]);

  useEffect(() => {
    const t = setTimeout(() => fetchDetails(), 0);
    return () => clearTimeout(t);
  }, [fetchDetails]);

  const handleToggleStatus = async () => {
    if (!details) return;
    const action = details.goal.status === 'PAUSED' ? 'resume' : 'pause';
    setIsToggling(true);
    try {
      await apiClient.patch(`/goals/${goalId}/${action}`);
      addToast(
        'success',
        action === 'pause' ? 'Goal Paused' : 'Goal Resumed',
        `"${details.goal.title}" has been ${action}d.`,
      );
      fetchDetails();
      onRefreshList();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? `Failed to ${action} goal.`;
      addToast('error', 'Action Failed', msg);
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading || !details) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <Skeleton variant="text" className="w-1/4 h-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GoalCardSkeleton />
          <div className="lg:col-span-2">
            <GoalCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const { goal, percentageCompleted, milestones } = details;
  const remaining = Number(goal.targetCents) - Number(goal.currentCents);
  const days = daysRemaining(goal.deadline);
  const isCompleted = goal.status === 'COMPLETED';
  const isPaused = goal.status === 'PAUSED';

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-semibold transition-colors cursor-pointer w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Goals
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel — Summary */}
        <Card className="flex flex-col gap-5 h-fit">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={goal.status} />
            </div>
            <h2 className="text-xl font-bold text-text-primary mt-2">{goal.title}</h2>
          </div>

          {/* Progress ring */}
          <div className="flex flex-col items-center gap-2 py-4 border-y border-border-light">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  className="text-text-muted/10"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  className={isCompleted ? 'text-brand-primary' : 'text-emerald-500'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${percentageCompleted * 2.64} ${264 - percentageCompleted * 2.64}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-text-primary">
                  {percentageCompleted}%
                </span>
              </div>
            </div>
            <div className="text-xs text-text-muted text-center">
              {formatINR(goal.currentCents)} of {formatINR(goal.targetCents)}
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Remaining</span>
              <span className="font-bold text-text-primary">{formatINR(remaining)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Deadline</span>
              <span className="font-bold text-text-primary">{formatDate(goal.deadline)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Days Left</span>
              <span className={`font-bold ${days <= 30 ? 'text-rose-600' : 'text-text-primary'}`}>
                {isCompleted ? '—' : `${days} days`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Streak</span>
              <span className="font-bold text-text-primary">{goal.streakCount} contributions</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {!isCompleted && (
              <>
                <Button
                  onClick={() => setShowAddFunds(true)}
                  className="text-xs w-full"
                  disabled={isPaused}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Funds
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleToggleStatus}
                  isLoading={isToggling}
                  className="text-xs w-full"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-4 w-4 mr-1.5" /> Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 mr-1.5" /> Pause
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Compliance notice for Edit/Delete */}
          <div className="p-3 bg-brand-primary/5 rounded-sq-sm border border-brand-primary/10 flex items-start gap-2.5 text-[11px] leading-relaxed text-text-secondary">
            <Info className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
            <span>
              <strong>Notice</strong>: Editing or deleting goals is not supported by the current API
              schema. Contact your financial advisor to modify goal parameters.
            </span>
          </div>
        </Card>

        {/* Right panel — Milestones */}
        <Card className="lg:col-span-2 flex flex-col gap-5">
          <div>
            <h3 className="text-base font-bold text-text-primary">Milestone Timeline</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Track your progress through automated savings checkpoints.
            </p>
          </div>

          <div className="flex flex-col gap-0">
            {milestones
              .sort((a, b) => a.percentage - b.percentage)
              .map((ms, idx) => {
                const isLast = idx === milestones.length - 1;
                const msAmount = (Number(goal.targetCents) * ms.percentage) / 100;
                return (
                  <div key={ms.id} className="flex gap-4">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          ms.isAchieved
                            ? 'bg-brand-primary text-white'
                            : 'bg-text-muted/10 text-text-muted'
                        }`}
                      >
                        {ms.isAchieved ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 min-h-[32px] ${
                            ms.isAchieved ? 'bg-brand-primary' : 'bg-text-muted/10'
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary">
                          {ms.percentage}% Milestone
                        </span>
                        {ms.isAchieved && (
                          <span className="text-[10px] font-semibold text-brand-primary uppercase tracking-wider">
                            Achieved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{formatINR(msAmount)}</p>
                    </div>
                  </div>
                );
              })}
          </div>

          {isCompleted && (
            <div className="p-4 rounded-sq-sm bg-brand-primary/5 border border-brand-primary/10 flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-brand-primary" />
              <div>
                <h4 className="text-sm font-bold text-brand-primary">Goal Completed!</h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Congratulations — you have fully funded this financial target.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <AddFundsModal
          goal={goal}
          onClose={() => setShowAddFunds(false)}
          onSuccess={() => {
            fetchDetails();
            onRefreshList();
          }}
        />
      )}
    </div>
  );
};

// ─── Main Goals Component ─────────────────────────────────────────────────────

export const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GoalStatus | ''>('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);

  const { addToast } = useToastStore();

  const fetchGoals = useCallback(async () => {
    try {
      const res = await apiClient.get('/goals');
      setGoals(res.data.data);
    } catch {
      addToast('error', 'Fetch Failed', 'Could not load goals.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const t = setTimeout(() => fetchGoals(), 0);
    return () => clearTimeout(t);
  }, [fetchGoals]);

  // Filtering + sorting
  const processedGoals = goals
    .filter((g) => {
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || g.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortMode === 'progress') {
        return pct(b.currentCents, b.targetCents) - pct(a.currentCents, a.targetCents);
      }
      if (sortMode === 'deadline') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // If viewing details, delegate entirely
  if (selectedGoalId) {
    return (
      <GoalDetailView
        goalId={selectedGoalId}
        onBack={() => setSelectedGoalId(null)}
        onRefreshList={fetchGoals}
      />
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-text-secondary">
          Track, fund, and achieve your savings targets.
        </p>
        <Button onClick={() => setShowCreate(true)} className="text-xs py-1.5">
          <Plus className="h-4 w-4 mr-1.5" />
          New Goal
        </Button>
      </div>

      {/* Summary Cards */}
      {!isLoading && goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="py-4 flex flex-col items-center gap-1">
            <Target className="h-5 w-5 text-brand-primary" />
            <span className="text-2xl font-extrabold text-text-primary">{goals.length}</span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider">
              Total Goals
            </span>
          </Card>
          <Card className="py-4 flex flex-col items-center gap-1">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <span className="text-2xl font-extrabold text-text-primary">
              {goals.filter((g) => g.status === 'ACTIVE').length}
            </span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Active</span>
          </Card>
          <Card className="py-4 flex flex-col items-center gap-1">
            <CheckCircle2 className="h-5 w-5 text-brand-primary" />
            <span className="text-2xl font-extrabold text-text-primary">
              {goals.filter((g) => g.status === 'COMPLETED').length}
            </span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Completed</span>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5" />
          Filters &amp; Search
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
            <input
              id="goal-search"
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-bg-base border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus placeholder:text-text-muted"
              aria-label="Search goals by title"
            />
          </div>
          <select
            id="goal-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as GoalStatus | '')}
            className="w-full px-3 py-2 text-xs bg-bg-base border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select
            id="goal-sort"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="w-full px-3 py-2 text-xs bg-bg-base border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
            aria-label="Sort goals"
          >
            <option value="newest">Newest First</option>
            <option value="progress">Highest Progress</option>
            <option value="deadline">Earliest Deadline</option>
          </select>
        </div>
      </Card>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <GoalCardSkeleton key={i} />
          ))}
        </div>
      ) : processedGoals.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <Target className="h-10 w-10 text-text-muted" />
          <h4 className="text-sm font-bold text-text-secondary">No goals found</h4>
          <p className="text-xs text-text-muted max-w-xs">
            {searchQuery || statusFilter
              ? 'Adjust your filters or clear the search query.'
              : 'Create your first financial target to start saving.'}
          </p>
          {!searchQuery && !statusFilter && (
            <Button onClick={() => setShowCreate(true)} className="text-xs py-1.5">
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Goal
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {processedGoals.map((goal) => {
            const percentage = pct(goal.currentCents, goal.targetCents);
            const days = daysRemaining(goal.deadline);
            const isCompleted = goal.status === 'COMPLETED';

            return (
              <Card
                key={goal.id}
                hoverable
                onClick={() => setSelectedGoalId(goal.id)}
                className="cursor-pointer flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-text-primary truncate">{goal.title}</h4>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Created {formatDate(goal.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={goal.status} />
                </div>

                <ProgressBar percentage={percentage} status={goal.status} />

                <div className="flex justify-between items-end text-xs">
                  <div>
                    <span className="text-text-muted">Progress </span>
                    <span className="font-bold text-text-primary">{percentage}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-text-muted">{isCompleted ? 'Target' : 'Remaining'} </span>
                    <span className="font-bold text-brand-primary">
                      {isCompleted
                        ? formatINR(goal.targetCents)
                        : formatINR(Number(goal.targetCents) - Number(goal.currentCents))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <Clock className="h-3 w-3" />
                  {isCompleted ? (
                    <span className="text-brand-primary font-semibold">Target achieved</span>
                  ) : (
                    <span>
                      {days} day{days !== 1 ? 's' : ''} remaining • Due {formatDate(goal.deadline)}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateGoalModal onClose={() => setShowCreate(false)} onSuccess={fetchGoals} />
      )}
    </div>
  );
};
