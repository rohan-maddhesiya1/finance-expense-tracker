const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// CORS — allow origins listed in ALLOWED_ORIGINS env var (comma-separated)
// Falls back to localhost for local development
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/budgets',  require('./routes/budgets'));
app.use('/api/reports',  require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'Server is running' })
);

// Version info
app.get('/api/version', (req, res) =>
  res.json({
    version: '2.0.0',
    features: [
      'recurring', 'savings', 'goals', 'split', 'reminders',
      'subscriptions', 'insights', 'tax', 'multi-currency',
    ],
  })
);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB then start server (skipped on Vercel — serverless)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      process.exit(1);
    });
} else {
  // On Vercel — connect lazily on first request
  let isConnected = false;
  const connectOnce = async () => {
    if (!isConnected) {
      await mongoose.connect(process.env.MONGODB_URI);
      isConnected = true;
    }
  };
  app.use(async (req, res, next) => {
    try {
      await connectOnce();
      next();
    } catch (err) {
      next(err);
    }
  });
}

module.exports = app;

