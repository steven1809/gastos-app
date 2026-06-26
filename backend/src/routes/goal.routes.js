const express = require('express');
const router = express.Router();
const {
  getAll,
  getById,
  create,
  update,
  remove,
  addContribution,
  removeContribution,
  getStats
} = require('../controllers/goal.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, getAll);
router.get('/stats', verifyToken, getStats);
router.get('/:id', verifyToken, getById);
router.post('/', verifyToken, create);
router.put('/:id', verifyToken, update);
router.delete('/:id', verifyToken, remove);
router.post('/:id/contributions', verifyToken, addContribution);
router.delete('/:id/contributions/:contribId', verifyToken, removeContribution);

module.exports = router;
