import { useState, useEffect, useContext } from 'react';
import { PrivacyContext } from '../context/PrivacyContext';
import api from '../services/api';
import { Link } from 'react-router-dom';
import TransactionModal from '../components/TransactionModal';
import ConfirmModal from '../components/ConfirmModal';

const TransactionsHistory = () => {
  const getInitialDates = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const { formatCurrency } = useContext(PrivacyContext);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New States
  const [startDate, setStartDate] = useState(getInitialDates().start);
  const [endDate, setEndDate] = useState(getInitialDates().end);
  const [dateError, setDateError] = useState('');
  const [viewMode, setViewMode] = useState('date'); // 'date' | 'category'
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchTransactions = async () => {
    if (startDate && endDate && startDate > endDate) {
      setDateError('Rentang tanggal tidak valid (Dari > Sampai).');
      return;
    }
    setDateError('');
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const res = await api.get(`/transactions?${queryParams.toString()}`);
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const handleShortcut = (type) => {
    const today = new Date();
    let start, end;
    switch (type) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'week':
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(today);
        start.setDate(diff);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'all':
        setStartDate('');
        setEndDate('');
        return;
      default:
        return;
    }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

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

  // Grouping Logic for "Per Category" view
  const categoryGroups = transactions.reduce((acc, tx) => {
    if (tx.type === 'TRANSFER') {
      if (!acc.transfer) acc.transfer = { type: 'TRANSFER', items: [], total: 0 };
      acc.transfer.items.push(tx);
      acc.transfer.total += Number(tx.amount);
      return acc;
    }

    const typeKey = tx.type === 'INCOME' ? 'income' : 'expense';
    if (!acc[typeKey]) acc[typeKey] = {};
    
    const catName = tx.category?.name || 'Uncategorized';
    if (!acc[typeKey][catName]) {
      acc[typeKey][catName] = { name: catName, type: tx.type, items: [], total: 0 };
    }
    acc[typeKey][catName].items.push(tx);
    acc[typeKey][catName].total += Number(tx.amount);
    return acc;
  }, { income: {}, expense: {}, transfer: null });

  const sortedExpense = Object.values(categoryGroups.expense).sort((a, b) => b.total - a.total);
  const sortedIncome = Object.values(categoryGroups.income).sort((a, b) => b.total - a.total);

  const totalIncome = sortedIncome.reduce((sum, cat) => sum + cat.total, 0);
  const totalExpense = sortedExpense.reduce((sum, cat) => sum + cat.total, 0);
  const totalTransfer = categoryGroups.transfer?.total || 0;

  const renderTransactionItem = (tx) => (
    <div key={tx.id} className="p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            {tx.type === 'TRANSFER' ? 'Transfer' : tx.category?.name || 'Uncategorized'}
          </p>
          <p className="text-xs text-slate-500">
            {new Date(tx.date).toLocaleDateString()} • {tx.account?.name}
            {tx.type === 'TRANSFER' && ` → ${tx.toAccount?.name}`}
          </p>
          {tx.note && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">"{tx.note}"</p>}
        </div>
        <p className={`font-bold text-sm ${
          tx.type === 'INCOME' ? 'text-green-600' : 
          tx.type === 'EXPENSE' ? 'text-red-600' : 'text-blue-600'
        }`}>
          {tx.type === 'INCOME' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
        </p>
      </div>
      
      <div className="flex gap-2 justify-end mt-2">
        <button onClick={() => handleEdit(tx)} className="text-xs font-medium text-blue-600 hover:underline">Edit</button>
        <button onClick={() => triggerDelete(tx.id)} className="text-xs font-medium text-red-600 hover:underline">Delete</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-500 hover:text-slate-700 dark:text-slate-400">
            ← Back
          </Link>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Transaction History</h1>
        </div>
        
        <button 
          onClick={async () => {
            try {
              const queryParams = new URLSearchParams();
              if (startDate) queryParams.append('startDate', startDate);
              if (endDate) queryParams.append('endDate', endDate);
              const response = await api.get(`/export?${queryParams.toString()}`, { responseType: 'blob' });
              const blob = new Blob([response.data], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (error) {
              console.error('Failed to export transactions:', error);
              alert('Gagal mengekspor data.');
            }
          }}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Export CSV
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto flex flex-col gap-6">
        
        {/* Filters Section */}
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <button onClick={() => handleShortcut('today')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full font-medium">Hari Ini</button>
            <button onClick={() => handleShortcut('week')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full font-medium">Minggu Ini</button>
            <button onClick={() => handleShortcut('month')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full font-medium">Bulan Ini</button>
            <button onClick={() => handleShortcut('all')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full font-medium">Semua</button>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Dari Tanggal</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="input w-full text-sm py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Sampai Tanggal</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="input w-full text-sm py-2"
              />
            </div>
          </div>
          {dateError && <p className="text-xs text-red-500 font-medium mt-1">{dateError}</p>}
        </div>

        {/* View Toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button 
            onClick={() => setViewMode('date')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'date' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Per Tanggal
          </button>
          <button 
            onClick={() => setViewMode('category')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'category' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Per Kategori
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <p className="text-center text-slate-500 py-8">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-center text-slate-500 py-8">Tidak ada transaksi di rentang tanggal ini.</p>
        ) : viewMode === 'date' ? (
          /* Per Date View */
          <div className="flex flex-col gap-3">
            {transactions.map(tx => (
              <div key={tx.id} className="card">
                {renderTransactionItem(tx)}
              </div>
            ))}
          </div>
        ) : (
          /* Per Category View */
          <div className="flex flex-col gap-6">
            {/* Overview Totals */}
            <div className="card p-4 flex justify-between items-center text-center">
              <div>
                <p className="text-xs text-slate-500 font-medium">Income</p>
                <p className="text-sm font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Expense</p>
                <p className="text-sm font-bold text-red-600">{formatCurrency(totalExpense)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Transfer</p>
                <p className="text-sm font-bold text-blue-600">{formatCurrency(totalTransfer)}</p>
              </div>
            </div>

            {/* Expenses Section */}
            {sortedExpense.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider">Pengeluaran</h2>
                <div className="flex flex-col gap-3">
                  {sortedExpense.map(cat => (
                    <details key={cat.name} className="card group">
                      <summary className="p-4 flex justify-between items-center cursor-pointer list-none">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</div>
                        <div className="font-bold text-red-600">Rp {cat.total.toLocaleString('id-ID')}</div>
                      </summary>
                      <div className="border-t border-slate-100 dark:border-slate-800">
                        {cat.items.map(tx => renderTransactionItem(tx))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Income Section */}
            {sortedIncome.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 mt-4 uppercase tracking-wider">Pemasukan</h2>
                <div className="flex flex-col gap-3">
                  {sortedIncome.map(cat => (
                    <details key={cat.name} className="card group">
                      <summary className="p-4 flex justify-between items-center cursor-pointer list-none">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</div>
                        <div className="font-bold text-green-600">Rp {cat.total.toLocaleString('id-ID')}</div>
                      </summary>
                      <div className="border-t border-slate-100 dark:border-slate-800">
                        {cat.items.map(tx => renderTransactionItem(tx))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Transfer Section */}
            {categoryGroups.transfer && categoryGroups.transfer.items.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 mt-4 uppercase tracking-wider">Transfer</h2>
                <details className="card group">
                  <summary className="p-4 flex justify-between items-center cursor-pointer list-none">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Transfer Antar Akun</div>
                    <div className="font-bold text-blue-600">Rp {categoryGroups.transfer.total.toLocaleString('id-ID')}</div>
                  </summary>
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    {categoryGroups.transfer.items.map(tx => renderTransactionItem(tx))}
                  </div>
                </details>
              </div>
            )}

          </div>
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
