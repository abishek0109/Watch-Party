import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Tv, PlusCircle, Compass, History, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [quickCode, setQuickCode] = useState('');

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCode.trim()) {
      navigate(`/join?code=${encodeURIComponent(quickCode.trim())}`);
      setQuickCode('');
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-cinematic-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-electric flex items-center justify-center shadow-lg shadow-brand-violet/25 group-hover:scale-105 transition-transform">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
          <div>
            <span className="font-display font-black text-xl tracking-tight bg-gradient-to-r from-white via-cinematic-100 to-brand-electricBlue bg-clip-text text-transparent">
              SyncScreen
            </span>
            <div className="text-[10px] tracking-widest uppercase font-semibold text-brand-violet font-mono leading-none">
              Live Party
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/discover"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-cinematic-300 hover:text-white hover:bg-cinematic-850 transition-colors"
          >
            <Compass className="w-4 h-4 text-brand-electricBlue" />
            Discover
          </Link>
          <Link
            to="/create-room"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-cinematic-300 hover:text-white hover:bg-cinematic-850 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-brand-violet" />
            Create Party
          </Link>
          <Link
            to="/join"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-cinematic-300 hover:text-white hover:bg-cinematic-850 transition-colors"
          >
            <Tv className="w-4 h-4 text-brand-coral" />
            Join Room
          </Link>
          <Link
            to="/history"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-cinematic-300 hover:text-white hover:bg-cinematic-850 transition-colors"
          >
            <History className="w-4 h-4 text-brand-gold" />
            History
          </Link>
        </nav>

        {/* Quick Join & User Profile */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleQuickJoin} className="hidden sm:flex items-center relative">
            <input
              type="text"
              placeholder="Code: SYNC-XXXX"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              className="bg-cinematic-900/90 border border-cinematic-700/60 rounded-lg px-3 py-1.5 text-xs text-cinematic-100 placeholder-cinematic-500 w-32 focus:w-40 transition-all focus:outline-none focus:border-brand-violet"
            />
            <button
              type="submit"
              className="absolute right-1 text-[11px] font-semibold text-brand-violet hover:text-white px-1.5 py-0.5 rounded bg-brand-violet/20 hover:bg-brand-violet transition-colors"
            >
              Join
            </button>
          </form>

          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-cinematic-850 border border-cinematic-700/60 hover:border-brand-violet transition-all"
            >
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-7 h-7 rounded-full bg-cinematic-800 border border-brand-violet/40 object-cover"
              />
              <span className="text-xs font-medium text-cinematic-200 max-w-[100px] truncate">
                {user.username}
              </span>
              {user.isGuest && (
                <span className="text-[10px] font-semibold bg-cinematic-700 text-cinematic-300 px-1.5 py-0.2 rounded-full">
                  Guest
                </span>
              )}
            </Link>
          ) : (
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-violet hover:bg-brand-violetDark text-white shadow-lg shadow-brand-violet/20 transition-all"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
