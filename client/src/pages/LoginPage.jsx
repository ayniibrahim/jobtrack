import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back to JobTrack! 👋');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await demoLogin();
      showToast('Signed in as demo user Ayni Ibrahim! 🚀');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Demo sign in failed.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo */}
        <div className="inline-flex items-center gap-2 mb-3">
          <img
            alt="JobTrack Brand Mark"
            className="h-10 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1XIVKHIF26hejsVsOaI48BV-4fMKQm1ddFt9PZgLI9TvD6Ly0sCP047vX9qpeYrp_0QTiRrb4CA5gumqSIZRek5U8o2AQZ6AVryiKzYNPbvWQQlZRJ3YIjRjJAgI0dAI03NwEbxe9LQAGhsSZ8tPvoT0E_iBFTx8-6oFYoyMqskfEmAQOSPanvLOgl7cUPTWZEN7iaz_YCcYfU5NLnS4GoPz8HiGhfvOR4MYhV6LcWCzX-bNjip4XSrJ7k"
          />
          <span className="font-headline text-2xl font-bold tracking-tight text-on-surface">
            JobTrack
          </span>
        </div>
        <h2 className="font-headline text-xl font-bold text-on-surface">
          Sign in to your command center
        </h2>
        <p className="mt-1 text-xs text-on-surface-variant">
          Track high-stakes job applications, interview debriefs, and compensation offers
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-container-lowest py-8 px-6 sm:px-10 rounded-3xl border border-outline-variant/30 shadow-xl space-y-5">
          {/* Quick Demo Sign In Button */}
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={demoLoading}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-label-md text-xs font-bold shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2.5"
          >
            {demoLoading ? (
              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            )}
            <span>Sign In as Demo User (Ayni Ibrahim)</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-outline-variant/30 w-full"></div>
            <span className="bg-surface-container-lowest px-3 text-[11px] font-semibold uppercase text-on-surface-variant shrink-0">
              or credentials
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-on-surface-variant mb-1 font-semibold">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ayni@jobtrack.io"
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-on-surface-variant font-semibold">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-surface-container text-on-surface font-label-md text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
            >
              {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              Sign In
            </button>
          </form>

          <p className="text-center text-xs text-on-surface-variant pt-2">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
