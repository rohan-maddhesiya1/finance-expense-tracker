const Expense = require('../models/Expense');

// @desc  Monthly trend (last 6 months)
// @route GET /api/reports/monthly-trend
const getMonthlyTrend = async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const trend = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({ success: true, trend });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Category breakdown for a given period
// @route GET /api/reports/category-breakdown
const getCategoryBreakdown = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { user: req.user._id, type: 'expense' };

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const breakdown = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ success: true, breakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Daily spending for the current month
// @route GET /api/reports/daily
const getDailySpending = async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const daily = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { day: { $dayOfMonth: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]);

    res.json({ success: true, daily });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Top spending transactions
// @route GET /api/reports/top-transactions
const getTopTransactions = async (req, res) => {
  try {
    const { limit = 5, type = 'expense' } = req.query;
    const now = new Date();

    const transactions = await Expense.find({
      user: req.user._id,
      type,
      date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
    })
      .sort({ amount: -1 })
      .limit(Number(limit));

    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMonthlyTrend, getCategoryBreakdown, getDailySpending, getTopTransactions };
