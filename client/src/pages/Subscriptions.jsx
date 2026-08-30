import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get('/recurring');
      setSubscriptions(res.data);
    } catch (err) {
      console.error('Failed to fetch recurring transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const triggerDelete = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/recurring/${itemToDelete}`);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting subscription');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 flex gap-4 items-center">
        <Link to="/" className="text-slate-500 hover:text-slate-700 dark:text-slate-400">← Back</Link>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Manage Subscriptions</h1>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        <div className="flex flex-col gap-4">
          {subscriptions.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <p>No active subscriptions.</p>
              <p className="text-sm mt-1">Create a recurring transaction to see it here.</p>
            </div>
          ) : (
            subscriptions.map(sub => (
              <div key={sub.id} className="card p-4 flex flex-col gap-3 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  sub.type === 'INCOME' ? 'bg-green-500' : 
                  sub.type === 'EXPENSE' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
                
                <div className="flex justify-between items-start pl-2">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      {sub.category?.name || 'Uncategorized'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                      <span className="capitalize">{sub.frequency.toLowerCase()}</span>
                      <span>•</span>
                      {sub.type === 'TRANSFER' 
                        ? `${sub.account.name} → ${sub.toAccount?.name}` 
                        : sub.account.name
                      }
                    </p>
                    {sub.note && (
                      <p className="text-xs text-slate-400 mt-1 italic">"{sub.note}"</p>
                    )}
                  </div>
                  <button 
                    onClick={() => triggerDelete(sub.id)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Stop
                  </button>
                </div>
                
                <div className="flex justify-between items-end pl-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500">
                    Next: <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(sub.nextDate).toLocaleDateString()}</span>
                  </div>
                  <span className={`font-bold ${
                    sub.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 
                    sub.type === 'EXPENSE' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    Rp {Number(sub.amount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="Stop Subscription"
        message="Are you sure you want to stop this recurring transaction? This will not delete past transactions, but no new ones will be generated."
      />
    </div>
  );
};

export default Subscriptions;
