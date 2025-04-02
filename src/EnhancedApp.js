import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import BitcoinTab from './pages/EnhancedBitcoinTab';
import EthereumTab from './pages/EnhancedEthereumTab';
import AvalancheTab from './pages/AvalancheTab';
import EnhancedBitcoinTab from './pages/EnhancedBitcoinTab';
import EnhancedEthereumTab from './pages/EnhancedEthereumTab';
import './App.css';

function EnhancedApp() {
  const [dataMode, setDataMode] = useState('enhanced'); // 'original' or 'enhanced'
  
  const toggleDataMode = () => {
    setDataMode(prevMode => prevMode === 'original' ? 'enhanced' : 'original');
  };
  
  return (
    <Router>
      <div className="app-container">
        <header>
          <h1>Whirlpool Backtesting Tool</h1>
          
          <div className="mode-toggle">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={dataMode === 'enhanced'} 
                onChange={toggleDataMode} 
              />
              <span className="slider round"></span>
            </label>
            <span className="toggle-label">
              {dataMode === 'enhanced' ? 'Hourly Data (Enhanced)' : 'Daily Data (Original)'}
            </span>
          </div>
          
          <nav>
            <ul className="tabs">
              <li>
                <Link to="/bitcoin" className="tab-link">Bitcoin Basket</Link>
              </li>
              <li>
                <Link to="/ethereum" className="tab-link">Ethereum Basket</Link>
              </li>
              <li>
                <Link to="/avalanche" className="tab-link">Avalanche Basket</Link>
              </li>
            </ul>
          </nav>
        </header>
        
        <main>
          <Routes>
            <Route path="/bitcoin" element={
              dataMode === 'enhanced' ? <EnhancedBitcoinTab /> : <BitcoinTab />
            } />
            <Route path="/ethereum" element={
              dataMode === 'enhanced' ? <EnhancedEthereumTab /> : <EthereumTab />
            } />
            <Route path="/avalanche" element={<AvalancheTab />} />
            <Route path="/" element={<Navigate to="/bitcoin" replace />} />
          </Routes>
        </main>
        
        <footer>
          <p>Whirlpool Backtesting Tool © 2025</p>
        </footer>
      </div>
    </Router>
  );
}

export default EnhancedApp;