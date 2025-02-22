import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import BitcoinTab from './pages/BitcoinTab';
import EthereumTab from './pages/EthereumTab';
import AvalancheTab from './pages/AvalancheTab';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header>
          <h1>Whirlpool Backtesting Tool</h1>
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
            <Route path="/bitcoin" element={<BitcoinTab />} />
            <Route path="/ethereum" element={<EthereumTab />} />
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

export default App;