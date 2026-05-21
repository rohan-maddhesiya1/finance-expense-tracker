import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Expenses from './components/Expenses/Expenses';
import Budget from './components/Budget/Budget';
import Reports from './components/Reports/Reports';
import Recurring from './components/Recurring/Recurring';
import Savings from './components/Savings/Savings';
import Goals from './components/Goals/Goals';
import ExpenseSplit from './components/ExpenseSplit/ExpenseSplit';
import Reminders from './components/Reminders/Reminders';
import Subscriptions from './components/Subscriptions/Subscriptions';
import Insights from './components/Insights/Insights';
import Tax from './components/Tax/Tax';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard"     element={<Dashboard />} />
        <Route path="expenses"      element={<Expenses />} />
        <Route path="budget"        element={<Budget />} />
        <Route path="reports"       element={<Reports />} />
        <Route path="recurring"     element={<Recurring />} />
        <Route path="savings"       element={<Savings />} />
        <Route path="goals"         element={<Goals />} />
        <Route path="split"         element={<ExpenseSplit />} />
        <Route path="reminders"     element={<Reminders />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="insights"      element={<Insights />} />
        <Route path="tax"           element={<Tax />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <AppRoutes />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
