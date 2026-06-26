const User = require('./User');
const Category = require('./Category');
const Transaction = require('./Transaction');
const Budget = require('./Budget');

User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Budget, { foreignKey: 'userId' });
Budget.belongsTo(User, { foreignKey: 'userId' });

Category.hasMany(Transaction, { foreignKey: 'categoryId' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId' });

Category.hasMany(Budget, { foreignKey: 'categoryId' });
Budget.belongsTo(Category, { foreignKey: 'categoryId' });

module.exports = {
  User,
  Category,
  Transaction,
  Budget
};
