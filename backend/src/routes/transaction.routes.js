const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, getSummary, getTodaySummary } = require('../controllers/transaction.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validateTransaction } = require('../middlewares/validation.middleware');

router.get('/', verifyToken, getAll);
router.get('/summary', verifyToken, getSummary);
router.get('/today', verifyToken, getTodaySummary);
router.get('/:id', verifyToken, getById);
router.post('/', verifyToken, validateTransaction, create);
router.put('/:id', verifyToken, validateTransaction, update);
router.delete('/:id', verifyToken, remove);

module.exports = router;
