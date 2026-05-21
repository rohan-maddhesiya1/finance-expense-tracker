const express = require('express');
const router = express.Router();
const {
  getExpenses, getExpense, createExpense, updateExpense, deleteExpense, getSummary,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getSummary);
router.route('/').get(getExpenses).post(createExpense);
router.route('/:id').get(getExpense).put(updateExpense).delete(deleteExpense);

module.exports = router;
