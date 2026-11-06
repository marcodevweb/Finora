import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { CustomSelect } from './CustomSelect';

interface MonthFilterProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  clearable?: boolean;
  className?: string;
}

export const MonthFilter: React.FC<MonthFilterProps> = ({
  value,
  onChange,
  label = 'Mês',
  clearable = true,
  className = '',
}) => {
  const { isDark } = useTheme();
  const options = useMemo(() => {
    const now = new Date();
    const availableMonths = [];

    if (clearable) availableMonths.push({ value: '', label: 'Todos os meses' });

    for (let offset = 0; offset < 120; offset += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
      availableMonths.push({
        value: monthValue,
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      });
    }

    return availableMonths;
  }, [clearable]);

  return (
    <div className={`w-full sm:w-52 ${className}`}>
      <span className={`mb-1.5 block text-xs font-inter ${isDark ? 'text-[#a0a0a0]' : 'text-[#828282]'}`}>
        {label}
      </span>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder="Selecione um mês"
      />
    </div>
  );
};
