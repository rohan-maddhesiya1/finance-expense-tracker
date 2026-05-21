import React, { useState, useEffect, useCallback } from 'react';
import { expenseAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Brain, TrendingUp, TrendingDown, Lightbulb, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import './AIInsights.css';

const CATEGORY_COLORS = {
  'Food & Dining': '#f59e0b', 'Shopping': '#8b5cf6', 'Transportation': '#3b82f6',
  'Bills & Utilities': '#ef4444', 'Entertainment': '#ec4899', 'Health & Medical': '#22c55e',
  'Travel': '#06b6d4', 'Education': '#f97316', 'Investments': '#6366f1', 'Other': '#6b7280',
};

function generateInsights(currentSummary, prevSummary, sym) {
  const insights = [];
  const suggestions = [];
  const current = currentSummary?.categoryBreakdown || [];
  const prev = prevSummary?.categoryBreakdown || [];
  const totalCurrent = currentSummary?.totalExpense || 0;
  const totalPrev = prevSummary?.totalExpense || 0;

  // Overall spending change
  if (totalPrev > 0) {
    const change = ((totalCurrent - totalPrev) / totalPrev) * 100;
    if (change > 10) {
      insights.push({
        type: 'warning',
        icon: TrendingUp,
        title: 'Spending Increased',
        message: `You spent ${Math.abs(change).toFixed(0)}% more this month (${sym}${totalCurrent.toFixed(0)} vs ${sym}${totalPrev.toFixed(0)} last month).`,
      });
    } else if (change < -10) {
      insights.push({
        type: 'success',
        icon: TrendingDown,
        title: 'Great Job Saving!',
        message: `You reduced spending by ${Math.abs(change).toFixed(0)}% this month vs last month.`,
      });
    }
  }

  // Per-category changes
  current.forEach((cat) => {
    const prevCat = prev.find((p) => p._id === cat._id);
    if (!prevCat) return;
    const change = ((cat.total - prevCat.total) / prevCat.total) * 100;
    const pct = totalCurrent > 0 ? ((cat.total / totalCurrent) * 100).toFixed(0) : 0;

    if (change > 25) {
      insights.push({
        type: 'warning',
        icon: TrendingUp,
        title: `${cat._id} Spike`,
        message: `You spent ${change.toFixed(0)}% more on ${cat._id} this month (${sym}${cat.total.toFixed(0)}).`,
        color: CATEGORY_COLORS[cat._id],
      });
    }

    if (Number(pct) > 30) {
      suggestions.push({
        icon: Lightbulb,
        title: `Review ${cat._id} Spending`,
        message: `${cat._id} makes up ${pct}% of your total expenses. Try reducing it to stay within budget.`,
        color: CATEGORY_COLORS[cat._id],
      });
    }
  });

  // Predict next month
  const months = 2;
  const predictedNext = totalCurrent > 0 && totalPrev > 0
    ? ((totalCurrent + totalPrev) / months * 1.05).toFixed(0)
    : null;

  // Savings rate
  const income = currentSummary?.totalIncome || 0;
  if (income > 0) {
    const savingsRate = ((income - totalCurrent) / income) * 100;
    if (savingsRate < 10) {
      suggestions.push({
        icon: AlertTriangle,
        title: 'Low Savings Rate',
        message: `You're saving only ${savingsRate.toFixed(0)}% of income. Aim for at least 20% savings.`,
        color: '#f59e0b',
      });
    } else if (savingsRate > 30) {
      insights.push({
        type: 'success',
        icon: Sparkles,
        title: 'Excellent Savings!',
        message: `You're saving ${savingsRate.toFixed(0)}% of your income this month. Keep it up!`,
      });
    }
  }

  // Top spending category suggestion
  if (current.length > 0) {
    const top = [...current].sort((a, b) => b.total - a.total)[0];
    const topPct = totalCurrent > 0 ? ((top.total / totalCurrent) * 100).toFixed(0) : 0;
    if (!suggestions.find(s => s.title.includes(top._id))) {
      suggestions.push({
        icon: Lightbulb,
        title: `Top Spend: ${top._id}`,
        message: `${top._id} is your highest expense at ${sym}${top.total.toFixed(0)} (${topPct}% of total). Look for ways to cut back.`,
        color: CATEGORY_COLORS[top._id],
      });
    }
  }

  return { insights, suggestions, predictedNext };
}

export default function AIInsights() {
  const { user } = useAuth();
  const sym = { USD:'$', EUR:'€', GBP:'£', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$' }[user?.currency] || '$';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [curr, prev] = await Promise.all([
        expenseAPI.getSummary({ month: now.getMonth() + 1, year: now.getFullYear() }),
        expenseAPI.getSummary({ month: prevMonth, year: prevYear }),
      ]);
      const result = generateInsights(curr.data.summary, prev.data.summary, sym);
      const totalCurrent = curr.data.summary?.totalExpense || 0;
      const totalPrev = prev.data.summary?.totalExpense || 0;
      setData({ ...result, totalCurrent, totalPrev, summary: curr.data.summary });
    } catch (e) {
      setError('Could not load expense data.');
    } finally {
      setLoading(false);
    }
  }, [sym]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="ai-insights-card card">
      <div className="ai-header">
        <Brain size={20} className="ai-brain-icon" />
        <h3>AI Insights</h3>
      </div>
      <div className="ai-loading"><div className="spinner" /><p>Analyzing your spending...</p></div>
    </div>
  );

  if (error) return (
    <div className="ai-insights-card card">
      <div className="ai-header"><Brain size={20} className="ai-brain-icon" /><h3>AI Insights</h3></div>
      <p className="text-muted" style={{ padding: '16px 0' }}>{error}</p>
    </div>
  );

  const { insights, suggestions, predictedNext, totalCurrent, totalPrev } = data;

  return (
    <div className="ai-insights-card card">
      <div className="ai-header">
        <div className="ai-title-row">
          <Brain size={20} className="ai-brain-icon" />
          <h3>AI Insights</h3>
          <span className="ai-badge">Powered by AI</span>
        </div>
        <button className="btn-ghost icon-btn" onClick={load} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Prediction Banner */}
      {predictedNext && (
        <div className="prediction-banner">
          <Sparkles size={16} />
          <span>Based on your trends, next month's estimate is <strong>{sym}{Number(predictedNext).toLocaleString()}</strong></span>
        </div>
      )}

      {insights.length === 0 && suggestions.length === 0 ? (
        <div className="ai-empty">
          <Sparkles size={32} style={{ opacity: 0.3 }} />
          <p>Add more transactions to unlock personalized insights!</p>
        </div>
      ) : (
        <div className="ai-sections">
          {insights.length > 0 && (
            <div className="ai-section">
              <h4 className="ai-section-title">Spending Patterns</h4>
              <div className="ai-items">
                {insights.map((item, i) => (
                  <div key={i} className={`ai-item ai-item-${item.type}`}>
                    <div className="ai-item-icon" style={item.color ? { color: item.color, background: item.color + '22' } : {}}>
                      <item.icon size={16} />
                    </div>
                    <div>
                      <div className="ai-item-title">{item.title}</div>
                      <div className="ai-item-msg">{item.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="ai-section">
              <h4 className="ai-section-title">💡 Money-Saving Tips</h4>
              <div className="ai-items">
                {suggestions.map((item, i) => (
                  <div key={i} className="ai-item ai-item-tip">
                    <div className="ai-item-icon" style={{ color: item.color || '#f59e0b', background: (item.color || '#f59e0b') + '22' }}>
                      <item.icon size={16} />
                    </div>
                    <div>
                      <div className="ai-item-title">{item.title}</div>
                      <div className="ai-item-msg">{item.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
