
import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, GridIcon } from './icons';

interface CardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  actions?: React.ReactNode; // For buttons like "Add Task" or "Clear Filters"
}

const Card: React.FC<CardProps> = ({ title, icon, children, className = '', collapsible = true, defaultCollapsed = false, actions }) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-brand-neutral-200">
        <div className="flex items-center space-x-2">
          {icon || <GridIcon className="text-brand-primary w-5 h-5" />}
          <h3 className="text-lg font-semibold text-brand-text-primary">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {actions}
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-brand-text-muted hover:text-brand-primary p-1 rounded-full"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
      {!isCollapsed && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default Card;
