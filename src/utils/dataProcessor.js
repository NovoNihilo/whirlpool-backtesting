// utils/dataProcessor.js
/**
 * Parse CSV data into a JavaScript array of objects
 * @param {string} csvText - The raw CSV text
 * @returns {Array} - Array of objects with date and price properties
 */
export const parseCSV = (csvText) => {
    if (!csvText) return [];
    
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        // Convert price to number
        if (header === 'price') {
          obj[header] = parseFloat(value);
        } else {
          obj[header] = value;
        }
      });
      
      return obj;
    });
  };
  
  /**
   * Filter price data by date range
   * @param {Array} data - Array of price data objects
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Array} - Filtered array
   */
  export const filterDataByDateRange = (data, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return data.filter(item => {
      const date = new Date(item.date);
      return date >= start && date <= end;
    });
  };
  
  /**
   * Format price data for the chart
   * @param {Array} data - Array of price data objects
   * @returns {Array} - Formatted data for the chart
   */
  export const formatChartData = (data) => {
    return data.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      price: item.price,
    }));
  };
  
  // utils/calculator.js
  /**
   * Calculate performance for 100% asset strategy
   * @param {Array} priceData - Array of price data objects
   * @param {number} initialInvestment - Initial investment amount
   * @returns {Array} - Performance data
   */
  export const calculateFullAssetPerformance = (priceData, initialInvestment) => {
    if (!priceData.length || !initialInvestment) return [];
    
    const initialPrice = priceData[0].price;
    const assetAmount = initialInvestment / initialPrice;
    
    return priceData.map(day => ({
      date: new Date(day.date).toLocaleDateString(),
      strategy1: assetAmount * day.price,
    }));
  };
  
  /**
   * Calculate performance for 50/50 asset/USDC strategy without rebalancing
   * @param {Array} priceData - Array of price data objects
   * @param {number} initialInvestment - Initial investment amount
   * @param {number} assetYieldPercent - Annual yield percentage for the asset
   * @param {number} usdcYieldPercent - Annual yield percentage for USDC
   * @returns {Array} - Performance data
   */
  export const calculate5050Performance = (priceData, initialInvestment, assetYieldPercent, usdcYieldPercent) => {
    if (!priceData.length || !initialInvestment) return [];
    
    const initialPrice = priceData[0].price;
    const halfInvestment = initialInvestment / 2;
    const initialAssetAmount = halfInvestment / initialPrice;
    let usdcValue = halfInvestment;
    
    // Daily yield rates (compounded)
    const dailyAssetYield = Math.pow(1 + assetYieldPercent / 100, 1/365) - 1;
    const dailyUsdcYield = Math.pow(1 + usdcYieldPercent / 100, 1/365) - 1;
    
    let assetAmount = initialAssetAmount;
    
    return priceData.map((day, index) => {
      if (index > 0) {
        // Apply daily yield
        assetAmount *= (1 + dailyAssetYield);
        usdcValue *= (1 + dailyUsdcYield);
      }
      
      const assetValue = assetAmount * day.price;
      const totalValue = assetValue + usdcValue;
      
      return {
        date: new Date(day.date).toLocaleDateString(),
        strategy2: totalValue,
      };
    });
  };
  
  /**
   * Calculate performance for 50/50 asset/USDC strategy with daily rebalancing
   * @param {Array} priceData - Array of price data objects
   * @param {number} initialInvestment - Initial investment amount
   * @param {number} assetYieldPercent - Annual yield percentage for the asset
   * @param {number} usdcYieldPercent - Annual yield percentage for USDC
   * @returns {Array} - Performance data
   */
  export const calculateRebalancedPerformance = (priceData, initialInvestment, assetYieldPercent, usdcYieldPercent) => {
    if (!priceData.length || !initialInvestment) return [];
    
    const initialPrice = priceData[0].price;
    let totalValue = initialInvestment;
    
    // Daily yield rates (compounded)
    const dailyAssetYield = Math.pow(1 + assetYieldPercent / 100, 1/365) - 1;
    const dailyUsdcYield = Math.pow(1 + usdcYieldPercent / 100, 1/365) - 1;
    
    return priceData.map((day, index) => {
      if (index > 0) {
        // Get yesterday's allocation
        const prevDay = priceData[index - 1];
        const prevPrice = prevDay.price;
        const prevHalfValue = totalValue / 2;
        
        // Calculate asset amount and USDC amount from yesterday
        const assetAmount = prevHalfValue / prevPrice;
        const usdcAmount = prevHalfValue;
        
        // Apply daily yields
        const assetValue = (assetAmount * day.price) * (1 + dailyAssetYield);
        const usdcValue = usdcAmount * (1 + dailyUsdcYield);
        
        // Update total value before rebalancing
        totalValue = assetValue + usdcValue;
      }
      
      return {
        date: new Date(day.date).toLocaleDateString(),
        strategy3: totalValue,
      };
    });
  };
  
  /**
   * Combine performance data from different strategies
   * @param {Array} strategy1Data - 100% asset strategy data
   * @param {Array} strategy2Data - 50/50 without rebalancing data
   * @param {Array} strategy3Data - 50/50 with rebalancing data
   * @returns {Array} - Combined performance data
   */
  export const combinePerformanceData = (strategy1Data, strategy2Data, strategy3Data) => {
    if (!strategy1Data.length) return [];
    
    return strategy1Data.map((item, index) => ({
      date: item.date,
      strategy1: item.strategy1,
      strategy2: strategy2Data[index]?.strategy2 || 0,
      strategy3: strategy3Data[index]?.strategy3 || 0,
    }));
  };
  
  /**
   * Generate summary statistics
   * @param {Array} performanceData - Combined performance data
   * @returns {Object} - Summary statistics
   */
  export const generateSummaryStats = (performanceData) => {
    if (!performanceData.length) return {};
    
    const firstDay = performanceData[0];
    const lastDay = performanceData[performanceData.length - 1];
    
    const initialValue = firstDay.strategy1; // All strategies start with the same value
    
    const strategy1Final = lastDay.strategy1;
    const strategy2Final = lastDay.strategy2;
    const strategy3Final = lastDay.strategy3;
    
    const strategy1Return = ((strategy1Final / initialValue) - 1) * 100;
    const strategy2Return = ((strategy2Final / initialValue) - 1) * 100;
    const strategy3Return = ((strategy3Final / initialValue) - 1) * 100;
    
    // Calculate volatility (standard deviation of daily returns)
    const calculateVolatility = (strategyKey) => {
      const dailyReturns = [];
      
      for (let i = 1; i < performanceData.length; i++) {
        const today = performanceData[i][strategyKey];
        const yesterday = performanceData[i-1][strategyKey];
        const dailyReturn = (today / yesterday) - 1;
        dailyReturns.push(dailyReturn);
      }
      
      const mean = dailyReturns.reduce((sum, val) => sum + val, 0) / dailyReturns.length;
      const squaredDiffs = dailyReturns.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
      const stdDev = Math.sqrt(variance);
      
      // Annualize the standard deviation
      return stdDev * Math.sqrt(252) * 100; // 252 trading days in a year
    };
    
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
        strategy1: strategy1Return / (performanceData.length / 365),
        strategy2: strategy2Return / (performanceData.length / 365),
        strategy3: strategy3Return / (performanceData.length / 365),
      },
      volatility: {
        strategy1: calculateVolatility('strategy1'),
        strategy2: calculateVolatility('strategy2'),
        strategy3: calculateVolatility('strategy3'),
      },
    };
  };