import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notifications') || '[]'); } catch { return []; }
  });
  const [browserPermission, setBrowserPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 50)));
  }, [notifications]);

  const addNotification = useCallback((notification) => {
    const n = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };
    setNotifications((prev) => [n, ...prev.slice(0, 49)]);

    if (browserPermission === 'granted') {
      try {
        new Notification(n.title, { body: n.message, icon: '/favicon.ico', tag: n.type });
      } catch {}
    }

    const toastFn =
      n.type === 'danger' ? toast.error :
      n.type === 'warning' ? (msg) => toast(msg, { icon: '⚠️' }) :
      n.type === 'success' ? toast.success : toast;
    toastFn(`${n.title}: ${n.message}`);
    return n;
  }, [browserPermission]);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied';
    const perm = await Notification.requestPermission();
    setBrowserPermission(perm);
    return perm;
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const checkBudgetAlerts = useCallback((budgets) => {
    budgets.forEach((b) => {
      const key = `budget-alert-${b._id}-${b.month}-${b.year}`;
      const alerted = sessionStorage.getItem(key);
      const over = b.spent - b.limit;
      if (b.spent > b.limit && alerted !== 'over') {
        addNotification({
          title: '⚠️ Budget Alert — Exceeded!',
          message: `You have exceeded your ${b.category} budget by ₹${Math.abs(over).toLocaleString()} this month.`,
          type: 'danger',
          category: 'budget',
        });
        sessionStorage.setItem(key, 'over');
      } else if (b.percentUsed >= b.alertThreshold && alerted !== 'warning' && b.spent <= b.limit) {
        addNotification({
          title: '⚠️ Spending Warning',
          message: `You have used ${b.percentUsed}% of your ${b.category} budget. Only ₹${b.remaining.toLocaleString()} remaining.`,
          type: 'warning',
          category: 'budget',
        });
        sessionStorage.setItem(key, 'warning');
      }
    });
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, addNotification,
      markAllRead, clearAll, checkBudgetAlerts,
      browserPermission, requestBrowserPermission,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
