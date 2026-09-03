import { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PrivacyContext } from '../context/PrivacyContext';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import TransactionModal from '../components/TransactionModal';
import AccountModal from '../components/AccountModal';
import ExpensePieChart from '../components/ExpensePieChart';
import DailyLineChart from '../components/DailyLineChart';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { isBalanceHidden, togglePrivacy, formatCurrency } = useContext(PrivacyContext);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const [accRes, txRes] = await Promise.all([
        api.get('/accounts'),
        api.get(`/transactions?month=${month}&year=${year}`)
      ]);
      
      setAccounts(accRes.data);
      setTransactions(txRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const totalBalance = accounts.reduce((acc, account) => acc + Number(account.balance), 0);
  
  // Calculate this month's income and expense
  const monthlyIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + Number(t.amount), 0);
    
  const monthlyExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back,</p>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">{user?.name}</h1>
        </div>
        <div className="flex gap-4 items-center">
          <Link 
            to="/settings"
            className="text-slate-500 hover:text-blue-600 transition-colors"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <button 
            onClick={logout}
            className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-lg mx-auto flex flex-col gap-6">
        
        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-2">
          <Link to="/transactions" className="py-2 px-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-center text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50">
            History
          </Link>
          <Link to="/budgets" className="py-2 px-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl text-center text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-900/50">
            Budgets
          </Link>
          <Link to="/savings" className="py-2 px-3 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl text-center text-sm font-medium hover:bg-teal-100 dark:hover:bg-teal-900/50">
            Savings
          </Link>
          <Link to="/categories" className="py-2 px-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl text-center text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50">
            Categories
          </Link>
          <Link to="/subscriptions" className="col-span-2 py-2 px-3 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl text-center text-sm font-medium hover:bg-pink-100 dark:hover:bg-pink-900/50">
            Subscriptions
          </Link>
        </section>

        {/* Total Balance */}
        <section className="text-center py-2 relative">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-center gap-2">
            Total Balance
            <button onClick={togglePrivacy} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              {isBalanceHidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </p>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(totalBalance)}
          </h2>
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-4">
          <div className="card p-4 bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/50">
            <p className="text-sm text-green-600 dark:text-green-500 font-medium">Income</p>
            <p className="text-xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(monthlyIncome)}
            </p>
          </div>
          <div className="card p-4 bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/50">
            <p className="text-sm text-red-600 dark:text-red-500 font-medium">Expense</p>
            <p className="text-xl font-bold text-red-700 dark:text-red-400">
              {formatCurrency(monthlyExpense)}
            </p>
          </div>
        </section>

        {/* Charts Section */}
        <section className="flex flex-col gap-4">
          <ExpensePieChart transactions={transactions} />
          <DailyLineChart transactions={transactions} />
        </section>

        {/* Accounts List (MVP) */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Your Accounts</h3>
            <button 
              onClick={() => setIsAccountModalOpen(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-md"
            >
              + Add
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {accounts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No accounts yet.</p>
            ) : (
              accounts.map((acc) => (
                <div key={acc.id} className="card p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{acc.name}</p>
                    <p className="text-xs text-slate-500">{acc.type}</p>
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrency(acc.balance)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* FAB - Add Transaction */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full max-w-lg mx-auto block py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-center cursor-pointer"
        >
          + Add Transaction
        </button>
      </div>

      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchDashboardData();
        }}
      />

      <AccountModal 
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSuccess={() => {
          setIsAccountModalOpen(false);
          fetchDashboardData();
        }}
      />
    </div>
  );
};

export default Dashboard;
