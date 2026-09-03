import { createContext, useState, useEffect } from 'react';

export const PrivacyContext = createContext();

export const PrivacyProvider = ({ children }) => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(() => {
    const saved = localStorage.getItem('hideBalance');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('hideBalance', isBalanceHidden);
  }, [isBalanceHidden]);

  const togglePrivacy = () => {
    setIsBalanceHidden(prev => !prev);
  };

  const formatCurrency = (amount) => {
    if (isBalanceHidden) {
      return 'Rp ●●●●●●';
    }
    return `Rp ${Number(amount).toLocaleString('id-ID')}`;
  };

  return (
    <PrivacyContext.Provider value={{ isBalanceHidden, togglePrivacy, formatCurrency }}>
      {children}
    </PrivacyContext.Provider>
  );
};
