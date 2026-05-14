interface SourceBadgeProps {
  source: 'terra' | 'manual' | 'planned';
  label?: string;
  syncedMin?: number;
}

export function SourceBadge({ source, label, syncedMin }: SourceBadgeProps) {
  const dotColor =
    source === 'terra' ? '#10B981' :
    source === 'planned' ? '#F59E0B' : '#A1A1A6';

  const text = label ?? (
    source === 'terra'
      ? `Apple Health${syncedMin !== undefined ? ` · ${syncedMin < 60 ? `${syncedMin}m ago` : `${Math.round(syncedMin / 60)}h ago`}` : ''}`
      : source === 'planned'
      ? 'Planned'
      : 'Manual'
  );

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-secondary">
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: dotColor }}
      />
      {text}
    </span>
  );
}
