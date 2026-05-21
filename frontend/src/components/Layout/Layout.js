import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  LogOut, Menu, X, Wallet, ChevronRight,
  RefreshCw, Landmark, Split, Bell, CreditCard,
  TrendingUp, Lightbulb, Calculator, Star,
} from 'lucide-react';
import NotificationPanel from '../Notifications/NotificationPanel';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import './Layout.css';

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses',      icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/budget',        icon: Target,          label: 'Budgets' },
  { to: '/reports',       icon: PieChart,        label: 'Reports' },
  { to: '/recurring',     icon: RefreshCw,       label: 'Recurring' },
  { to: '/savings',       icon: Landmark,        label: 'Savings' },
  { to: '/goals',         icon: Star,            label: 'Goals' },
  { to: '/split',         icon: Split,           label: 'Split Expenses' },
  { to: '/reminders',     icon: Bell,            label: 'Bill Reminders' },
  { to: '/subscriptions', icon: CreditCard,      label: 'Subscriptions' },
  { to: '/insights',      icon: Lightbulb,       label: 'Insights' },
  { to: '/tax',           icon: Calculator,      label: 'Tax Calculator' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Wallet size={22} />
            <span>ExpenseIQ</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={16} />
              <span>{label}</span>
              <ChevronRight size={12} className="nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div className="user-text">
              <p className="user-name">{user?.name}</p>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-right">
            <span className="currency-pill">{user?.currency || 'USD'}</span>
            <ThemeSwitcher />
            <NotificationPanel />
            <div className="topbar-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
