import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/auth.service';
import categoryService from '../services/category.service';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Alert from '../components/common/Alert';

const AdminPanel = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'expense', icon: '', color: '#6366f1' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [catData] = await Promise.all([
        categoryService.getAll()
      ]);
      setCategories(catData);
    } catch (err) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, formData);
        setSuccessMessage('Categoría actualizada');
      } else {
        await categoryService.create(formData);
        setSuccessMessage('Categoría creada');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError('Error al guardar categoría');
    }
  };

  const tabs = [
    { id: 'users', label: '👥 Usuarios' },
    { id: 'stats', label: '📊 Estadísticas globales' },
    { id: 'categories', label: '🏷️ Categorías' }
  ];

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <Card title="Usuarios del Sistema">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Rol</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Fecha de Registro</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">Administrador</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">admin@gastos.com</td>
                  <td className="px-6 py-4">
                    <Badge color="#6366f1">Admin</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color="#22c55e">Activo</Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">01/01/2024</td>
                  <td className="px-6 py-4 text-right">-</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">Usuario Demo</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">demo@gastos.com</td>
                  <td className="px-6 py-4">
                    <Badge color="#6b7280">Usuario</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color="#22c55e">Activo</Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">02/01/2024</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm mr-3">Cambiar rol</button>
                    <button className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm">Desactivar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-700">
            <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Total Usuarios</p>
            <p className="text-3xl font-bold text-indigo-800 dark:text-indigo-100 mt-2">2</p>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Total Transacciones</p>
            <p className="text-3xl font-bold text-purple-800 dark:text-purple-100 mt-2">18</p>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">Transacciones este mes</p>
            <p className="text-3xl font-bold text-green-800 dark:text-green-100 mt-2">8</p>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">Monto total gastos</p>
            <p className="text-3xl font-bold text-red-800 dark:text-red-100 mt-2">$12,450,000</p>
          </Card>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Categorías del Sistema</h2>
            <Button onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', type: 'expense', icon: '', color: '#6366f1' });
              setModalOpen(true);
            }}>
              + Nueva Categoría
            </Button>
          </div>
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <Badge color={cat.color}>{cat.name}</Badge>
                    <span className={`px-2 py-1 text-xs rounded-full ${cat.type === 'income' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                      {cat.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </div>
                  {cat.userId && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Categoría personal</p>
                  )}
                  <div className="flex gap-2 justify-end">
                    {cat.userId === null && (
                      <>
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setFormData({
                              name: cat.name, type: cat.type,
                              icon: cat.icon, color: cat.color
                            });
                            setModalOpen(true);
                          }}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm"
                        >
                          Editar
                        </button>
                        <button className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm">
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
          size="sm"
        >
          <div className="space-y-4">
            <Input
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`flex-1 py-2 rounded-lg border ${formData.type === 'income' ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                >
                  Ingreso
                </button>
                <button
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`flex-1 py-2 rounded-lg border ${formData.type === 'expense' ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                >
                  Gasto
                </button>
              </div>
            </div>
            <Input
              label="Ícono (opcional)"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSaveCategory}>
              {editingCategory ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPanel;
