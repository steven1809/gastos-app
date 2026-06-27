const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const {
  getRates,
  convertAmount,
  updateUserCurrency,
  getUserCurrency
} = require('../controllers/currency.controller');

router.get('/currency/rates', verifyToken, getRates);
router.post('/currency/convert', verifyToken, convertAmount);
router.get('/currency/user', verifyToken, getUserCurrency);
router.put('/currency/user', verifyToken, updateUserCurrency);

module.exports = router;
