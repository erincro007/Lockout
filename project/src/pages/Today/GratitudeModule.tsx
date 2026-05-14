import { useRef } from 'react';
import type { Day } from '../../lib/database.types';

interface GratitudeModuleProps {
  day: Day | null;
  reminderEnabled: boolean;
  reminderTime: string;
  onUpdate: (text: string) => void;
}

export function GratitudeModule({ day, reminderEnabled, reminderTime, onUpdate }: GratitudeModuleProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(val: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onUpdate(val), 800);
  }

  return (
    <div className="bg-bg border border-border rounded-2xl p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Gratitude</p>
      <input
        className="w-full bg-transparent font-display font-semibold text-2xl tracking-tight mt-2 focus:outline-none placeholder:text-ink-tertiary"
        placeholder="one good thing about today"
        defaultValue={day?.gratitude ?? ''}
        onChange={e => handleChange(e.target.value)}
      />
      {reminderEnabled && (
        <p className="text-xs text-ink-tertiary mt-3">
          reminder set for {reminderTime}
        </p>
      )}
    </div>
  );
}
