const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// @desc  Get all budgets for the current month
// @route GET /api/budgets
const getBudgets = async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const budgets = await Budget.find({ user: req.user._id, month, year });

    // Attach actual spending for each budget category
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const spending = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]);

    const spendingMap = {};
    spending.forEach((s) => (spendingMap[s._id] = s.spent));

    const budgetsWithSpending = budgets.map((b) => ({
      ...b.toObject(),
      spent: spendingMap[b.category] || 0,
      remaining: b.limit - (spendingMap[b.category] || 0),
      percentUsed: Math.round(((spendingMap[b.category] || 0) / b.limit) * 100),
    }));

    res.json({ success: true, budgets: budgetsWithSpending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create or update budget
// @route POST /api/budgets
const createBudget = async (req, res) => {
  try {
    const { category, limit, month, year, alertThreshold } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month, year },
      { limit, alertThreshold },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ success: true, message: 'Budget saved', budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete budget
// @route DELETE /api/budgets/:id
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
    res.json({ success: true, message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBudgets, createBudget, deleteBudget };
