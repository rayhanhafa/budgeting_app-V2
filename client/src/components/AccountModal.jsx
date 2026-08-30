import { useState, useEffect } from 'react';
import api from '../services/api';
import CurrencyInput from './CurrencyInput';

const AccountModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [balance, setBalance] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData && isOpen) {
      setName(initialData.name);
      setType(initialData.type);
      setBalance(initialData.balance);
    } else if (isOpen) {
      setName('');
      setType('BANK');
      setBalance('');
      setError('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name,
        type,
        balance: Number(balance)
      };

      if (initialData) {
        await api.put(`/accounts/${initialData.id}`, payload);
      } else {
        await api.post('/accounts', payload);
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-2xl shadow-xl p-4 pb-12 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {initialData ? 'Edit Account' : 'Add New Account'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Account Name</label>
            <input
              type="text"
              className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BCA, Cash, OVO"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Type</label>
            <select
              className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="BANK">Bank</option>
              <option value="CASH">Cash</option>
              <option value="EWALLET">E-Wallet</option>
            </select>
          </div>

          {!initialData && (
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Initial Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">Rp</span>
                <CurrencyInput
                  className="w-full pl-9 p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Account'}
          </button>
        </form>
      </div>
    </>
  );
};

export default AccountModal;
