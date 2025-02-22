import React from 'react';

function InvestmentInput({ value, onChange }) {
  const handleChange = (e) => {
    // Remove non-numeric characters and convert to number
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    onChange(numericValue ? parseInt(numericValue, 10) : '');
  };

  return (
    <div className="form-group">
      <label htmlFor="investment-amount">Initial Investment ($):</label>
      <input
        type="text"
        id="investment-amount"
        value={value}
        onChange={handleChange}
        placeholder="Enter amount in USD"
      />
    </div>
  );
}

export default InvestmentInput;