import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function PerformanceChart({ data, strategies }) {
  // Generate a unique color for each strategy
  const colors = ['#8884d8', '#82ca9d', '#ffc658'];
  
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => ['$' + value.toFixed(2), 'Value']} />
          <Legend />
          {strategies.map((strategy, index) => (
            <Line 
              key={strategy.name}
              type="monotone"
              dataKey={strategy.key}
              name={strategy.name}
              stroke={colors[index % colors.length]}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PerformanceChart;