import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-sans font-medium transition-all active:scale-[0.98]';

  const variants = {
    primary: 'bg-accent text-canvas hover:bg-accent-hover',
    ghost: 'bg-transparent text-text-secondary hover:text-accent hover:bg-surface-alt',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} rounded-[5px] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
