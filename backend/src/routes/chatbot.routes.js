const express = require('express');
const router = express.Router();
const { processMessage } = require('../controllers/chatbot.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/message', verifyToken, processMessage);

module.exports = router;
