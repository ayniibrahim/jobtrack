import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function RegisterPage() {
  const { register, demoLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({ fullName, email, password, confirmPassword });
      showToast('Account created! Welcome to JobTrack 🚀');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
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
          Create your career tracker account
        </h2>
        <p className="mt-1 text-xs text-on-surface-variant">
          Start organizing your high-growth pipeline and offer negotiations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-container-lowest py-8 px-6 sm:px-10 rounded-3xl border border-outline-variant/30 shadow-xl space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-on-surface-variant mb-1 font-semibold">
                Full name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-on-surface-variant mb-1 font-semibold">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-on-surface-variant mb-1 font-semibold">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-on-surface-variant mb-1 font-semibold">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-md hover:bg-primary-container transition-colors flex items-center justify-center gap-2"
            >
              {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              Create Free Account
            </button>
          </form>

          <p className="text-center text-xs text-on-surface-variant pt-2">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
