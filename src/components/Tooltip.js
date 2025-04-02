import React from 'react';

function Tooltip({ text }) {
  return (
    <div className="tooltip">
      <div className="tooltip-icon">i</div>
      <div className="tooltip-text">{text}</div>
    </div>
  );
}

export default Tooltip;