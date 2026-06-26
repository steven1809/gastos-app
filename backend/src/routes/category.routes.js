const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/category.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, getAll);
router.post('/', verifyToken, create);
router.put('/:id', verifyToken, update);
router.delete('/:id', verifyToken, remove);

module.exports = router;
