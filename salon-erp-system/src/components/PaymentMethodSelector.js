import React from 'react';

const PaymentMethodSelector = ({ value, onChange }) => {
  const methods = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'debit', label: 'Debit Card' },
    { value: 'mobile', label: 'Mobile Payment' },
    { value: 'voucher', label: 'Voucher' }
  ];

  return (
    <div className="payment-method-selector">
      <label>Payment Method:</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {methods.map(method => (
          <option key={method.value} value={method.value}>
            {method.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PaymentMethodSelector;