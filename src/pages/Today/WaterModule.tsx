import { useState } from 'react';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Sheet } from '../../components/ui/Sheet';

interface WaterModuleProps {
  waterOz: number;
  goal: number;
  onAdd: (oz: number) => void;
}

export function WaterModule({ waterOz, goal, onAdd }: WaterModuleProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customVal, setCustomVal] = useState('');
  const pct = Math.round(Math.min(100, (waterOz / goal) * 100));
  const hit = waterOz >= goal;

  return (
    <>
      <div className="bg-bg border border-border rounded-2xl p-6">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Water</p>
          <span className="text-xs text-ink-tertiary tabular-nums font-semibold">{pct}%</span>
        </div>
        <div className={`font-display font-bold text-6xl tracking-tightest mt-2 tabular-nums ${hit ? 'gradient-text' : ''}`}>
          {waterOz}
          <span className="text-ink-tertiary text-2xl font-medium"> / {goal} oz</span>
        </div>
        <div className="mt-4">
          <ProgressBar value={waterOz} max={goal} height={10} />
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => onAdd(8)}
            className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white tap-active"
            style={{ background: 'var(--accent)' }}
          >
            + 8 oz
          </button>
          <button
            onClick={() => onAdd(16)}
            className="flex-1 py-2.5 rounded-full font-semibold text-sm border border-border bg-surface hover:bg-divider transition-colors tap-active"
          >
            + 16 oz
          </button>
          <button
            onClick={() => setCustomOpen(true)}
            className="w-10 h-10 rounded-full border border-border bg-surface flex items-center justify-center text-ink-secondary hover:bg-divider transition-colors flex-shrink-0 tap-active"
          >
            +
          </button>
        </div>
      </div>

      <Sheet open={customOpen} onClose={() => setCustomOpen(false)} title="Add water">
        <div className="space-y-4">
          <input
            type="number"
            className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors"
            placeholder="Amount in oz"
            value={customVal}
            onChange={e => setCustomVal(e.target.value)}
            autoFocus
          />
          <button
            onClick={() => { if (customVal) { onAdd(Number(customVal)); setCustomVal(''); setCustomOpen(false); } }}
            className="w-full py-3 rounded-full font-semibold text-sm text-white tap-active"
            style={{ background: 'var(--accent)' }}
          >
            Add
          </button>
        </div>
      </Sheet>
    </>
  );
}
