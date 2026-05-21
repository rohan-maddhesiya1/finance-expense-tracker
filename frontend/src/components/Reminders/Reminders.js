import React, { useState, useEffect } from 'react';
import { Bell, Plus, X, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Reminders.css';

export default function Reminders() {
  const { user } = useAuth();
  const sym = { USD:'$', EUR:'€', GBP:'£', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$' }[user?.currency] || '$';
  const [reminders, setReminders] = useState(() => JSON.parse(localStorage.getItem('bill_reminders') || '[]'));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', amount:'', dueDate:'', category:'Bills & Utilities', recurring:'monthly', notes:'' });

  useEffect(() => { localStorage.setItem('bill_reminders', JSON.stringify(reminders)); }, [reminders]);

  const getStatus = (dueDate, paid) => {
    if (paid) return 'paid';
    const days = Math.ceil((new Date(dueDate) - new Date()) / (1000*60*60*24));
    if (days < 0) return 'overdue';
    if (days <= 3) return 'urgent';
    return 'upcoming';
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.dueDate) return toast.error('Title, amount and due date required');
    const rem = { ...form, id: Date.now(), amount: Number(form.amount), paid: false };
    setReminders(prev => [rem, ...prev].sort((a,b) => new Date(a.dueDate)-new Date(b.dueDate)));
    toast.success('Reminder added!');
    setShowModal(false);
    setForm({ title:'', amount:'', dueDate:'', category:'Bills & Utilities', recurring:'monthly', notes:'' });
  };

  const togglePaid = id => {
    setReminders(prev => prev.map(r => r.id===id ? {...r, paid:!r.paid} : r));
  };

  const handleDelete = id => {
    setReminders(prev => prev.filter(r => r.id !== id));
    toast.success('Reminder deleted');
  };

  const overdue = reminders.filter(r => !r.paid && getStatus(r.dueDate,'')!=='paid' && new Date(r.dueDate)<new Date());
  const upcoming = reminders.filter(r => !r.paid && new Date(r.dueDate)>=new Date());
  const paid = reminders.filter(r => r.paid);

  const statusConfig = { overdue:{icon:AlertTriangle,color:'var(--red)',label:'Overdue'}, urgent:{icon:Clock,color:'var(--yellow)',label:'Due Soon'}, upcoming:{icon:Bell,color:'var(--blue)',label:'Upcoming'}, paid:{icon:CheckCircle,color:'var(--green)',label:'Paid'} };

  const ReminderItem = ({r}) => {
    const status = getStatus(r.dueDate, r.paid);
    const cfg = statusConfig[status];
    const StatusIcon = cfg.icon;
    const daysLeft = Math.ceil((new Date(r.dueDate) - new Date()) / (1000*60*60*24));
    return (
      <div className={`reminder-item card status-${status}`}>
        <div className="reminder-status-icon" style={{background:cfg.color+'22'}}>
          <StatusIcon size={18} style={{color:cfg.color}} />
        </div>
        <div className="reminder-info">
          <div className="reminder-title">{r.title}</div>
          <div className="reminder-meta">{r.category} · Due {r.dueDate} {!r.paid && daysLeft<0 ? `(${Math.abs(daysLeft)}d overdue)` : daysLeft>=0&&daysLeft<=7?`(in ${daysLeft}d)`:''}</div>
          {r.notes && <div className="reminder-notes">{r.notes}</div>}
        </div>
        <div className="reminder-amount" style={{color:cfg.color}}>{sym}{Number(r.amount).toLocaleString()}</div>
        <div className="reminder-actions">
          <button className={`paid-toggle ${r.paid?'is-paid':''}`} onClick={() => togglePaid(r.id)}>
            {r.paid ? 'Paid ✓' : 'Mark Paid'}
          </button>
          <button className="btn-ghost icon-btn" onClick={() => handleDelete(r.id)}><X size={14}/></button>
        </div>
      </div>
    );
  };

  const totalDue = upcoming.reduce((s,r)=>s+r.amount,0) + overdue.reduce((s,r)=>s+r.amount,0);

  return (
    <div className="reminders-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bill & EMI Reminders</h1>
          <p className="page-sub">Never miss a payment again</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16}/> Add Reminder
        </button>
      </div>

      <div className="rem-summary">
        <div className="rem-sum-card card"><span className="rem-sum-label">Total Due</span><span className="rem-sum-val" style={{color:'var(--red)'}}>{sym}{totalDue.toLocaleString()}</span></div>
        <div className="rem-sum-card card"><span className="rem-sum-label">Overdue</span><span className="rem-sum-val" style={{color:'var(--red)'}}>{overdue.length}</span></div>
        <div className="rem-sum-card card"><span className="rem-sum-label">Upcoming</span><span className="rem-sum-val" style={{color:'var(--blue)'}}>{upcoming.length}</span></div>
        <div className="rem-sum-card card"><span className="rem-sum-label">Paid this month</span><span className="rem-sum-val" style={{color:'var(--green)'}}>{paid.length}</span></div>
      </div>

      {reminders.length === 0 ? (
        <div className="empty-state card"><Bell size={40} className="empty-icon"/><h3>No reminders set</h3><p>Add your bills, EMIs and other payments</p></div>
      ) : (
        <div className="reminders-list">
          {overdue.length > 0 && <><div className="rem-section-title">⚠️ Overdue</div>{overdue.map(r=><ReminderItem key={r.id} r={r}/>)}</>}
          {upcoming.length > 0 && <><div className="rem-section-title">📅 Upcoming</div>{upcoming.map(r=><ReminderItem key={r.id} r={r}/>)}</>}
          {paid.length > 0 && <><div className="rem-section-title">✅ Paid</div>{paid.map(r=><ReminderItem key={r.id} r={r}/>)}</>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Bill Reminder</h2>
              <button className="btn-ghost icon-btn" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group"><label>Title</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Electricity Bill, Home Loan EMI" /></div>
              <div className="form-row">
                <div className="form-group"><label>Amount ({sym})</label><input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} /></div>
                <div className="form-group"><label>Due Date</label><input type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {['Bills & Utilities','Health & Medical','Education','Transportation','Housing','EMI','Other'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Recurring</label>
                  <select value={form.recurring} onChange={e=>setForm(f=>({...f,recurring:e.target.value}))}>
                    {['once','monthly','quarterly','yearly'].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Notes</label><input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional notes..." /></div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
