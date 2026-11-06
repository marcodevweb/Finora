import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface Option {
  value: string;
  label: string;
  className?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isDark } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3.5 text-sm rounded-xl flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#ff682c] transition-all ${
          isDark ? 'bg-[#242424] border border-[#333] text-white' : 'bg-white border border-[#e8e8e8] text-[#202020]'
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-[#828282] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 top-full left-0 mt-1 w-full rounded-xl shadow-xl border overflow-hidden py-1 max-h-60 overflow-y-auto ${
          isDark ? 'bg-[#1e1e1e] border-[#333] text-white' : 'bg-white border border-[#e8e8e8] text-[#202020]'
        }`}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                  option.className || ''
                } ${
                  isSelected
                    ? 'bg-[#ff682c]/10 text-[#ff682c] font-medium'
                    : isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-[#f8f8f8]'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-[#ff682c]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
