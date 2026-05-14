import { useState, useEffect, useRef } from 'react';
import { Search, Star, Clock } from 'lucide-react';
import { Sheet } from '../../components/ui/Sheet';
import { searchFood, type FoodResult } from '../../lib/food';
import { supabase } from '../../lib/supabase';
import type { FoodEntry } from '../../lib/database.types';

interface ServingModal {
  food: FoodResult;
  servingG: string;
}

interface QuickAddSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onAdded: (entry: Omit<FoodEntry, 'id' | 'created_at'>) => void;
  defaultMeal?: 'B' | 'L' | 'D' | 'S';
}

const MEAL_LABELS = { B: 'Breakfast', L: 'Lunch', D: 'Dinner', S: 'Snacks' };

export function QuickAddSheet({ open, onClose, userId, onAdded, defaultMeal = 'S' }: QuickAddSheetProps) {
  const [tab, setTab] = useState<'recents' | 'favorites' | 'search'>('recents');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [recents, setRecents] = useState<FoodEntry[]>([]);
  const [favorites, setFavorites] = useState<FoodEntry[]>([]);
  const [serving, setServing] = useState<ServingModal | null>(null);
  const [meal, setMeal] = useState<'B' | 'L' | 'D' | 'S'>(defaultMeal);
  const [customOpen, setCustomOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open && userId) {
      supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => setRecents(data ?? []));

      supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('is_favorite', true)
        .order('food_name')
        .then(({ data }) => setFavorites(data ?? []));
    }
  }, [open, userId]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const r = await searchFood(query);
      setResults(r);
      setSearching(false);
    }, 300);
  }, [query]);

  function addFromHistory(entry: FoodEntry) {
    onAdded({
      user_id: userId,
      date: new Date().toISOString().slice(0, 10),
      meal,
      food_name: entry.food_name,
      serving_grams: entry.serving_grams,
      calories: entry.calories,
      protein_g: entry.protein_g,
      carbs_g: entry.carbs_g,
      fat_g: entry.fat_g,
      source: entry.source,
      source_id: entry.source_id,
      is_favorite: false,
    });
    onClose();
  }

  function openServing(food: FoodResult) {
    setServing({ food, servingG: '100' });
  }

  function confirmServing() {
    if (!serving) return;
    const g = Number(serving.servingG) || 100;
    const scale = g / 100;
    onAdded({
      user_id: userId,
      date: new Date().toISOString().slice(0, 10),
      meal,
      food_name: serving.food.name,
      serving_grams: g,
      calories: Math.round(serving.food.calories_per_100g * scale),
      protein_g: Math.round(serving.food.protein_per_100g * scale * 10) / 10,
      carbs_g: Math.round(serving.food.carbs_per_100g * scale * 10) / 10,
      fat_g: Math.round(serving.food.fat_per_100g * scale * 10) / 10,
      source: serving.food.source,
      source_id: serving.food.id,
      is_favorite: false,
    });
    setServing(null);
    onClose();
  }

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Add food">
        {/* Meal selector */}
        <div className="flex gap-2 mb-5">
          {(Object.keys(MEAL_LABELS) as Array<keyof typeof MEAL_LABELS>).map(m => (
            <button
              key={m}
              onClick={() => setMeal(m)}
              className="flex-1 py-1.5 rounded-full text-xs font-semibold border transition-colors"
              style={meal === m
                ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }
                : { borderColor: '#E5E5EA', color: '#6E6E73', background: '#FAFAFA' }
              }
            >
              {MEAL_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface rounded-xl p-1 mb-4">
          {(['recents', 'favorites', 'search'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors"
              style={tab === t
                ? { background: '#fff', color: 'var(--accent)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { color: '#6E6E73' }
              }
            >
              {t === 'recents' && <Clock size={11} className="inline mr-1" />}
              {t === 'favorites' && <Star size={11} className="inline mr-1" />}
              {t}
            </button>
          ))}
        </div>

        {tab === 'search' && (
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary" />
            <input
              className="w-full bg-surface border border-transparent rounded-xl pl-9 pr-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors"
              placeholder="Search Open Food Facts + USDA..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {tab === 'recents' && (
          <FoodList
            items={recents.map(r => ({
              id: r.id,
              name: r.food_name,
              brand: undefined,
              sub: r.source === 'off' ? 'Open Food Facts' : r.source === 'usda' ? 'USDA' : 'Custom',
              cal: r.calories,
              onAdd: () => addFromHistory(r),
            }))}
            emptyText="no recent foods yet."
          />
        )}

        {tab === 'favorites' && (
          <FoodList
            items={favorites.map(r => ({
              id: r.id,
              name: r.food_name,
              brand: undefined,
              sub: 'Favorite',
              cal: r.calories,
              onAdd: () => addFromHistory(r),
            }))}
            emptyText="no favorites yet. star a food to save it here."
          />
        )}

        {tab === 'search' && (
          <>
            {searching && <p className="text-sm text-ink-secondary text-center py-4">Searching...</p>}
            {!searching && query && results.length === 0 && (
              <p className="text-sm text-ink-tertiary text-center py-4">no results found.</p>
            )}
            <FoodList
              items={results.map(r => ({
                id: r.id,
                name: r.name,
                brand: r.brand,
                sub: r.source === 'off' ? 'Open Food Facts' : 'USDA',
                cal: Math.round(r.calories_per_100g),
                calLabel: 'per 100g',
                onAdd: () => openServing(r),
              }))}
              emptyText=""
            />
          </>
        )}

        <button
          onClick={() => setCustomOpen(true)}
          className="w-full mt-4 py-3 rounded-xl border border-dashed border-border text-sm text-ink-secondary hover:bg-surface transition-colors"
        >
          + Add custom food
        </button>
      </Sheet>

      {/* Serving size modal */}
      {serving && (
        <Sheet open={!!serving} onClose={() => setServing(null)} title="Serving size">
          <div className="space-y-4">
            <p className="font-semibold text-sm">{serving.food.name}</p>
            {serving.food.brand && <p className="text-xs text-ink-secondary -mt-2">{serving.food.brand}</p>}
            <div>
              <label className="text-xs font-semibold text-ink-secondary uppercase tracking-wider block mb-2">
                Amount (grams)
              </label>
              <input
                type="number"
                className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors"
                value={serving.servingG}
                onChange={e => setServing({ ...serving, servingG: e.target.value })}
                autoFocus
              />
            </div>
            <div className="bg-surface rounded-xl p-4 text-sm space-y-1">
              {['calories', 'protein', 'carbs', 'fat'].map((n, i) => {
                const vals = [serving.food.calories_per_100g, serving.food.protein_per_100g, serving.food.carbs_per_100g, serving.food.fat_per_100g];
                const val = Math.round(vals[i] * (Number(serving.servingG) || 100) / 100 * 10) / 10;
                return (
                  <div key={n} className="flex justify-between">
                    <span className="capitalize text-ink-secondary">{n}</span>
                    <span className="tabular-nums font-semibold">{val}{n !== 'calories' ? 'g' : ''}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={confirmServing}
              className="w-full py-3 rounded-full font-semibold text-sm text-white tap-active"
              style={{ background: 'var(--accent)' }}
            >
              Add to {MEAL_LABELS[meal]}
            </button>
          </div>
        </Sheet>
      )}

      {/* Custom food sheet */}
      {customOpen && (
        <CustomFoodSheet
          open={customOpen}
          onClose={() => setCustomOpen(false)}
          userId={userId}
          meal={meal}
          onAdded={onAdded}
          onClose2={() => { setCustomOpen(false); onClose(); }}
        />
      )}
    </>
  );
}

interface FoodListItem {
  id: string;
  name: string;
  brand?: string;
  sub?: string;
  cal: number;
  calLabel?: string;
  onAdd: () => void;
}

function FoodList({ items, emptyText }: { items: FoodListItem[]; emptyText: string }) {
  if (items.length === 0 && emptyText) {
    return <p className="text-sm text-ink-tertiary py-4 text-center">{emptyText}</p>;
  }
  return (
    <div className="space-y-1">
      {items.map(item => (
        <button
          key={item.id}
          onClick={item.onAdd}
          className="w-full text-left flex items-center justify-between py-3 px-3 rounded-xl hover:bg-surface transition-colors"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{item.name}</p>
            <p className="text-xs text-ink-tertiary mt-0.5">{item.brand ? `${item.brand} · ` : ''}{item.sub}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
            <div className="text-right">
              <span className="text-xs font-semibold text-ink-secondary tabular-nums">{item.cal} cal</span>
              {item.calLabel && <p className="text-[10px] text-ink-tertiary">{item.calLabel}</p>}
            </div>
            <span className="text-lg font-light" style={{ color: 'var(--accent)' }}>+</span>
          </div>
        </button>
      ))}
    </div>
  );
}

interface CustomFoodSheetProps {
  open: boolean;
  onClose: () => void;
  onClose2: () => void;
  userId: string;
  meal: 'B' | 'L' | 'D' | 'S';
  onAdded: (entry: Omit<FoodEntry, 'id' | 'created_at'>) => void;
}

function CustomFoodSheet({ open, onClose, onClose2, userId, meal, onAdded }: CustomFoodSheetProps) {
  const [form, setForm] = useState({ name: '', serving: '100', cal: '', p: '', c: '', f: '' });

  function save() {
    if (!form.name.trim() || !form.cal) return;
    onAdded({
      user_id: userId,
      date: new Date().toISOString().slice(0, 10),
      meal,
      food_name: form.name,
      serving_grams: Number(form.serving) || 100,
      calories: Number(form.cal),
      protein_g: Number(form.p) || 0,
      carbs_g: Number(form.c) || 0,
      fat_g: Number(form.f) || 0,
      source: 'custom',
      source_id: null,
      is_favorite: false,
    });
    onClose2();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Custom food">
      <div className="space-y-3">
        <input
          className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none"
          placeholder="Food name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input type="number" className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none" placeholder="Serving (g)" value={form.serving} onChange={e => setForm({ ...form, serving: e.target.value })} />
          <input type="number" className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none" placeholder="Calories" value={form.cal} onChange={e => setForm({ ...form, cal: e.target.value })} />
          <input type="number" className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none" placeholder="Protein (g)" value={form.p} onChange={e => setForm({ ...form, p: e.target.value })} />
          <input type="number" className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none" placeholder="Carbs (g)" value={form.c} onChange={e => setForm({ ...form, c: e.target.value })} />
        </div>
        <input type="number" className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none" placeholder="Fat (g)" value={form.f} onChange={e => setForm({ ...form, f: e.target.value })} />
        <button onClick={save} disabled={!form.name.trim() || !form.cal} className="w-full py-3 rounded-full font-semibold text-sm text-white tap-active disabled:opacity-40" style={{ background: 'var(--accent)' }}>
          Add custom food
        </button>
      </div>
    </Sheet>
  );
}
