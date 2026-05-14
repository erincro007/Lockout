import { useRef } from 'react';
import { SourceBadge } from '../../components/ui/SourceBadge';
import type { Day } from '../../lib/database.types';

interface SleepModuleProps {
  day: Day | null;
  onUpdateNote: (note: string) => void;
}

export function SleepModule({ day, onUpdateNote }: SleepModuleProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleNoteChange(val: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onUpdateNote(val), 800);
  }

  const hours = day?.sleep_hours ?? null;

  return (
    <div className="bg-bg border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Sleep</p>
          {hours !== null ? (
            <div className="font-display font-bold text-5xl tracking-tightest mt-1.5 tabular-nums">
              {hours}
              <span className="text-ink-tertiary text-xl font-medium"> hr</span>
            </div>
          ) : (
            <p className="text-ink-tertiary text-sm mt-2">no data yet</p>
          )}
        </div>
        {hours !== null && (
          <SourceBadge
            source={(day?.sleep_source ?? 'manual') as 'terra' | 'manual'}
            syncedMin={day?.sleep_source === 'terra' ? 180 : undefined}
          />
        )}
      </div>
      <input
        className="w-full bg-surface border border-transparent rounded-xl px-3 py-2.5 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors mt-4"
        placeholder="how did it feel?"
        defaultValue={day?.sleep_note ?? ''}
        onChange={e => handleNoteChange(e.target.value)}
      />
    </div>
  );
}
