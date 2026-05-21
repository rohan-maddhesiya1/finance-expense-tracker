import React, { useState } from 'react';
import { Bell, BellOff, Trash2, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationPanel.css';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICONS = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};
const TYPE_COLORS = {
  danger: 'var(--red)',
  warning: 'var(--yellow)',
  success: 'var(--green)',
  info: 'var(--accent)',
};

export default function NotificationPanel() {
  const { notifications, unreadCount, markAllRead, clearAll, browserPermission, requestBrowserPermission } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="notif-wrapper">
      <button className="notif-bell btn-ghost icon-btn" onClick={() => { setOpen((o) => !o); if (!open) markAllRead(); }}>
        <Bell size={18} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <>
          <div className="notif-backdrop" onClick={() => setOpen(false)} />
          <div className="notif-panel card">
            <div className="notif-panel-header">
              <h3>Notifications</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {notifications.length > 0 && (
                  <button className="btn-ghost icon-btn" onClick={clearAll} title="Clear all"><Trash2 size={14} /></button>
                )}
                <button className="btn-ghost icon-btn" onClick={() => setOpen(false)}><X size={16} /></button>
              </div>
            </div>

            {browserPermission !== 'granted' && (
              <div className="notif-browser-prompt">
                <BellOff size={14} />
                <span>Enable browser notifications</span>
                <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={requestBrowserPermission}>
                  Enable
                </button>
              </div>
            )}

            <div className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-empty">
                  <Bell size={32} style={{ opacity: 0.2 }} />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] || Info;
                  const color = TYPE_COLORS[n.type] || 'var(--accent)';
                  return (
                    <div key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
                      <div className="notif-icon" style={{ color, background: color + '22' }}>
                        <Icon size={14} />
                      </div>
                      <div className="notif-body">
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-msg">{n.message}</div>
                        <div className="notif-time">
                          {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                      {!n.read && <div className="notif-dot" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
