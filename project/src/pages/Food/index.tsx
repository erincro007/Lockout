import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../components/layout/AppShell';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { QuickAddSheet } from './QuickAddSheet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toDateStr, formatShortDate } from '../../lib/dates';
import type { FoodEntry } from '../../lib/database.types';

const MEALS = [
  { key: 'B', label: 'Breakfast' },
  { key: 'L', label: 'Lunch' },
  { key: 'D', label: 'Dinner' },
  { key: 'S', label: 'Snacks' },
] as const;

export default function Food() {
  const { user, profile } = useAuth();
  const today = toDateStr();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [addMeal, setAddMeal] = useState<'B' | 'L' | 'D' | 'S' | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at');
    setEntries(data ?? []);
  }, [user, today]);

  useEffect(() => { load(); }, [load]);

  async function handleAdded(entry: Omit<FoodEntry, 'id' | 'created_at'>) {
    if (!user) return;
    const { data } = await supabase.from('food_entries').insert(entry).select().maybeSingle();
    if (data) setEntries(prev => [...prev, data]);
    setAddMeal(null);
  }

  async function handleDelete(id: string) {
    await supabase.from('food_entries').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  const totals = entries.reduce(
    (acc, e) => ({
      cal: acc.cal + (e.calories ?? 0),
      p: acc.p + (e.protein_g ?? 0),
      c: acc.c + (e.carbs_g ?? 0),
      f: acc.f + (e.fat_g ?? 0),
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  const calGoal = profile?.cal_goal ?? 2000;
  const showMacros = profile?.show_macros ?? true;

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Food" title={`Today, ${formatShortDate(today)}`} />

      <div className="px-5 pb-6 space-y-4 stagger-children">
        {/* Daily summary */}
        <div className="bg-bg border border-border rounded-2xl p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Today</p>
          <div className="font-display font-bold text-6xl tracking-tightest mt-2 tabular-nums">
            {totals.cal.toLocaleString()}
            <span className="text-ink-tertiary text-2xl font-medium"> / {calGoal.toLocaleString()}</span>
          </div>
          <p className="text-xs text-ink-secondary mt-1">calories</p>
          <div className="mt-4">
            <ProgressBar value={totals.cal} max={calGoal} height={8} />
          </div>

          {showMacros && (
            <div className="space-y-3 mt-5 pt-5 border-t border-divider">
              {[
                { label: 'Protein', val: totals.p, goal: Math.round(calGoal * (profile?.protein_pct ?? 30) / 100 / 4) },
                { label: 'Carbs', val: totals.c, goal: Math.round(calGoal * (profile?.carbs_pct ?? 40) / 100 / 4) },
                { label: 'Fat', val: totals.f, goal: Math.round(calGoal * (profile?.fat_pct ?? 30) / 100 / 9) },
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
        </div>

        {/* Meal cards */}
        {MEALS.map(({ key, label }) => {
          const mealEntries = entries.filter(e => e.meal === key);
          const mealCal = mealEntries.reduce((a, e) => a + (e.calories ?? 0), 0);
          return (
            <div key={key} className="bg-bg border border-border rounded-2xl p-6">
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">{label}</p>
                  {mealCal > 0 && (
                    <p className="text-xs text-ink-tertiary tabular-nums mt-0.5">{Math.round(mealCal)} cal</p>
                  )}
                </div>
                <button
                  onClick={() => setAddMeal(key)}
                  className="flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold border border-border bg-surface hover:bg-divider transition-colors tap-active"
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>
              {mealEntries.length === 0 ? (
                <p className="text-sm text-ink-tertiary italic">nothing here yet.</p>
              ) : (
                <div>
                  {mealEntries.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className={`flex justify-between items-baseline py-2.5 ${idx < mealEntries.length - 1 ? 'border-b border-divider' : ''}`}
                    >
                      <span className="text-sm">{entry.food_name}</span>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <span className="text-xs text-ink-tertiary tabular-nums">
                          {Math.round(entry.calories)} cal
                          <span className="mx-1 text-ink-tertiary/50">·</span>
                          {Math.round(entry.protein_g)}p / {Math.round(entry.carbs_g)}c / {Math.round(entry.fat_g)}f
                        </span>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-ink-tertiary hover:text-error transition-colors text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <QuickAddSheet
        open={!!addMeal}
        onClose={() => setAddMeal(null)}
        userId={user?.id ?? ''}
        onAdded={handleAdded}
        defaultMeal={addMeal ?? 'S'}
      />
    </div>
  );
}
