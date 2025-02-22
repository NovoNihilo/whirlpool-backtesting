import React from 'react';

function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }) {
  // Convert dates to ISO format for input elements
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Validation function to ensure dates are within the allowed range
  const validateDate = (date, isStart) => {
    const minDate = new Date('2021-01-01');
    const maxDate = new Date('2025-01-01');
    const selectedDate = new Date(date);

    if (selectedDate < minDate) {
      return formatDateForInput(minDate);
    } else if (selectedDate > maxDate) {
      return formatDateForInput(maxDate);
    }

    // For end date, make sure it's not before start date
    if (!isStart && startDate && selectedDate < new Date(startDate)) {
      return startDate;
    }
    
    // For start date, make sure it's not after end date
    if (isStart && endDate && selectedDate > new Date(endDate)) {
      return endDate;
    }

    return date;
  };

  const handleStartDateChange = (e) => {
    const validatedDate = validateDate(e.target.value, true);
    onStartDateChange(validatedDate);
  };

  const handleEndDateChange = (e) => {
    const validatedDate = validateDate(e.target.value, false);
    onEndDateChange(validatedDate);
  };

  return (
    <div className="date-range-picker">
      <div className="form-group">
        <label htmlFor="start-date">Start Date:</label>
        <input 
          type="date" 
          id="start-date" 
          value={formatDateForInput(startDate)}
          onChange={handleStartDateChange}
          min="2021-01-01" 
          max="2025-01-01" 
        />
      </div>
      <div className="form-group">
        <label htmlFor="end-date">End Date:</label>
        <input 
          type="date" 
          id="end-date" 
          value={formatDateForInput(endDate)}
          onChange={handleEndDateChange}
          min="2021-01-01" 
          max="2025-01-01" 
        />
      </div>
    </div>
  );
}

export default DateRangePicker;