import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });

  const validateEmail = (value) => {
    if (!value) return 'El email es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ingresa un email válido';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'La contraseña es obligatoria';
    if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return '';
  };

  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    setErrors(prev => ({ ...prev, email: validateEmail(email) }));
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    setErrors(prev => ({ ...prev, password: validatePassword(password) }));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const newErrors = {
      email: validateEmail(email),
      password: validatePassword(password)
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(e => e)) return;

    setLoading(true);
    setError(null);

    try {
      const data = await authService.login(email, password);
      login(data);
      navigate('/');
    } catch (err) {
      const errCode = err.response?.data?.error;
      let errMessage = 'Email o contraseña incorrectos. Verifica tus datos.';
      if (errCode === 'user_not_found') {
        errMessage = 'No encontramos una cuenta con ese email.';
      } else if (errCode === 'account_disabled') {
        errMessage = 'Tu cuenta ha sido desactivada. Contacta al administrador.';
      }
      setError(errMessage);
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = touched.email && !errors.email;
  const isPasswordValid = touched.password && !errors.password;
  const isFormValid = !errors.email && !errors.password && email && password;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500 py-12 px-4 sm:px-6 lg:px-8">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GastosApp</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Iniciar sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="tu@email.com"
              className={`block w-full rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white pl-4 pr-4 py-2.5 sm:text-sm transition-colors ${
                errors.email && touched.email
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : isEmailValid
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                  : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            />
            {errors.email && touched.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                placeholder="••••••••"
                className={`block w-full rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white pl-4 pr-12 py-2.5 sm:text-sm transition-colors ${
                  errors.password && touched.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : isPasswordValid
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0-8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                  {!showPassword && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0-8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>
            {errors.password && touched.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={!isFormValid || loading}
            className="w-full bg-gradient-to-br via-green-500 to-yellow-500 hover:bg-gradient-to-bl from-green-500 via-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Iniciar sesión
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-600 dark:text-green-400 hover:text-indigo-500"
            >
              Regístrate
            </Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Demo:</span> demo@gastos.com / demo123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
