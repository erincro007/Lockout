import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BrandMark } from '../components/ui/BrandMark';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/today');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center mb-12">
          <div
            className="w-20 h-20 rounded-[22px] flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, var(--accent-grad-from) 0%, var(--accent-grad-to) 100%)' }}
          >
            <BrandMark size={52} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl tracking-tighter">
            LOCKOUT
          </h1>
          <p className="text-ink-secondary text-sm mt-2">your private fitness circle</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
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
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-surface border border-transparent rounded-xl px-4 py-3 text-sm focus:border-accent focus:bg-bg focus:outline-none transition-colors"
            required
          />
          {error && (
            <p className="text-error text-xs px-1">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full font-semibold text-sm text-white tap-active transition-opacity disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-secondary mt-6">
          New here?{' '}
          <Link to="/signup" className="font-semibold" style={{ color: 'var(--accent)' }}>
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
