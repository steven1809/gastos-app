const express = require('express');
const router = express.Router();
const { getSummaryReport, exportExcel, exportPDF } = require('../controllers/report.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/summary', verifyToken, getSummaryReport);
router.get('/export/excel', verifyToken, exportExcel);
router.get('/export/pdf', verifyToken, exportPDF);

module.exports = router;
