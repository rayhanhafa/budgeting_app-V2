import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import TransactionModal from '../components/TransactionModal';
import ConfirmModal from '../components/ConfirmModal';

const TransactionsHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const triggerDelete = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/transactions/${itemToDelete}`);
      fetchTransactions();
    } catch (err) {
      alert('Failed to delete transaction');
    }
  };

  const handleEdit = (tx) => {
    setEditingData(tx);
    setIsModalOpen(true);
  };

  const closeAndRefresh = () => {
    setIsModalOpen(false);
    setEditingData(null);
    fetchTransactions();
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-500 hover:text-slate-700 dark:text-slate-400">
            ← Back
          </Link>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Transaction History</h1>
        </div>
        
        <button 
          onClick={() => {
            const token = localStorage.getItem('token');
            if (token) {
              window.open(`http://localhost:5000/api/export?token=${token}`, '_blank');
              // Alternatively, trigger a fetch and blob download for better auth header handling,
              // but since we want to be simple, we can fetch and download blob.
            }
          }}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Export CSV
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto flex flex-col gap-4">
        {transactions.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No transactions found.</p>
        ) : (
          transactions.map(tx => (
            <div key={tx.id} className="card p-4 flex flex-col gap-2 relative group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {tx.type === 'TRANSFER' ? 'Transfer' : tx.category?.name || 'Uncategorized'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(tx.date).toLocaleDateString()} • {tx.account?.name}
                    {tx.type === 'TRANSFER' && ` → ${tx.toAccount?.name}`}
                  </p>
                  {tx.note && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 italic">"{tx.note}"</p>}
                </div>
                <p className={`font-bold ${
                  tx.type === 'INCOME' ? 'text-green-600' : 
                  tx.type === 'EXPENSE' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {tx.type === 'INCOME' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => handleEdit(tx)}
                  className="text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button 
                  onClick={() => triggerDelete(tx.id)}
                  className="text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingData(null); }}
        onSuccess={closeAndRefresh}
        initialData={editingData}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div>
  );
};

export default TransactionsHistory;
