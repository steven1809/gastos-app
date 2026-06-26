const { Op } = require('sequelize');
const { Goal, GoalContribution } = require('../models');

// Helper: Calculate days left
const calculateDaysLeft = (deadline) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper: Enrich goal with calculated fields
const enrichGoal = (goal, contributions = []) => {
  const goalJson = goal.toJSON();
  const currentAmount = parseFloat(goalJson.currentAmount || 0);
  const targetAmount = parseFloat(goalJson.targetAmount);
  const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const remaining = targetAmount - currentAmount;
  const daysLeft = calculateDaysLeft(goalJson.deadline);
  const isOverdue = daysLeft < 0 && goalJson.status === 'active';
  
  return {
    ...goalJson,
    percentage,
    remaining,
    daysLeft,
    isOverdue,
    contributions
  };
};

const getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;

    const goals = await Goal.findAll({
      where,
      include: [{
        model: GoalContribution,
        order: [['date', 'DESC']]
      }],
      order: [
        ['status', 'ASC'],
        ['deadline', 'ASC']
      ]
    });

    const enrichedGoals = goals.map(goal => enrichGoal(goal));
    res.json(enrichedGoals);
  } catch (error) {
    console.error('Error getting goals:', error);
    res.status(500).json({ error: 'Error al obtener metas' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOne({
      where: { id, userId: req.user.id },
      include: [{
        model: GoalContribution,
        order: [['date', 'DESC']]
      }]
    });

    if (!goal) return res.status(404).json({ error: 'Meta no encontrada' });
    res.json(enrichGoal(goal, goal.GoalContributions));
  } catch (error) {
    console.error('Error getting goal:', error);
    res.status(500).json({ error: 'Error al obtener la meta' });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, targetAmount, deadline, icon, color } = req.body;
    
    // Validate target amount is positive
    if (parseFloat(targetAmount) <= 0) {
      return res.status(400).json({ error: 'El monto objetivo debe ser mayor a 0' });
    }
    
    // Validate deadline is in future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    if (deadlineDate <= today) {
      return res.status(400).json({ error: 'La fecha límite debe ser en el futuro' });
    }

    const goal = await Goal.create({
      name,
      description,
      targetAmount: parseFloat(targetAmount),
      currentAmount: 0,
      deadline,
      icon: icon || '🎯',
      color: color || '#6366f1',
      userId: req.user.id,
      status: 'active'
    });

    res.status(201).json(enrichGoal(goal));
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Error al crear la meta: ' + error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, targetAmount, deadline, icon, color } = req.body;

    const goal = await Goal.findOne({
      where: { id, userId: req.user.id }
    });

    if (!goal) return res.status(404).json({ error: 'Meta no encontrada' });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (targetAmount !== undefined) {
      if (parseFloat(targetAmount) <= 0) {
        return res.status(400).json({ error: 'El monto objetivo debe ser mayor a 0' });
      }
      updateData.targetAmount = parseFloat(targetAmount);
    }
    if (deadline !== undefined) updateData.deadline = deadline;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;

    await goal.update(updateData);
    res.json(enrichGoal(goal));
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Error al actualizar la meta' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOne({
      where: { id, userId: req.user.id }
    });

    if (!goal) return res.status(404).json({ error: 'Meta no encontrada' });

    await goal.update({ status: 'cancelled' });
    res.json({ message: 'Meta cancelada', goal: enrichGoal(goal) });
  } catch (error) {
    console.error('Error cancelling goal:', error);
    res.status(500).json({ error: 'Error al cancelar la meta' });
  }
};

const addContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, notes, date } = req.body;

    const goal = await Goal.findOne({
      where: { id, userId: req.user.id }
    });

    if (!goal) return res.status(404).json({ error: 'Meta no encontrada' });
    if (goal.status !== 'active') {
      return res.status(400).json({ error: 'No se puede aportar a una meta inactiva' });
    }
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    const contribution = await GoalContribution.create({
      amount: parseFloat(amount),
      notes: notes || null,
      date: date || new Date().toISOString().split('T')[0],
      goalId: id,
      userId: req.user.id
    });

    // Update goal currentAmount
    const newCurrentAmount = parseFloat(goal.currentAmount || 0) + parseFloat(amount);
    const updateData = { currentAmount: newCurrentAmount };
    let justCompleted = false;

    if (newCurrentAmount >= parseFloat(goal.targetAmount) && goal.status !== 'completed') {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
      justCompleted = true;
    }

    await goal.update(updateData);

    // Get updated goal with contributions
    const updatedGoal = await Goal.findByPk(goal.id, {
      include: [{
        model: GoalContribution,
        order: [['date', 'DESC']]
      }]
    });

    const result = enrichGoal(updatedGoal, updatedGoal.GoalContributions);
    if (justCompleted) result.justCompleted = true;

    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding contribution:', error);
    res.status(500).json({ error: 'Error al agregar aporte' });
  }
};

const removeContribution = async (req, res) => {
  try {
    const { id, contribId } = req.params;

    const goal = await Goal.findOne({
      where: { id, userId: req.user.id }
    });

    if (!goal) return res.status(404).json({ error: 'Meta no encontrada' });

    const contribution = await GoalContribution.findOne({
      where: { id: contribId, goalId: id, userId: req.user.id }
    });

    if (!contribution) return res.status(404).json({ error: 'Aporte no encontrado' });

    // Subtract from goal
    const newCurrentAmount = parseFloat(goal.currentAmount || 0) - parseFloat(contribution.amount);
    const updateData = { currentAmount: Math.max(newCurrentAmount, 0) };

    // Check if we need to un-complete the goal
    if (goal.status === 'completed' && newCurrentAmount < parseFloat(goal.targetAmount)) {
      updateData.status = 'active';
      updateData.completedAt = null;
    }

    await goal.update(updateData);
    await contribution.destroy();

    const updatedGoal = await Goal.findByPk(goal.id, {
      include: [{
        model: GoalContribution,
        order: [['date', 'DESC']]
      }]
    });

    res.json(enrichGoal(updatedGoal, updatedGoal.GoalContributions));
  } catch (error) {
    console.error('Error removing contribution:', error);
    res.status(500).json({ error: 'Error al eliminar aporte' });
  }
};

const getStats = async (req, res) => {
  try {
    const goals = await Goal.findAll({
      where: { userId: req.user.id }
    });

    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.currentAmount || 0), 0);
    const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    // Find near deadline (next 30 days)
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    const nearDeadline = goals.filter(goal => {
      if (goal.status !== 'active') return false;
      const deadlineDate = new Date(goal.deadline);
      return deadlineDate >= today && deadlineDate <= thirtyDaysLater;
    }).map(goal => enrichGoal(goal));

    res.json({
      totalGoals,
      activeGoals,
      completedGoals,
      totalSaved,
      totalTarget,
      overallProgress,
      nearDeadline
    });
  } catch (error) {
    console.error('Error getting goal stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de metas' });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  addContribution,
  removeContribution,
  getStats
};
