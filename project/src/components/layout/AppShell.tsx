import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, UtensilsCrossed, Users, Settings } from 'lucide-react';
import { BrandIcon } from '../ui/BrandMark';

const NAV_ITEMS = [
  { to: '/today', label: 'Today', Icon: Home },
  { to: '/week', label: 'Week', Icon: Calendar },
  { to: '/food', label: 'Food', Icon: UtensilsCrossed },
  { to: '/feed', label: 'Feed', Icon: Users },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Content area */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-[460px] mx-auto">
          {children}
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 border-t border-border"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-[460px] mx-auto flex justify-around items-center py-1 pb-safe">
          {NAV_ITEMS.map(({ to, label, Icon }) => {
            const active = location.pathname.startsWith(to) && (to !== '/settings' || location.pathname.startsWith('/settings'));
            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[56px]"
              >
                <span
                  className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200"
                  style={active ? { background: 'var(--accent-muted)', color: 'var(--accent)' } : { color: '#6E6E73' }}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                </span>
                <span
                  className="text-[10px] font-semibold transition-colors"
                  style={{ color: active ? 'var(--accent)' : '#6E6E73' }}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* App header for Today route is rendered by the page itself */}
    </div>
  );
}

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  right?: ReactNode;
}

export function PageHeader({ eyebrow, title, right }: PageHeaderProps) {
  return (
    <header className="px-5 pt-8 pb-4 flex items-end justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BrandIcon size={20} />
          <span
            className="text-[10px] font-bold tracking-[0.18em] text-ink-tertiary"
            style={{ fontFamily: '"Inter Tight", Inter, sans-serif' }}
          >
            LOCKOUT
          </span>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">{eyebrow}</p>
        <h1 className="font-display font-bold text-3xl tracking-tightest mt-1">{title}</h1>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}
