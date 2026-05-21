const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ─── CORS ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ─── Lazy MongoDB connection (MUST be before routes) ───────────
// On Vercel serverless, each invocation may be a cold start.
// We connect once per container instance and reuse the connection.
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log('✅ MongoDB connected');
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// ─── Routes ────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/budgets',  require('./routes/budgets'));
app.use('/api/reports',  require('./routes/reports'));

// ─── Health / Version ──────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'Server is running' })
);

app.get('/api/version', (req, res) =>
  res.json({
    version: '2.0.0',
    features: [
      'recurring', 'savings', 'goals', 'split', 'reminders',
      'subscriptions', 'insights', 'tax', 'multi-currency',
    ],
  })
);

// ─── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── Local dev: start HTTP server ─────────────────────────────
// On Vercel this block is skipped — Vercel calls module.exports directly.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('❌ Startup error:', err.message);
      process.exit(1);
    });
}

module.exports = app;
