import React from 'react';
import { CalendarDays, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MonthFilterProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  clearable?: boolean;
}

export const MonthFilter: React.FC<MonthFilterProps> = ({ value, onChange, label = 'Filtrar por mês', clearable = true }) => {
  const { isDark } = useTheme();
  const now = new Date();
  const maxMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="flex items-end gap-2">
      <label className="block min-w-0">
        <span className={`mb-1.5 block text-xs font-inter ${isDark ? 'text-[#a0a0a0]' : 'text-[#828282]'}`}>
          {label}
        </span>
        <span className="relative block">
          <CalendarDays aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#828282]" />
          <input
            type="month"
            value={value}
            min="2000-01"
            max={maxMonth}
            aria-label={label}
            onChange={(event) => onChange(event.target.value)}
            className={`w-full min-w-[180px] rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff682c] ${
              isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8] text-[#202020]'
            }`}
          />
        </span>
      </label>
      {value && clearable && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Mostrar todos os meses"
          title="Mostrar todos os meses"
          className={`mb-0.5 rounded-xl border p-3 transition-colors ${
            isDark ? 'border-[#333] text-[#a0a0a0] hover:bg-[#242424]' : 'border-[#e8e8e8] text-[#626262] hover:bg-[#f8f8f8]'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
