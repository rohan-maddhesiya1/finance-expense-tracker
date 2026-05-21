import React, { useEffect, useState } from 'react';
import { reportAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import './Reports.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#6c63ff','#22c55e','#f59e0b','#ef4444','#3b82f6','#ec4899','#06b6d4','#f97316','#8b5cf6','#6b7280'];

const CustomTooltip = ({ active, payload, label, sym }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#181c26', border: '1px solid #252a38', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ color: '#8892a4', fontSize: 12, marginBottom: 6 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
            {p.name}: {sym}{Number(p.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const { user } = useAuth();
  const sym = { USD:'$', EUR:'€', GBP:'£', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$' }[user?.currency] || '$';

  const [trend, setTrend]         = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [trendRes, breakRes] = await Promise.all([
          reportAPI.monthlyTrend(),
          reportAPI.categoryBreakdown(),
        ]);

        // Process monthly trend into chart data
        const trendMap = {};
        trendRes.data.trend.forEach(({ _id, total }) => {
          const key = `${MONTHS[_id.month - 1]} ${_id.year}`;
          if (!trendMap[key]) trendMap[key] = { month: key, income: 0, expense: 0 };
          trendMap[key][_id.type] = total;
        });
        setTrend(Object.values(trendMap));
        setBreakdown(breakRes.data.breakdown);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const totalExpense = breakdown.reduce((s, b) => s + b.total, 0);
  const pieData = breakdown.slice(0, 8).map((b) => ({ name: b._id, value: b.total }));

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="reports-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">Visual overview of your finances</p>
        </div>
      </div>

      {/* Monthly Income vs Expense */}
      <div className="card">
        <h3 className="card-title">Income vs Expense — Last 6 Months</h3>
        {trend.length === 0 ? (
          <div className="empty-state"><p>No data available yet</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252a38" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#505a6e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#505a6e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip sym={sym} />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#8892a4', paddingTop: 16 }} />
              <Bar dataKey="income"  name="Income"  fill="#22c55e" radius={[6,6,0,0]} maxBarSize={40} />
              <Bar dataKey="expense" name="Expense" fill="#6c63ff" radius={[6,6,0,0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="reports-grid">
        {/* Pie chart */}
        <div className="card">
          <h3 className="card-title">Expense Distribution</h3>
          {pieData.length === 0 ? (
            <div className="empty-state"><p>No expense data</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#181c26', border: '1px solid #252a38', borderRadius: 10 }}
                  formatter={(v) => [`${sym}${Number(v).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#8892a4' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top categories */}
        <div className="card">
          <h3 className="card-title">Top Expense Categories</h3>
          {breakdown.length === 0 ? (
            <div className="empty-state"><p>No data available</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {breakdown.slice(0, 6).map((b, i) => {
                const pct = totalExpense > 0 ? Math.round((b.total / totalExpense) * 100) : 0;
                return (
                  <div key={b._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], display: 'inline-block' }} />
                        {b._id}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {sym}{b.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: COLORS[i] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Savings Trend Line */}
      {trend.length > 0 && (
        <div className="card">
          <h3 className="card-title">Net Savings Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={trend.map((d) => ({ ...d, savings: (d.income || 0) - (d.expense || 0) }))}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#252a38" />
              <XAxis dataKey="month" tick={{ fill: '#505a6e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#505a6e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip sym={sym} />} />
              <Line type="monotone" dataKey="savings" name="Net Savings" stroke="#22c55e" strokeWidth={2.5}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
