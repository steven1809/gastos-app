import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  ...props
}) => {
  return (
    <div className={`bg-white shadow-sm rounded-xl overflow-hidden ${className}`} {...props}>
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
