import React, { useEffect, useState } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { expenseAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './Insights.css';

export default function Insights() {
  const { user } = useAuth();
  const sym = { USD:'$', EUR:'€', GBP:'£', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$' }[user?.currency] || '$';
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    expenseAPI.getSummary({ month: now.getMonth()+1, year: now.getFullYear() })
      .then(res => setSummary(res.data.summary))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  const totalExpense = summary?.totalExpense || 0;
  const totalIncome = summary?.totalIncome || 0;
  const savingsRate = totalIncome > 0 ? ((totalIncome-totalExpense)/totalIncome*100) : 0;
  const breakdown = summary?.categoryBreakdown || [];
  const topCategory = breakdown.sort((a,b)=>b.total-a.total)[0];

  const insights = [
    savingsRate >= 20 ? { type:'success', icon: CheckCircle, title:'Great Savings Rate!', desc:`You saved ${savingsRate.toFixed(1)}% of your income this month. Financial experts recommend saving at least 20%.` }
    : { type:'warning', icon: AlertTriangle, title:'Low Savings Rate', desc:`Your savings rate is ${savingsRate.toFixed(1)}%. Try to save at least 20% of your income each month.` },
    topCategory ? { type:'info', icon: TrendingUp, title:`Top Spending: ${topCategory._id}`, desc:`You spent ${sym}${topCategory.total.toLocaleString()} on ${topCategory._id} this month. This is your highest expense category.` } : null,
    totalExpense > totalIncome * 0.7 ? { type:'danger', icon: TrendingDown, title:'High Expense Ratio', desc:`Your expenses are ${((totalExpense/totalIncome)*100).toFixed(0)}% of your income. Consider reducing non-essential spending.` } : null,
    { type:'tip', icon: Lightbulb, title:'50/30/20 Rule', desc:`Allocate 50% (${sym}${(totalIncome*0.5).toLocaleString()}) to needs, 30% (${sym}${(totalIncome*0.3).toLocaleString()}) to wants, and 20% (${sym}${(totalIncome*0.2).toLocaleString()}) to savings.` },
    totalIncome > 0 ? { type:'tip', icon: DollarSign, title:'Emergency Fund Target', desc:`Your 3-month emergency fund target: ${sym}${(totalExpense*3).toLocaleString()}. ${totalExpense*3 > 0 ? 'Start contributing to it today!' : ''}` } : null,
  ].filter(Boolean);

  return (
    <div className="insights-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Smart Spending Insights</h1>
          <p className="page-sub">Personalized insights based on your spending patterns</p>
        </div>
      </div>

      <div className="insights-overview">
        <div className="insight-stat card">
          <span className="insight-stat-label">Monthly Income</span>
          <span className="insight-stat-val green">{sym}{totalIncome.toLocaleString()}</span>
        </div>
        <div className="insight-stat card">
          <span className="insight-stat-label">Monthly Expense</span>
          <span className="insight-stat-val red">{sym}{totalExpense.toLocaleString()}</span>
        </div>
        <div className="insight-stat card">
          <span className="insight-stat-label">Savings Rate</span>
          <span className="insight-stat-val" style={{color:savingsRate>=20?'var(--green)':'var(--yellow)'}}>{savingsRate.toFixed(1)}%</span>
        </div>
      </div>

      <div className="insights-grid">
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          const colors = { success:'var(--green)', warning:'var(--yellow)', danger:'var(--red)', info:'var(--blue)', tip:'var(--accent)' };
          const c = colors[ins.type];
          return (
            <div key={i} className="insight-card card" style={{borderLeftColor:c}}>
              <div className="insight-icon-wrap" style={{background:c+'22'}}>
                <Icon size={20} style={{color:c}} />
              </div>
              <div className="insight-content">
                <div className="insight-title" style={{color:c}}>{ins.title}</div>
                <div className="insight-desc">{ins.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {breakdown.length > 0 && (
        <div className="spending-breakdown card">
          <h3 className="section-title">Spending Breakdown</h3>
          {breakdown.slice(0,6).map(b => {
            const pct = totalExpense > 0 ? b.total/totalExpense*100 : 0;
            return (
              <div key={b._id} className="breakdown-row">
                <span className="breakdown-cat">{b._id}</span>
                <div className="breakdown-bar-wrap">
                  <div className="breakdown-bar" style={{width:pct+'%'}} />
                </div>
                <span className="breakdown-pct">{pct.toFixed(0)}%</span>
                <span className="breakdown-amt">{sym}{b.total.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
