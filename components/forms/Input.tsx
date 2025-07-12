
import React from 'react';

// Common non-functional props (layout, labels, errors, basic HTML attributes)
interface CommonHtmlAttributes {
  name?: string;
  className?: string; // For custom styling of the input/textarea element itself
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

interface CommonWrapperProps {
  label?: string;
  id: string; // id is always required and string for the input/textarea element
  error?: string;
  containerClassName?: string; // For styling the div wrapper
  helperText?: string; // New helperText prop
}

// Specific HTML attributes for <input>, excluding those managed by CommonHtmlAttributes or variant-specific props
type HtmlInputOnlyAttributes = Omit<React.InputHTMLAttributes<HTMLInputElement>,
  keyof CommonHtmlAttributes | 'id' | 'value' | 'onChange' | 'type'
>;

// Specific HTML attributes for <textarea>, excluding those managed by CommonHtmlAttributes or variant-specific props
type HtmlTextareaOnlyAttributes = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  keyof CommonHtmlAttributes | 'id' | 'value' | 'onChange' | 'type' | 'rows'
>;

interface StandardInputProps extends CommonWrapperProps, CommonHtmlAttributes, HtmlInputOnlyAttributes {
  type?: Exclude<React.HTMLInputTypeAttribute, 'textarea'>;
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

interface TextareaInputProps extends CommonWrapperProps, CommonHtmlAttributes, HtmlTextareaOnlyAttributes {
  type: 'textarea';
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  rows?: number;
}

export type InputProps = StandardInputProps | TextareaInputProps;

const Input: React.FC<InputProps> = (props) => {
  const commonInputStyles = `block w-full px-3 py-2 border bg-white rounded-md shadow-sm
  text-sm text-brand-text-primary placeholder-brand-neutral-400
  focus:outline-none focus:ring-2 focus:ring-brand-primary-light focus:border-brand-primary-light`;

  if (props.type === 'textarea') {
    // Explicitly cast props for this branch then destructure
    const textareaProps = props as TextareaInputProps;
    const {
        id, label, error, containerClassName, helperText,
        className: inputClassName = '',
        name, placeholder, disabled, style,
        value,
        onChange,
        rows,
        type: _type_discriminant, // to exclude 'type' from rest
        ...restHtmlTextareaAttrs
    } = textareaProps;

    const finalClassName = `${commonInputStyles} ${error ? 'border-brand-error' : 'border-brand-neutral-300'} ${inputClassName}`;

    return (
      <div className={`mb-4 ${containerClassName || ''}`}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-brand-text-secondary mb-1">
            {label}
          </label>
        )}
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={finalClassName}
          placeholder={placeholder}
          disabled={disabled}
          style={style}
          rows={rows}
          {...restHtmlTextareaAttrs}
        />
        {helperText && !error && <p className="mt-1 text-xs text-brand-text-muted">{helperText}</p>}
        {error && <p className="mt-1 text-xs text-brand-error">{error}</p>}
      </div>
    );
  } else {
    // Explicitly cast props for this branch then destructure
    const standardInputProps = props as StandardInputProps;
    const {
        id, label, error, containerClassName, helperText,
        className: inputClassName = '',
        name, placeholder, disabled, style,
        value,
        onChange,
        type,
        ...restHtmlInputAttrs
    } = standardInputProps;

    const finalClassName = `${commonInputStyles} ${error ? 'border-brand-error' : 'border-brand-neutral-300'} ${inputClassName}`;

    return (
      <div className={`mb-4 ${containerClassName || ''}`}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-brand-text-secondary mb-1">
            {label}
          </label>
        )}
        <input
          id={id}
          type={type || 'text'}
          name={name}
          value={value}
          onChange={onChange}
          className={finalClassName}
          placeholder={placeholder}
          disabled={disabled}
          style={style}
          {...restHtmlInputAttrs}
        />
        {helperText && !error && <p className="mt-1 text-xs text-brand-text-muted">{helperText}</p>}
        {error && <p className="mt-1 text-xs text-brand-error">{error}</p>}
      </div>
    );
  }
};

export default Input;
