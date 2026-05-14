import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, LogOut, Wifi } from 'lucide-react';
import { PageHeader } from '../../components/layout/AppShell';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { THEMES, applyTheme, type ThemeKey } from '../../lib/themes';
import { useToast } from '../../components/ui/Toast';

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

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  async function updateProfile(updates: Record<string, unknown>) {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update(updates).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
  }

  async function handleTheme(key: ThemeKey) {
    applyTheme(key);
    await updateProfile({ theme: key });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function handleCreateGroup() {
    if (!user) return;
    const name = window.prompt('Group name:');
    if (!name) return;
    const { data: group } = await supabase
      .from('groups')
      .insert({ name, created_by: user.id })
      .select()
      .maybeSingle();
    if (group) {
      await updateProfile({ group_id: group.id });
      toast('Group created!');
    }
  }

  async function copyInvite() {
    if (!profile) return;
    const { data: group } = await supabase.from('groups').select('invite_code').eq('id', profile.group_id!).maybeSingle();
    if (group) {
      await navigator.clipboard.writeText(group.invite_code).catch(() => {});
      toast('Invite code copied!');
    }
  }

  if (!profile) return null;

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Settings" title="Account" />

      <div className="px-5 pb-6 space-y-4 stagger-children">

        {/* Profile */}
        <div className="bg-bg border border-border rounded-2xl p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary mb-3">Profile</p>
          <div className="flex items-center gap-3">
            <Avatar name={profile.name || 'User'} size={48} avatarUrl={profile.avatar_url} />
            <div>
              <p className="font-semibold">{profile.name || 'Set your name'}</p>
              <p className="text-xs text-ink-secondary mt-0.5">{profile.email || user?.email}</p>
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-bg border border-border rounded-2xl p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Accent color</p>
          <p className="text-xs text-ink-secondary mt-1 mb-4">used across the entire app</p>
          <div className="flex items-center gap-3">
            {(Object.keys(THEMES) as ThemeKey[]).map(key => (
              <button
                key={key}
                onClick={() => handleTheme(key)}
                className="w-10 h-10 rounded-full relative transition-transform hover:scale-105 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${THEMES[key].gradFrom} 0%, ${THEMES[key].gradTo} 100%)`,
                  border: profile.theme === key ? '2.5px solid #0A0A0F' : '2.5px solid transparent',
                  outline: profile.theme === key ? '2px solid white' : 'none',
                  outlineOffset: '1px',
                }}
              >
                {profile.theme === key && (
                  <span className="text-white text-xs font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-tertiary mt-3 capitalize">{THEMES[profile.theme as ThemeKey]?.label}</p>
        </div>

        {/* Today layout */}
        <Link
          to="/settings/today"
          className="bg-bg border border-border rounded-2xl p-6 flex items-center justify-between hover:bg-surface transition-colors"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Today layout</p>
            <p className="text-sm mt-1.5 font-medium">
              {Array.isArray(profile.today_layout)
                ? (profile.today_layout as Array<{ visible: boolean }>).filter(m => m.visible).length
                : 6} modules visible
            </p>
          </div>
          <ChevronRight size={18} className="text-ink-tertiary" />
        </Link>

        {/* Daily goals */}
        <div className="bg-bg border border-border rounded-2xl p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary mb-4">Daily goals</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Water</span>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  className="w-16 text-right tabular-nums text-sm font-semibold border-b border-border focus:outline-none bg-transparent focus:border-accent transition-colors"
                  defaultValue={profile.water_goal_oz}
                  onBlur={e => updateProfile({ water_goal_oz: Number(e.target.value) })}
                />
                <span className="text-ink-secondary text-sm">oz</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Calories</span>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  className="w-20 text-right tabular-nums text-sm font-semibold border-b border-border focus:outline-none bg-transparent focus:border-accent transition-colors"
                  defaultValue={profile.cal_goal}
                  onBlur={e => updateProfile({ cal_goal: Number(e.target.value) })}
                />
                <span className="text-ink-secondary text-sm">cal</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-sm font-semibold">Show macros</p>
                <p className="text-xs text-ink-secondary mt-0.5">protein, carbs & fat breakdown</p>
              </div>
              <Toggle on={profile.show_macros} onToggle={() => updateProfile({ show_macros: !profile.show_macros })} />
            </div>

            {profile.show_macros && (
              <div className="pt-3 border-t border-divider space-y-3">
                {[
                  { label: 'Protein', key: 'protein_pct', val: profile.protein_pct },
                  { label: 'Carbs', key: 'carbs_pct', val: profile.carbs_pct },
                  { label: 'Fat', key: 'fat_pct', val: profile.fat_pct },
                ].map(({ label, key, val }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{label}</span>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        min={5}
                        max={80}
                        className="w-12 text-right tabular-nums text-sm font-semibold border-b border-border focus:outline-none bg-transparent focus:border-accent transition-colors"
                        defaultValue={val}
                        onBlur={e => updateProfile({ [key]: Number(e.target.value) })}
                      />
                      <span className="text-ink-secondary text-sm">%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Health sync */}
        <Link
          to="/settings/sync"
          className="bg-bg border border-border rounded-2xl p-6 flex items-center justify-between hover:bg-surface transition-colors"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Health sync</p>
            <p className="text-sm mt-1.5 font-medium flex items-center gap-2">
              <Wifi size={14} className="text-ink-tertiary" />
              Connect wearables via Terra
            </p>
          </div>
          <ChevronRight size={18} className="text-ink-tertiary" />
        </Link>

        {/* Auto-post */}
        <div className="bg-bg border border-border rounded-2xl p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary mb-4">Auto-post to feed</p>
          <div className="space-y-3">
            {[
              { label: 'When I complete a workout', key: 'auto_post_workout', val: profile.auto_post_workout },
              { label: 'When I hit my water goal', key: 'auto_post_water_goal', val: profile.auto_post_water_goal },
              { label: 'When I hit my calorie goal', key: 'auto_post_cal_goal', val: profile.auto_post_cal_goal },
              { label: 'When I hit my steps goal', key: 'auto_post_steps_goal', val: profile.auto_post_steps_goal },
            ].map(({ label, key, val }, i) => (
              <div key={key} className={`flex items-center justify-between ${i > 0 ? 'pt-3 border-t border-divider' : ''}`}>
                <span className="text-sm">{label}</span>
                <Toggle on={val} onToggle={() => updateProfile({ [key]: !val })} />
              </div>
            ))}
          </div>
        </div>

        {/* Reminders */}
        <div className="bg-bg border border-border rounded-2xl p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary mb-4">Reminders</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Gratitude</p>
                <p className="text-xs text-ink-secondary mt-0.5">daily at {profile.gratitude_reminder_time}</p>
              </div>
              <Toggle
                on={profile.gratitude_reminder_enabled}
                onToggle={() => updateProfile({ gratitude_reminder_enabled: !profile.gratitude_reminder_enabled })}
              />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-divider">
              <div>
                <p className="text-sm font-semibold">Weekly planning</p>
                <p className="text-xs text-ink-secondary mt-0.5">Sundays at 9:00 am</p>
              </div>
              <Toggle
                on={profile.weekly_reminder_enabled}
                onToggle={() => updateProfile({ weekly_reminder_enabled: !profile.weekly_reminder_enabled })}
              />
            </div>
          </div>
        </div>

        {/* Group */}
        <div className="bg-bg border border-border rounded-2xl p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary mb-3">Group</p>
          {profile.group_id ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Inner Circle</p>
              <button
                onClick={copyInvite}
                className="rounded-full px-3.5 py-2 text-xs font-semibold border border-border bg-surface hover:bg-divider transition-colors tap-active"
              >
                Copy invite code
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-ink-secondary">You're not in a group yet.</p>
              <button
                onClick={handleCreateGroup}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-white tap-active"
                style={{ background: 'var(--accent)' }}
              >
                Create a group
              </button>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-error font-semibold border border-error/30 rounded-full text-sm hover:bg-error/5 transition-colors tap-active"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );
}
