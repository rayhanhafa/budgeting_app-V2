import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'EXPENSE' });
  const [error, setError] = useState('');
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/categories', formData);
      setIsModalOpen(false);
      setFormData({ name: '', type: 'EXPENSE' });
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating category');
    }
  };

  const triggerDelete = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/categories/${itemToDelete}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting category');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  const expenses = categories.filter(c => c.type === 'EXPENSE');
  const incomes = categories.filter(c => c.type === 'INCOME');

  const renderCategoryList = (list, title, colorClass) => (
    <div className="mb-6">
      <h2 className={`font-bold mb-3 ${colorClass}`}>{title}</h2>
      <div className="flex flex-col gap-2">
        {list.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No {title.toLowerCase()} categories.</p>
        ) : (
          list.map(c => (
            <div key={c.id} className="card p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</p>
                {!c.userId && <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full mt-1 inline-block">Default</span>}
              </div>
              <button 
                onClick={() => triggerDelete(c.id)}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg text-xl font-bold"
                title="Delete Category"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Link to="/" className="text-slate-500 hover:text-slate-700 dark:text-slate-400">← Back</Link>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Categories</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
        >
          + Add
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {renderCategoryList(expenses, 'Expense Categories', 'text-red-600 dark:text-red-400')}
        {renderCategoryList(incomes, 'Income Categories', 'text-green-600 dark:text-green-400')}
      </main>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg sm:rounded-2xl rounded-t-2xl p-6 shadow-xl transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Add Category</h2>
              <button onClick={() => { setIsModalOpen(false); setError(''); }} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  {['EXPENSE', 'INCOME'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({...formData, type: t})}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                        formData.type === t 
                          ? (t === 'EXPENSE' ? 'bg-red-500 text-white' : 'bg-green-500 text-white')
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category Name</label>
                <input 
                  required type="text"
                  placeholder="e.g. Shopping, Salary"
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  autoFocus
                />
              </div>
              
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-4">
                Save
              </button>
            </form>
          </div>
        </div>
      )}
      
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? Transactions using it will become uncategorized. Budgets for this category will be deleted."
      />
    </div>
  );
};

export default Categories;
