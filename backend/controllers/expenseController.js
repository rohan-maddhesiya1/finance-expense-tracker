const Expense = require('../models/Expense');

// @desc  Get all expenses for logged-in user
// @route GET /api/expenses
const getExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, startDate, endDate, search } = req.query;

    const query = { user: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) query.title = { $regex: search, $options: 'i' };

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: expenses.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      expenses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single expense
// @route GET /api/expenses/:id
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create expense
// @route POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, message: 'Expense created', expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update expense
// @route PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense updated', expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete expense
// @route DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get expense summary (totals by type)
// @route GET /api/expenses/summary
const getSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const m = Number(month) || now.getMonth() + 1;
    const y = Number(year) || now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const summary = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const categoryBreakdown = await Expense.aggregate([
      { $match: { user: req.user._id, type: 'expense', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const totalIncome = summary.find((s) => s._id === 'income')?.total || 0;
    const totalExpense = summary.find((s) => s._id === 'expense')?.total || 0;

    res.json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        month: m,
        year: y,
        categoryBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getExpenses, getExpense, createExpense, updateExpense, deleteExpense, getSummary };
