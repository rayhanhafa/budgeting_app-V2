import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import CurrencyInput from './CurrencyInput';

const TransactionModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [type, setType] = useState('EXPENSE');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('MONTHLY');
  
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch accounts and categories
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [catRes, accRes] = await Promise.all([
            api.get('/categories'),
            api.get('/accounts')
          ]);
          setCategories(catRes.data);
          setAccounts(accRes.data);
          
          if (!initialData && accRes.data.length > 0) {
            setAccountId(accRes.data[0].id);
          }
        } catch (err) {
          console.error('Failed to fetch modal data', err);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  // Populate initial data if editing
  useEffect(() => {
    if (initialData && isOpen) {
      setType(initialData.type);
      setAmount(initialData.amount);
      setCategoryId(initialData.categoryId || '');
      setAccountId(initialData.accountId || '');
      setToAccountId(initialData.toAccountId || '');
      setNote(initialData.note || '');
      setDate(new Date(initialData.date).toISOString().split('T')[0]);
      setIsRecurring(false);
    } else if (isOpen) {
      // Reset form if creating new
      setType('EXPENSE');
      setAmount('');
      setCategoryId('');
      setToAccountId('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
      setFrequency('MONTHLY');
      setError('');
    }
  }, [initialData, isOpen]);

  // Set default category when type changes or categories load
  useEffect(() => {
    if (type !== 'TRANSFER' && categories.length > 0 && !categoryId) {
      const defaultCat = categories.find(c => c.type === type);
      if (defaultCat) setCategoryId(defaultCat.id);
    }
  }, [type, categories, categoryId]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        type,
        amount: Number(amount),
        accountId,
        date: new Date(date).toISOString(),
        note,
        ...(isRecurring && { frequency })
      };

      if (type !== 'TRANSFER') {
        payload.categoryId = categoryId;
      } else {
        payload.toAccountId = toAccountId;
      }

      if (initialData) {
        await api.put(`/transactions/${initialData.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }

      onSuccess(); // Close and refetch
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Bottom Sheet Modal */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-2xl shadow-xl transform transition-transform duration-300 max-h-[90vh] overflow-y-auto`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {initialData ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 pb-12">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
          
          {/* Type Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {['EXPENSE', 'INCOME', 'TRANSFER'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  type === t 
                    ? (t === 'EXPENSE' ? 'bg-red-500 text-white' : t === 'INCOME' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white')
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">Rp</span>
              <CurrencyInput
                className="w-full pl-9 p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          {type !== 'TRANSFER' && (
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Category</label>
              <select
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="" disabled>Select Category</option>
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {type === 'TRANSFER' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">From Account</label>
                <select
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">To Account</label>
                <select
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select</option>
                  {accounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Account</label>
              <select
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
              >
                <option value="" disabled>Select Account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Date</label>
              <input
                type="date"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Note (Optional)</label>
              <input
                type="text"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Details..."
              />
            </div>
          </div>
          
          {/* Recurring Option (Only for New Transactions) */}
          {!initialData && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Repeat this transaction?</span>
              </label>
              
              {isRecurring && (
                <div className="mt-3 pl-6">
                  <label className="block text-xs font-medium mb-1 text-slate-500 dark:text-slate-400">Frequency</label>
                  <select
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`mt-4 w-full py-3 px-4 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95 ${
              type === 'EXPENSE' ? 'bg-red-600 hover:bg-red-700' : 
              type === 'INCOME' ? 'bg-green-600 hover:bg-green-700' : 
              'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Transaction')}
          </button>
        </form>
      </div>
    </>
  );
};

export default TransactionModal;
