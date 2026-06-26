const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateRegister = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  handleValidationErrors
];

const validateLogin = [
  body('email').notEmpty().withMessage('El email es requerido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
  handleValidationErrors
];

const validateTransaction = [
  body('description').notEmpty().withMessage('La descripción es requerida'),
  body('amount').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0'),
  body('type').isIn(['income', 'expense']).withMessage('Tipo de transacción inválido'),
  body('date').isDate().withMessage('Fecha inválida'),
  handleValidationErrors
];

const validateBudget = [
  (req, res, next) => {
    console.log('=== Budget validation middleware ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    next();
  },
  // Validación para creación (usa startMonth/startYear/durationMonths)
  body('startMonth')
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage('Mes de inicio inválido (1-12)'),
  body('startYear')
    .optional()
    .isInt({ min: 2000 }).withMessage('Año de inicio inválido'),
  body('durationMonths')
    .optional()
    .isInt({ min: 1, max: 120 }).withMessage('Duración inválida (1-120 meses)'),
  // Validación para edición simple (usa month/year)
  body('month')
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage('Mes inválido (1-12)'),
  body('year')
    .optional()
    .isInt({ min: 2000 }).withMessage('Año inválido'),
  // Campos obligatorios
  body('amount').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0'),
  body('dueDay')
    .optional()
    .custom((value, { req }) => {
      if (req.body.isFixed && !value) {
        throw new Error('Día de vencimiento es requerido para gastos fijos');
      }
      if (value && (value < 1 || value > 31)) {
        throw new Error('Día de vencimiento inválido (1-31)');
      }
      return true;
    }),
  handleValidationErrors
];

const validateChangePassword = [
  body('oldPassword').notEmpty().withMessage('La contraseña actual es requerida'),
  body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateTransaction,
  validateBudget,
  validateChangePassword
};
