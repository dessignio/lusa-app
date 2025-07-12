
import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  id: string;
  options: SelectOption[];
  error?: string;
  containerClassName?: string;
  placeholderOption?: string; // e.g., "Select an option..."
}

const Select: React.FC<SelectProps> = ({ label, id, options, error, containerClassName = '', className = '', placeholderOption, ...props }) => {
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-brand-text-secondary mb-1">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`block w-full px-3 py-2 border rounded-md shadow-sm 
                    text-sm text-brand-text-primary bg-white
                    focus:outline-none focus:ring-2 focus:ring-brand-primary-light focus:border-brand-primary-light
                    ${error ? 'border-brand-error' : 'border-brand-neutral-300'}
                    ${className}`}
        {...props}
      >
        {placeholderOption && <option value="">{placeholderOption}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-brand-error">{error}</p>}
    </div>
  );
};

export default Select;