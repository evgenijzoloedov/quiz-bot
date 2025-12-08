import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, checked, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <label 
        htmlFor={checkboxId}
        className={cn(
          'inline-flex items-center gap-2 cursor-pointer select-none',
          'relative',
          className
        )}
        onClick={(e) => {
          // Prevent event bubbling to parent containers
          e.stopPropagation();
        }}
      >
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <div className={cn(
            'w-5 h-5 rounded border-2 transition-all duration-200',
            'flex items-center justify-center',
            checked 
              ? 'bg-accent-500 border-accent-500' 
              : 'bg-transparent border-[#3a3a4a] peer-hover:border-[#4a4a5a]'
          )}>
            {checked && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>
        {label && (
          <span className="text-sm text-[#f0f0f5]">{label}</span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

