import React from 'react';

const CurrencyInput = ({ value, onChange, className, ...props }) => {
  // Format the display value
  const displayValue = value ? Number(value).toLocaleString('id-ID') : '';

  const handleChange = (e) => {
    // Remove all non-digit characters
    const rawValue = e.target.value.replace(/\D/g, '');
    
    // Call the original onChange with the raw numeric string
    onChange({
      ...e,
      target: {
        ...e.target,
        name: e.target.name,
        value: rawValue
      }
    });
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  );
};

export default CurrencyInput;
