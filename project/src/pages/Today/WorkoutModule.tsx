import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SourceBadge } from '../../components/ui/SourceBadge';
import { Sheet } from '../../components/ui/Sheet';
import type { Workout } from '../../lib/database.types';

interface WorkoutModuleProps {
  workout: Workout | null;
  onComplete: (w: Workout) => void;
  onLogWorkout: (data: Partial<Workout>) => void;
}

export function WorkoutModule({ workout, onComplete, onLogWorkout }: WorkoutModuleProps) {
  const [logOpen, setLogOpen] = useState(false);
  const [form, setForm] = useState({ type: '', duration_min: '', calories_burned: '', avg_hr: '', max_hr: '', notes: '' });

  function handleLog() {
    onLogWorkout({
      type: form.type,
      duration_min: form.duration_min ? Number(form.duration_min) : null,
      calories_burned: form.calories_burned ? Number(form.calories_burned) : null,
      avg_hr: form.avg_hr ? Number(form.avg_hr) : null,
      max_hr: form.max_hr ? Number(form.max_hr) : null,
      notes: form.notes,
      source: 'manual',
    });
    setLogOpen(false);
    setForm({ type: '', duration_min: '', calories_burned: '', avg_hr: '', max_hr: '', notes: '' });
  }

  if (!workout) {
    return (
      <>
        <div className="border border-dashed border-border rounded-2xl p-6 flex flex-col items-center gap-3">
          <p className="text-sm text-ink-secondary">log what you did today.</p>
          <button
            onClick={() => setLogOpen(true)}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white tap-active"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={16} />
            Log workout
          </button>
        </div>
        <LogWorkoutSheet open={logOpen} onClose={() => setLogOpen(false)} form={form} setForm={setForm} onSave={handleLog} />
      </>
    );
  }

  return (
    <>
      <div className="bg-bg border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Workout</p>
            <h3 className="font-display font-bold text-2xl tracking-tighter mt-1.5 truncate">{workout.type || 'Workout'}</h3>
            <div className="mt-1.5">
              <SourceBadge
                source={workout.source as 'manual' | 'planned' | 'terra'}
                syncedMin={workout.source === 'terra' ? 12 : undefined}
              />
            </div>
          </div>
          <button
            onClick={() => !workout.completed && onComplete(workout)}
            className={`w-7 h-7 rounded-full border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
              workout.completed
                ? 'text-white border-transparent'
                : 'border-border bg-bg hover:border-accent'
            }`}
            style={workout.completed ? { background: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
          >
            {workout.completed && <Check size={14} strokeWidth={3} />}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-divider">
          {workout.duration_min && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Duration</p>
              <p className="font-display font-bold text-xl tracking-tighter mt-1 tabular-nums">
                {workout.duration_min}<span className="text-ink-tertiary text-sm font-medium"> min</span>
              </p>
            </div>
          )}
          {workout.calories_burned && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Calories</p>
              <p className="font-display font-bold text-xl tracking-tighter mt-1 tabular-nums">{workout.calories_burned}</p>
            </div>
          )}
          {workout.avg_hr && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Avg HR</p>
              <p className="font-display font-bold text-xl tracking-tighter mt-1 tabular-nums">
                {workout.avg_hr}<span className="text-ink-tertiary text-sm font-medium"> bpm</span>
              </p>
            </div>
          )}
        </div>

        {!workout.completed && (
          <div className="mt-4 pt-4 border-t border-divider">
            <ProgressBar value={0} max={1} height={4} />
            <p className="text-xs text-ink-tertiary mt-1.5">tap ✓ to mark complete</p>
          </div>
        )}
      </div>

      <LogWorkoutSheet open={logOpen} onClose={() => setLogOpen(false)} form={form} setForm={setForm} onSave={handleLog} />
    </>
  );
}

interface LogWorkoutSheetProps {
  open: boolean;
  onClose: () => void;
  form: { type: string; duration_min: string; calories_burned: string; avg_hr: string; max_hr: string; notes: string };
  setForm: (f: LogWorkoutSheetProps['form']) => void;
  onSave: () => void;
}

function LogWorkoutSheet({ open, onClose, form, setForm, onSave }: LogWorkoutSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Log workout">
      <div className="space-y-3">
        <input
          className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors"
          placeholder="Workout type (e.g., Lift: legs)"
          value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors"
            placeholder="Duration (min)"
            value={form.duration_min}
            onChange={e => setForm({ ...form, duration_min: e.target.value })}
          />
          <input
            type="number"
            className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors"
            placeholder="Cal burned"
            value={form.calories_burned}
            onChange={e => setForm({ ...form, calories_burned: e.target.value })}
          />
          <input
            type="number"
            className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors"
            placeholder="Avg HR (bpm)"
            value={form.avg_hr}
            onChange={e => setForm({ ...form, avg_hr: e.target.value })}
          />
          <input
            type="number"
            className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors"
            placeholder="Max HR (bpm)"
            value={form.max_hr}
            onChange={e => setForm({ ...form, max_hr: e.target.value })}
          />
        </div>
        <textarea
          className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors resize-none"
          placeholder="Notes"
          rows={2}
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
        />
        <button
          onClick={onSave}
          disabled={!form.type.trim()}
          className="w-full py-3 rounded-full font-semibold text-sm text-white tap-active disabled:opacity-40"
          style={{ background: 'var(--accent)' }}
        >
          Save workout
        </button>
      </div>
    </Sheet>
  );
}
