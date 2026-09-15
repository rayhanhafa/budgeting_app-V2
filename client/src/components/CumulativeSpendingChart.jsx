import React, { useMemo, useState, useEffect, useContext, useRef } from 'react';
import { PrivacyContext } from '../context/PrivacyContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Filter } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  const { formatCurrency } = useContext(PrivacyContext);

  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CumulativeSpendingChart = ({ transactions, budgetProgress = [], month, year }) => {
  const { formatCurrency, isBalanceHidden } = useContext(PrivacyContext);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Identify ALL expense categories (budgeted and unbudgeted)
  const allCategories = useMemo(() => {
    return budgetProgress.map(b => ({
      id: b.category.id,
      name: b.category.name,
      budgetAmount: b.budgetAmount || 0
    }));
  }, [budgetProgress]);

  // Read saved selection from localStorage or initialize empty
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() => {
    const saved = localStorage.getItem('cumulativeChartCategoryFilter');
    return saved ? JSON.parse(saved) : {};
  });

  // Make sure new categories default to checked
  useEffect(() => {
    let hasChanges = false;
    const updatedSelection = { ...selectedCategoryIds };

    allCategories.forEach(cat => {
      if (updatedSelection[cat.id] === undefined) {
        updatedSelection[cat.id] = true;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setSelectedCategoryIds(updatedSelection);
      localStorage.setItem('cumulativeChartCategoryFilter', JSON.stringify(updatedSelection));
    }
  }, [allCategories, selectedCategoryIds]);

  // Handle outside click to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleCategory = (id) => {
    const updated = {
      ...selectedCategoryIds,
      [id]: !selectedCategoryIds[id]
    };
    setSelectedCategoryIds(updated);
    localStorage.setItem('cumulativeChartCategoryFilter', JSON.stringify(updated));
  };

  const activeCategoryIds = useMemo(() => {
    return Object.keys(selectedCategoryIds).filter(id => selectedCategoryIds[id]);
  }, [selectedCategoryIds]);

  // Calculate filtered total limit (unbudgeted categories contribute 0)
  const filteredTotalLimit = useMemo(() => {
    return allCategories
      .filter(cat => activeCategoryIds.includes(cat.id))
      .reduce((sum, cat) => sum + cat.budgetAmount, 0);
  }, [allCategories, activeCategoryIds]);

  // Generate chart data based on active categories
  const data = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
    const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;

    const dailyExpenses = new Array(daysInMonth + 1).fill(0);
    const budgetedDailyExpenses = new Array(daysInMonth + 1).fill(0);
    
    // Set for quick lookup of active categories that ACTUALLY have a budget
    const activeBudgetedIds = new Set(
      allCategories
        .filter(c => c.budgetAmount > 0 && activeCategoryIds.includes(c.id))
        .map(c => c.id)
    );

    transactions.forEach(t => {
      if (t.type === 'EXPENSE' && activeCategoryIds.includes(t.categoryId)) {
        const txDate = new Date(t.date);
        if (txDate.getMonth() + 1 === month && txDate.getFullYear() === year) {
          const amount = Number(t.amount);
          dailyExpenses[txDate.getDate()] += amount;
          
          if (activeBudgetedIds.has(t.categoryId)) {
            budgetedDailyExpenses[txDate.getDate()] += amount;
          }
        }
      }
    });

    const chartData = [];
    let cumulativeExpense = 0;
    let budgetedCumulativeExpense = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${day} ${new Date(year, month - 1, day).toLocaleString('id-ID', { month: 'short' })}`;
      
      const dataPoint = {
        date: dateStr,
        day: day
      };

      if (!isCurrentMonth || day <= currentDay) {
        cumulativeExpense += dailyExpenses[day];
        budgetedCumulativeExpense += budgetedDailyExpenses[day];
        
        dataPoint['Pengeluaran Kumulatif'] = cumulativeExpense;
        // Keep budgeted expense in data object for recommendation card (not rendered in chart)
        dataPoint['budgetedExpense'] = budgetedCumulativeExpense;
      }

      if (filteredTotalLimit > 0) {
        dataPoint['Pace Ideal'] = (filteredTotalLimit / daysInMonth) * day;
      }

      chartData.push(dataPoint);
    }
    
    return chartData;
  }, [transactions, allCategories, activeCategoryIds, filteredTotalLimit, month, year]);

  const hasFilteredExpenses = useMemo(() => 
    transactions.some(t => t.type === 'EXPENSE' && activeCategoryIds.includes(t.categoryId)), 
  [transactions, activeCategoryIds]);

  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;

  // Filter Popover Content
  const renderFilter = () => (
    <div className="absolute top-4 right-4 z-20" ref={filterRef}>
      <button 
        onClick={() => setIsFilterOpen(!isFilterOpen)} 
        className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
        title="Filter Kategori"
      >
        <Filter size={18} />
      </button>
      
      {isFilterOpen && (
        <div className="absolute right-0 mt-2 w-[220px] bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Filter Kategori (Budget)</p>
          </div>
          <div className="max-h-60 overflow-y-auto p-2 flex flex-col gap-1">
            {allCategories.length === 0 ? (
              <p className="text-xs text-slate-500 p-2 text-center">Belum ada kategori pengeluaran.</p>
            ) : (
              allCategories.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={!!selectedCategoryIds[cat.id]}
                    onChange={() => handleToggleCategory(cat.id)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 flex-shrink-0"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-600 transition-colors flex items-center">
                    {cat.name}
                    {cat.budgetAmount === 0 && (
                      <span className="text-[10px] text-slate-400 font-normal ml-1.5 whitespace-nowrap">(Belum ada limit)</span>
                    )}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (activeCategoryIds.length === 0) {
    return (
      <div className="card p-4 h-[350px] flex flex-col items-center justify-center relative bg-slate-50/50 dark:bg-slate-900/50">
        {renderFilter()}
        <p className="font-medium text-slate-500 dark:text-slate-400">Pilih minimal 1 kategori</p>
      </div>
    );
  }

  if (!hasFilteredExpenses && filteredTotalLimit === 0) {
    return (
      <div className="card p-4 h-64 flex flex-col items-center justify-center text-slate-500 relative">
        {renderFilter()}
        <p className="font-medium text-slate-600 dark:text-slate-400 mb-1">Cumulative Spending</p>
        <p className="text-sm text-center italic">No expense transactions this month.</p>
        <p className="text-xs text-center text-slate-500 mt-4">
          Set budget kategori untuk melihat perbandingan pace
        </p>
      </div>
    );
  }

  // Insight calculation (uses all checked categories)
  let insightText = null;
  let insightType = 'neutral';
  
  if (filteredTotalLimit > 0 && hasFilteredExpenses && isCurrentMonth) {
    const todayDate = today.getDate();
    const currentDataPoint = data[todayDate - 1]; // array is 0-indexed
    const currentExpense = currentDataPoint['Pengeluaran Kumulatif'];
    const currentIdealPace = currentDataPoint['Pace Ideal'];

    if (currentExpense <= currentIdealPace) {
      insightText = `Kamu masih di jalur aman, pengeluaran ${formatCurrency(currentExpense)} di bawah pace ideal ${formatCurrency(currentIdealPace)} untuk tanggal ini.`;
      insightType = 'positive';
    } else {
      insightText = `Pengeluaran kamu sudah ${formatCurrency(currentExpense)}, lebih cepat dari pace ideal ${formatCurrency(currentIdealPace)}. Kalau diteruskan, berpotensi melebihi total budget di akhir bulan.`;
      insightType = 'warning';
    }
  }

  // Recommendation Card Calculation 
  // (Uses ONLY budgeted expenses to avoid penalizing unbudgeted categories against a budget limit)
  let recommendationCard = null;
  if (filteredTotalLimit > 0 && isCurrentMonth) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const todayDate = today.getDate();
    const sisaHari = daysInMonth - todayDate + 1;
    
    // Get exact cumulative expense of BUDGETED categories up to today from the same data array
    const currentDataPoint = data[todayDate - 1];
    const currentBudgetedCumulativeExpense = currentDataPoint ? (currentDataPoint['budgetedExpense'] || 0) : 0;
    const sisaBudget = filteredTotalLimit - currentBudgetedCumulativeExpense;

    if (sisaBudget > 0) {
      const rekomendasiHarian = sisaBudget / sisaHari;
      recommendationCard = (
        <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">💡 Rekomendasi Harian</p>
          <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
            Sisa budget kamu <span className="font-bold">{formatCurrency(sisaBudget)}</span>. Supaya tetap sesuai pace, disarankan belanja maksimal <span className="font-bold">{formatCurrency(rekomendasiHarian)}</span> per hari untuk <span className="font-bold">{sisaHari}</span> hari sisa bulan ini.
          </p>
        </div>
      );
    } else {
      recommendationCard = (
        <div className="mt-3 p-3 bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">⚠️ Over Budget</p>
          <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
            Kamu sudah melebihi total budget sebesar <span className="font-bold">{formatCurrency(Math.abs(sisaBudget))}</span>. Disarankan tidak ada pengeluaran tambahan dari kategori ini sampai akhir bulan.
          </p>
        </div>
      );
    }
  }

  return (
    <div className="card p-4 flex flex-col relative h-auto min-h-[350px]">
      {renderFilter()}
      
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 pr-8">
        Cumulative Spending vs Pace Ideal
      </h3>
      
      <div className="w-full h-64 ml-[-15px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              dy={10}
              minTickGap={20}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              tickFormatter={(value) => {
                if (isBalanceHidden) return formatCurrency(value);
                return `Rp${value >= 1000 ? (value/1000) + 'k' : value}`
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="plainline" wrapperStyle={{ paddingRight: '20px' }} />
            <Line 
              type="monotone" 
              dataKey="Pengeluaran Kumulatif" 
              stroke="#ef4444" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6 }} 
            />
            {filteredTotalLimit > 0 && (
              <Line 
                type="monotone" 
                dataKey="Pace Ideal" 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insight Text */}
      {filteredTotalLimit === 0 ? (
        <p className="text-xs text-center text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
          Set budget kategori untuk melihat perbandingan pace
        </p>
      ) : insightText ? (
        <div className={`mt-2 p-3 rounded-lg text-xs font-medium border ${
          insightType === 'positive' 
            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50' 
            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50'
        }`}>
          {insightText}
        </div>
      ) : null}

      {/* Daily Recommendation Card */}
      {recommendationCard}
    </div>
  );
};

export default CumulativeSpendingChart;
