const express = require('express');
const router = express.Router();
const {
  getMonthlyTrend, getCategoryBreakdown, getDailySpending, getTopTransactions,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/monthly-trend', getMonthlyTrend);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/daily', getDailySpending);
router.get('/top-transactions', getTopTransactions);

module.exports = router;
