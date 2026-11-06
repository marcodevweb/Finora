import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
}

const parseDateValue = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day, 12) : new Date();
};

const toDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const localDateValue = (date = new Date()) => toDateValue(date);

export const formatDateValue = (value: string, options: Intl.DateTimeFormatOptions = {}) =>
  new Intl.DateTimeFormat('pt-BR', options).format(parseDateValue(value));

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => parseDateValue(value));
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleMonth(parseDateValue(value));
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(visibleMonth);
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const dayCount = new Date(year, month + 1, 0).getDate();
  const selectedValue = value;
  const todayValue = localDateValue();
  const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const moveMonth = (amount: number) => {
    setVisibleMonth(new Date(year, month + amount, 1, 12));
  };

  return (
    <div className="relative w-full" ref={pickerRef}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Selecionar data: ${formatDateValue(value, { dateStyle: 'long' })}`}
        onClick={() => setIsOpen((open) => !open)}
        className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3.5 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff682c] ${
          isDark
            ? 'border-[#333] bg-[#242424] text-white hover:border-[#ff682c]/60'
            : 'border-[#e8e8e8] bg-white text-[#202020] hover:border-[#ff682c]/70'
        }`}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-[#ff682c]" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{formatDateValue(value, { dateStyle: 'long' })}</span>
        <ChevronRight className={`h-4 w-4 shrink-0 text-[#828282] transition-transform ${isOpen ? '-rotate-90' : 'rotate-90'}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Calendário para escolher a data"
          className={`absolute bottom-full left-0 z-[120] mb-2 w-[min(320px,calc(100vw-2rem))] rounded-2xl border p-4 shadow-xl ${
            isDark ? 'border-[#333] bg-[#1a1a1a] text-white' : 'border-[#e8e8e8] bg-white text-[#202020]'
          }`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className={`font-polysans text-base font-medium capitalize ${isDark ? 'text-white' : 'text-[#202020]'}`}>
              {monthLabel}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Mês anterior"
                onClick={() => moveMonth(-1)}
                className={`rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff682c] ${isDark ? 'text-[#c5c5c5] hover:bg-[#2a2a2a]' : 'text-[#4d4d4d] hover:bg-[#f5f5f5]'}`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Próximo mês"
                onClick={() => moveMonth(1)}
                className={`rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff682c] ${isDark ? 'text-[#c5c5c5] hover:bg-[#2a2a2a]' : 'text-[#4d4d4d] hover:bg-[#f5f5f5]'}`}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((weekday) => (
              <span key={weekday} className="py-2 text-xs font-medium text-[#828282]" aria-label={weekday}>
                {weekday}
              </span>
            ))}
            {Array.from({ length: startOffset }, (_, index) => (
              <span key={`empty-${index}`} aria-hidden="true" />
            ))}
            {Array.from({ length: dayCount }, (_, index) => {
              const day = index + 1;
              const dayValue = toDateValue(new Date(year, month, day, 12));
              const isSelected = dayValue === selectedValue;
              const isToday = dayValue === todayValue;

              return (
                <button
                  key={dayValue}
                  type="button"
                  aria-label={formatDateValue(dayValue, { dateStyle: 'full' })}
                  aria-pressed={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  onClick={() => {
                    onChange(dayValue);
                    setIsOpen(false);
                  }}
                  className={`aspect-square rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff682c] ${
                    isSelected
                      ? 'bg-[#ff682c] font-semibold text-white'
                      : isToday
                        ? `font-semibold text-[#ff682c] ring-1 ring-inset ring-[#ff682c]/60 ${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-[#fff3ed]'}`
                        : isDark
                          ? 'text-[#e5e5e5] hover:bg-[#2a2a2a]'
                          : 'text-[#202020] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
