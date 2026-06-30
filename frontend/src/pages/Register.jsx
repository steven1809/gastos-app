import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import Button from '../components/common/Button';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const debounceRef = useRef(null);

  const validateName = (value) => {
    if (!value) return 'El nombre es obligatorio';
    if (value.length < 2) return 'El nombre debe tener al menos 2 caracteres';
    if (value.length > 50) return 'El nombre no puede tener más de 50 caracteres';
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) return 'El nombre solo puede contener letras';
    return '';
  };

  const validateEmail = (value) => {
    if (!value) return 'El email es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ingresa un email válido';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'La contraseña es obligatoria';
    if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    return '';
  };

  const validateConfirmPassword = (value, pass) => {
    if (!value) return 'Confirma tu contraseña';
    if (value !== pass) return 'Las contraseñas no coinciden';
    return '';
  };

  const checkEmailAvailability = async (value) => {
    if (!value || validateEmail(value)) return;
    setCheckingEmail(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/check-email?email=${encodeURIComponent(value)}`);
      const data = await res.json();
      setEmailExists(data.exists);
    } catch (err) {
      setEmailExists(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleNameBlur = () => {
    setTouched(prev => ({ ...prev, name: true }));
    setErrors(prev => ({ ...prev, name: validateName(name) }));
  };

  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    setErrors(prev => ({ ...prev, email: validateEmail(email) }));
    if (!validateEmail(email)) {
      checkEmailAvailability(email);
    }
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    setErrors(prev => ({ ...prev, password: validatePassword(password) }));
    if (touched.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, password) }));
    }
  };

  const handleConfirmPasswordBlur = () => {
    setTouched(prev => ({ ...prev, confirmPassword: true }));
    setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, password) }));
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    if (touched.name) {
      setErrors(prev => ({ ...prev, name: validateName(value) }));
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailExists(false);
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      checkEmailAvailability(value);
    }, 500);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
    if (touched.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, value) }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(value, password) }));
    }
  };

  const hasEightChars = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const getPasswordStrength = () => {
    if (!hasEightChars) return { level: 'weak', label: 'Débil', color: 'text-red-500', bg: 'bg-red-200 dark:bg-red-800' };
    if (!hasUppercase || !hasNumber) return { level: 'medium', label: 'Media', color: 'text-yellow-500', bg: 'bg-yellow-200 dark:bg-yellow-800' };
    return { level: 'strong', label: 'Fuerte', color: 'text-green-500', bg: 'bg-green-200 dark:bg-green-800' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    const newErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword, password)
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(e => e) || emailExists) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await authService.register(name, email, password);
      login(data);
      setSuccess(`¡Cuenta creada! Bienvenido/a ${name} 🎉`);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const isNameValid = touched.name && !errors.name;
  const isEmailValid = touched.email && !errors.email && !emailExists;
  const isPasswordValid = touched.password && !errors.password;
  const isConfirmPasswordValid = touched.confirmPassword && !errors.confirmPassword;

  const isFormValid = isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid &&
    hasEightChars && hasUppercase && hasNumber;

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

      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💰 GastosApp</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Crea tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              value={name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              placeholder="Tu nombre"
              className={`block w-full rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white pl-4 pr-4 py-2.5 sm:text-sm transition-colors ${
                errors.name && touched.name
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : isNameValid
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                  : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            />
            {errors.name && touched.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="tu@email.com"
                className={`block w-full rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white pl-4 pr-10 py-2.5 sm:text-sm transition-colors ${
                  errors.email && touched.name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : isEmailValid
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {checkingEmail && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {emailExists && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              {isEmailValid && !checkingEmail && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            {errors.email && touched.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
            {emailExists && !errors.email && touched.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Este email ya está registrado. ¿Quieres{' '}
                <Link to="/login" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  iniciar sesión?
                </Link>
              </p>
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

            {password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${strength.color}`}>
                    Fortaleza: {strength.label}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      strength.level === 'weak'
                        ? 'bg-red-500 w-1/3'
                        : strength.level === 'medium'
                        ? 'bg-yellow-500 w-2/3'
                        : 'bg-green-500 w-full'
                    } transition-all duration-300`}
                  ></div>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  <div className={`flex items-center gap-2 text-sm ${hasEightChars ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {hasEightChars ? (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4 flex-shrink-0 border border-gray-400 dark:border-gray-500 rounded-full"></div>
                    )}
                    <span>Mínimo 8 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {hasUppercase ? (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4 flex-shrink-0 border border-gray-400 dark:border-gray-500 rounded-full"></div>
                    )}
                    <span>Al menos una mayúscula</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {hasNumber ? (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4 flex-shrink-0 border border-gray-400 dark:border-gray-500 rounded-full"></div>
                    )}
                    <span>Al menos un número</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmar contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                onBlur={handleConfirmPasswordBlur}
                placeholder="••••••••"
                className={`block w-full rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white pl-4 pr-12 py-2.5 sm:text-sm transition-colors ${
                  errors.confirmPassword && touched.confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : isConfirmPasswordValid
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showConfirmPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0-8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                  {!showConfirmPassword && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0-8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>
            {errors.confirmPassword && touched.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={!isFormValid || loading}
            className="w-full bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500 hover:bg-gradient-to-bl from-green-500 via-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Crear cuenta
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="font-medium text-indigo-600 dark:text-yellow-400 hover:text-green-500 dark:hover:text-green-300"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
