
import React from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, isLoading = false, variant = 'primary', icon, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold text-sm flex items-center justify-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-teal-600 text-white hover:bg-teal-500 focus:ring-teal-500',
    secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};
