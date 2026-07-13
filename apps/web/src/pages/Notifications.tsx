import React, { useEffect, useState, useCallback } from 'react';
import { useToastStore } from '../store/toast-store';
import { apiClient } from '../api/client';
import { Notification } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { Bell, Check, Info, SlidersHorizontal, RefreshCw } from 'lucide-react';

type FilterType = 'all' | 'unread' | 'read';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const { addToast } = useToastStore();

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/notifications');
      setNotifications(response.data.data);
    } catch {
      addToast('error', 'Fetch Failed', 'Could not load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchNotifications();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      addToast('success', 'Notification Cleared', 'Notification marked as read.');
    } catch {
      addToast('error', 'Action Failed', 'Could not update notification state.');
    }
  };

  // Client-side filtering
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-text-secondary">
            Stay updated with secure alerts, transaction signals, and financial milestone
            notifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mark All As Read - Disabled as backend has no bulk endpoint */}
          <div title="Bulk mark all as read is not supported by the current API specifications">
            <Button
              variant="secondary"
              disabled
              className="text-xs opacity-50 cursor-not-allowed"
              aria-disabled="true"
            >
              Mark All as Read
            </Button>
          </div>
          <Button
            variant="secondary"
            onClick={fetchNotifications}
            className="text-xs"
            aria-label="Refresh notifications"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* API Compliance Info Notice */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-sq-sm border border-border-light bg-bg-surface text-xs text-text-secondary">
        <Info className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
        <span>
          <strong>Audit Info</strong>: Bulk notifications management and delete actions are not
          exposed in the frozen backend endpoints. Clear alerts individually using the check button.
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border-light pb-1">
        <SlidersHorizontal className="h-3.5 w-3.5 text-text-secondary mr-1" />
        {(['all', 'unread', 'read'] as FilterType[]).map((type) => {
          const count =
            type === 'all'
              ? notifications.length
              : type === 'unread'
                ? notifications.filter((n) => !n.isRead).length
                : notifications.filter((n) => n.isRead).length;

          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                filter === type
                  ? 'border-brand-primary text-brand-primary font-bold'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {type} ({count})
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex gap-4 items-start border-b border-border-light pb-4 last:border-0 last:pb-0"
              >
                <Skeleton variant="circle" className="w-10 h-10 shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton variant="text" className="w-1/4 h-4" />
                  <Skeleton variant="text" className="w-3/4 h-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Bell className="h-10 w-10 text-text-muted" />
            <div>
              <h4 className="text-sm font-bold text-text-secondary">No notifications found</h4>
              <p className="text-xs text-text-muted mt-1">
                {filter === 'all'
                  ? 'You are completely up to date. No notifications recorded yet.'
                  : `No ${filter} notifications matching the filter.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredNotifications.map((notif, idx) => (
              <div
                key={notif.id}
                className={`flex gap-4 items-start p-5 transition-all ${
                  notif.isRead ? 'opacity-60 bg-transparent' : 'bg-brand-primary/5'
                } ${idx < filteredNotifications.length - 1 ? 'border-b border-border-light' : ''}`}
              >
                {/* Icon wrapper */}
                <div
                  className={`p-2 rounded-full shrink-0 ${
                    notif.isRead
                      ? 'bg-text-muted/10 text-text-secondary'
                      : 'bg-brand-primary/15 text-brand-primary'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                </div>

                {/* Text Context */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-sm font-bold text-text-primary leading-tight">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-text-muted shrink-0 mt-0.5">
                      {new Date(notif.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-normal">{notif.message}</p>
                </div>

                {/* Actions */}
                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="p-1.5 rounded-sq-sm border border-border-light hover:border-brand-primary hover:bg-brand-primary/5 text-text-secondary hover:text-brand-primary transition-all shrink-0 ml-2"
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
