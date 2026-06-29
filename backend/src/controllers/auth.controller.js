const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const checkEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    const user = await User.findOne({ where: { email } });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar email' });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'account_disabled' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    const isPasswordValid = await user.validatePassword(oldPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};

module.exports = {
  checkEmail,
  register,
  login,
  getProfile,
  changePassword
};
