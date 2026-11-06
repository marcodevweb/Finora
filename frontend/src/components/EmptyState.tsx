import React from 'react';
import { FolderOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = FolderOpen,
  actionLabel,
  onAction,
}) => {
  const { isDark } = useTheme();

  return (
    <div className={`rounded-2xl p-12 text-center flex flex-col items-center justify-center transition-all duration-300 ${
      isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-white border border-[#e8e8e8]'
    }`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${
        isDark ? 'bg-[#242424] text-[#ff682c]' : 'bg-white text-[#ff682c]'
      }`}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className={`font-polysans text-xl font-medium mb-2 ${isDark ? 'text-white' : 'text-[#202020]'}`}>
        {title}
      </h3>
      <p className={`text-sm font-inter max-w-md mb-6 ${isDark ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-[#ff682c] text-white font-polysans text-sm py-3 px-6 rounded-xl hover:bg-[#e05620] transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
