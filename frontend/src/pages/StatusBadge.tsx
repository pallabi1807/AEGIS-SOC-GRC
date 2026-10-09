import type { ReactNode } from 'react';

interface StatusBadgeProps {
  value: string;
  className?: string;
  children?: ReactNode;
}

export default function StatusBadge({
  value,
  className = '',
  children,
}: StatusBadgeProps) {
  const tone = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  return (
    <span className={`table-badge ${tone} ${className}`.trim()}>
      {children ?? value}
    </span>
  );
}