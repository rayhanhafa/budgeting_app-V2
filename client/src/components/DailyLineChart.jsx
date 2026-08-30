import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Date: {label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: Rp {Number(entry.value).toLocaleString('id-ID')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DailyLineChart = ({ transactions }) => {
  const data = useMemo(() => {
    // We only care about INCOME and EXPENSE for this chart
    const relevant = transactions.filter(t => t.type === 'INCOME' || t.type === 'EXPENSE');
    
    // Group by Date String (YYYY-MM-DD)
    const grouped = relevant.reduce((acc, tx) => {
      const dateStr = new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (!acc[dateStr]) acc[dateStr] = { date: dateStr, Income: 0, Expense: 0 };
      
      if (tx.type === 'INCOME') acc[dateStr].Income += Number(tx.amount);
      if (tx.type === 'EXPENSE') acc[dateStr].Expense += Number(tx.amount);
      
      return acc;
    }, {});

    // For better UX, we might want to sort it by the actual Date object
    // Since we filtered for a specific month/year in the query, sorting by Day works.
    const arr = Object.values(grouped).sort((a, b) => {
      // Very simple parsing of "10 Aug" vs "11 Aug" based on the first number since it's same month
      return parseInt(a.date) - parseInt(b.date);
    });

    return arr;
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="card p-4 h-64 flex flex-col items-center justify-center text-slate-500">
        <p className="font-medium text-slate-600 dark:text-slate-400 mb-1">Daily Trends</p>
        <p className="text-sm text-center italic">No income or expense data this month.</p>
      </div>
    );
  }

  return (
    <div className="card p-4 h-72 flex flex-col relative">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Daily Trends</h3>
      <div className="flex-1 min-h-0 w-full ml-[-15px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              tickFormatter={(value) => `Rp${value > 1000 ? (value/1000) + 'k' : value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="plainline" />
            <Line 
              type="monotone" 
              dataKey="Income" 
              stroke="#22c55e" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2 }} 
              activeDot={{ r: 6 }} 
            />
            <Line 
              type="monotone" 
              dataKey="Expense" 
              stroke="#ef4444" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2 }} 
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyLineChart;
