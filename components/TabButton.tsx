import React from 'react';

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ label, active, onClick, icon }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2
        ${active 
          ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' 
          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
};

export default TabButton;