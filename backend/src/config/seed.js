const { User, Category, Goal, GoalContribution } = require('../models');

const seedDatabase = async () => {
  try {
    const [adminUser, adminCreated] = await User.findOrCreate({
      where: { email: 'admin@gastos.com' },
      defaults: {
        name: 'Administrador',
        password: 'admin123',
        role: 'admin',
        currency: 'COP'
      }
    });
    if (adminCreated) console.log('Usuario admin creado');

    const [demoUser, demoCreated] = await User.findOrCreate({
      where: { email: 'demo@gastos.com' },
      defaults: {
        name: 'Usuario Demo',
        password: 'demo123',
        role: 'user',
        currency: 'COP'
      }
    });
    if (demoCreated) console.log('Usuario demo creado');

    if (demoCreated) {
      // Create demo goals for the new demo user
      const emergencyGoal = await Goal.create({
        name: 'Fondo de emergencia',
        description: 'Fondo para gastos imprevistos',
        targetAmount: 3000000,
        currentAmount: 850000,
        deadline: '2026-12-31',
        icon: '🛡️',
        color: '#22c55e',
        userId: demoUser.id
      });

      const travelGoal = await Goal.create({
        name: 'Viaje a Cartagena',
        description: 'Vacaciones en la costa',
        targetAmount: 1500000,
        currentAmount: 450000,
        deadline: '2026-08-15',
        icon: '✈️',
        color: '#6366f1',
        userId: demoUser.id
      });

      // Add contributions for emergency goal
      await GoalContribution.create({
        amount: 500000,
        notes: 'Primer aporte al fondo de emergencia',
        date: '2026-01-15',
        goalId: emergencyGoal.id,
        userId: demoUser.id
      });
      await GoalContribution.create({
        amount: 350000,
        notes: 'Ahorro del mes de febrero',
        date: '2026-02-20',
        goalId: emergencyGoal.id,
        userId: demoUser.id
      });

      // Add contributions for travel goal
      await GoalContribution.create({
        amount: 250000,
        notes: 'Primer aporte para el viaje',
        date: '2026-03-01',
        goalId: travelGoal.id,
        userId: demoUser.id
      });
      await GoalContribution.create({
        amount: 200000,
        notes: 'Ahorro del bono de trabajo',
        date: '2026-04-10',
        goalId: travelGoal.id,
        userId: demoUser.id
      });

      console.log('Metas de demo creadas');
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
      await Category.findOrCreate({
        where: { name: categoryData.name, userId: null },
        defaults: { ...categoryData, userId: null }
      });
    }

    console.log('Categorías creadas');
    console.log('Seed completado');
  } catch (error) {
    console.error('Error al ejecutar seed:', error);
  }
};

module.exports = seedDatabase;
