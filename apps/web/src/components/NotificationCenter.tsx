import React, { useState, useEffect } from 'react';
import { Bell, Check, Info } from 'lucide-react';
import { useToastStore } from '../store/toast-store';
import { useAuthStore } from '../store/auth-store';
import { apiClient } from '../api/client';
import { Notification } from '../types';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { addToast } = useToastStore();
  const { setScreen } = useAuthStore();

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications');
      const data = response.data.data;
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
    } catch {
      console.error('Failed to load notifications');
    }
  };

  useEffect(() => {
    // Run asynchronously after the initial paint to prevent cascading render error
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);

    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      addToast('success', 'Notification Cleared', 'Marked as read.');
    } catch {
      addToast('error', 'Action Failed', 'Could not clear notification.');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full border border-border-light bg-bg-surface hover:bg-opacity-80 transition-all text-text-secondary hover:text-text-primary"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-brand-secondary text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <>
          {/* Overlay to dismiss */}
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2.5 w-80 max-h-96 overflow-y-auto rounded-sq-md border border-border-light bg-bg-surface p-4 shadow-ambient z-40 flex flex-col gap-3">
            <div className="flex justify-between items-center pb-2 border-b border-border-light">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                Notifications
              </h4>
              {unreadCount > 0 ? (
                <span className="text-[10px] bg-brand-primary-light px-2 py-0.5 rounded-full font-medium text-brand-primary">
                  {unreadCount} Unread
                </span>
              ) : null}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-6 text-text-muted text-xs flex flex-col items-center gap-1.5">
                <Info className="h-4 w-4" />
                <span>No notifications found.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-sq-sm border text-xs flex items-start gap-2.5 transition-all ${
                      notif.isRead
                        ? 'border-border-light opacity-60 bg-transparent'
                        : 'border-brand-primary/20 bg-brand-primary/5'
                    }`}
                  >
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="font-semibold text-text-primary leading-tight">
                        {notif.title}
                      </div>
                      <div className="text-text-secondary leading-normal">{notif.message}</div>
                      <div className="text-[9px] text-text-muted mt-0.5">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {!notif.isRead ? (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-1 rounded bg-bg-surface hover:bg-brand-primary-light text-text-secondary hover:text-brand-primary transition-all shrink-0"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                setScreen('notifications');
              }}
              className="text-center text-[11px] font-semibold text-brand-primary hover:text-brand-secondary pt-2 border-t border-border-light transition-colors w-full"
            >
              View All Notifications
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};
