import { useState, useEffect, useCallback } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toDateStr } from '../../lib/dates';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { BrandIcon } from '../../components/ui/BrandMark';
import { WorkoutModule } from './WorkoutModule';
import { WaterModule } from './WaterModule';
import { NutritionModule } from './NutritionModule';
import { SleepModule } from './SleepModule';
import { StepsModule } from './StepsModule';
import { GratitudeModule } from './GratitudeModule';
import { QuickAddSheet } from '../Food/QuickAddSheet';
import type { Day, FoodEntry, Workout, TodayLayoutItem } from '../../lib/database.types';

export default function Today() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const today = toDateStr();

  const [day, setDay] = useState<Day | null>(null);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [layout, setLayout] = useState<TodayLayoutItem[]>([]);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (profile) {
      setLayout((profile.today_layout as TodayLayoutItem[]) ?? []);
    }
  }, [profile]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [{ data: d }, { data: f }, { data: w }] = await Promise.all([
      supabase.from('days').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('food_entries').select('*').eq('user_id', user.id).eq('date', today),
      supabase.from('workouts').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
    ]);
    setDay(d);
    setFoodEntries(f ?? []);
    setWorkout(w);
  }, [user, today]);

  useEffect(() => { loadData(); }, [loadData]);

  async function upsertDay(updates: Partial<Day>) {
    if (!user) return;
    const { data } = await supabase
      .from('days')
      .upsert({ user_id: user.id, date: today, ...updates }, { onConflict: 'user_id,date' })
      .select()
      .maybeSingle();
    if (data) setDay(data);
  }

  async function handleAddWater(oz: number) {
    const current = day?.water_oz ?? 0;
    const newVal = current + oz;
    await upsertDay({ water_oz: newVal });

    if (profile?.auto_post_water_goal && profile?.group_id) {
      const goalHit = newVal >= (profile.water_goal_oz ?? 64) && current < (profile.water_goal_oz ?? 64);
      if (goalHit) {
        const alreadyPosted = await checkAutoPost('auto_goal_water');
        if (!alreadyPosted) {
          await supabase.from('posts').insert({
            group_id: profile.group_id,
            author_id: user!.id,
            type: 'auto_goal_water',
            body: `hit ${profile.water_goal_oz} oz water today`,
          });
          toast('Water goal hit! Posted to feed.');
        }
      }
    }
  }

  async function checkAutoPost(type: string): Promise<boolean> {
    if (!user || !profile?.group_id) return false;
    const start = today + 'T00:00:00';
    const end = today + 'T23:59:59';
    const { data } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', user.id)
      .eq('type', type)
      .gte('created_at', start)
      .lte('created_at', end)
      .maybeSingle();
    return !!data;
  }

  async function handleCompleteWorkout(w: Workout) {
    const { data } = await supabase
      .from('workouts')
      .update({ completed: true })
      .eq('id', w.id)
      .select()
      .maybeSingle();
    if (data) setWorkout(data);

    if (profile?.auto_post_workout && profile?.group_id) {
      const alreadyPosted = await checkAutoPost('auto_workout');
      if (!alreadyPosted) {
        await supabase.from('posts').insert({
          group_id: profile.group_id,
          author_id: user!.id,
          type: 'auto_workout',
          body: `finished ${w.type}`,
          tag: 'workout',
        });
        toast(`${w.type} complete! Posted to feed.`);
      }
    }
  }

  async function handleLogWorkout(data: Partial<Workout>) {
    if (!user) return;
    const { data: w } = await supabase
      .from('workouts')
      .insert({ user_id: user.id, date: today, ...data })
      .select()
      .maybeSingle();
    if (w) setWorkout(w);
    toast('Workout logged.');
  }

  async function handleGratitudeUpdate(text: string) {
    await upsertDay({ gratitude: text });
  }

  async function handleSleepNoteUpdate(note: string) {
    await upsertDay({ sleep_note: note });
  }

  async function handleFoodAdded(entry: Omit<FoodEntry, 'id' | 'created_at'>) {
    if (!user) return;
    const { data } = await supabase
      .from('food_entries')
      .insert({ ...entry, user_id: user.id, date: today })
      .select()
      .maybeSingle();
    if (data) {
      setFoodEntries(prev => [...prev, data]);
      toast('Added to food log.');
    }
  }

  async function saveLayout(newLayout: TodayLayoutItem[]) {
    if (!user) return;
    await supabase.from('profiles').update({ today_layout: newLayout }).eq('id', user.id);
    await refreshProfile();
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = layout.findIndex(m => m.module === active.id);
      const newIdx = layout.findIndex(m => m.module === over.id);
      const newLayout = arrayMove(layout, oldIdx, newIdx);
      setLayout(newLayout);
      saveLayout(newLayout);
    }
  }

  function toggleModuleVisibility(module: string) {
    const newLayout = layout.map(m =>
      m.module === module ? { ...m, visible: !m.visible } : m
    );
    setLayout(newLayout);
    saveLayout(newLayout);
  }

  async function handleDoneEdit() {
    setEditMode(false);
    await saveLayout(layout);
  }

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  function renderModule(item: TodayLayoutItem) {
    switch (item.module) {
      case 'workout':
        return <WorkoutModule workout={workout} onComplete={handleCompleteWorkout} onLogWorkout={handleLogWorkout} />;
      case 'water':
        return <WaterModule waterOz={day?.water_oz ?? 0} goal={profile?.water_goal_oz ?? 64} onAdd={handleAddWater} />;
      case 'nutrition':
        return (
          <NutritionModule
            entries={foodEntries}
            calGoal={profile?.cal_goal ?? 2000}
            showMacros={profile?.show_macros ?? true}
            proteinPct={profile?.protein_pct ?? 30}
            carbsPct={profile?.carbs_pct ?? 40}
            fatPct={profile?.fat_pct ?? 30}
            onQuickAdd={() => setQuickAddOpen(true)}
          />
        );
      case 'sleep':
        return <SleepModule day={day} onUpdateNote={handleSleepNoteUpdate} />;
      case 'steps':
        return <StepsModule day={day} />;
      case 'gratitude':
        return (
          <GratitudeModule
            day={day}
            reminderEnabled={profile?.gratitude_reminder_enabled ?? true}
            reminderTime={profile?.gratitude_reminder_time ?? '20:00'}
            onUpdate={handleGratitudeUpdate}
          />
        );
      default:
        return null;
    }
  }

  if (!profile) return null;

  return (
    <div className="page-enter">
      {/* App bar */}
      <header className="px-5 pt-8 pb-4 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BrandIcon size={20} />
            <span className="text-[10px] font-bold tracking-[0.18em] text-ink-tertiary" style={{ fontFamily: '"Inter Tight", sans-serif' }}>
              LOCKOUT
            </span>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Today</p>
          <h1 className="font-display font-bold text-3xl tracking-tightest mt-1">{dateLabel}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => editMode ? handleDoneEdit() : setEditMode(true)}
            className={`rounded-full px-3.5 py-2 font-semibold text-xs transition-colors tap-active ${
              editMode
                ? 'text-white'
                : 'bg-surface border border-border text-ink hover:bg-divider'
            }`}
            style={editMode ? { background: 'var(--accent)' } : {}}
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
          <Avatar name={profile.name || 'User'} size={36} avatarUrl={profile.avatar_url} />
        </div>
      </header>

      <div className="px-5 pb-6">
        {editMode && (
          <div className="bg-surface border border-border rounded-2xl p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Customize your home</p>
              <p className="text-xs text-ink-secondary mt-0.5">drag to reorder, toggle to hide</p>
            </div>
          </div>
        )}

        {editMode ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={layout.map(m => m.module)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {layout.map(item => (
                  <SortableModule
                    key={item.module}
                    item={item}
                    onToggle={() => toggleModuleVisibility(item.module)}
                  >
                    {renderModule(item)}
                  </SortableModule>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="space-y-4 stagger-children">
            {layout.filter(m => m.visible).map(item => (
              <div key={item.module}>
                {renderModule(item)}
              </div>
            ))}
          </div>
        )}
      </div>

      <QuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        userId={user?.id ?? ''}
        onAdded={handleFoodAdded}
        defaultMeal="S"
      />
    </div>
  );
}

interface SortableModuleProps {
  item: TodayLayoutItem;
  onToggle: () => void;
  children: React.ReactNode;
}

function SortableModule({ item, onToggle, children }: SortableModuleProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.module,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const MODULE_LABELS: Record<string, string> = {
    workout: 'Workout',
    water: 'Water',
    nutrition: 'Nutrition',
    sleep: 'Sleep',
    steps: 'Steps',
    gratitude: 'Gratitude',
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative ${!item.visible ? 'opacity-40' : ''}`}>
      {/* Edit overlay header */}
      <div className="absolute -top-0 left-0 right-0 z-10 flex items-center gap-2 bg-bg/95 rounded-t-2xl px-3 py-2 border border-b-0 border-border">
        <button
          className="text-ink-tertiary hover:text-ink-secondary p-1 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <span className="text-xs font-semibold flex-1 text-ink-secondary">{MODULE_LABELS[item.module]}</span>
        <button
          onClick={onToggle}
          className="w-10 h-5.5 rounded-full relative transition-colors flex-shrink-0"
          style={{ background: item.visible ? 'var(--accent)' : '#E5E5EA', height: '22px', width: '40px' }}
        >
          <span
            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all"
            style={{ left: item.visible ? '21px' : '3px' }}
          />
        </button>
      </div>
      <div className="pt-10">
        {children}
      </div>
    </div>
  );
}
