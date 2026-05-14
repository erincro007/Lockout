import { useNavigate } from 'react-router-dom';
import { ProgressBar } from '../../components/ui/ProgressBar';
import type { FoodEntry } from '../../lib/database.types';

interface NutritionModuleProps {
  entries: FoodEntry[];
  calGoal: number;
  showMacros: boolean;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  onQuickAdd: () => void;
}

export function NutritionModule({
  entries, calGoal, showMacros, proteinPct, carbsPct, fatPct, onQuickAdd,
}: NutritionModuleProps) {
  const navigate = useNavigate();

  const totals = entries.reduce(
    (acc, e) => ({
      cal: acc.cal + (e.calories ?? 0),
      p: acc.p + (e.protein_g ?? 0),
      c: acc.c + (e.carbs_g ?? 0),
      f: acc.f + (e.fat_g ?? 0),
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  const left = Math.max(0, calGoal - totals.cal);
  const pGoal = Math.round((calGoal * proteinPct) / 100 / 4);
  const cGoal = Math.round((calGoal * carbsPct) / 100 / 4);
  const fGoal = Math.round((calGoal * fatPct) / 100 / 9);

  return (
    <div className="bg-bg border border-border rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Nutrition</p>
        <span className="text-xs text-ink-tertiary tabular-nums font-semibold">{left.toLocaleString()} left</span>
      </div>
      <div className="font-display font-bold text-6xl tracking-tightest mt-2 tabular-nums">
        {totals.cal.toLocaleString()}
        <span className="text-ink-tertiary text-2xl font-medium"> / {calGoal.toLocaleString()}</span>
      </div>
      <p className="text-xs text-ink-secondary mt-1">calories today</p>
      <div className="mt-4">
        <ProgressBar value={totals.cal} max={calGoal} height={8} />
      </div>

      {showMacros && (
        <div className="space-y-3 mt-5 pt-5 border-t border-divider">
          {[
            { label: 'Protein', val: totals.p, goal: pGoal },
            { label: 'Carbs', val: totals.c, goal: cGoal },
            { label: 'Fat', val: totals.f, goal: fGoal },
          ].map(({ label, val, goal }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold">{label}</span>
                <span className="tabular-nums text-ink-secondary">{Math.round(val)}g / {goal}g</span>
              </div>
              <ProgressBar value={val} max={goal} height={6} />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-5">
        <button
          onClick={onQuickAdd}
          className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white tap-active"
          style={{ background: 'var(--accent)' }}
        >
          + Quick add
        </button>
        <button
          onClick={() => navigate('/food')}
          className="flex-1 py-2.5 rounded-full font-semibold text-sm border border-border bg-surface hover:bg-divider transition-colors tap-active"
        >
          Search foods
        </button>
      </div>
    </div>
  );
}
