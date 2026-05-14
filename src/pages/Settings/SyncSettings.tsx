import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SERVICES = [
  { id: 'apple', name: 'Apple Health', desc: 'Steps, sleep, workouts, heart rate' },
  { id: 'whoop', name: 'Whoop', desc: 'Recovery, sleep, strain' },
  { id: 'oura', name: 'Oura', desc: 'Sleep, activity, readiness' },
  { id: 'google', name: 'Google Fit', desc: 'Steps, workouts, activity' },
  { id: 'fitbit', name: 'Fitbit', desc: 'Steps, sleep, heart rate' },
  { id: 'garmin', name: 'Garmin', desc: 'GPS, performance, health' },
];

export default function SyncSettings() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  function handleConnect(serviceId: string) {
    // Terra OAuth widget flow would go here
    // For now show a coming soon alert
    alert(`Terra integration for ${serviceId} — connect at terra.co to get your Terra user ID, then add it in your profile.`);
  }

  const connected = profile?.terra_user_id ? ['apple'] : [];

  return (
    <div className="page-enter">
      <header className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/settings')} className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center hover:bg-divider transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Settings</p>
          <h1 className="font-display font-bold text-2xl tracking-tighter mt-0.5">Health Sync</h1>
        </div>
      </header>

      <div className="px-5 pb-6 space-y-4">
        <p className="text-sm text-ink-secondary">
          Connect your wearables through Terra to automatically sync steps, sleep, and workouts.
        </p>

        <div className="bg-bg border border-border rounded-2xl overflow-hidden">
          {SERVICES.map((service, i) => {
            const isConnected = connected.includes(service.id);
            return (
              <div
                key={service.id}
                className={`flex items-center justify-between px-5 py-4 ${i < SERVICES.length - 1 ? 'border-b border-divider' : ''}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{service.name}</p>
                  {isConnected ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-ink-secondary mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      connected · synced 12 min ago
                    </div>
                  ) : (
                    <p className="text-xs text-ink-tertiary mt-0.5">{service.desc}</p>
                  )}
                </div>
                {isConnected ? (
                  <button className="text-xs font-semibold text-ink-secondary px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-divider transition-colors">
                    Manage
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(service.id)}
                    className="text-xs font-semibold text-white px-3 py-1.5 rounded-full tap-active"
                    style={{ background: 'var(--accent)' }}
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-surface border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-ink-secondary">
            Powered by <span className="font-semibold">Terra API</span>. Data syncs automatically when your device syncs.
          </p>
        </div>
      </div>
    </div>
  );
}
