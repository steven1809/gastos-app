const express = require('express');
const router = express.Router();
const { getAll, updateStatus, updateRole } = require('../controllers/user.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, isAdmin, getAll);
router.put('/:id/status', verifyToken, isAdmin, updateStatus);
router.put('/:id/role', verifyToken, isAdmin, updateRole);

module.exports = router;
