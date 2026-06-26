const { User, Category } = require('../models');

const seedDatabase = async () => {
  try {
    const adminExists = await User.findOne({ where: { email: 'admin@gastos.com' } });
    if (!adminExists) {
      await User.create({
        name: 'Administrador',
        email: 'admin@gastos.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Usuario admin creado');
    }

    const demoExists = await User.findOne({ where: { email: 'demo@gastos.com' } });
    if (!demoExists) {
      await User.create({
        name: 'Usuario Demo',
        email: 'demo@gastos.com',
        password: 'demo123',
        role: 'user'
      });
      console.log('Usuario demo creado');
    }

    const categories = [
      { name: 'Salario', type: 'income', icon: 'briefcase', color: '#22c55e' },
      { name: 'Freelance', type: 'income', icon: 'laptop', color: '#6366f1' },
      { name: 'Inversiones', type: 'income', icon: 'trending-up', color: '#f59e0b' },
      { name: 'Otros ingresos', type: 'income', icon: 'plus', color: '#14b8a6' },
      { name: 'Alimentación', type: 'expense', icon: 'shopping-bag', color: '#ef4444' },
      { name: 'Transporte', type: 'expense', icon: 'car', color: '#f97316' },
      { name: 'Vivienda', type: 'expense', icon: 'home', color: '#8b5cf6' },
      { name: 'Salud', type: 'expense', icon: 'heart', color: '#ec4899' },
      { name: 'Educación', type: 'expense', icon: 'book', color: '#06b6d4' },
      { name: 'Entretenimiento', type: 'expense', icon: 'film', color: '#84cc16' },
      { name: 'Ropa', type: 'expense', icon: 'shirt', color: '#a855f7' },
      { name: 'Servicios', type: 'expense', icon: 'zap', color: '#64748b' }
    ];

    for (const categoryData of categories) {
      const categoryExists = await Category.findOne({
        where: { name: categoryData.name, userId: null }
      });
      if (!categoryExists) {
        await Category.create({ ...categoryData, userId: null });
      }
    }

    console.log('Categorías creadas');
    console.log('Seed completado');
  } catch (error) {
    console.error('Error al ejecutar seed:', error);
  }
};

module.exports = seedDatabase;
