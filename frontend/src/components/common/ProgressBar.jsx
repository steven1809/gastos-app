import React from 'react';

const ProgressBar = ({
  percentage,
  color,
  animated = false,
  showLabel = false,
  height = 'h-2.5'
}) => {
  const getStatusColor = () => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage > 80) return 'bg-orange-500';
    if (percentage > 60) return 'bg-yellow-500';
    return color || 'bg-green-500';
  };

  const displayPercentage = Math.min(percentage, 100);
  const isOverflow = percentage > 100;

  return (
    <div className="relative">
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${getStatusColor()} rounded-full h-full transition-all duration-500 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${displayPercentage}%` }}
        ></div>
      </div>
      {isOverflow && (
        <div
          className="absolute top-0 left-0 bg-red-200 rounded-full opacity-30 h-full"
          style={{ width: '100%' }}
        ></div>
      )}
      {showLabel && (
        <p className="text-xs text-gray-600 mt-1 text-right">{percentage.toFixed(0)}%</p>
      )}
    </div>
  );
};

export default ProgressBar;
