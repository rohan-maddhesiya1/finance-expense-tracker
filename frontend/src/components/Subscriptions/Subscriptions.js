import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, X, Pause, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Subscriptions.css';

const POPULAR = [
  { name:'Netflix', icon:'🎬', amount:649, category:'Entertainment', billing:'monthly' },
  { name:'Spotify', icon:'🎵', amount:119, category:'Entertainment', billing:'monthly' },
  { name:'YouTube Premium', icon:'📺', amount:129, category:'Entertainment', billing:'monthly' },
  { name:'Amazon Prime', icon:'📦', amount:299, category:'Shopping', billing:'monthly' },
  { name:'iCloud', icon:'☁️', amount:75, category:'Technology', billing:'monthly' },
  { name:'Google One', icon:'🔵', amount:130, category:'Technology', billing:'monthly' },
];

export default function Subscriptions() {
  const { user } = useAuth();
  const sym = { USD:'$', EUR:'€', GBP:'£', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$' }[user?.currency] || '$';
  const [subs, setSubs] = useState(() => JSON.parse(localStorage.getItem('subscriptions') || '[]'));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', icon:'📱', amount:'', billing:'monthly', category:'Entertainment', nextBilling:'', active:true });

  useEffect(() => { localStorage.setItem('subscriptions', JSON.stringify(subs)); }, [subs]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || !form.amount) return toast.error('Name and amount required');
    const sub = { ...form, id: Date.now(), amount: Number(form.amount) };
    setSubs(prev => [sub, ...prev]);
    toast.success('Subscription added!');
    setShowModal(false);
    setForm({ name:'', icon:'📱', amount:'', billing:'monthly', category:'Entertainment', nextBilling:'', active:true });
  };

  const addPopular = sub => {
    const today = new Date();
    today.setMonth(today.getMonth()+1);
    const newSub = { ...sub, id: Date.now(), nextBilling: today.toISOString().slice(0,10), active: true };
    setSubs(prev => [newSub, ...prev]);
    toast.success(`${sub.name} added!`);
  };

  const toggleActive = id => setSubs(prev => prev.map(s => s.id===id?{...s,active:!s.active}:s));
  const handleDelete = id => { setSubs(prev=>prev.filter(s=>s.id!==id)); toast.success('Removed'); };

  const monthly = subs.filter(s=>s.active).reduce((t,s)=>{
    if(s.billing==='monthly') return t+s.amount;
    if(s.billing==='yearly') return t+s.amount/12;
    return t;
  },0);
  const yearly = monthly * 12;

  return (
    <div className="subs-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription Tracker</h1>
          <p className="page-sub">Netflix, Spotify, OTT & more — all in one place</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16}/> Add Subscription
        </button>
      </div>

      <div className="subs-summary">
        <div className="sub-sum-card card">
          <span className="sub-sum-label">Monthly Cost</span>
          <span className="sub-sum-val" style={{color:'var(--red)'}}>{sym}{monthly.toFixed(2)}</span>
        </div>
        <div className="sub-sum-card card">
          <span className="sub-sum-label">Yearly Cost</span>
          <span className="sub-sum-val" style={{color:'var(--yellow)'}}>{sym}{yearly.toFixed(2)}</span>
        </div>
        <div className="sub-sum-card card">
          <span className="sub-sum-label">Active Subscriptions</span>
          <span className="sub-sum-val" style={{color:'var(--accent-light)'}}>{subs.filter(s=>s.active).length}</span>
        </div>
      </div>

      {subs.length === 0 && (
        <div className="popular-section">
          <h3 className="popular-title">Quick Add Popular Subscriptions</h3>
          <div className="popular-grid">
            {POPULAR.map(p => (
              <button key={p.name} className="popular-card card" onClick={() => addPopular(p)}>
                <span style={{fontSize:'1.6rem'}}>{p.icon}</span>
                <div className="popular-name">{p.name}</div>
                <div className="popular-price">{sym}{p.amount}/mo</div>
                <div className="popular-add">+ Add</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {subs.length > 0 && (
        <div className="subs-list">
          {subs.map(sub => (
            <div key={sub.id} className={`sub-item card ${!sub.active?'paused':''}`}>
              <div className="sub-icon">{sub.icon}</div>
              <div className="sub-info">
                <div className="sub-name">{sub.name}</div>
                <div className="sub-meta">{sub.category} · {sub.billing} {sub.nextBilling?`· Next: ${sub.nextBilling}`:''}</div>
              </div>
              <div className="sub-amount" style={{color: sub.active?'var(--red)':'var(--text-muted)'}}>
                {sym}{sub.amount}/{sub.billing==='yearly'?'yr':'mo'}
              </div>
              <div className="sub-actions">
                <button className={`sub-toggle ${sub.active?'active':''}`} onClick={() => toggleActive(sub.id)}>
                  {sub.active ? <><Pause size={12}/> Pause</> : <><Play size={12}/> Resume</>}
                </button>
                <button className="btn-ghost icon-btn" onClick={() => handleDelete(sub.id)}><X size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Subscription</h2>
              <button className="btn-ghost icon-btn" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group" style={{flex:'0 0 80px'}}>
                  <label>Icon</label>
                  <input value={form.icon} onChange={e=>setForm(f=>({...f,icon:e.target.value}))} style={{textAlign:'center',fontSize:'1.3rem'}} maxLength={2} />
                </div>
                <div className="form-group">
                  <label>Service Name</label>
                  <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Netflix, Spotify..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount ({sym})</label>
                  <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Billing Cycle</label>
                  <select value={form.billing} onChange={e=>setForm(f=>({...f,billing:e.target.value}))}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Next Billing Date</label>
                <input type="date" value={form.nextBilling} onChange={e=>setForm(f=>({...f,nextBilling:e.target.value}))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
