import React, { useState, useEffect } from 'react';
import categoryService from "../../services/category.service";
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import CategorySelect from '../common/CategorySelect';

const formatNumber = (num) => {
  if (!num && num !== 0) return '';
  const number = parseFloat(num.toString().replace(/\./g, ''));
  if (isNaN(number)) return '';
  return number.toLocaleString('es-CO');
};

const parseNumber = (str) => {
  return parseFloat(str.replace(/\./g, ''));
};

const TransactionForm = ({ initialData, prefillData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    notes: ''
  });
  const [displayAmount, setDisplayAmount] = useState('');
  const [categories, setCategories] = useState([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense', color: '#6366f1' });

  useEffect(() => {
    loadCategories();
    if (initialData) {
      setFormData({
        ...initialData,
        amount: initialData.amount
      });
      setDisplayAmount(formatNumber(initialData.amount));
      if (initialData.Category) {
        setNewCategory({ ...newCategory, type: initialData.type });
      }
    } else if (prefillData) {
      const data = {
        description: prefillData.description || '',
        amount: prefillData.amount || '',
        type: prefillData.type || 'expense',
        date: new Date().toISOString().split('T')[0],
        categoryId: prefillData.categoryId || '',
        notes: ''
      };
      setFormData(data);
      setDisplayAmount(formatNumber(prefillData.amount));
      setNewCategory({ ...newCategory, type: data.type });
    }
  }, [initialData, prefillData]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      const onlyDigits = value.replace(/[^0-9]/g, '');
      setDisplayAmount(formatNumber(onlyDigits));
      setFormData(prev => ({ ...prev, [name]: onlyDigits }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (name === 'type') {
      setNewCategory(prev => ({ ...prev, type: value }));
    }
  };

  const handleCreateCategory = async () => {
    try {
      const created = await categoryService.create(newCategory);
      setCategories(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, categoryId: created.id }));
      setShowNewCategory(false);
      setNewCategory({ name: '', type: formData.type, color: '#6366f1' });
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const filteredCategories = categories.filter(cat =>
    cat.userId === null || (formData.type && cat.type === formData.type)
  );

  const getModalTitle = () => initialData ? 'Editar Transacción' : 'Nueva Transacción';
  const getModalHeaderColor = () => formData.type === 'income' ? 'bg-green-600' : 'bg-red-600';

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={getModalTitle()}
      size="md"
    >
      <div className={`-mx-6 -mt-4 -mb-6 p-6 rounded-t-xl ${getModalHeaderColor()}`}></div>
      <form onSubmit={handleSubmit} className="space-y-4 pt-6">
        <p className="text-sm font-medium text-gray-700 mb-1">Selecciona que tipo de transacción vas hacer :</p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
            className={`flex-1 py-3 rounded-lg font-semibold border-2 transition-all ${
              formData.type === 'income'
                ? 'bg-green-100 border-green-500 text-green-700'
                : 'border-gray-300 text-gray-600 hover:border-green-300'
            }`}
          >
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
            className={`flex-1 py-3 rounded-lg font-semibold border-2 transition-all ${
              formData.type === 'expense'
                ? 'bg-red-100 border-red-500 text-red-700'
                : 'border-gray-300 text-gray-600 hover:border-red-300'
            }`}
          >
            Gasto
          </button>
        </div>

        <Input
          label="Descripción"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Ej: Comida del supermercado"
          required
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500">
              $
            </div>
            <input
              name="amount"
              value={displayAmount}
              onChange={handleChange}
              placeholder="0"
              required
              inputMode="numeric"
              className="block w-full rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 pl-8 pr-4 py-2.5 sm:text-sm"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría <span className="text-red-500">*</span>
          </label>
          {!showNewCategory ? (
            <div className="flex gap-2">
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Seleccionar categoría</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
              >
                +
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nombre de categoría"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300"
              />
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="h-12 w-full"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Crear categoría
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <Input
          label="Fecha"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          required
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas (opcional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Notas adicionales..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {initialData ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionForm;