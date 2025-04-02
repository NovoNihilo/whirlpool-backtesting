import React, { useState, useEffect } from 'react';
import DateRangePicker from '../components/DateRangePicker';
import InvestmentInput from '../components/InvestmentInput';
import RebalanceFrequency from '../components/RebalanceFrequency';
import PerformanceChart from '../components/PerformanceChart';
import { 
  parseHourlyCSV, 
  filterHourlyDataByDateRange,
  calculateFullAssetPerformanceHourly,
  calculate5050PerformanceHourly,
  calculateRebalancedPerformanceHourly,
  combineHourlyPerformanceData,
  generateHourlySummaryStats
} from '../utils/enhancedDataProcessor';

function EnhancedBitcoinTab() {
  // State for form inputs
  const [startDate, setStartDate] = useState('2021-01-01');
  const [endDate, setEndDate] = useState('2025-01-01');
  const [investment, setInvestment] = useState(10000);
  const [rebalanceFrequency, setRebalanceFrequency] = useState(1); // Default: daily
  
  // State for data handling
  const [hourlyData, setHourlyData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');
  
  // Strategy definitions
  const strategies = [
    { key: 'strategy1', name: '100% BTC' },
    { key: 'strategy2', name: '50% BTC (0.3% APY) / 50% USDC (7% APY)' },
    { key: 'strategy3', name: `50% BTC (0.3% APY) / 50% USDC (7% APY) + (${rebalanceFrequency > 1 ? rebalanceFrequency + 'x Daily' : 'Daily'} Rebalance)` }
  ];
  
  // Fetch hourly price data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/bitcoin_1hour_complete.csv');
        const text = await response.text();
        const data = parseHourlyCSV(text);
        setHourlyData(data);
      } catch (err) {
        console.error('Error fetching hourly Bitcoin data:', err);
        setError('Failed to load hourly Bitcoin price data. Please ensure the CSV file is in the correct location.');
      }
    };
    
    fetchData();
  }, []);
  
  // Update strategy name when rebalance frequency changes
  useEffect(() => {
    strategies[2].name = `50% BTC (0.3% APY) / 50% USDC (7% APY) + (${rebalanceFrequency > 1 ? rebalanceFrequency + 'x Daily' : 'Daily'} Rebalance)`;
  }, [rebalanceFrequency]);
  
  // Run calculations and visualize data
  const handleVisualize = () => {
    if (!hourlyData.length) {
      setError('No hourly price data available. Please check the CSV file.');
      return;
    }
    
    if (!investment) {
      setError('Please enter a valid investment amount.');
      return;
    }
    
    setIsCalculating(true);
    setError('');
    
    try {
      // Filter data by selected date range
      const filtered = filterHourlyDataByDateRange(hourlyData, startDate, endDate);
      setFilteredData(filtered);
      
      if (filtered.length === 0) {
        setError('No data available for the selected date range.');
        setIsCalculating(false);
        return;
      }
      
      // Calculate performance for each strategy
      const strategy1Data = calculateFullAssetPerformanceHourly(filtered, investment);
      const strategy2Data = calculate5050PerformanceHourly(filtered, investment, 0.3, 7); // Bitcoin gets 0.3% APY, USDC gets 7% APY
      const strategy3Data = calculateRebalancedPerformanceHourly(filtered, investment, 0.3, 7, rebalanceFrequency);
      
      // Combine all performance data and resample to daily for the chart
      const combined = combineHourlyPerformanceData(strategy1Data, strategy2Data, strategy3Data, true);
      setPerformanceData(combined);
      
      // Generate summary statistics from hourly data (don't resample for stats)
      const hourlyPerformance = combineHourlyPerformanceData(strategy1Data, strategy2Data, strategy3Data, false);
      const stats = generateHourlySummaryStats(hourlyPerformance);
      setSummaryStats(stats);
    } catch (err) {
      console.error('Error calculating performance:', err);
      setError('An error occurred while calculating performance data.');
    } finally {
      setIsCalculating(false);
    }
  };
  
  return (
    <div className="tab-content">
      <h2>Bitcoin Basket Performance (Hourly Data)</h2>
      
      <div className="control-panel">
        <DateRangePicker 
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
        
        <InvestmentInput 
          value={investment}
          onChange={setInvestment}
        />
        
        <RebalanceFrequency
          value={rebalanceFrequency}
          onChange={setRebalanceFrequency}
        />
        
        <button 
          onClick={handleVisualize} 
          disabled={isCalculating}
        >
          {isCalculating ? 'Calculating...' : 'Visualize'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {performanceData.length > 0 && (
        <>
          <PerformanceChart 
            data={performanceData}
            strategies={strategies}
          />
          
          {summaryStats && (
            <div className="results-summary">
              <h3>Performance Summary</h3>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Strategy</th>
                    <th>Initial Value</th>
                    <th>Final Value</th>
                    <th>Total Return</th>
                    <th>Annualized Return</th>
                    <th>Volatility</th>
                    <th>Max Drawdown</th>
                    <th>Sharpe Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>100% Bitcoin</td>
                    <td>${summaryStats.initialValue.toFixed(2)}</td>
                    <td>${summaryStats.finalValues.strategy1.toFixed(2)}</td>
                    <td>{summaryStats.totalReturns.strategy1.toFixed(2)}%</td>
                    <td>{summaryStats.annualizedReturns.strategy1.toFixed(2)}%</td>
                    <td>{summaryStats.volatility.strategy1.toFixed(2)}%</td>
                    <td>{summaryStats.maxDrawdown.strategy1.toFixed(2)}%</td>
                    <td>{summaryStats.sharpeRatio.strategy1.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>50/50 No Rebalance</td>
                    <td>${summaryStats.initialValue.toFixed(2)}</td>
                    <td>${summaryStats.finalValues.strategy2.toFixed(2)}</td>
                    <td>{summaryStats.totalReturns.strategy2.toFixed(2)}%</td>
                    <td>{summaryStats.annualizedReturns.strategy2.toFixed(2)}%</td>
                    <td>{summaryStats.volatility.strategy2.toFixed(2)}%</td>
                    <td>{summaryStats.maxDrawdown.strategy2.toFixed(2)}%</td>
                    <td>{summaryStats.sharpeRatio.strategy2.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>{rebalanceFrequency > 1 ? `50/50 ${rebalanceFrequency}x Daily Rebalance` : '50/50 Daily Rebalance'}</td>
                    <td>${summaryStats.initialValue.toFixed(2)}</td>
                    <td>${summaryStats.finalValues.strategy3.toFixed(2)}</td>
                    <td>{summaryStats.totalReturns.strategy3.toFixed(2)}%</td>
                    <td>{summaryStats.annualizedReturns.strategy3.toFixed(2)}%</td>
                    <td>{summaryStats.volatility.strategy3.toFixed(2)}%</td>
                    <td>{summaryStats.maxDrawdown.strategy3.toFixed(2)}%</td>
                    <td>{summaryStats.sharpeRatio.strategy3.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EnhancedBitcoinTab;