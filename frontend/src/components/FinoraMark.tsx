import React from 'react';

export const FinoraMark: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
    />
  </svg>
);
