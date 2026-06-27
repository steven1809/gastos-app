require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transaction.routes');
const budgetRoutes = require('./routes/budget.routes');
const categoryRoutes = require('./routes/category.routes');
const userRoutes = require('./routes/user.routes');
const reportRoutes = require('./routes/report.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const goalRoutes = require('./routes/goal.routes');
const currencyRoutes = require('./routes/currency.routes');
const seedDatabase = require('./config/seed');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api', currencyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

const PORT = process.env.PORT || 5000;

// DESPUÉS (correcto)
sequelize.sync({ force: false })
  .then(async () => {
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log('Base de datos sincronizada');
    });
  })
  .catch(err => {
    console.error('Error al conectar con la base de datos:', err);
  });
