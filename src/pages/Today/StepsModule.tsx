import { ProgressBar } from '../../components/ui/ProgressBar';
import { SourceBadge } from '../../components/ui/SourceBadge';
import type { Day } from '../../lib/database.types';

interface StepsModuleProps {
  day: Day | null;
  goal?: number;
}

export function StepsModule({ day, goal = 10000 }: StepsModuleProps) {
  const steps = day?.steps ?? null;

  return (
    <div className="bg-bg border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Steps</p>
          {steps !== null ? (
            <div className="font-display font-bold text-5xl tracking-tightest mt-1.5 tabular-nums">
              {steps.toLocaleString()}
            </div>
          ) : (
            <p className="text-ink-tertiary text-sm mt-2">no data yet</p>
          )}
        </div>
        {steps !== null && (
          <SourceBadge
            source={(day?.steps_source ?? 'manual') as 'terra' | 'manual'}
            syncedMin={day?.steps_source === 'terra' ? 12 : undefined}
          />
        )}
      </div>
      {steps !== null && (
        <>
          <div className="mt-4">
            <ProgressBar value={steps} max={goal} height={6} />
          </div>
          <p className="text-xs text-ink-tertiary mt-2 tabular-nums">
            {Math.round(Math.min(100, (steps / goal) * 100))}% of {goal.toLocaleString()} goal
          </p>
        </>
      )}
    </div>
  );
}
