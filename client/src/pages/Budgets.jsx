import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import CurrencyInput from '../components/CurrencyInput';

const Budgets = () => {
  const [categories, setCategories] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [inputType, setInputType] = useState('MONTHLY');

  const daysInMonth = new Date(year, month, 0).getDate();
  const weeksInMonth = daysInMonth / 7;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, progRes] = await Promise.all([
        api.get('/categories'),
        api.get(`/budgets/progress?month=${month}&year=${year}`)
      ]);
      setCategories(catRes.data.filter(c => c.type === 'EXPENSE'));
      setProgressData(progRes.data);
    } catch (err) {
      console.error('Failed to fetch budget data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const handleOpenModal = (category, currentAmount) => {
    setEditingCategory(category);
    setBudgetAmount(currentAmount ? currentAmount.toString() : '');
    setInputType('MONTHLY');
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    
    let finalAmount = Number(budgetAmount);
    if (inputType === 'DAILY') {
      finalAmount = finalAmount * daysInMonth;
    } else if (inputType === 'WEEKLY') {
      finalAmount = finalAmount * weeksInMonth;
    }

    try {
      await api.post('/budgets', {
        categoryId: editingCategory.id,
        amount: Math.round(finalAmount),
        month,
        year
      });
      setIsModalOpen(false);
      fetchData(); // Refetch progress
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set budget');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Link to="/" className="text-slate-500 hover:text-slate-700 dark:text-slate-400">
            ← Back
          </Link>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Monthly Budget</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto flex flex-col gap-6">
        
        {/* Date Selector */}
        <div className="flex gap-4 items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <select 
            value={month} 
            onChange={(e) => setMonth(Number(e.target.value))}
            className="flex-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <input 
            type="number" 
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        {/* Total Budget Summary */}
        <div className="card p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Budget Summary</h2>
          {(() => {
            const totalBudget = progressData.reduce((acc, curr) => acc + curr.budgetAmount, 0);
            const totalSpent = progressData.reduce((acc, curr) => acc + curr.spentAmount, 0);
            const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
            
            let barColor = 'bg-blue-500';
            if (totalPercentage >= 100) barColor = 'bg-red-500';
            else if (totalPercentage >= 80) barColor = 'bg-yellow-500';

            return (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-500">Total Spent</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">Rp {totalSpent.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Total Limit</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">Rp {totalBudget.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mt-1 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full ${barColor} transition-all duration-500`} 
                    style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Budget List */}
        <div className="flex flex-col gap-4">
          {categories.map(cat => {
            const budget = progressData.find(p => p.category.id === cat.id);
            const isSet = !!budget;
            const spent = budget ? budget.spentAmount : 0;
            const limit = budget ? budget.budgetAmount : 0;
            const percentage = limit > 0 ? (spent / limit) * 100 : 0;
            
            const dailyLimit = limit > 0 ? Math.round(limit / daysInMonth) : 0;
            const spentToday = budget ? budget.spentToday : 0;
            const isCurrentMonth = month === currentDate.getMonth() + 1 && year === currentDate.getFullYear();

            let barColor = 'bg-green-500';
            if (percentage >= 100) barColor = 'bg-red-500';
            else if (percentage >= 80) barColor = 'bg-yellow-500';

            return (
              <div key={cat.id} className="card p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</p>
                  <button 
                    onClick={() => handleOpenModal(cat, limit)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 dark:border-blue-900 rounded px-2 py-1"
                  >
                    {isSet ? 'Edit' : 'Set Budget'}
                  </button>
                </div>
                
                {isSet ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Spent: Rp {spent.toLocaleString('id-ID')}</span>
                      <div className="text-right">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Limit: Rp {limit.toLocaleString('id-ID')}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          (~Rp {dailyLimit.toLocaleString('id-ID')}/hari)
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full ${barColor} transition-all duration-500`} 
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    {percentage >= 100 && (
                      <p className="text-xs text-red-500 font-medium">Over budget!</p>
                    )}
                    
                    {/* Daily Pacing Info */}
                    {isCurrentMonth && (
                      <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                        <span className="text-slate-500">Hari ini: <span className="font-medium text-slate-700 dark:text-slate-300">Rp {spentToday.toLocaleString('id-ID')}</span></span>
                        <span className={`font-medium ${spentToday > dailyLimit ? 'text-red-500' : 'text-green-500'}`}>
                          {spentToday > dailyLimit ? 'Over Daily Limit' : 'Safe for today'}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400 italic">No budget set for this month.</p>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Set Budget Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-2xl shadow-xl p-4 pb-12">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              Set Budget for {editingCategory?.name}
            </h2>
            <form onSubmit={handleSaveBudget} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Input By</label>
                <select
                  value={inputType}
                  onChange={e => setInputType(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white mb-4"
                >
                  <option value="MONTHLY">Total Bulanan (Monthly)</option>
                  <option value="WEEKLY">Target Mingguan (Weekly)</option>
                  <option value="DAILY">Target Harian (Daily)</option>
                </select>

                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">Rp</span>
                  <CurrencyInput
                    className="w-full pl-9 p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {inputType !== 'MONTHLY' && budgetAmount && (
                <div className="text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="mb-1">Total limit for this month will be saved as:</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                    Rp {Math.round(Number(budgetAmount) * (inputType === 'DAILY' ? daysInMonth : weeksInMonth)).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs mt-1">Based on {inputType === 'DAILY' ? `${daysInMonth} days` : `${weeksInMonth.toFixed(1)} weeks`} in {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}.</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95"
              >
                Save Budget
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Budgets;
