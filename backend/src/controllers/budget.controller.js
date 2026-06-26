const { Op } = require('sequelize');
const { Budget, Category, Transaction } = require('../models');

const calculateSpent = async (budgetId, userId, month, year, categoryId) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  const where = {
    userId,
    type: 'expense',
    date: { [Op.between]: [startDate, endDate] }
  };

  if (categoryId) where.categoryId = categoryId;

  const transactions = await Transaction.findAll({ where });
  return transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
};

const getAll = async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = { userId: req.user.id };
    if (month) where.month = month;
    if (year) where.year = year;

    const budgets = await Budget.findAll({
      where,
      include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }]
    });

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await calculateSpent(
          budget.id,
          budget.userId,
          budget.month,
          budget.year,
          budget.categoryId
        );
        return {
          ...budget.toJSON(),
          spent,
          percentage_used: budget.amount > 0 ? (spent / budget.amount) * 100 : 0
        };
      })
    );

    res.json(budgetsWithSpent);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener presupuestos' });
  }
};

const create = async (req, res) => {
  try {
    console.log('=== Budget create controller ===');
    console.log('Received body:', JSON.stringify(req.body, null, 2));

    const { 
      startMonth, 
      startYear, 
      durationMonths, 
      amount, 
      categoryId, 
      isFixed, 
      dueDay 
    } = req.body;

    console.log('Creating budgets with:', { startMonth, startYear, durationMonths, amount, categoryId, isFixed, dueDay });

    const budgetsToCreate = [];
    let currentMonth = Number(startMonth);
    let currentYear = Number(startYear);

    for (let i = 0; i < Number(durationMonths); i++) {
      budgetsToCreate.push({
        month: currentMonth,
        year: currentYear,
        amount: Number(amount),
        categoryId: categoryId || null,
        userId: req.user.id,
        isFixed: isFixed || false,
        dueDay: (isFixed && dueDay) ? Number(dueDay) : null
      });

      // Incrementar mes y año
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    console.log('Budgets to create:', budgetsToCreate);

    // Crear todos los presupuestos
    const createdBudgets = await Budget.bulkCreate(budgetsToCreate);
    console.log('Created budgets:', createdBudgets.length);

    // Obtener los presupuestos con su categoría
    const budgetsWithCategory = await Budget.findAll({
      where: { id: createdBudgets.map(b => b.id) },
      include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }]
    });

    res.status(201).json(budgetsWithCategory);
  } catch (error) {
    console.error('Error creating budgets:', error);
    res.status(500).json({ error: 'Error al crear presupuestos: ' + error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, isFixed, dueDay } = req.body;

    const budget = await Budget.findOne({
      where: { id, userId: req.user.id }
    });

    if (!budget) return res.status(404).json({ error: 'Presupuesto no encontrado' });

    await budget.update({ 
      amount, 
      isFixed: isFixed !== undefined ? isFixed : budget.isFixed,
      dueDay: isFixed !== undefined && isFixed ? dueDay : budget.dueDay
    });
    const updatedBudget = await Budget.findByPk(budget.id, {
      include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }]
    });

    const spent = await calculateSpent(
      budget.id,
      budget.userId,
      budget.month,
      budget.year,
      budget.categoryId
    );

    res.json({
      ...updatedBudget.toJSON(),
      spent,
      percentage_used: budget.amount > 0 ? (spent / budget.amount) * 100 : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar presupuesto' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteFromHere } = req.query;

    const budget = await Budget.findOne({
      where: { id, userId: req.user.id }
    });

    if (!budget) return res.status(404).json({ error: 'Presupuesto no encontrado' });

    if (deleteFromHere === 'true') {
      const { categoryId, userId, month, year } = budget;
      const { count } = await Budget.destroy({
        where: {
          userId,
          categoryId,
          year,
          month: { [Op.gte]: month }
        }
      });
      const category = await Category.findByPk(categoryId);
      const categoryName = category ? category.name : 'la categoría';
      res.json({ deleted: count, message: `Se eliminaron ${count} presupuestos de ${categoryName}` });
    } else {
      await budget.destroy();
      res.json({ message: 'Presupuesto eliminado' });
    }
  } catch (error) {
    console.error('Error deleting budgets:', error);
    res.status(500).json({ error: 'Error al eliminar presupuesto' });
  }
};

const getMonthlyStatus = async (req, res) => {
  try {
    const now = new Date();
    const { month = now.getMonth() + 1, year = now.getFullYear() } = req.query;

    const budgets = await Budget.findAll({
      where: { userId: req.user.id, month, year },
      include: [{ model: Category, attributes: ['id', 'name', 'icon', 'color'] }]
    });

    const budgetsWithStatus = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await calculateSpent(
          budget.id,
          budget.userId,
          budget.month,
          budget.year,
          budget.categoryId
        );
        const remaining = budget.amount - spent;
        const percentage_used = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        let status = 'ok';
        if (percentage_used > 100) status = 'exceeded';
        else if (percentage_used > 80) status = 'warning';

        return {
          ...budget.toJSON(),
          spent,
          remaining,
          percentage_used,
          status
        };
      })
    );

    const totalBudgeted = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const totalSpent = budgetsWithStatus.reduce((sum, b) => sum + b.spent, 0);

    let overallStatus = 'ok';
    const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    if (overallPercentage > 100) overallStatus = 'exceeded';
    else if (overallPercentage > 80) overallStatus = 'warning';

    res.json({
      budgets: budgetsWithStatus,
      totalBudgeted,
      totalSpent,
      overallStatus
    });
  } catch (error) {
    console.error('ERROR getMonthlyStatus:', error); // <- agrega esta línea
    res.status(500).json({ error: 'Error al obtener estado mensual' });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove,
  getMonthlyStatus
};
