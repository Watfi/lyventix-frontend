import React from 'react';

const Input = ({ label, type = 'text', placeholder, value, onChange, error, icon: Icon, className = '' }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-400 ml-1">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`
            w-full bg-white/70 dark:bg-white/5 border rounded-xl py-2.5 outline-none transition-all duration-200
            ${Icon ? 'pl-11' : 'pl-4'} pr-4
            ${error ? 'border-red-500/50 bg-red-500/5 focus:border-red-500' : 'border-primary-200/50 dark:border-white/10 focus:border-primary-500/50 focus:bg-white dark:focus:bg-white/[0.08] shadow-sm shadow-primary-900/5 dark:shadow-none'}
            placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-100
          `}
        />
      </div>
      {error && <span className="text-xs text-red-500 dark:text-red-400 ml-1">{error}</span>}
    </div>
  );
};

export default Input;
