import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, Trash2, X, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Recurring.css';

const CATEGORIES_EXPENSE = ['Food & Dining','Shopping','Transportation','Bills & Utilities','Entertainment','Health & Medical','Travel','Education','Investments','Other'];
const CATEGORIES_INCOME  = ['Salary','Freelance','Business','Investments','Other'];
const PERIODS = ['daily','weekly','monthly','yearly'];
const emptyForm = { title:'', amount:'', type:'expense', category:'Food & Dining', paymentMethod:'Cash', recurringPeriod:'monthly', nextDate:'' };

export default function Recurring() {
  const { user } = useAuth();
  const sym = { USD:'$', EUR:'€', GBP:'£', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$' }[user?.currency] || '$';
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('recurring_items') || '[]'));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { localStorage.setItem('recurring_items', JSON.stringify(items)); }, [items]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value, ...(name==='type'?{category: value==='income'?'Salary':'Food & Dining'}:{}) }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.title || !form.amount) return toast.error('Title and amount required');
    const item = { ...form, id: Date.now(), amount: Number(form.amount), createdAt: new Date().toISOString() };
    setItems(prev => [item, ...prev]);
    toast.success('Recurring entry added!');
    setShowModal(false);
    setForm(emptyForm);
  };

  const handleDelete = id => {
    if (!window.confirm('Delete this recurring entry?')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Deleted');
  };

  const income = items.filter(i=>i.type==='income').reduce((s,i)=>s+i.amount,0);
  const expense = items.filter(i=>i.type==='expense').reduce((s,i)=>s+i.amount,0);

  return (
    <div className="recurring-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recurring Transactions</h1>
          <p className="page-sub">Manage your regular income & expenses</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Recurring
        </button>
      </div>

      <div className="rec-summary">
        <div className="rec-sum-card income-card">
          <span className="rec-sum-label">Monthly Recurring Income</span>
          <span className="rec-sum-val green">{sym}{income.toLocaleString()}</span>
        </div>
        <div className="rec-sum-card expense-card">
          <span className="rec-sum-label">Monthly Recurring Expense</span>
          <span className="rec-sum-val red">-{sym}{expense.toLocaleString()}</span>
        </div>
        <div className="rec-sum-card net-card">
          <span className="rec-sum-label">Net Monthly</span>
          <span className={`rec-sum-val ${income-expense>=0?'green':'red'}`}>{sym}{(income-expense).toLocaleString()}</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state card">
          <RefreshCw size={40} className="empty-icon" />
          <h3>No recurring transactions</h3>
          <p>Add your salary, rent, subscriptions and other regular transactions</p>
        </div>
      ) : (
        <div className="rec-list">
          {items.map(item => (
            <div key={item.id} className="rec-item card">
              <div className="rec-item-icon" style={{background: item.type==='income'?'var(--green-dim)':'var(--red-dim)'}}>
                <DollarSign size={18} style={{color: item.type==='income'?'var(--green)':'var(--red)'}} />
              </div>
              <div className="rec-item-info">
                <div className="rec-item-title">{item.title}</div>
                <div className="rec-item-meta">{item.category} · {item.paymentMethod}</div>
              </div>
              <div className="rec-item-period">
                <Calendar size={12} />
                <span>{item.recurringPeriod}</span>
              </div>
              <div className={`rec-item-amount ${item.type==='income'?'green':'red'}`}>
                {item.type==='income'?'+':'-'}{sym}{Number(item.amount).toLocaleString()}
              </div>
              <button className="btn-ghost icon-btn" onClick={() => handleDelete(item.id)}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Recurring Transaction</h2>
              <button className="btn-ghost icon-btn" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Period</label>
                  <select name="recurringPeriod" value={form.recurringPeriod} onChange={handleChange}>
                    {PERIODS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Netflix, Rent, Salary" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount ({sym})</label>
                  <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0.00" min="0" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={form.category} onChange={handleChange}>
                    {(form.type==='income'?CATEGORIES_INCOME:CATEGORIES_EXPENSE).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Next Due Date</label>
                <input type="date" name="nextDate" value={form.nextDate} onChange={handleChange} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Recurring</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
