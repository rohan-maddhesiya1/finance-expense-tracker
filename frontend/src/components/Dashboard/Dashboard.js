import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { expenseAPI, budgetAPI } from '../../utils/api';
import { useNotifications } from '../../context/NotificationContext';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import AIInsights from '../AIInsights/AIInsights';
import './Dashboard.css';

const CATEGORY_COLORS = {
  'Food & Dining': '#f59e0b', 'Shopping': '#8b5cf6', 'Transportation': '#3b82f6',
  'Bills & Utilities': '#ef4444', 'Entertainment': '#ec4899', 'Health & Medical': '#22c55e',
  'Travel': '#06b6d4', 'Education': '#f97316', 'Investments': '#6366f1', 'Other': '#6b7280',
};

function StatCard({ title, value, icon: Icon, color, change, currency }) {
  return (
    <div className="stat-card card">
      <div className="stat-top">
        <div className="stat-label">{title}</div>
        <div className="stat-icon-wrap" style={{ background: color + '22', color }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="stat-value">
        <span className="currency-sym">{currency}</span>
        {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      {change !== undefined && (
        <div className={`stat-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          <span>{Math.abs(change).toFixed(1)}% vs last month</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { checkBudgetAlerts } = useNotifications();
  const now = new Date();
  const [summary, setSummary] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const currencySymbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CAD: 'CA$', AUD: 'A$' };
  const sym = currencySymbols[user?.currency] || '$';

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, expRes, budgetRes] = await Promise.all([
        expenseAPI.getSummary({ month: now.getMonth() + 1, year: now.getFullYear() }),
        expenseAPI.getAll({ limit: 6, page: 1 }),
        budgetAPI.getAll({ month: now.getMonth() + 1, year: now.getFullYear() }),
      ]);
      setSummary(sumRes.data.summary);
      setRecentExpenses(expRes.data.expenses);
      // Fire budget alerts
      if (budgetRes.data.budgets?.length) {
        checkBudgetAlerts(budgetRes.data.budgets);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [checkBudgetAlerts]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const netBalance = summary?.netBalance || 0;
  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpense || 0;
  const breakdown = summary?.categoryBreakdown || [];

  const chartData = breakdown.slice(0, 6).map((b) => ({
    name: b._id.split(' ')[0],
    amount: b.total,
  }));

  return (
    <div className="dashboard fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">
            {format(now, 'MMMM yyyy')} — Welcome back, <strong>{user?.name?.split(' ')[0]}</strong>
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Net Balance"   value={netBalance}    icon={Wallet}       color="#6c63ff" currency={sym} />
        <StatCard title="Total Income"  value={totalIncome}   icon={TrendingUp}   color="#22c55e" currency={sym} />
        <StatCard title="Total Expense" value={totalExpense}  icon={TrendingDown} color="#ef4444" currency={sym} />
      </div>

      {/* AI Insights */}
      <AIInsights />

      <div className="dashboard-grid">
        <div className="card">
          <h3 className="card-title">Spending by Category</h3>
          {breakdown.length === 0 ? (
            <div className="empty-state"><p>No expenses this month</p></div>
          ) : (
            <div className="category-list">
              {breakdown.map((b) => {
                const pct = totalExpense > 0 ? Math.round((b.total / totalExpense) * 100) : 0;
                const color = CATEGORY_COLORS[b._id] || '#6c63ff';
                return (
                  <div key={b._id} className="category-row">
                    <div className="cat-meta">
                      <span className="cat-dot" style={{ background: color }} />
                      <span className="cat-name">{b._id}</span>
                      <span className="cat-pct">{pct}%</span>
                    </div>
                    <div className="cat-right">
                      <span className="cat-amount">{sym}{b.total.toLocaleString()}</span>
                    </div>
                    <div className="progress-bar" style={{ marginTop: 6 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Category Overview</h3>
          {chartData.length === 0 ? (
            <div className="empty-state"><p>No data available</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}
                  labelStyle={{ color: 'var(--text-primary)', fontSize: 12 }}
                  itemStyle={{ color: 'var(--accent-light)' }}
                  formatter={(v) => [`${sym}${v.toLocaleString()}`, 'Amount']}
                />
                <Area type="monotone" dataKey="amount" stroke="#6c63ff" strokeWidth={2} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card recent-card">
        <div className="card-header-row">
          <h3 className="card-title">Recent Transactions</h3>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="empty-state"><p>No transactions yet. Add your first one!</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th><th>Category</th><th>Date</th><th>Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((tx) => (
                  <tr key={tx._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{tx.title}</td>
                    <td>{tx.category}</td>
                    <td>{format(new Date(tx.date), 'MMM dd, yyyy')}</td>
                    <td><span className={`badge badge-${tx.type}`}>{tx.type}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                      {tx.type === 'income' ? '+' : '-'}{sym}{tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
