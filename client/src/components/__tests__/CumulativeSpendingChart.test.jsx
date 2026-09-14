import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CumulativeSpendingChart from '../CumulativeSpendingChart';
import { PrivacyContext } from '../../context/PrivacyContext';

// Mock recharts because it uses ResizeObserver and SVG that are hard to test in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

const mockFormatCurrency = vi.fn((val) => `Rp ${val.toLocaleString('id-ID')}`);

const renderWithContext = (ui, providerProps = {}) => {
  return render(
    <PrivacyContext.Provider value={{ formatCurrency: mockFormatCurrency, isBalanceHidden: false, ...providerProps }}>
      {ui}
    </PrivacyContext.Provider>
  );
};

describe('CumulativeSpendingChart', () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const currentDay = currentDate.getDate();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no expenses and no budget', () => {
    renderWithContext(
      <CumulativeSpendingChart 
        transactions={[]} 
        totalLimitBudget={0} 
        month={currentMonth} 
        year={currentYear} 
      />
    );
    expect(screen.getByText('No expense transactions this month.')).toBeInTheDocument();
    expect(screen.getByText('Set budget kategori untuk melihat perbandingan pace')).toBeInTheDocument();
  });

  it('renders chart and correct insight when under budget', () => {
    // Current day is e.g. 15.
    // Total budget is 30,000, so daily pace is 1,000. For day 15 it's 15,000.
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const totalLimitBudget = 1000 * daysInMonth;
    
    // Spend 500 on day 1 (which is well under pace)
    const transactions = [
      {
        type: 'EXPENSE',
        amount: 500,
        date: new Date(currentYear, currentMonth - 1, 1).toISOString()
      }
    ];

    renderWithContext(
      <CumulativeSpendingChart 
        transactions={transactions} 
        totalLimitBudget={totalLimitBudget} 
        month={currentMonth} 
        year={currentYear} 
      />
    );

    const expectedPace = 1000 * currentDay;
    const expectedInsight = `Kamu masih di jalur aman, pengeluaran Rp 500 di bawah pace ideal Rp ${expectedPace.toLocaleString('id-ID')} untuk tanggal ini.`;
    expect(screen.getByText(expectedInsight)).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders correct insight when over budget', () => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const totalLimitBudget = 1000 * daysInMonth; // Pace is 1000 per day
    
    // Spend 100,000 (definitely over pace)
    const transactions = [
      {
        type: 'EXPENSE',
        amount: 100000,
        date: new Date(currentYear, currentMonth - 1, 1).toISOString()
      }
    ];

    renderWithContext(
      <CumulativeSpendingChart 
        transactions={transactions} 
        totalLimitBudget={totalLimitBudget} 
        month={currentMonth} 
        year={currentYear} 
      />
    );

    const expectedPace = 1000 * currentDay;
    const expectedInsight = `Pengeluaran kamu sudah Rp 100.000, lebih cepat dari pace ideal Rp ${expectedPace.toLocaleString('id-ID')}. Kalau diteruskan, berpotensi melebihi total budget di akhir bulan.`;
    expect(screen.getByText(expectedInsight)).toBeInTheDocument();
  });

  it('handles privacy mode correctly in insight text', () => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const totalLimitBudget = 1000 * daysInMonth;
    
    const transactions = [
      {
        type: 'EXPENSE',
        amount: 500,
        date: new Date(currentYear, currentMonth - 1, 1).toISOString()
      }
    ];

    const privacyFormatCurrency = vi.fn(() => 'Rp ●●●●●●');

    renderWithContext(
      <CumulativeSpendingChart 
        transactions={transactions} 
        totalLimitBudget={totalLimitBudget} 
        month={currentMonth} 
        year={currentYear} 
      />,
      { isBalanceHidden: true, formatCurrency: privacyFormatCurrency }
    );

    expect(screen.getByText('Kamu masih di jalur aman, pengeluaran Rp ●●●●●● di bawah pace ideal Rp ●●●●●● untuk tanggal ini.')).toBeInTheDocument();
  });
});
