import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, type = 'button', variant = 'primary', loading = false, disabled = false, className = '' }) => {
  const baseStyles = 'px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/10 dark:shadow-primary-900/20',
    secondary: 'bg-primary-500/10 dark:bg-white/10 hover:bg-primary-500/20 dark:hover:bg-white/20 text-primary-700 dark:text-white border border-primary-500/20 dark:border-white/20',
    outline: 'bg-transparent hover:bg-primary-500/5 dark:hover:bg-white/5 text-primary-600 dark:text-white border border-primary-500/30 dark:border-white/30',
    ghost: 'bg-transparent hover:bg-primary-500/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-primary-700 dark:hover:text-white',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </motion.button>
  );
};

export default Button;
