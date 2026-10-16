import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tv, Key, User, Lock, ArrowRight, Play, Users, Globe, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, createGuest } = useAuthStore();

  const codeParam = searchParams.get('code') || '';

  const [roomCode, setRoomCode] = useState(codeParam);
  const [displayName, setDisplayName] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [publicRooms, setPublicRooms] = useState<any[]>([]);

  useEffect(() => {
    // Fetch public rooms
    api.getPublicRooms()
      .then((data) => setPublicRooms(data))
      .catch((err) => console.warn('Could not fetch public rooms:', err));
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    setIsJoining(true);
    setError(null);

    try {
      // Create guest session if not signed in
      if (!user) {
        await createGuest(displayName.trim() || `Guest_${Math.floor(1000 + Math.random() * 9000)}`);
      }

      // Check room and verify password if needed
      const room = await api.getRoom(roomCode.trim(), password || undefined);
      navigate(`/room/${room.id}`);
    } catch (err: any) {
      if (err.message === 'Password required' || err.isPasswordProtected) {
        setNeedsPassword(true);
        setError('This room is password protected. Please enter the password.');
      } else {
        setError(err.message || 'Room not found or unavailable');
      }
      setIsJoining(false);
    }
  };

  const handleJoinDirect = (r: any) => {
    setRoomCode(r.roomCode);
    if (r.isPasswordProtected) {
      setNeedsPassword(true);
    } else {
      navigate(`/room/${r.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <div className="max-w-xl mx-auto glass-panel-elevated rounded-3xl p-6 sm:p-10 border border-brand-violet/40 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-coral/20 text-brand-coral flex items-center justify-center mx-auto mb-3">
            <Tv className="w-6 h-6" />
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Join a Watch Party
          </h1>
          <p className="text-xs sm:text-sm text-cinematic-400 mt-1">
            Enter a room code or browse active public rooms below.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-cinematic-200 mb-1.5 uppercase tracking-wider">
              Room Code or Link ID
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinematic-500" />
              <input
                type="text"
                placeholder="e.g. SYNC-7777 or Room ID"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value);
                  setError(null);
                }}
                className="w-full bg-cinematic-950 border border-cinematic-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet font-mono uppercase"
                required
              />
            </div>
          </div>

          {!user && (
            <div>
              <label className="block text-xs font-bold text-cinematic-200 mb-1.5 uppercase tracking-wider">
                Your Display Name (Guest)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinematic-500" />
                <input
                  type="text"
                  placeholder="e.g. Sarah"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-cinematic-950 border border-cinematic-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
                  required
                />
              </div>
            </div>
          )}

          {needsPassword && (
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Room Password
              </label>
              <input
                type="password"
                placeholder="Enter room password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-cinematic-950 border border-amber-500/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-brand-violet to-brand-electric hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-violet/25 transition-all mt-2"
          >
            <span>{isJoining ? 'Joining Room...' : 'Join Watch Party'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Public Watch Rooms Showcase */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-brand-electricBlue" />
          <h2 className="font-display font-bold text-lg text-white">Active Public Rooms</h2>
        </div>

        {publicRooms.length === 0 ? (
          <p className="text-xs text-cinematic-500 bg-cinematic-900/50 p-6 rounded-2xl border border-cinematic-800 text-center">
            No public rooms currently active. Be the first to start a party!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {publicRooms.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-cinematic-900/70 border border-cinematic-800 hover:border-brand-violet/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-bold text-brand-violet bg-brand-violet/10 px-2 py-0.5 rounded-full border border-brand-violet/20">
                      {r.roomCode}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      LIVE
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white truncate">{r.name}</h3>
                  <p className="text-xs text-cinematic-400 truncate mt-0.5">
                    Streaming: {r.videoTitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-cinematic-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-cinematic-400 font-mono flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-brand-coral" />
                    {r.participantCount} / {r.maxParticipants}
                  </span>
                  <button
                    onClick={() => handleJoinDirect(r)}
                    className="px-3 py-1.5 rounded-lg bg-brand-violet/20 hover:bg-brand-violet text-brand-violet hover:text-white text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" /> Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
