// src/components/RebalanceFrequency.js
import React from 'react';
import Tooltip from './Tooltip';

function RebalanceFrequency({ value, onChange }) {
  const frequencies = [
    { value: 1, label: 'Daily (Default)' },
    { value: 2, label: 'Every 12 hours' },
    { value: 4, label: 'Every 6 hours' },
    { value: 6, label: 'Every 4 hours' },
    { value: 8, label: 'Every 3 hours' },
    { value: 12, label: 'Every 2 hours' },
    { value: 24, label: 'Hourly' }
  ];

  return (
    <div className="form-group">
      <label htmlFor="rebalance-frequency">
        Rebalance Frequency:
        <Tooltip text="Rebalancing adjusts the portfolio back to target allocations (50/50) at the selected frequency. Higher frequency potentially increases the effect of volatility harvesting but may also increase transaction costs." />
      </label>
      <select
        id="rebalance-frequency"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      >
        {frequencies.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default RebalanceFrequency;