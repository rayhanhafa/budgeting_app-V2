import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// A fixed set of aesthetically pleasing colors for consistent category mapping
const COLORS = [
  '#f87171', // red-400
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#a78bfa', // violet-400
  '#f472b6', // pink-400
  '#38bdf8', // sky-400
  '#a3e635', // lime-400
  '#fb923c', // orange-400
  '#818cf8', // indigo-400
];

const stringToColorIndex = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % COLORS.length;
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="font-semibold text-slate-800 dark:text-slate-200">{data.name}</p>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Rp {data.value.toLocaleString('id-ID')}
        </p>
      </div>
    );
  }
  return null;
};

const ExpensePieChart = ({ transactions }) => {
  const data = useMemo(() => {
    // 1 & 2. Filter strictly for EXPENSE
    const expenses = transactions.filter(t => t.type === 'EXPENSE');
    
    // Group by category name
    const grouped = expenses.reduce((acc, tx) => {
      const catName = tx.category?.name || 'Uncategorized';
      if (!acc[catName]) acc[catName] = 0;
      acc[catName] += Number(tx.amount);
      return acc;
    }, {});

    // Format for Recharts
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort descending
  }, [transactions]);

  // 4. Empty state for no expenses
  if (data.length === 0) {
    return (
      <div className="card p-4 h-64 flex flex-col items-center justify-center text-slate-500">
        <p className="font-medium text-slate-600 dark:text-slate-400 mb-1">Expenses</p>
        <p className="text-sm text-center italic">No expense transactions this month.</p>
      </div>
    );
  }

  return (
    <div className="card p-4 h-72 flex flex-col relative">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Expenses by Category</h3>
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => {
                // 3. Consistent color mapping using hash of category name
                const colorIndex = stringToColorIndex(entry.name);
                return (
                  <Cell key={`cell-${index}`} fill={COLORS[colorIndex]} />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpensePieChart;
