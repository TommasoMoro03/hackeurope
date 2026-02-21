import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  isLoading,
  disabled,
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles = 'px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-glow',
    secondary: 'bg-slate-600 text-white hover:bg-slate-700',
    outline: 'border border-white/20 text-slate-300 hover:bg-white/5 hover:border-primary/50',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};
