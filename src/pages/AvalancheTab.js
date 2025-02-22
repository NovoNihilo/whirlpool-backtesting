import React, { useState, useEffect } from 'react';
import DateRangePicker from '../components/DateRangePicker';
import InvestmentInput from '../components/InvestmentInput';
import PerformanceChart from '../components/PerformanceChart';
import { 
  parseCSV, 
  filterDataByDateRange,
  calculateFullAssetPerformance,
  calculate5050Performance,
  calculateRebalancedPerformance,
  combinePerformanceData,
  generateSummaryStats
} from '../utils/dataProcessor';

function AvalancheTab() {
  // State for form inputs
  const [startDate, setStartDate] = useState('2021-01-01');
  const [endDate, setEndDate] = useState('2025-01-01');
  const [investment, setInvestment] = useState(10000);
  
  // State for data handling
  const [priceData, setPriceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');
  
  // Strategy definitions
  const strategies = [
    { key: 'strategy1', name: '100% AVAX' },
    { key: 'strategy2', name: '50% sAVAX (6% APY) / 50% USDC (7% APY)' },
    { key: 'strategy3', name: '50% sAVAX (6% APY) / 50% USDC (7% APY) + (Daily Rebalance)' }
  ];
  
  // Fetch price data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/avalanche.csv');
        const text = await response.text();
        const data = parseCSV(text);
        setPriceData(data);
      } catch (err) {
        console.error('Error fetching Avalanche data:', err);
        setError('Failed to load Avalanche price data. Please ensure the CSV file is in the correct location.');
      }
    };
    
    fetchData();
  }, []);
  
  // Run calculations and visualize data
  const handleVisualize = () => {
    if (!priceData.length) {
      setError('No price data available. Please check the CSV file.');
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
      const filtered = filterDataByDateRange(priceData, startDate, endDate);
      setFilteredData(filtered);
      
      if (filtered.length === 0) {
        setError('No data available for the selected date range.');
        setIsCalculating(false);
        return;
      }
      
      // Calculate performance for each strategy
      const strategy1Data = calculateFullAssetPerformance(filtered, investment);
      const strategy2Data = calculate5050Performance(filtered, investment, 6, 7); // sAVAX gets 6% APY, USDC gets 7% APY
      const strategy3Data = calculateRebalancedPerformance(filtered, investment, 6, 7);
      
      // Combine all performance data
      const combined = combinePerformanceData(strategy1Data, strategy2Data, strategy3Data);
      setPerformanceData(combined);
      
      // Generate summary statistics
      const stats = generateSummaryStats(combined);
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
      <h2>Avalanche Basket Performance</h2>
      
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
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>100% Avalanche</td>
                    <td>${summaryStats.initialValue.toFixed(2)}</td>
                    <td>${summaryStats.finalValues.strategy1.toFixed(2)}</td>
                    <td>{summaryStats.totalReturns.strategy1.toFixed(2)}%</td>
                    <td>{summaryStats.annualizedReturns.strategy1.toFixed(2)}%</td>
                    <td>{summaryStats.volatility.strategy1.toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td>50/50 No Rebalance</td>
                    <td>${summaryStats.initialValue.toFixed(2)}</td>
                    <td>${summaryStats.finalValues.strategy2.toFixed(2)}</td>
                    <td>{summaryStats.totalReturns.strategy2.toFixed(2)}%</td>
                    <td>{summaryStats.annualizedReturns.strategy2.toFixed(2)}%</td>
                    <td>{summaryStats.volatility.strategy2.toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td>50/50 Daily Rebalance</td>
                    <td>${summaryStats.initialValue.toFixed(2)}</td>
                    <td>${summaryStats.finalValues.strategy3.toFixed(2)}</td>
                    <td>{summaryStats.totalReturns.strategy3.toFixed(2)}%</td>
                    <td>{summaryStats.annualizedReturns.strategy3.toFixed(2)}%</td>
                    <td>{summaryStats.volatility.strategy3.toFixed(2)}%</td>
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

export default AvalancheTab;