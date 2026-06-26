const { Op } = require('sequelize');
const { Transaction, Category, GoalContribution, Goal } = require('../models');

const getAll = async (req, res) => {
  try {
    const { type, categoryId, startDate, endDate, month, year, page = 1, limit = 20, all, includeGoalContributions } = req.query;
    const isAdmin = req.user.role === 'admin' && all === 'true';

    const where = {};
    if (!isAdmin) where.userId = req.user.id;
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (month && year) {
      where.date = { [Op.startsWith]: `${year}-${String(month).padStart(2, '0')}` };
    }

    const offset = (page - 1) * limit;
    let transactions = [];
    let totalCount = 0;

    if (includeGoalContributions === 'true') {
      // Get regular transactions
      const { count: txCount, rows: txRows } = await Transaction.findAndCountAll({
        where,
        include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }],
        order: [['date', 'DESC'], ['createdAt', 'DESC']],
      });

      // Get goal contributions
      const goalContribWhere = { userId: req.user.id };
      if (startDate && endDate) {
        goalContribWhere.date = { [Op.between]: [startDate, endDate] };
      } else if (month && year) {
        goalContribWhere.date = { [Op.startsWith]: `${year}-${String(month).padStart(2, '0')}` };
      }

      const contributions = await GoalContribution.findAll({
        where: goalContribWhere,
        include: [{ model: Goal, attributes: ['name', 'icon'] }],
        order: [['date', 'DESC']],
      });

      // Convert contributions to transaction-like objects
      const contributionTransactions = contributions.map(contrib => ({
        id: `goal_contrib_${contrib.id}`,
        description: `Aporte a meta: ${contrib.Goal?.name}`,
        amount: contrib.amount,
        type: 'expense',
        date: contrib.date,
        notes: contrib.notes,
        Category: { name: 'Metas de Ahorro', color: '#6366f1', icon: '🎯' },
        isGoalContribution: true,
        goalName: contrib.Goal?.name,
        goalIcon: contrib.Goal?.icon,
        createdAt: contrib.createdAt,
      }));

      // Merge and sort
      const allItems = [...txRows, ...contributionTransactions];
      allItems.sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));

      // Paginate
      totalCount = allItems.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      transactions = allItems.slice(start, end);
    } else {
      const { count, rows } = await Transaction.findAndCountAll({
        where,
        include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }],
        order: [['date', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      totalCount = count;
      transactions = rows;
    }

    res.json({
      transactions,
      total: totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.user.role !== 'admin') where.userId = req.user.id;

    const transaction = await Transaction.findOne({
      where,
      include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }]
    });

    if (!transaction) return res.status(404).json({ error: 'Transacción no encontrada' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener transacción' });
  }
};

const create = async (req, res) => {
  try {
    const { categoryId, ...transactionData } = req.body;

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category || (category.userId && category.userId !== req.user.id)) {
        return res.status(400).json({ error: 'Categoría inválida' });
      }
    }

    const transaction = await Transaction.create({
      ...transactionData,
      categoryId,
      userId: req.user.id
    });

    const transactionWithCategory = await Transaction.findByPk(transaction.id, {
      include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }]
    });

    res.status(201).json(transactionWithCategory);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear transacción' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, ...updateData } = req.body;

    const where = { id };
    if (req.user.role !== 'admin') where.userId = req.user.id;

    const transaction = await Transaction.findOne({ where });
    if (!transaction) return res.status(404).json({ error: 'Transacción no encontrada' });

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category || (category.userId && category.userId !== req.user.id)) {
        return res.status(400).json({ error: 'Categoría inválida' });
      }
    }

    await transaction.update({ ...updateData, categoryId });
    const updatedTransaction = await Transaction.findByPk(transaction.id, {
      include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }]
    });

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar transacción' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.user.role !== 'admin') where.userId = req.user.id;

    const transaction = await Transaction.findOne({ where });
    if (!transaction) return res.status(404).json({ error: 'Transacción no encontrada' });

    await transaction.destroy();
    res.json({ message: 'Transacción eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar transacción' });
  }
};

const getSummary = async (req, res) => {
  try {
    const now = new Date();
    const { month = now.getMonth() + 1, year = now.getFullYear() } = req.query;

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const transactions = await Transaction.findAll({
      where: {
        userId: req.user.id,
        date: { [Op.between]: [startDate, endDate] }
      },
      include: [{ model: Category }]
    });

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const categoryMap = {};
    transactions.forEach(t => {
      if (t.type === 'expense' && t.Category) {
        if (!categoryMap[t.Category.id]) {
          categoryMap[t.Category.id] = {
            categoryName: t.Category.name,
            categoryColor: t.Category.color,
            amount: 0
          };
        }
        categoryMap[t.Category.id].amount += parseFloat(t.amount);
      }
    });

    const byCategory = Object.values(categoryMap).map(c => ({
      ...c,
      percentage: totalExpenses > 0 ? (c.amount / totalExpenses) * 100 : 0
    }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const dailyTransactions = await Transaction.findAll({
      where: {
        userId: req.user.id,
        date: { [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] }
      },
      order: [['date', 'ASC']]
    });

    const dailyTrendMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dailyTrendMap[dateStr] = { date: dateStr, income: 0, expenses: 0 };
    }
    dailyTransactions.forEach(t => {
      const entry = dailyTrendMap[t.date];
      if (entry) {
        if (t.type === 'income') entry.income += parseFloat(t.amount);
        else entry.expenses += parseFloat(t.amount);
      }
    });
    const dailyTrend = Object.values(dailyTrendMap);

    res.json({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      byCategory,
      dailyTrend
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getSummary
};
