import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import categoryService from '../../services/category.service';

const COLOR_OPTIONS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#f59e0b', label: 'Amarillo' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#f97316', label: 'Naranja' },
  { value: '#8b5cf6', label: 'Violeta' }
];

const CategorySelect = ({ value, onChange, type, placeholder = 'Selecciona una categoría' }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const data = await categoryService.getAll(type);
        setCategories(data);
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, [type]);

  // Separar categorías personales y globales
  const personalCategories = categories.filter(cat => cat.userId === user?.id);
  const globalCategories = categories.filter(cat => !cat.userId);

  // Manejar cambio de selección
  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue === '__new__') {
      setShowNewCategory(true);
    } else {
      onChange(selectedValue ? parseInt(selectedValue) : null);
    }
  };

  // Crear nueva categoría
  const handleCreateCategory = async () => {
    // Validación
    if (!newCategoryName.trim() || newCategoryName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const newCategory = await categoryService.create({
        name: newCategoryName.trim(),
        type: type || 'expense',
        color: newCategoryColor,
        icon: 'tag'
      });

      // Agregar la categoría a la lista local
      setCategories(prev => [...prev, newCategory]);
      
      // Seleccionar automáticamente la nueva categoría
      onChange(newCategory.id);

      // Mostrar éxito
      setSuccess(true);
      setNewCategoryName('');
      setNewCategoryColor('#6366f1');

      // Ocultar formulario después de 1 segundo
      setTimeout(() => {
        setShowNewCategory(false);
        setSuccess(false);
      }, 1000);

    } catch (err) {
      setError('Error al crear la categoría');
      console.error('Error creating category:', err);
    } finally {
      setCreating(false);
    }
  };

  // Cancelar
  const handleCancel = () => {
    setShowNewCategory(false);
    setNewCategoryName('');
    setNewCategoryColor('#6366f1');
    setError('');
    setSuccess(false);
  };

  return (
    <div className="w-full">
      {/* Select principal */}
      <select
        value={showNewCategory ? '__new__' : value || ''}
        onChange={handleSelectChange}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
          success ? 'border-green-500 focus:ring-green-200' : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500'
        }`}
        disabled={loading}
      >
        <option value="">{placeholder}</option>
        
        {/* Categorías personales */}
        {personalCategories.length > 0 && (
          <optgroup label="Mis categorías">
            {personalCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </optgroup>
        )}

        {/* Categorías globales */}
        {globalCategories.length > 0 && (
          <optgroup label="Categorías generales">
            {globalCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </optgroup>
        )}

        {/* Opción para nueva categoría */}
        <option value="__new__">➕ Otra categoría...</option>
      </select>

      {/* Feedback de éxito */}
      {success && (
        <p className="text-green-600 text-sm mt-1 font-medium">✓ Categoría creada</p>
      )}

      {/* Mini-formulario para nueva categoría */}
      {showNewCategory && (
        <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-lg p-3 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-indigo-700">Nueva categoría personal</h4>
            <span className="text-xs text-gray-400">Solo visible para ti</span>
          </div>

          {/* Nombre */}
          <div className="mb-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre de la categoría (ej. Nómina, Mascotas...)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          {/* Selección de color */}
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-2">Color:</p>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setNewCategoryColor(color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    newCategoryColor === color.value ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              disabled={creating}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateCategory}
              className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={creating}
            >
              {creating ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {/* Animaciones */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CategorySelect;
