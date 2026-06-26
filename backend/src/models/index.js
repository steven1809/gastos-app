const User = require('./User');
const Category = require('./Category');
const Transaction = require('./Transaction');
const Budget = require('./Budget');
const Goal = require('./Goal');
const GoalContribution = require('./GoalContribution');

User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Budget, { foreignKey: 'userId' });
Budget.belongsTo(User, { foreignKey: 'userId' });

Category.hasMany(Transaction, { foreignKey: 'categoryId' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId' });

Category.hasMany(Budget, { foreignKey: 'categoryId' });
Budget.belongsTo(Category, { foreignKey: 'categoryId' });

User.hasMany(Goal, { foreignKey: 'userId' });
Goal.belongsTo(User, { foreignKey: 'userId' });

Goal.hasMany(GoalContribution, { foreignKey: 'goalId' });
GoalContribution.belongsTo(Goal, { foreignKey: 'goalId' });

User.hasMany(GoalContribution, { foreignKey: 'userId' });
GoalContribution.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  Category,
  Transaction,
  Budget,
  Goal,
  GoalContribution
};
