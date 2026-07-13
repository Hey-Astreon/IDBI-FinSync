import React, { useEffect, useState } from 'react';
import { useToastStore } from '../store/toast-store';
import { apiClient } from '../api/client';
import { Account, Transaction } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Skeleton } from '../components/Skeleton';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  ArrowLeft,
  ChevronRight,
  Info,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountTransactions, setAccountTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTxns, setIsLoadingTxns] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SAVINGS' | 'CURRENT'>('ALL');

  // Pagination State (Listing)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Create Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkAccountNumber, setLinkAccountNumber] = useState('');
  const [linkAccountType, setLinkAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [isLinking, setIsLinking] = useState(false);

  const { addToast } = useToastStore();

  const fetchAccounts = React.useCallback(async () => {
    try {
      const response = await apiClient.get('/accounts');
      setAccounts(response.data.data);
    } catch {
      addToast('error', 'Query Failed', 'Failed to retrieve linked ledgers.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAccounts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAccounts]);

  const handleSelectAccount = async (account: Account) => {
    setSelectedAccount(account);
    setIsLoadingTxns(true);
    try {
      // Get all transactions to filter client-side since API does not support accountId query param
      const response = await apiClient.get('/transactions?limit=100');
      const allTxns = response.data.data.transactions as Transaction[];
      const filtered = allTxns.filter((t) => t.accountId === account.id);
      setAccountTransactions(filtered);
    } catch {
      addToast('error', 'Query Failed', 'Failed to retrieve transactions for this ledger.');
    } finally {
      setIsLoadingTxns(false);
    }
  };

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
      addToast('success', 'Account Connected', 'Ledger linked successfully.');
      setIsLinkModalOpen(false);
      setLinkAccountNumber('');
      fetchAccounts();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to link account.';
      addToast('error', 'Link Failure', msg);
    } finally {
      setIsLinking(false);
    }
  };

  const formatINR = (cents: string | number) => {
    const val = Number(cents) / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val);
  };

  // Filter & Search Logic
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = acc.accountNumber.includes(searchQuery);
    const matchesType = typeFilter === 'ALL' || acc.accountType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <Skeleton variant="text" className="w-1/4 h-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {selectedAccount ? (
        /* Account Details view */
        <div className="flex flex-col gap-6">
          <div>
            <button
              onClick={() => setSelectedAccount(null)}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Accounts</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Detail Summary Panel */}
            <Card className="lg:col-span-1 flex flex-col gap-5 h-fit">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Ledger Details
                </h4>
                <h2 className="text-xl font-bold text-text-primary mt-1">
                  {selectedAccount.accountType} Account
                </h2>
              </div>

              <div className="flex flex-col gap-4 border-y border-border-light py-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Account Number</span>
                  <span className="font-mono text-text-primary font-semibold">
                    {selectedAccount.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Balance</span>
                  <span className="font-bold text-brand-primary">
                    {formatINR(selectedAccount.balanceCents)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Currency</span>
                  <span className="text-text-primary font-semibold">
                    {selectedAccount.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Connection Date</span>
                  <span className="text-text-primary font-semibold">
                    {new Date(selectedAccount.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Compliance note regarding modification */}
              <div className="p-3.5 bg-brand-primary/5 rounded-sq-sm border border-brand-primary/10 flex items-start gap-2.5 text-[11px] leading-relaxed text-text-secondary">
                <Info className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Compliance Directive</strong>: Editing or deleting connected bank ledgers
                  must be performed via the IDBI core branch portal.
                </span>
              </div>
            </Card>

            {/* Account Specific Transactions Panel */}
            <Card className="lg:col-span-2 flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold text-text-primary">Ledger Transactions</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Recent activities linked specifically to this account.
                </p>
              </div>

              {isLoadingTxns ? (
                <div className="flex flex-col gap-3 py-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : accountTransactions.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-xs">
                  No transaction history recorded for this account.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {accountTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-sq-sm border border-border-light flex items-center justify-between hover:bg-bg-base transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
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
                          <h4 className="text-xs font-semibold text-text-primary truncate max-w-[200px]">
                            {t.merchantName || 'Bank Transfer'}
                          </h4>
                          <p className="text-[10px] text-text-muted mt-0.5">
                            {t.category} • {new Date(t.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-xs font-bold ${
                            t.type === 'INFLOW' ? 'text-emerald-600' : 'text-text-primary'
                          }`}
                        >
                          {t.type === 'INFLOW' ? '+' : '-'} {formatINR(t.amountCents)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* Account Listing view */
        <div className="flex flex-col gap-6">
          {/* Header Row */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-text-secondary">
                Manage your connected bank accounts and statements.
              </p>
            </div>
            <Button onClick={() => setIsLinkModalOpen(true)} className="text-xs py-1.5">
              <Plus className="h-4 w-4 mr-1.5" /> Connect Account
            </Button>
          </div>

          {/* Search, Filter, and Controls Row */}
          <div className="flex flex-col sm:flex-row gap-3 items-center bg-bg-surface p-4 rounded-sq-md border border-border-light">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <Input
                id="search"
                type="text"
                placeholder="Search account numbers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value.replace(/\D/g, ''));
                  setCurrentPage(1);
                }}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Filter className="h-4 w-4 text-text-muted shrink-0" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-40 px-3 py-2 text-xs bg-bg-surface border border-border-light text-text-primary rounded-sq-sm focus:outline-none focus:border-border-focus"
              >
                <option value="ALL">All Types</option>
                <option value="SAVINGS">Savings Account</option>
                <option value="CURRENT">Current Account</option>
              </select>
            </div>
          </div>

          {/* Main Grid View */}
          {filteredAccounts.length === 0 ? (
            <Card className="text-center py-12 text-text-secondary flex flex-col items-center gap-3">
              <CreditCard className="h-10 w-10 text-text-muted" />
              <div>
                <h4 className="font-bold text-sm">No accounts found</h4>
                <p className="text-xs text-text-muted mt-1">
                  Adjust your filters or link a new bank account ledger to get started.
                </p>
              </div>
              <Button onClick={() => setIsLinkModalOpen(true)} className="text-xs py-1.5">
                Connect Account
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedAccounts.map((acc) => (
                <Card
                  key={acc.id}
                  hoverable
                  onClick={() => handleSelectAccount(acc)}
                  className="p-5 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-brand-primary/5 text-brand-primary flex items-center justify-center">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                        {acc.accountType}
                      </h4>
                      <p className="text-xs text-text-muted mt-0.5 font-mono">
                        IDBI •••• {acc.accountNumber.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-base font-extrabold text-brand-primary">
                        {formatINR(acc.balanceCents)}
                      </div>
                      <span className="text-[10px] text-text-muted">{acc.currency}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-muted" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <div className="flex justify-between items-center mt-2 border-t border-border-light pt-4">
              <span className="text-xs text-text-secondary">
                Showing Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="text-xs py-1 px-3"
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="text-xs py-1 px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Account Link Modal Dialog */}
      {isLinkModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsLinkModalOpen(false)}
          />
          <Card className="relative w-full max-w-sm bg-bg-surface border-border-light shadow-ambient flex flex-col gap-4 z-10 animate-scale-up">
            <div>
              <h3 className="text-base font-bold text-text-primary">Connect Bank Account</h3>
              <p className="text-xs text-text-secondary mt-1">
                Enter your details to sync records with IDBI Core ledger database.
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
                  className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-light text-text-primary rounded-sq-sm focus:outline-none"
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
                  Connect
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
};
