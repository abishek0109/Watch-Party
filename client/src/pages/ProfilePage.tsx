import React, { useState, useEffect } from 'react';
import { User, LogIn, UserPlus, Bookmark, Trash2, Play, Shield, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, login, register, logout, createGuest } = useAuthStore();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      api.getWatchlist(token)
        .then((data) => setWatchlist(data))
        .catch((err) => console.warn(err));
    }
  }, [token]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (authMode === 'login') {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await createGuest(guestName.trim());
    } catch (err: any) {
      setError(err.message || 'Guest creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveWatchlist = async (movieId: string) => {
    if (!token) return;
    try {
      await api.removeFromWatchlist(token, movieId);
      setWatchlist((prev) => prev.filter((item) => item.movieId !== movieId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleWatchInRoom = (item: any) => {
    navigate('/create-room', {
      state: {
        initialMovie: {
          title: item.movieTitle,
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          posterUrl: item.posterPath,
          videoType: 'html5',
        },
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          User Profile & Watchlist
        </h1>
        <p className="text-sm text-cinematic-400 mt-1">
          Manage your SyncScreen identity, active sessions, and personal saved titles.
        </p>
      </div>

      {user ? (
        /* User Profile View */
        <div className="space-y-8">
          <div className="p-6 rounded-3xl glass-panel-elevated border border-brand-violet/30 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-16 h-16 rounded-2xl bg-cinematic-800 border-2 border-brand-violet object-cover shadow-xl"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-xl text-white">{user.username}</h2>
                  {user.isGuest ? (
                    <span className="text-[10px] font-bold uppercase bg-cinematic-700 text-cinematic-300 px-2 py-0.5 rounded-full">
                      Guest Session
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase bg-brand-violet/20 text-brand-violet border border-brand-violet/30 px-2 py-0.5 rounded-full">
                      Verified Member
                    </span>
                  )}
                </div>
                {user.email && (
                  <p className="text-xs text-cinematic-400 font-mono mt-0.5">{user.email}</p>
                )}
                <p className="text-xs text-cinematic-500 font-mono mt-1">ID: {user.id}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-cinematic-800 hover:bg-rose-500/20 text-cinematic-300 hover:text-rose-300 border border-cinematic-700 hover:border-rose-500/40 text-xs font-semibold transition-all"
            >
              Log Out
            </button>
          </div>

          {/* Personal Watchlist */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bookmark className="w-5 h-5 text-brand-violet" />
              <h3 className="font-display font-bold text-lg text-white">
                Saved Watchlist ({watchlist.length})
              </h3>
            </div>

            {watchlist.length === 0 ? (
              <p className="text-xs text-cinematic-500 p-8 rounded-2xl bg-cinematic-900/40 border border-cinematic-800 text-center">
                Your watchlist is currently empty. Explore titles in the Discover page to save movies for later watch parties!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {watchlist.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-cinematic-900/80 border border-cinematic-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.posterPath}
                        alt={item.movieTitle}
                        className="w-12 h-16 object-cover rounded-xl bg-cinematic-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">{item.movieTitle}</h4>
                        {item.rating && (
                          <span className="text-[10px] text-amber-400 font-bold">
                            ★ {item.rating}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleWatchInRoom(item)}
                        className="p-2 rounded-xl bg-brand-violet hover:bg-brand-violetDark text-white text-xs font-bold transition-all"
                        title="Start watch party with this movie"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => handleRemoveWatchlist(item.movieId)}
                        className="p-2 rounded-xl text-cinematic-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Sign In / Guest Creation View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Member Authentication Form */}
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-cinematic-800">
            <div className="flex items-center border-b border-cinematic-800 pb-3 mb-6 gap-2">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  authMode === 'login'
                    ? 'bg-brand-violet text-white'
                    : 'text-cinematic-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  authMode === 'register'
                    ? 'bg-brand-violet text-white'
                    : 'text-cinematic-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cinematic-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-cinematic-950 border border-cinematic-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
                  required
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-cinematic-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-cinematic-950 border border-cinematic-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-cinematic-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-cinematic-950 border border-cinematic-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-brand-violet hover:bg-brand-violetDark text-white text-xs font-bold transition-all shadow-lg shadow-brand-violet/25"
              >
                {isLoading
                  ? 'Processing...'
                  : authMode === 'login'
                  ? 'Sign In to SyncScreen'
                  : 'Register Account'}
              </button>
            </form>
          </div>

          {/* Quick Guest Join Form */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cinematic-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-electric/20 text-brand-electric flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-1">Instant Guest Pass</h3>
              <p className="text-xs text-cinematic-400 mb-6">
                Just want to watch with friends without signing up? Create an instant guest persona in one click.
              </p>

              <form onSubmit={handleCreateGuest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-cinematic-300 mb-1">
                    Your Guest Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jordan"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-cinematic-950 border border-cinematic-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-electric"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !guestName.trim()}
                  className="w-full py-2.5 rounded-xl bg-brand-electric hover:bg-cyan-500 text-black font-extrabold text-xs transition-all"
                >
                  Enter as Guest
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-cinematic-800 text-[11px] text-cinematic-500 font-mono">
              Guest identities are preserved in local storage and can upgrade anytime.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
