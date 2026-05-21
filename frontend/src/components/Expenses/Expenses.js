import React, { useEffect, useState, useCallback } from 'react';
import { expenseAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit2, X, Filter } from 'lucide-react';
import './Expenses.css';

const CATEGORIES_EXPENSE = ['Food & Dining','Shopping','Transportation','Bills & Utilities','Entertainment','Health & Medical','Travel','Education','Investments','Other'];
const CATEGORIES_INCOME  = ['Salary','Freelance','Business','Investments','Other'];
const PAYMENT_METHODS    = ['Cash','Credit Card','Debit Card','Bank Transfer','UPI','Other'];

const emptyForm = { title: '', amount: '', type: 'expense', category: 'Food & Dining', description: '', date: format(new Date(), 'yyyy-MM-dd'), paymentMethod: 'Cash' };

export default function Expenses() {
  const { user } = useAuth();
  const currSymbols = { USD:'$', EUR:'€', GBP:'£', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$', SGD:'S$', AED:'AED', CHF:'CHF', CNY:'¥', MXN:'MXN', BRL:'R$' }; const sym = currSymbols[user?.currency] || '$';

  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [filters, setFilters]     = useState({ search: '', type: '', category: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expenseAPI.getAll({ page, limit: 10, ...filters });
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (e) { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item, date: format(new Date(item.date), 'yyyy-MM-dd') });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditItem(null); setForm(emptyForm); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f, [name]: value,
      ...(name === 'type' ? { category: value === 'income' ? 'Salary' : 'Food & Dining' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return toast.error('Title and amount are required');
    setSaving(true);
    try {
      if (editItem) {
        await expenseAPI.update(editItem._id, { ...form, amount: Number(form.amount) });
        toast.success('Transaction updated');
      } else {
        await expenseAPI.create({ ...form, amount: Number(form.amount) });
        toast.success('Transaction added');
      }
      closeModal();
      fetchExpenses();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await expenseAPI.delete(id);
      toast.success('Transaction deleted');
      fetchExpenses();
    } catch { toast.error('Failed to delete'); }
  };

  const categories = form.type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  return (
    <div className="expenses-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-sub">{total} total transactions</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={15} /> Filters
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add New
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card filters-bar">
          <div className="form-row" style={{ gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} className="search-icon" />
              <input
                style={{ paddingLeft: 32 }}
                placeholder="Search title..."
                value={filters.search}
                onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              />
            </div>
            <select value={filters.type} onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}>
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}>
              <option value="">All Categories</option>
              {[...CATEGORIES_EXPENSE, ...CATEGORIES_INCOME].map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn-ghost" onClick={() => { setFilters({ search: '', type: '', category: '' }); setPage(1); }}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <Plus size={40} />
            <p>No transactions found. Add your first one!</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((tx) => (
                  <tr key={tx._id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{tx.title}</div>
                      {tx.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.description}</div>}
                    </td>
                    <td>{tx.category}</td>
                    <td>{tx.paymentMethod}</td>
                    <td>{format(new Date(tx.date), 'MMM dd, yyyy')}</td>
                    <td><span className={`badge badge-${tx.type}`}>{tx.type}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                      {tx.type === 'income' ? '+' : '-'}{sym}{tx.amount.toLocaleString()}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-ghost icon-btn" onClick={() => openEdit(tx)}><Edit2 size={14} /></button>
                        <button className="btn-ghost icon-btn danger" onClick={() => handleDelete(tx._id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setPage(page - 1)} disabled={page === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>›</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Transaction' : 'Add Transaction'}</h3>
              <button className="btn-ghost icon-btn" onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type *</label>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input name="title" placeholder="e.g. Grocery shopping" value={form.title} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount ({sym}) *</label>
                  <input type="number" name="amount" placeholder="0.00" value={form.amount} onChange={handleChange} min="0.01" step="0.01" required />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={form.category} onChange={handleChange}>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                    {PAYMENT_METHODS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" placeholder="Optional notes..." value={form.description} onChange={handleChange} rows={2} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editItem ? 'Update' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
