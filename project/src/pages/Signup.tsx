import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BrandMark } from '../components/ui/BrandMark';

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Sign up failed');
      setLoading(false);
      return;
    }

    // Resolve group if invite code provided
    let groupId: string | null = null;
    if (inviteCode.trim()) {
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', inviteCode.trim())
        .maybeSingle();
      groupId = group?.id ?? null;
      if (!groupId) {
        setError('Invite code not found.');
        setLoading(false);
        return;
      }
    }

    await supabase.from('profiles').upsert({
      id: data.user.id,
      name,
      email,
      group_id: groupId,
    });

    navigate('/today');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-20 h-20 rounded-[22px] flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, var(--accent-grad-from) 0%, var(--accent-grad-to) 100%)' }}
          >
            <BrandMark size={52} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl tracking-tighter">LOCKOUT</h1>
          <p className="text-ink-secondary text-sm mt-2">invite-only fitness tracking</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Your name"
            autoComplete="name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors"
            required
          />
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Password (min 8 chars)"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors"
            required
          />
          <input
            type="text"
            placeholder="Invite code (optional)"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors"
          />
          {error && <p className="text-error text-xs px-1">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full font-semibold text-sm text-white tap-active transition-opacity disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-secondary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
