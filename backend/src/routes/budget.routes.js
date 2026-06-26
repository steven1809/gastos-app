const express = require('express');
const router = express.Router();
const { getAll, create, update, remove, getMonthlyStatus } = require('../controllers/budget.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validateBudget } = require('../middlewares/validation.middleware');

router.get('/', verifyToken, getAll);
router.get('/status', verifyToken, getMonthlyStatus);
router.post('/', verifyToken, validateBudget, create);
router.put('/:id', verifyToken, update);
router.delete('/:id', verifyToken, remove);

module.exports = router;
