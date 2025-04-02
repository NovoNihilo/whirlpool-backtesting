// src/utils/enhancedDataProcessor.js

/**
 * Parse hourly price data CSV
 * @param {string} csvText - The raw CSV text
 * @returns {Array} - Array of objects with datetime and price properties
 */
export const parseHourlyCSV = (csvText) => {
  if (!csvText) return [];
  
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    
    headers.forEach((header, index) => {
      const value = values[index];
      // Convert numeric values to numbers
      if (['open', 'high', 'low', 'close', 'volume'].includes(header)) {
        obj[header] = parseFloat(value);
      } else {
        obj[header] = value;
      }
    });
    
    return obj;
  });
};

/**
 * Filter hourly price data by date range
 * @param {Array} data - Array of hourly price data objects
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} - Filtered array
 */
export const filterHourlyDataByDateRange = (data, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return data.filter(item => {
    const date = new Date(item.datetime);
    return date >= start && date <= end;
  });
};

/**
 * Extract close price from hourly data and format for calculations
 * @param {Array} hourlyData - Array of hourly price data objects
 * @returns {Array} - Formatted data with date and price
 */
export const formatHourlyDataForCalculations = (hourlyData) => {
  return hourlyData.map(item => ({
    date: new Date(item.datetime),
    price: item.close, // Use close price
  }));
};

/**
 * Group hourly data into daily candles (for display purposes)
 * @param {Array} hourlyData - Array of hourly price data objects
 * @returns {Array} - Daily price data
 */
export const groupHourlyToDaily = (hourlyData) => {
  const dailyMap = new Map();
  
  hourlyData.forEach(item => {
    const date = new Date(item.datetime);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      });
    } else {
      const existing = dailyMap.get(dateKey);
      existing.high = Math.max(existing.high, item.high);
      existing.low = Math.min(existing.low, item.low);
      existing.close = item.close; // Last hour's close becomes daily close
      existing.volume += item.volume;
    }
  });
  
  return Array.from(dailyMap.values());
};

/**
 * Calculate performance for 100% asset strategy with hourly data
 * @param {Array} hourlyData - Array of hourly price data objects
 * @param {number} initialInvestment - Initial investment amount
 * @returns {Array} - Performance data
 */
export const calculateFullAssetPerformanceHourly = (hourlyData, initialInvestment) => {
  if (!hourlyData.length || !initialInvestment) return [];
  
  const initialPrice = hourlyData[0].close;
  const assetAmount = initialInvestment / initialPrice;
  
  return hourlyData.map(hour => ({
    date: new Date(hour.datetime),
    strategy1: assetAmount * hour.close,
  }));
};

/**
 * Calculate performance for 50/50 asset/USDC strategy without rebalancing - hourly version
 * @param {Array} hourlyData - Array of hourly price data objects
 * @param {number} initialInvestment - Initial investment amount
 * @param {number} assetYieldPercent - Annual yield percentage for the asset
 * @param {number} usdcYieldPercent - Annual yield percentage for USDC
 * @returns {Array} - Performance data
 */
export const calculate5050PerformanceHourly = (hourlyData, initialInvestment, assetYieldPercent, usdcYieldPercent) => {
  if (!hourlyData.length || !initialInvestment) return [];
  
  const initialPrice = hourlyData[0].close;
  const halfInvestment = initialInvestment / 2;
  const initialAssetAmount = halfInvestment / initialPrice;
  let usdcValue = halfInvestment;
  
  // Hourly yield rates (compounded)
  const hourlyAssetYield = Math.pow(1 + assetYieldPercent / 100, 1/(365 * 24)) - 1;
  const hourlyUsdcYield = Math.pow(1 + usdcYieldPercent / 100, 1/(365 * 24)) - 1;
  
  let assetAmount = initialAssetAmount;
  
  return hourlyData.map((hour, index) => {
    if (index > 0) {
      // Apply hourly yield
      assetAmount *= (1 + hourlyAssetYield);
      usdcValue *= (1 + hourlyUsdcYield);
    }
    
    const assetValue = assetAmount * hour.close;
    const totalValue = assetValue + usdcValue;
    
    return {
      date: new Date(hour.datetime),
      strategy2: totalValue,
    };
  });
};

/**
 * Calculate performance for 50/50 asset/USDC strategy with variable rebalancing frequency
 * @param {Array} hourlyData - Array of hourly price data objects
 * @param {number} initialInvestment - Initial investment amount
 * @param {number} assetYieldPercent - Annual yield percentage for the asset
 * @param {number} usdcYieldPercent - Annual yield percentage for USDC
 * @param {number} rebalanceFrequency - Number of rebalances per day (1-24)
 * @returns {Array} - Performance data
 */
export const calculateRebalancedPerformanceHourly = (hourlyData, initialInvestment, assetYieldPercent, usdcYieldPercent, rebalanceFrequency) => {
  if (!hourlyData.length || !initialInvestment) return [];
  
  // Validate rebalance frequency (default to daily if invalid)
  const frequency = rebalanceFrequency >= 1 && rebalanceFrequency <= 24 ? rebalanceFrequency : 1;
  
  // Determine how many hours between each rebalance
  const hoursBetweenRebalances = 24 / frequency;
  
  const initialPrice = hourlyData[0].close;
  let totalValue = initialInvestment;
  
  // Hourly yield rates (compounded)
  const hourlyAssetYield = Math.pow(1 + assetYieldPercent / 100, 1/(365 * 24)) - 1;
  const hourlyUsdcYield = Math.pow(1 + usdcYieldPercent / 100, 1/(365 * 24)) - 1;
  
  let assetValue = totalValue / 2;
  let usdcValue = totalValue / 2;
  let lastRebalanceHour = 0;
  
  return hourlyData.map((hour, index) => {
    if (index > 0) {
      // Calculate asset amount and USDC amount from previous hour
      const prevHour = hourlyData[index - 1];
      const prevPrice = prevHour.close;
      
      const assetAmount = assetValue / prevPrice;
      
      // Apply hourly yields
      const updatedAssetValue = (assetAmount * hour.close) * (1 + hourlyAssetYield);
      const updatedUsdcValue = usdcValue * (1 + hourlyUsdcYield);
      
      // Update values
      assetValue = updatedAssetValue;
      usdcValue = updatedUsdcValue;
      totalValue = assetValue + usdcValue;
      
      // Check if it's time to rebalance
      if (frequency > 1) {
        const hourOfDay = new Date(hour.datetime).getHours();
        const shouldRebalance = hourOfDay % hoursBetweenRebalances === 0 && hourOfDay !== lastRebalanceHour;
        
        if (shouldRebalance) {
          // Rebalance to 50/50
          const halfValue = totalValue / 2;
          assetValue = halfValue;
          usdcValue = halfValue;
          lastRebalanceHour = hourOfDay;
        }
      } else if (index % 24 === 0) {
        // Daily rebalance (at midnight)
        const halfValue = totalValue / 2;
        assetValue = halfValue;
        usdcValue = halfValue;
      }
    }
    
    return {
      date: new Date(hour.datetime),
      strategy3: totalValue,
    };
  });
};

/**
 * Combine hourly performance data and optionally resample to daily
 * @param {Array} strategy1Data - 100% asset strategy data
 * @param {Array} strategy2Data - 50/50 without rebalancing data
 * @param {Array} strategy3Data - 50/50 with rebalancing data
 * @param {boolean} resampleToDaily - Whether to resample to daily data
 * @returns {Array} - Combined performance data
 */
export const combineHourlyPerformanceData = (strategy1Data, strategy2Data, strategy3Data, resampleToDaily = true) => {
  if (!strategy1Data.length) return [];
  
  // Combine hourly data
  const hourlyData = strategy1Data.map((item, index) => ({
    date: item.date,
    strategy1: item.strategy1,
    strategy2: strategy2Data[index]?.strategy2 || 0,
    strategy3: strategy3Data[index]?.strategy3 || 0,
  }));
  
  if (!resampleToDaily) {
    return hourlyData;
  }
  
  // Resample to daily for chart display
  const dailyMap = new Map();
  
  hourlyData.forEach(item => {
    const dateStr = item.date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, {
        date: dateStr,
        strategy1: item.strategy1,
        strategy2: item.strategy2,
        strategy3: item.strategy3,
      });
    } else {
      // Use the last hour's values for the day
      const entry = dailyMap.get(dateStr);
      entry.strategy1 = item.strategy1;
      entry.strategy2 = item.strategy2;
      entry.strategy3 = item.strategy3;
    }
  });
  
  return Array.from(dailyMap.values());
};

/**
 * Generate summary statistics from hourly data
 * @param {Array} hourlyPerformanceData - Hourly performance data
 * @returns {Object} - Summary statistics
 */
export const generateHourlySummaryStats = (hourlyPerformanceData) => {
  if (!hourlyPerformanceData.length) return {};
  
  // Use the initial hour and final hour for calculations
  const firstHour = hourlyPerformanceData[0];
  const lastHour = hourlyPerformanceData[hourlyPerformanceData.length - 1];
  
  const initialValue = firstHour.strategy1; // All strategies start with the same value
  
  const strategy1Final = lastHour.strategy1;
  const strategy2Final = lastHour.strategy2;
  const strategy3Final = lastHour.strategy3;
  
  const strategy1Return = ((strategy1Final / initialValue) - 1) * 100;
  const strategy2Return = ((strategy2Final / initialValue) - 1) * 100;
  const strategy3Return = ((strategy3Final / initialValue) - 1) * 100;
  
  // Calculate volatility (standard deviation of hourly returns)
  const calculateVolatility = (strategyKey) => {
    const hourlyReturns = [];
    
    for (let i = 1; i < hourlyPerformanceData.length; i++) {
      const current = hourlyPerformanceData[i][strategyKey];
      const previous = hourlyPerformanceData[i-1][strategyKey];
      const hourlyReturn = (current / previous) - 1;
      hourlyReturns.push(hourlyReturn);
    }
    
    const mean = hourlyReturns.reduce((sum, val) => sum + val, 0) / hourlyReturns.length;
    const squaredDiffs = hourlyReturns.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(variance);
    
    // Annualize the standard deviation (sqrt of hours in a year)
    return stdDev * Math.sqrt(365 * 24) * 100;
  };
  
  // Calculate drawdown
  const calculateMaxDrawdown = (strategyKey) => {
    let peak = hourlyPerformanceData[0][strategyKey];
    let maxDrawdown = 0;
    
    hourlyPerformanceData.forEach(hour => {
      const value = hour[strategyKey];
      
      // Update peak if new high
      if (value > peak) {
        peak = value;
      }
      
      // Calculate current drawdown
      const drawdown = (peak - value) / peak;
      
      // Update max drawdown if current is larger
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });
    
    return maxDrawdown * 100; // Convert to percentage
  };
  
  // Calculate Sharpe ratio (using risk-free rate of 2%)
  const calculateSharpe = (strategyKey) => {
    const hourlyReturns = [];
    
    for (let i = 1; i < hourlyPerformanceData.length; i++) {
      const current = hourlyPerformanceData[i][strategyKey];
      const previous = hourlyPerformanceData[i-1][strategyKey];
      const hourlyReturn = (current / previous) - 1;
      hourlyReturns.push(hourlyReturn);
    }
    
    const mean = hourlyReturns.reduce((sum, val) => sum + val, 0) / hourlyReturns.length;
    const annualizedReturn = (Math.pow(1 + mean, 365 * 24) - 1) * 100;
    
    const squaredDiffs = hourlyReturns.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(variance);
    
    const annualizedStdDev = stdDev * Math.sqrt(365 * 24) * 100;
    const riskFreeRate = 2; // 2% annual risk-free rate
    
    return (annualizedReturn - riskFreeRate) / annualizedStdDev;
  };
  
  // Calculate duration in years
  const durationInYears = hourlyPerformanceData.length / (365 * 24);
  
  return {
    initialValue,
    finalValues: {
      strategy1: strategy1Final,
      strategy2: strategy2Final,
      strategy3: strategy3Final,
    },
    totalReturns: {
      strategy1: strategy1Return,
      strategy2: strategy2Return,
      strategy3: strategy3Return,
    },
    annualizedReturns: {
      strategy1: strategy1Return / durationInYears,
      strategy2: strategy2Return / durationInYears,
      strategy3: strategy3Return / durationInYears,
    },
    volatility: {
      strategy1: calculateVolatility('strategy1'),
      strategy2: calculateVolatility('strategy2'),
      strategy3: calculateVolatility('strategy3'),
    },
    maxDrawdown: {
      strategy1: calculateMaxDrawdown('strategy1'),
      strategy2: calculateMaxDrawdown('strategy2'),
      strategy3: calculateMaxDrawdown('strategy3'),
    },
    sharpeRatio: {
      strategy1: calculateSharpe('strategy1'),
      strategy2: calculateSharpe('strategy2'),
      strategy3: calculateSharpe('strategy3'),
    }
  };
};