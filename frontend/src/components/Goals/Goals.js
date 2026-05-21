import React, { useState, useEffect } from 'react';
import { Star, Plus, Trash2, X, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Goals.css';

export default function Goals() {
  const { user } = useAuth();
  const sym = { USD:'$', EUR:'€', GBP:'£', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$' }[user?.currency] || '$';
  const [goals, setGoals] = useState(() => JSON.parse(localStorage.getItem('savings_goals') || '[]'));
  const [showModal, setShowModal] = useState(false);
  const [addFundsId, setAddFundsId] = useState(null);
  const [addAmount, setAddAmount] = useState('');
  const [form, setForm] = useState({ name:'', targetAmount:'', currentAmount:'0', deadline:'', icon:'🎯', color:'#6c63ff' });

  const ICONS = ['🎯','🏠','🚗','✈️','💻','📱','💍','🎓','🏖️','💪'];
  const COLORS = ['#6c63ff','#22c55e','#f59e0b','#3b82f6','#ef4444','#ec4899'];

  useEffect(() => { localStorage.setItem('savings_goals', JSON.stringify(goals)); }, [goals]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || !form.targetAmount) return toast.error('Name and target required');
    const goal = { ...form, id: Date.now(), targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount||0) };
    setGoals(prev => [goal, ...prev]);
    toast.success('Goal created!');
    setShowModal(false);
    setForm({ name:'', targetAmount:'', currentAmount:'0', deadline:'', icon:'🎯', color:'#6c63ff' });
  };

  const handleAddFunds = goalId => {
    const amt = Number(addAmount);
    if (!amt || amt <= 0) return toast.error('Enter valid amount');
    setGoals(prev => prev.map(g => g.id === goalId ? {...g, currentAmount: Math.min(g.currentAmount + amt, g.targetAmount)} : g));
    toast.success(`${sym}${amt} added!`);
    setAddFundsId(null);
    setAddAmount('');
  };

  const handleDelete = id => {
    if (!window.confirm('Delete this goal?')) return;
    setGoals(prev => prev.filter(g => g.id !== id));
    toast.success('Goal deleted');
  };

  return (
    <div className="goals-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="page-sub">Track and achieve your financial goals</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16}/> New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state card">
          <Star size={40} className="empty-icon" />
          <h3>No goals yet</h3>
          <p>Create your first savings goal and start your journey</p>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map(goal => {
            const pct = Math.min(100, goal.targetAmount ? (goal.currentAmount/goal.targetAmount*100) : 0);
            const done = pct >= 100;
            return (
              <div key={goal.id} className={`goal-card card ${done?'goal-done':''}`}>
                <div className="goal-header">
                  <div className="goal-icon-wrap" style={{background: goal.color+'22'}}>
                    <span style={{fontSize:'1.4rem'}}>{goal.icon}</span>
                  </div>
                  <div className="goal-info">
                    <div className="goal-name">{goal.name}</div>
                    {goal.deadline && <div className="goal-deadline">Target: {goal.deadline}</div>}
                  </div>
                  {done && <span className="goal-badge">✓ Complete</span>}
                  <button className="btn-ghost icon-btn" onClick={() => handleDelete(goal.id)}><Trash2 size={14}/></button>
                </div>
                <div className="goal-amounts">
                  <span style={{color:'var(--green)', fontWeight:700}}>{sym}{goal.currentAmount.toLocaleString()}</span>
                  <span style={{color:'var(--text-muted)'}}>of {sym}{goal.targetAmount.toLocaleString()}</span>
                </div>
                <div className="goal-progress-wrap">
                  <div className="goal-progress-bar" style={{background:goal.color+'33'}}>
                    <div className="goal-progress-fill" style={{width:pct+'%', background:goal.color}} />
                  </div>
                  <span className="goal-pct">{pct.toFixed(0)}%</span>
                </div>
                {!done && (
                  addFundsId === goal.id ? (
                    <div className="goal-add-funds">
                      <input type="number" placeholder={`Amount (${sym})`} value={addAmount} onChange={e=>setAddAmount(e.target.value)} />
                      <button className="btn-primary" onClick={() => handleAddFunds(goal.id)}>Add</button>
                      <button className="btn-secondary" onClick={()=>setAddFundsId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="goal-add-btn" style={{borderColor:goal.color, color:goal.color}} onClick={()=>setAddFundsId(goal.id)}>+ Add Funds</button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Savings Goal</h2>
              <button className="btn-ghost icon-btn" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Goal Name</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. New Laptop, Vacation..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Target Amount ({sym})</label>
                  <input type="number" value={form.targetAmount} onChange={e=>setForm(f=>({...f,targetAmount:e.target.value}))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Current Savings ({sym})</label>
                  <input type="number" value={form.currentAmount} onChange={e=>setForm(f=>({...f,currentAmount:e.target.value}))} placeholder="0" />
                </div>
              </div>
              <div className="form-group">
                <label>Target Date (optional)</label>
                <input type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <div className="icon-picker">{ICONS.map(i=><button key={i} type="button" className={`icon-btn-sel ${form.icon===i?'active':''}`} onClick={()=>setForm(f=>({...f,icon:i}))}>{i}</button>)}</div>
              </div>
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">{COLORS.map(c=><button key={c} type="button" className={`color-dot ${form.color===c?'active':''}`} style={{background:c}} onClick={()=>setForm(f=>({...f,color:c}))} />)}</div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
