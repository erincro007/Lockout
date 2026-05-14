import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { TodayLayoutItem } from '../../lib/database.types';

const MODULE_META: Record<string, { label: string; desc: string }> = {
  workout: { label: 'Workout', desc: 'Log and track today\'s session' },
  water: { label: 'Water', desc: 'Hydration tracking with quick-log' },
  nutrition: { label: 'Nutrition', desc: 'Calorie and macro progress' },
  sleep: { label: 'Sleep', desc: 'Sleep duration and notes' },
  steps: { label: 'Steps', desc: 'Daily step count from wearable or manual' },
  gratitude: { label: 'Gratitude', desc: 'Daily reflection journal' },
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative rounded-full transition-colors flex-shrink-0"
      style={{ width: 42, height: 26, background: on ? 'var(--accent)' : '#E5E5EA' }}
    >
      <span
        className="absolute top-[3px] w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200"
        style={{ left: on ? 19 : 3 }}
      />
    </button>
  );
}

interface SortableRowProps {
  item: TodayLayoutItem;
  onToggle: () => void;
}

function SortableRow({ item, onToggle }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.module });
  const meta = MODULE_META[item.module];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 bg-bg border border-border rounded-2xl px-4 py-3.5"
    >
      <button
        className="text-ink-tertiary hover:text-ink-secondary p-1 cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{meta?.label ?? item.module}</p>
        <p className="text-xs text-ink-secondary mt-0.5">{meta?.desc}</p>
      </div>
      <Toggle on={item.visible} onToggle={onToggle} />
    </div>
  );
}

export default function TodayLayoutEditor() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [layout, setLayout] = useState<TodayLayoutItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (profile?.today_layout) {
      setLayout(profile.today_layout as TodayLayoutItem[]);
    }
  }, [profile]);

  async function save(newLayout: TodayLayoutItem[]) {
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
      save(newLayout);
    }
  }

  function toggleVisibility(module: string) {
    const newLayout = layout.map(m => m.module === module ? { ...m, visible: !m.visible } : m);
    setLayout(newLayout);
    save(newLayout);
  }

  return (
    <div className="page-enter">
      <header className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/settings')} className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center hover:bg-divider transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Settings</p>
          <h1 className="font-display font-bold text-2xl tracking-tighter mt-0.5">Today Layout</h1>
        </div>
      </header>

      <div className="px-5 pb-6">
        <p className="text-sm text-ink-secondary mb-4">drag to reorder, toggle to show or hide</p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={layout.map(m => m.module)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {layout.map(item => (
                <SortableRow key={item.module} item={item} onToggle={() => toggleVisibility(item.module)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
