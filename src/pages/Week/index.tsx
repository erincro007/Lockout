import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import { PageHeader } from '../../components/layout/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toDateStr, getWeekStart, getWeekDays, formatShortDate } from '../../lib/dates';
import type { Day, Workout, Week, FoodEntry } from '../../lib/database.types';

const DAY_LETTERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Week() {
  const { user } = useAuth();
  const today = toDateStr();
  const weekStart = getWeekStart();
  const weekDays = getWeekDays(weekStart);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const [week, setWeek] = useState<Week | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [foodByDate, setFoodByDate] = useState<Record<string, FoodEntry[]>>({});
  const commitDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const startStr = weekDays[0].toISOString().slice(0, 10);
    const endStr = weekDays[6].toISOString().slice(0, 10);

    const [{ data: w }, { data: d }, { data: wo }, { data: f }] = await Promise.all([
      supabase.from('weeks').select('*').eq('user_id', user.id).eq('week_start', weekStartStr).maybeSingle(),
      supabase.from('days').select('*').eq('user_id', user.id).gte('date', startStr).lte('date', endStr),
      supabase.from('workouts').select('*').eq('user_id', user.id).gte('date', startStr).lte('date', endStr),
      supabase.from('food_entries').select('*').eq('user_id', user.id).gte('date', startStr).lte('date', endStr),
    ]);

    setWeek(w);
    setDays(d ?? []);
    setWorkouts(wo ?? []);

    const byDate: Record<string, FoodEntry[]> = {};
    for (const entry of (f ?? [])) {
      if (!byDate[entry.date]) byDate[entry.date] = [];
      byDate[entry.date].push(entry);
    }
    setFoodByDate(byDate);
  }, [user, weekStartStr]);

  useEffect(() => { load(); }, [load]);

  async function updateCommit(text: string) {
    if (!user) return;
    if (week) {
      await supabase.from('weeks').update({ commit_to: text }).eq('id', week.id);
    } else {
      const { data } = await supabase
        .from('weeks')
        .insert({ user_id: user.id, week_start: weekStartStr, commit_to: text })
        .select()
        .maybeSingle();
      if (data) setWeek(data);
    }
  }

  function handleCommitChange(val: string) {
    if (commitDebounce.current) clearTimeout(commitDebounce.current);
    commitDebounce.current = setTimeout(() => updateCommit(val), 800);
  }

  const weekLabel = `${formatShortDate(weekDays[0].toISOString().slice(0, 10))} – ${formatShortDate(weekDays[6].toISOString().slice(0, 10))}`;

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Week" title={weekLabel} />

      <div className="px-5 pb-6 space-y-4 stagger-children">
        {/* Commit card */}
        <div className="bg-bg border border-border rounded-2xl p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">This week, I commit to</p>
          <input
            className="w-full bg-transparent font-display font-bold text-3xl tracking-tightest mt-3 focus:outline-none placeholder:text-ink-tertiary"
            placeholder="your intention..."
            defaultValue={week?.commit_to ?? ''}
            onChange={e => handleCommitChange(e.target.value)}
          />
        </div>

        {/* Day rows */}
        <div className="bg-bg border border-border rounded-2xl overflow-hidden">
          {weekDays.map((date, i) => {
            const dateStr = date.toISOString().slice(0, 10);
            const isToday = dateStr === today;
            const dayData = days.find(d => d.date === dateStr);
            const wo = workouts.find(w => w.date === dateStr);
            const foodEntries = foodByDate[dateStr] ?? [];
            const dayCalories = foodEntries.reduce((a, e) => a + (e.calories ?? 0), 0);
            const isPast = dateStr < today;

            return (
              <div
                key={dateStr}
                className={`flex items-center gap-4 px-5 py-4 ${i < 6 ? 'border-b border-divider' : ''}`}
                style={isToday ? { background: 'color-mix(in srgb, var(--accent) 4%, transparent)' } : {}}
              >
                <div className="text-center w-10 flex-shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">{DAY_LETTERS[i]}</p>
                  <p
                    className="font-display font-bold text-2xl tracking-tighter mt-0.5 tabular-nums"
                    style={isToday ? { color: 'var(--accent)' } : {}}
                  >
                    {date.getDate()}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  {wo ? (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{wo.type}</p>
                      {wo.completed && (
                        <CheckCircle size={14} className="text-success flex-shrink-0" />
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-tertiary">{isPast ? '— rest' : '—'}</p>
                  )}

                  <div className="text-xs text-ink-tertiary tabular-nums mt-0.5 flex items-center gap-1">
                    {dayCalories > 0 && <span>{dayCalories.toLocaleString()} cal</span>}
                    {dayCalories > 0 && dayData?.water_oz && <span className="opacity-40">·</span>}
                    {dayData?.water_oz ? <span>{dayData.water_oz} oz</span> : null}
                  </div>

                  {dayData?.gratitude && (
                    <p className="text-xs text-ink-secondary mt-1 truncate italic">"{dayData.gratitude}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
