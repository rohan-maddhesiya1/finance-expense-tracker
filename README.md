# ExpenseIQ — Personal Finance Tracker v2.0

A full-stack personal expense tracker built with React + Node.js + MongoDB.

## 🚀 New Features (v2.0)

| Feature | Description |
|---|---|
| **Budget Alerts** | Email-style alerts when you exceed or hit 80% of any budget |
| **Recurring Transactions** | Track salary, rent, subscriptions as recurring entries |
| **Monthly Savings Tracker** | Month-by-month savings tracker with savings rate |
| **Savings Goals** | Goal-based savings with progress tracking |
| **Expense Split** | Split bills with friends, track who paid |
| **Bill & EMI Reminders** | Overdue/upcoming bill reminders with status |
| **Subscription Tracker** | Netflix, Spotify, OTT — all in one place |
| **Smart Insights** | 50/30/20 rule, savings rate, category analysis |
| **Tax Calculator** | Indian IT 2024-25 — Old vs New regime comparison |
| **Multi-Currency** | INR, USD, EUR, GBP, SGD, AED and more |
| **Full Sidebar** | Scrollable sidebar showing all pages correctly |
| **4 Themes** | Dark, Light, Midnight Blue, Forest |

## 📁 Project Structure

```
personal-expense-tracker/
├── frontend/           # React app (port 3000)
│   └── src/
│       ├── components/
│       │   ├── Auth/
│       │   ├── Dashboard/
│       │   ├── Expenses/       # Transactions
│       │   ├── Budget/         # Budget management
│       │   ├── Reports/        # Charts & reports
│       │   ├── Recurring/      # NEW: Recurring transactions
│       │   ├── Savings/        # NEW: Monthly savings tracker
│       │   ├── Goals/          # NEW: Savings goals
│       │   ├── ExpenseSplit/   # NEW: Split expenses
│       │   ├── Reminders/      # NEW: Bill reminders
│       │   ├── Subscriptions/  # NEW: Subscription tracker
│       │   ├── Insights/       # NEW: Smart insights
│       │   ├── Tax/            # NEW: Tax calculator
│       │   ├── Layout/
│       │   ├── Notifications/
│       │   └── ThemeSwitcher/
│       └── context/
└── backend/            # Express API (port 5000)
    ├── models/
    ├── controllers/
    ├── routes/
    └── middleware/
```

## 🛠️ Setup

### Backend
```bash
cd backend
npm install
# Create .env with:
# MONGODB_URI=mongodb://localhost:27017/expenseiq
# JWT_SECRET=your_secret_key
# PORT=5000
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

Visit http://localhost:3000

## 🔔 Budget Alerts
- **Exceeded**: "⚠️ Budget Alert — You have exceeded your Food budget by ₹1,200 this month"
- **80% Warning**: "⚠️ Spending Warning — You have used 80% of your Shopping budget"

Alerts show as in-app toasts and browser notifications (if permitted).
