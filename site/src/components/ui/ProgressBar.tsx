
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
      <div className="h-2 flex-1 border-2 border-border overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-sm font-bold text-text-tertiary tabular-nums">
          {pct}%
        </span>
      )}
    </div>
  );
}
