import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 100, showLabel = false, className = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-[11px] text-text-tertiary tabular-nums">
          {pct}%
        </span>
      )}
    </div>
  );
}
