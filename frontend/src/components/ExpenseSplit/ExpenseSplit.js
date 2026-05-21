import React, { useState, useEffect } from 'react';
import { Split, Plus, X, Users, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './ExpenseSplit.css';

export default function ExpenseSplit() {
  const { user } = useAuth();
  const sym = { USD:'$', EUR:'€', GBP:'£', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$' }[user?.currency] || '$';
  const [splits, setSplits] = useState(() => JSON.parse(localStorage.getItem('split_expenses') || '[]'));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', totalAmount:'', participants:'', date: new Date().toISOString().slice(0,10), notes:'' });

  useEffect(() => { localStorage.setItem('split_expenses', JSON.stringify(splits)); }, [splits]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.title || !form.totalAmount || !form.participants) return toast.error('All fields required');
    const names = form.participants.split(',').map(n=>n.trim()).filter(Boolean);
    if (names.length < 2) return toast.error('Add at least 2 participants');
    const perPerson = Number(form.totalAmount) / names.length;
    const split = {
      id: Date.now(), title: form.title, totalAmount: Number(form.totalAmount), date: form.date, notes: form.notes,
      participants: names.map(name => ({ name, amount: perPerson, paid: name === (user?.name || names[0]) }))
    };
    setSplits(prev => [split, ...prev]);
    toast.success('Split created!');
    setShowModal(false);
    setForm({ title:'', totalAmount:'', participants:'', date: new Date().toISOString().slice(0,10), notes:'' });
  };

  const togglePaid = (splitId, participantName) => {
    setSplits(prev => prev.map(s => s.id===splitId ? {
      ...s, participants: s.participants.map(p => p.name===participantName ? {...p, paid:!p.paid} : p)
    } : s));
  };

  const handleDelete = id => {
    if (!window.confirm('Delete this split?')) return;
    setSplits(prev => prev.filter(s => s.id !== id));
  };

  const totalOwed = splits.reduce((sum, s) => sum + s.participants.filter(p => !p.paid && p.name !== (user?.name)).reduce((a,p)=>a+p.amount,0), 0);

  return (
    <div className="split-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Split Expenses</h1>
          <p className="page-sub">Split bills with friends & track who owes what</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16}/> New Split
        </button>
      </div>

      {totalOwed > 0 && (
        <div className="split-alert card">
          <Clock size={20} style={{color:'var(--yellow)'}} />
          <span>You are owed <strong>{sym}{totalOwed.toFixed(2)}</strong> in total across all splits</span>
        </div>
      )}

      {splits.length === 0 ? (
        <div className="empty-state card">
          <Split size={40} className="empty-icon" />
          <h3>No splits yet</h3>
          <p>Split a dinner, trip, or any shared expense with friends</p>
        </div>
      ) : (
        <div className="splits-list">
          {splits.map(split => {
            const paidCount = split.participants.filter(p=>p.paid).length;
            const allPaid = paidCount === split.participants.length;
            return (
              <div key={split.id} className={`split-card card ${allPaid?'all-paid':''}`}>
                <div className="split-card-header">
                  <div>
                    <div className="split-title">{split.title}</div>
                    <div className="split-meta">{split.date} · {split.participants.length} people</div>
                  </div>
                  <div className="split-total">{sym}{split.totalAmount.toLocaleString()}</div>
                  <button className="btn-ghost icon-btn" onClick={() => handleDelete(split.id)}><X size={14}/></button>
                </div>
                {split.notes && <p className="split-notes">{split.notes}</p>}
                <div className="split-participants">
                  {split.participants.map(p => (
                    <div key={p.name} className={`participant-row ${p.paid?'paid':''}`}>
                      <div className="participant-avatar">{p.name.charAt(0).toUpperCase()}</div>
                      <span className="participant-name">{p.name}</span>
                      <span className="participant-amount">{sym}{p.amount.toFixed(2)}</span>
                      <button className={`paid-btn ${p.paid?'is-paid':''}`} onClick={() => togglePaid(split.id, p.name)}>
                        {p.paid ? <><CheckCircle size={14}/> Paid</> : 'Mark Paid'}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="split-progress">
                  <div className="split-prog-bar">
                    <div className="split-prog-fill" style={{width:(paidCount/split.participants.length*100)+'%'}} />
                  </div>
                  <span>{paidCount}/{split.participants.length} paid</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Split Expense</h2>
              <button className="btn-ghost icon-btn" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Expense Title</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Dinner at Restaurant" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Amount ({sym})</label>
                  <input type="number" value={form.totalAmount} onChange={e=>setForm(f=>({...f,totalAmount:e.target.value}))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label>Participants (comma-separated names)</label>
                <input value={form.participants} onChange={e=>setForm(f=>({...f,participants:e.target.value}))} placeholder="John, Jane, Mike..." />
                <small style={{color:'var(--text-muted)'}}>Amount will be split equally</small>
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Any notes..." />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Split</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
