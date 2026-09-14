import React, { useMemo, useContext } from 'react';
import { PrivacyContext } from '../context/PrivacyContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

const CumulativeSpendingChart = ({ transactions, totalLimitBudget, month, year }) => {
  const { formatCurrency, isBalanceHidden } = useContext(PrivacyContext);

  const data = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
    const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;

    // Calculate daily expenses
    const dailyExpenses = new Array(daysInMonth + 1).fill(0);
    transactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        const txDate = new Date(t.date);
        if (txDate.getMonth() + 1 === month && txDate.getFullYear() === year) {
          dailyExpenses[txDate.getDate()] += Number(t.amount);
        }
      }
    });

    const chartData = [];
    let cumulativeExpense = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${day} ${new Date(year, month - 1, day).toLocaleString('id-ID', { month: 'short' })}`;
      
      const dataPoint = {
        date: dateStr,
        day: day
      };

      if (!isCurrentMonth || day <= currentDay) {
        cumulativeExpense += dailyExpenses[day];
        dataPoint['Pengeluaran Kumulatif'] = cumulativeExpense;
      }

      if (totalLimitBudget > 0) {
        dataPoint['Pace Ideal'] = (totalLimitBudget / daysInMonth) * day;
      }

      chartData.push(dataPoint);
    }
    
    return chartData;
  }, [transactions, totalLimitBudget, month, year]);

  const hasExpenses = useMemo(() => transactions.some(t => t.type === 'EXPENSE'), [transactions]);

  if (!hasExpenses) {
    return (
      <div className="card p-4 h-64 flex flex-col items-center justify-center text-slate-500 relative">
        <p className="font-medium text-slate-600 dark:text-slate-400 mb-1">Cumulative Spending</p>
        <p className="text-sm text-center italic">No expense transactions this month.</p>
        {totalLimitBudget === 0 && (
          <p className="text-xs text-center text-slate-500 mt-4">
            Set budget kategori untuk melihat perbandingan pace
          </p>
        )}
      </div>
    );
  }

  // Insight calculation
  let insightText = null;
  let insightType = 'neutral';
  if (totalLimitBudget > 0 && hasExpenses) {
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
    
    if (isCurrentMonth) {
      const currentDay = today.getDate();
      const currentDataPoint = data[currentDay - 1]; // array is 0-indexed, day 1 is index 0
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
  }

  return (
    <div className="card p-4 flex flex-col relative h-auto min-h-[350px]">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Cumulative Spending vs Pace Ideal</h3>
      
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
            <Legend verticalAlign="top" height={36} iconType="plainline" />
            <Line 
              type="monotone" 
              dataKey="Pengeluaran Kumulatif" 
              stroke="#ef4444" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6 }} 
            />
            {totalLimitBudget > 0 && (
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
      {totalLimitBudget === 0 ? (
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
    </div>
  );
};

export default CumulativeSpendingChart;
