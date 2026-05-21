import React, { useState, useEffect } from 'react';
import { Landmark, TrendingUp, Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Savings.css';

export default function Savings() {
  const { user } = useAuth();
  const sym = { USD:'$', EUR:'€', GBP:'£', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$' }[user?.currency] || '$';
  const [entries, setEntries] = useState(() => JSON.parse(localStorage.getItem('savings_entries') || '[]'));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ month: new Date().toISOString().slice(0,7), income: '', expense: '', notes: '' });

  useEffect(() => { localStorage.setItem('savings_entries', JSON.stringify(entries)); }, [entries]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.income) return toast.error('Income is required');
    const saving = Number(form.income) - Number(form.expense || 0);
    const entry = { ...form, id: Date.now(), income: Number(form.income), expense: Number(form.expense||0), savings: saving };
    setEntries(prev => {
      const filtered = prev.filter(e => e.month !== form.month);
      return [entry, ...filtered].sort((a,b) => b.month.localeCompare(a.month));
    });
    toast.success('Savings entry saved!');
    setShowModal(false);
    setForm({ month: new Date().toISOString().slice(0,7), income:'', expense:'', notes:'' });
  };

  const totalSavings = entries.reduce((s,e) => s + e.savings, 0);
  const avgSavingsRate = entries.length ? (entries.reduce((s,e) => s + (e.savings/e.income*100), 0) / entries.length) : 0;

  return (
    <div className="savings-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Monthly Savings Tracker</h1>
          <p className="page-sub">Track your savings across months</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16}/> Add Month
        </button>
      </div>

      <div className="savings-summary">
        <div className="sav-card card">
          <Landmark size={22} style={{color:'var(--accent)'}} />
          <div className="sav-card-info">
            <span className="sav-label">Total Savings</span>
            <span className="sav-val" style={{color:'var(--green)'}}>{sym}{totalSavings.toLocaleString()}</span>
          </div>
        </div>
        <div className="sav-card card">
          <TrendingUp size={22} style={{color:'var(--yellow)'}} />
          <div className="sav-card-info">
            <span className="sav-label">Avg Savings Rate</span>
            <span className="sav-val" style={{color:'var(--yellow)'}}>{avgSavingsRate.toFixed(1)}%</span>
          </div>
        </div>
        <div className="sav-card card">
          <Landmark size={22} style={{color:'var(--blue)'}} />
          <div className="sav-card-info">
            <span className="sav-label">Months Tracked</span>
            <span className="sav-val" style={{color:'var(--blue)'}}>{entries.length}</span>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state card">
          <Landmark size={40} className="empty-icon" />
          <h3>No savings data yet</h3>
          <p>Start tracking your monthly savings to see your progress</p>
        </div>
      ) : (
        <div className="savings-table card">
          <table>
            <thead>
              <tr>
                <th>Month</th><th>Income</th><th>Expenses</th><th>Savings</th><th>Rate</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td className="month-cell">{e.month}</td>
                  <td className="green">{sym}{e.income.toLocaleString()}</td>
                  <td className="red">-{sym}{e.expense.toLocaleString()}</td>
                  <td className={e.savings>=0?'green':'red'}>{e.savings>=0?'+':''}{sym}{e.savings.toLocaleString()}</td>
                  <td>
                    <div className="rate-bar-wrap">
                      <div className="rate-bar" style={{width: Math.min(100, e.income?e.savings/e.income*100:0)+'%'}} />
                      <span>{e.income?(e.savings/e.income*100).toFixed(1):0}%</span>
                    </div>
                  </td>
                  <td className="notes-cell">{e.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Monthly Savings</h2>
              <button className="btn-ghost icon-btn" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Month</label>
                <input type="month" name="month" value={form.month} onChange={e => setForm(f=>({...f,month:e.target.value}))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Income ({sym})</label>
                  <input type="number" value={form.income} onChange={e=>setForm(f=>({...f,income:e.target.value}))} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Total Expense ({sym})</label>
                  <input type="number" value={form.expense} onChange={e=>setForm(f=>({...f,expense:e.target.value}))} placeholder="0.00" />
                </div>
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Any notes for this month..." />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
