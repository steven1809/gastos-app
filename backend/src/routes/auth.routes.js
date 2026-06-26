const express = require('express');
const router = express.Router();
const { register, login, getProfile, changePassword } = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validateRegister, validateLogin, validateChangePassword } = require('../middlewares/validation.middleware');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/profile', verifyToken, getProfile);
router.put('/change-password', verifyToken, validateChangePassword, changePassword);

module.exports = router;
