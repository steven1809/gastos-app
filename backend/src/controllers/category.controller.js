const { Category, Transaction } = require('../models');
const { Op } = require('sequelize');

const getAll = async (req, res) => {
  try {
    const { type } = req.query;
    const where = { [Op.or]: [{ userId: null }, { userId: req.user.id }] };
    if (type) where.type = type;

    const categories = await Category.findAll({
      where,
      order: [['type', 'ASC'], ['name', 'ASC']]
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

const create = async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    const category = await Category.create({
      name,
      type,
      icon,
      color,
      userId: req.user.id
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, icon, color } = req.body;

    const where = { id };
    if (req.user.role !== 'admin') where.userId = req.user.id;

    const category = await Category.findOne({ where });
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
    if (category.userId === null) {
      return res.status(403).json({ error: 'No puedes editar categorías globales' });
    }

    await category.update({ name, type, icon, color });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const where = { id };
    if (req.user.role !== 'admin') where.userId = req.user.id;

    const category = await Category.findOne({ where });
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
    if (category.userId === null) {
      return res.status(403).json({ error: 'No puedes eliminar categorías globales' });
    }

    const hasTransactions = await Transaction.count({ where: { categoryId: id } });
    if (hasTransactions > 0) {
      return res.status(400).json({ error: 'No se puede eliminar, tiene transacciones asociadas' });
    }

    await category.destroy();
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove
};
