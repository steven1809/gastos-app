const { User, Transaction } = require('../models');

const getAll = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{ model: Transaction, attributes: [] }],
      group: ['User.id']
    });

    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const userJson = user.toJSON();
        const transactionCount = await Transaction.count({ where: { userId: user.id } });
        return { ...userJson, transactionCount };
      })
    );

    res.json(usersWithCounts);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (id == req.user.id) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio estado' });
    }

    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    await user.update({ isActive: !user.isActive });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    if (id == req.user.id) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }

    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    await user.update({ role });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};

module.exports = {
  getAll,
  updateStatus,
  updateRole
};
