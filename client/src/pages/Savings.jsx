import { useState, useEffect, useContext } from 'react';
import { PrivacyContext } from '../context/PrivacyContext';
import api from '../services/api';
import { Link } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import CurrencyInput from '../components/CurrencyInput';

const Savings = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const { formatCurrency } = useContext(PrivacyContext);

  // Form states
  const [formData, setFormData] = useState({ name: '', targetAmount: '', targetDate: '' });
  const [fundAmount, setFundAmount] = useState('');

  const fetchGoals = async () => {
    try {
      const res = await api.get('/savings');
      setGoals(res.data);
    } catch (err) {
      console.error('Failed to fetch savings goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/savings', {
        ...formData,
        targetAmount: Number(formData.targetAmount)
      });
      setIsModalOpen(false);
      setFormData({ name: '', targetAmount: '', targetDate: '' });
      fetchGoals();
    } catch (err) {
      alert('Error creating savings goal');
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    try {
      const newAmount = Number(activeGoal.currentAmount) + Number(fundAmount);
      await api.put(`/savings/${activeGoal.id}`, {
        ...activeGoal,
        currentAmount: newAmount
      });
      setIsFundModalOpen(false);
      setFundAmount('');
      setActiveGoal(null);
      fetchGoals();
    } catch (err) {
      alert('Error adding funds');
    }
  };

  const triggerDelete = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/savings/${itemToDelete}`);
      fetchGoals();
    } catch (err) {
      alert('Error deleting goal');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Link to="/" className="text-slate-500 hover:text-slate-700 dark:text-slate-400">← Back</Link>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Savings Goals</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
        >
          + New Goal
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto flex flex-col gap-4">
        {goals.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p>No savings goals yet.</p>
            <p className="text-sm mt-1">Create one to start tracking your dreams!</p>
          </div>
        ) : (
          goals.map(goal => {
            const current = Number(goal.currentAmount);
            const target = Number(goal.targetAmount);
            const percentage = Math.min(100, Math.round((current / target) * 100)) || 0;
            
            return (
              <div key={goal.id} className="card p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">{goal.name}</h3>
                    {goal.targetDate && (
                      <p className="text-xs text-slate-500">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  <button onClick={() => triggerDelete(goal.id)} className="text-red-500 hover:text-red-700 text-xl font-bold px-2">×</button>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-blue-600 dark:text-blue-400">Rp {current.toLocaleString('id-ID')}</span>
                    <span className="text-slate-500">Rp {target.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-xs mt-1 text-slate-500 font-medium">{percentage}%</p>
                </div>

                <button 
                  onClick={() => { setActiveGoal(goal); setIsFundModalOpen(true); }}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-medium rounded-lg text-sm transition-colors"
                >
                  Add Funds
                </button>
              </div>
            );
          })
        )}
      </main>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg sm:rounded-2xl rounded-t-2xl p-6 shadow-xl transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Create Goal</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Goal Name</label>
                <input 
                  required type="text"
                  placeholder="e.g. New Car, Vacation"
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Amount (Rp)</label>
                <CurrencyInput 
                  required
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                  value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Date (Optional)</label>
                <input 
                  type="date"
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                  value={formData.targetDate} onChange={e => setFormData({...formData, targetDate: e.target.value})}
                />
              </div>
              
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-4">
                Save Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {isFundModalOpen && activeGoal && (
        <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg sm:rounded-2xl rounded-t-2xl p-6 shadow-xl transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Add to {activeGoal.name}</h2>
              <button onClick={() => { setIsFundModalOpen(false); setActiveGoal(null); setFundAmount(''); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleAddFunds} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount to add (Rp)</label>
                <CurrencyInput 
                  required
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100 text-xl font-bold"
                  value={fundAmount} onChange={e => setFundAmount(e.target.value)}
                  autoFocus
                />
              </div>
              
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-4">
                Confirm
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this savings goal? All progress will be lost."
      />
    </div>
  );
};

export default Savings;
