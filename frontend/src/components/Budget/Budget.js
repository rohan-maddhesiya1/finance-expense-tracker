import React, { useEffect, useState, useCallback } from 'react';
import { budgetAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

import './Budget.css';

const CATEGORIES = ['Food & Dining','Shopping','Transportation','Bills & Utilities','Entertainment','Health & Medical','Travel','Education','Investments','Other'];

const emptyForm = { category: 'Food & Dining', limit: '', alertThreshold: 80 };

export default function Budget() {
  const { user } = useAuth();
  const { checkBudgetAlerts } = useNotifications();
  const currSymbols = { USD:'$', EUR:'€', GBP:'£', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$', SGD:'S$', AED:'AED', CHF:'CHF', CNY:'¥', MXN:'MXN', BRL:'R$' }; const sym = currSymbols[user?.currency] || '$';
  const now = new Date();

  const [budgets, setBudgets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [month, setMonth]         = useState(now.getMonth() + 1);
  const [year, setYear]           = useState(now.getFullYear());

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await budgetAPI.getAll({ month, year });
      setBudgets(res.data.budgets);
      if (res.data.budgets?.length) checkBudgetAlerts(res.data.budgets);
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  }, [month, year, checkBudgetAlerts]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.limit) return toast.error('Please enter a budget limit');
    setSaving(true);
    try {
      await budgetAPI.create({ ...form, limit: Number(form.limit), month, year });
      toast.success('Budget saved!');
      setShowModal(false);
      setForm(emptyForm);
      fetchBudgets();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save budget'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await budgetAPI.delete(id);
      toast.success('Budget deleted');
      fetchBudgets();
    } catch { toast.error('Failed to delete'); }
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent  = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="budget-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-sub">Set and track monthly spending limits</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ width: 'auto' }}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 'auto' }}>
            {[2023, 2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
          </select>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Budget
          </button>
        </div>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="budget-summary card">
          <div className="summary-stat">
            <span className="summary-label">Total Budget</span>
            <span className="summary-value">{sym}{totalBudget.toLocaleString()}</span>
          </div>
          <div className="summary-stat">
            <span className="summary-label">Total Spent</span>
            <span className="summary-value" style={{ color: totalSpent > totalBudget ? 'var(--red)' : 'var(--green)' }}>
              {sym}{totalSpent.toLocaleString()}
            </span>
          </div>
          <div className="summary-stat">
            <span className="summary-label">Remaining</span>
            <span className="summary-value">{sym}{(totalBudget - totalSpent).toLocaleString()}</span>
          </div>
          <div className="summary-stat">
            <span className="summary-label">Categories</span>
            <span className="summary-value">{budgets.length}</span>
          </div>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
      ) : budgets.length === 0 ? (
        <div className="card"><div className="empty-state"><Plus size={40} /><p>No budgets for {months[month - 1]} {year}. Create one!</p></div></div>
      ) : (
        <div className="budgets-grid">
          {budgets.map((b) => {
            const pct = Math.min(b.percentUsed, 100);
            const over = b.spent > b.limit;
            const warning = b.percentUsed >= b.alertThreshold && !over;
            const barColor = over ? 'var(--red)' : warning ? 'var(--yellow)' : 'var(--accent)';

            return (
              <div key={b._id} className={`budget-card card ${over ? 'over-budget' : ''}`}>
                <div className="budget-card-header">
                  <div>
                    <div className="budget-category">{b.category}</div>
                    <div className="budget-month">{months[month - 1]} {year}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {(over || warning) && (
                      <AlertTriangle size={16} style={{ color: over ? 'var(--red)' : 'var(--yellow)' }} />
                    )}
                    <button className="btn-ghost icon-btn danger" onClick={() => handleDelete(b._id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="budget-amounts">
                  <div>
                    <div className="amount-label">Spent</div>
                    <div className="amount-value" style={{ color: over ? 'var(--red)' : 'var(--text-primary)' }}>
                      {sym}{b.spent.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="amount-label">Limit</div>
                    <div className="amount-value">{sym}{b.limit.toLocaleString()}</div>
                  </div>
                </div>

                <div className="progress-bar" style={{ marginTop: 12 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                </div>

                <div className="budget-footer">
                  <span style={{ color: barColor, fontWeight: 600, fontSize: '0.85rem' }}>
                    {b.percentUsed}% used
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {over ? `${sym}${(b.spent - b.limit).toLocaleString()} over` : `${sym}${b.remaining.toLocaleString()} left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Budget</h3>
              <button className="btn-ghost icon-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Monthly Limit ({sym}) *</label>
                <input type="number" placeholder="0.00" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} min="1" step="0.01" required />
              </div>
              <div className="form-group">
                <label>Alert at {form.alertThreshold}% usage</label>
                <input type="range" min="10" max="100" step="5" value={form.alertThreshold}
                  onChange={(e) => setForm({ ...form, alertThreshold: Number(e.target.value) })}
                  style={{ padding: 0, border: 'none', background: 'transparent', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create Budget'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
