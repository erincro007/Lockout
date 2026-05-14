interface ProgressBarProps {
  value: number;
  max: number;
  height?: number;
  className?: string;
}

export function ProgressBar({ value, max, height = 8, className = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={`bg-divider rounded-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className="progress-fill rounded-full h-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
