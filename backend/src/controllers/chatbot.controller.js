const { Op } = require('sequelize');
const { Transaction, Category, Budget } = require('../models');

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
};

const getCurrentMonthDateRange = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  return { month, year, startDate, endDate };
};

const getPreviousMonthDateRange = () => {
  const now = new Date();
  let month = now.getMonth();
  let year = now.getFullYear();
  if (month === 0) {
    month = 12;
    year--;
  }
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  return { month, year, startDate, endDate };
};

const RULES = [
  {
    patterns: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'hi', 'hello'],
    handler: async () => ({
      reply: "¡Hola! Soy tu asistente financiero 💰 Puedo ayudarte con:\n- Ver tu balance actual\n- Revisar tus gastos del mes\n- Verificar tus presupuestos\n- Darte consejos de ahorro\n¿Qué deseas saber?",
      suggestions: ['Ver mi balance', 'Gastos del mes', 'Estado del presupuesto', 'Consejos de ahorro']
    })
  },
  {
    patterns: ['balance', 'saldo', 'cuánto tengo', 'cuanto tengo', 'dinero disponible'],
    handler: async (userId) => {
      const { startDate, endDate } = getCurrentMonthDateRange();
      const transactions = await Transaction.findAll({
        where: { userId, date: { [Op.between]: [startDate, endDate] } }
      });
      
      const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
      const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
      const balance = income - expenses;
      
      return {
        reply: `Tu balance este mes es: ${formatCurrency(balance)}\n💚 Ingresos: ${formatCurrency(income)}\n🔴 Gastos: ${formatCurrency(expenses)}`,
        suggestions: ['Ver detalle por categoría', 'Exportar reporte', 'Ver presupuesto']
      };
    }
  },
  {
    patterns: ['gastos', 'gaste', 'gasté', 'mis gastos', 'en qué gasté', 'en que gaste'],
    handler: async (userId) => {
      const { startDate, endDate } = getCurrentMonthDateRange();
      const transactions = await Transaction.findAll({
        where: { userId, type: 'expense', date: { [Op.between]: [startDate, endDate] } },
        include: [{ model: Category }]
      });
      
      const totalExpenses = transactions.reduce((s, t) => s + parseFloat(t.amount), 0);
      const categories = {};
      transactions.forEach(t => {
        if (t.Category) {
          categories[t.Category.name] = (categories[t.Category.name] || 0) + parseFloat(t.amount);
        }
      });
      
      const sortedCategories = Object.entries(categories).sort(([, a], [, b]) => b - a).slice(0, 3);
      const categoriesList = sortedCategories.map(([name, amount], i) => `${i + 1}. ${name}: ${formatCurrency(amount)}`).join('\n');
      
      return {
        reply: `Este mes has gastado ${formatCurrency(totalExpenses)} en total:\n${categoriesList}`,
        suggestions: ['Ver todos los gastos', 'Comparar con mes anterior', 'Ver presupuesto']
      };
    }
  },
  {
    patterns: ['presupuesto', 'budget', 'límite', 'limite', 'cuánto me queda', 'cuanto me queda'],
    handler: async (userId) => {
      const { month, year } = getCurrentMonthDateRange();
      const budgets = await Budget.findAll({
        where: { userId, month, year },
        include: [{ model: Category }]
      });
      
      if (budgets.length === 0) {
        return {
          reply: "No tienes presupuestos configurados para este mes. ¡Configura tus límites para controlar tus gastos!",
          suggestions: ['Crear presupuesto', 'Ver mis gastos']
        };
      }
      
      const budgetsList = await Promise.all(
        budgets.map(async (budget) => {
          const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
          const monthEnd = `${year}-${String(month).padStart(2, '0')}-31`;
          const budgetTransactions = await Transaction.findAll({
            where: {
              userId,
              categoryId: budget.categoryId,
              type: 'expense',
              date: { [Op.between]: [monthStart, monthEnd] }
            }
          });
          const spent = budgetTransactions.reduce((s, t) => s + parseFloat(t.amount), 0);
          const percentage = (spent / budget.amount) * 100;
          const emoji = percentage > 100 ? '🔴' : percentage > 80 ? '⚠️' : '✅';
          return `${emoji} ${budget.Category ? budget.Category.name : 'General'}: ${percentage.toFixed(0)}% usado`;
        })
      );
      
      return {
        reply: `Estado de tu presupuesto este mes:\n${budgetsList.join('\n')}`,
        suggestions: ['Ajustar presupuesto', 'Ver gastos por categoría']
      };
    }
  },
  {
    patterns: ['ingreso', 'ingresos', 'cuánto gané', 'cuanto gane', 'gané', 'gane', 'salario'],
    handler: async (userId) => {
      const { startDate, endDate } = getCurrentMonthDateRange();
      const transactions = await Transaction.findAll({
        where: { userId, type: 'income', date: { [Op.between]: [startDate, endDate] } },
        include: [{ model: Category }]
      });
      
      const totalIncome = transactions.reduce((s, t) => s + parseFloat(t.amount), 0);
      const categories = {};
      transactions.forEach(t => {
        if (t.Category) {
          categories[t.Category.name] = (categories[t.Category.name] || 0) + parseFloat(t.amount);
        }
      });
      
      const categoriesList = Object.entries(categories).map(([name, amount]) => `- ${name}: ${formatCurrency(amount)}`).join('\n');
      
      return {
        reply: `Este mes tus ingresos son: ${formatCurrency(totalIncome)}\n${categoriesList}`,
        suggestions: ['Registrar nuevo ingreso', 'Ver historial', 'Comparar meses']
      };
    }
  },
  {
    patterns: ['consejo', 'consejos', 'ahorro', 'ahorrar', 'tip', 'tips', 'cómo ahorrar', 'como ahorrar'],
    handler: async (userId) => {
      const { startDate, endDate } = getCurrentMonthDateRange();
      const transactions = await Transaction.findAll({
        where: { userId, date: { [Op.between]: [startDate, endDate] } },
        include: [{ model: Category }]
      });
      
      const budgets = await Budget.findAll({ where: { userId } });
      
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
      
      const entertainmentCategory = transactions.find(t => t.Category && t.Category.name === 'Entretenimiento');
      const entertainmentTransactions = transactions.filter(t => t.type === 'expense' && t.Category?.name === 'Entretenimiento');
      const entertainmentTotal = entertainmentTransactions.reduce((s, t) => s + parseFloat(t.amount), 0);
      const entertainmentPercentage = totalExpenses > 0 ? (entertainmentTotal / totalExpenses) * 100 : 0;
      
      let reply = "";
      if (entertainmentPercentage > 20) {
        reply = "Noto que gastas bastante en entretenimiento. Considera fijar un límite mensual y busca opciones gratuitas o más económicas.";
      } else if (budgets.length === 0) {
        reply = "No tienes presupuestos configurados. ¡Establecer límites te ayuda a controlar gastos y ahorrar más!";
      } else if (totalIncome - totalExpenses < 0) {
        reply = "Tu balance es negativo este mes. Revisa tus gastos mayores y busca reducir los no esenciales para volver al positivo.";
      } else {
        reply = "Regla 50/30/20: destina 50% a necesidades, 30% a deseos y 20% a ahorro. ¡Es una excelente manera de organizar tus finanzas!";
      }
      
      return {
        reply,
        suggestions: ['Ver mis gastos', 'Configurar presupuesto', 'Ver balance']
      };
    }
  },
  {
    patterns: ['comparar', 'comparación', 'mes anterior', 'mes pasado', 'diferencia'],
    handler: async (userId) => {
      const { startDate: currentStart, endDate: currentEnd } = getCurrentMonthDateRange();
      const { startDate: prevStart, endDate: prevEnd } = getPreviousMonthDateRange();
      
      const currentTransactions = await Transaction.findAll({
        where: { userId, date: { [Op.between]: [currentStart, currentEnd] } }
      });
      const prevTransactions = await Transaction.findAll({
        where: { userId, date: { [Op.between]: [prevStart, prevEnd] } }
      });
      
      const currentIncome = currentTransactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
      const currentExpenses = currentTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
      const currentBalance = currentIncome - currentExpenses;
      
      const prevIncome = prevTransactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
      const prevExpenses = prevTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
      const prevBalance = prevIncome - prevExpenses;
      
      const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;
      const expensesChange = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0;
      const balanceChange = currentBalance - prevBalance;
      
      const incomeEmoji = incomeChange > 0 ? '📈' : '📉';
      const expensesEmoji = expensesChange > 0 ? '📈' : '📉';
      const balanceEmoji = balanceChange > 0 ? '💚' : '🔴';
      
      return {
        reply: `Comparación con el mes anterior:\n${incomeEmoji} Ingresos: ${incomeChange.toFixed(1)}%\n${expensesEmoji} Gastos: ${expensesChange.toFixed(1)}%\n${balanceEmoji} Balance: ${formatCurrency(balanceChange)}`,
        suggestions: ['Ver detalles', 'Ver reporte completo']
      };
    }
  }
];

const DEFAULT_RESPONSE = {
  reply: "No entendí tu pregunta 🤔 Puedes preguntarme sobre:\n- Balance actual\n- Gastos del mes\n- Estado del presupuesto\n- Consejos de ahorro",
  suggestions: ['Ver balance', 'Mis gastos', 'Presupuesto', 'Consejos de ahorro']
};

const processMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const normalizedMessage = message.toLowerCase().trim();
    
    for (const rule of RULES) {
      for (const pattern of rule.patterns) {
        if (normalizedMessage.includes(pattern)) {
          const response = await rule.handler(req.user.id);
          return res.json(response);
        }
      }
    }
    
    res.json(DEFAULT_RESPONSE);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar el mensaje' });
  }
};

module.exports = {
  processMessage
};
