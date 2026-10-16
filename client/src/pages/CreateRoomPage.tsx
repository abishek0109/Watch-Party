import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Globe,
  Sliders,
  Play,
  Film,
  Users,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { DEMO_MOVIES } from '../services/movieCatalog';

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, createGuest } = useAuthStore();

  const preselectedMovie = location.state?.initialMovie;

  const [name, setName] = useState('Sci-Fi & Cinema Premiere');
  const [description, setDescription] = useState('Real-time synchronized group screening with live chat.');
  const [hostName, setHostName] = useState(user?.username || 'Alex');
  const [isPublic, setIsPublic] = useState(true);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(25);
  const [controlMode, setControlMode] = useState<'collaborative' | 'host-only'>('collaborative');
  const [selectedMovieIndex, setSelectedMovieIndex] = useState(0);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [customVideoTitle, setCustomVideoTitle] = useState('');
  const [useCustomVideo, setUseCustomVideo] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      // If user is not logged in, create guest identity automatically
      let activeToken = token;
      if (!user) {
        const guestUser = await createGuest(hostName.trim() || 'Host');
        activeToken = localStorage.getItem('syncscreen_token');
      }

      let initialVideo: any = preselectedMovie;
      if (!initialVideo) {
        if (useCustomVideo && customVideoUrl.trim()) {
          initialVideo = {
            title: customVideoTitle.trim() || 'Custom Stream',
            url: customVideoUrl.trim(),
            videoType: 'html5',
          };
        } else {
          const m = DEMO_MOVIES[selectedMovieIndex];
          initialVideo = {
            title: m.title,
            url: m.playableDemoUrl,
            posterUrl: m.posterPath,
            videoType: 'html5',
          };
        }
      }

      const room = await api.createRoom(
        {
          name: name.trim(),
          description: description.trim(),
          isPublic,
          isPasswordProtected,
          password: isPasswordProtected ? password : undefined,
          maxParticipants,
          controlMode,
          allowGuestVoting: true,
          hostName: hostName.trim() || 'Host',
          initialVideo,
        },
        activeToken || undefined
      );

      navigate(`/room/${room.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-10 border border-brand-violet/40 shadow-2xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-violet/20 border border-brand-violet/30 text-brand-violet text-xs font-semibold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Host Authority & Synchronized Playback</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Create a Watch Party Room
          </h1>
          <p className="text-xs sm:text-sm text-cinematic-400 mt-1">
            Configure permissions, invitations, and initial video source for your participants.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          {/* General Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-cinematic-200 mb-1.5 uppercase tracking-wider">
                Party Room Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-cinematic-950 border border-cinematic-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cinematic-200 mb-1.5 uppercase tracking-wider">
                Your Display Name (Host)
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full bg-cinematic-950 border border-cinematic-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-cinematic-200 mb-1.5 uppercase tracking-wider">
              Room Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-cinematic-950 border border-cinematic-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
            />
          </div>

          {/* Privacy & Control Settings */}
          <div className="p-4 rounded-2xl bg-cinematic-900/80 border border-cinematic-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-electricBlue flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Room Access & Authority
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Public vs Private */}
              <div>
                <label className="block text-xs font-semibold text-cinematic-300 mb-2">
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      isPublic
                        ? 'bg-brand-violet text-white border-brand-violet'
                        : 'bg-cinematic-950 text-cinematic-400 border-cinematic-700'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" /> Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      !isPublic
                        ? 'bg-brand-violet text-white border-brand-violet'
                        : 'bg-cinematic-950 text-cinematic-400 border-cinematic-700'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" /> Private
                  </button>
                </div>
              </div>

              {/* Control Mode */}
              <div>
                <label className="block text-xs font-semibold text-cinematic-300 mb-2">
                  Playback Control
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setControlMode('collaborative')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      controlMode === 'collaborative'
                        ? 'bg-brand-electric text-black border-brand-electric font-black'
                        : 'bg-cinematic-950 text-cinematic-400 border-cinematic-700'
                    }`}
                  >
                    Shared Control
                  </button>
                  <button
                    type="button"
                    onClick={() => setControlMode('host-only')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      controlMode === 'host-only'
                        ? 'bg-brand-violet text-white border-brand-violet'
                        : 'bg-cinematic-950 text-cinematic-400 border-cinematic-700'
                    }`}
                  >
                    Host-Only
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Room Password */}
            <div className="pt-2 border-t border-cinematic-800">
              <label className="flex items-center gap-2 text-xs font-semibold text-cinematic-300 mb-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPasswordProtected}
                  onChange={(e) => setIsPasswordProtected(e.target.checked)}
                  className="rounded bg-cinematic-950 border-cinematic-700 text-brand-violet focus:ring-0"
                />
                <span>Password protect this room</span>
              </label>

              {isPasswordProtected && (
                <input
                  type="password"
                  placeholder="Enter private room password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-cinematic-950 border border-cinematic-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
                  required={isPasswordProtected}
                />
              )}
            </div>

            {/* Capacity */}
            <div className="flex items-center justify-between pt-2 border-t border-cinematic-800 text-xs">
              <span className="text-cinematic-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-coral" />
                Room Capacity:
              </span>
              <div className="flex items-center gap-2">
                {[10, 25, 50].map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setMaxParticipants(cap)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${
                      maxParticipants === cap
                        ? 'bg-brand-violet text-white border-brand-violet'
                        : 'bg-cinematic-950 text-cinematic-400 border-cinematic-700'
                    }`}
                  >
                    {cap} Users
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Initial Video Selection */}
          {!preselectedMovie && (
            <div className="p-4 rounded-2xl bg-cinematic-900/80 border border-cinematic-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  Initial Premiere Video
                </h3>
                <button
                  type="button"
                  onClick={() => setUseCustomVideo(!useCustomVideo)}
                  className="text-xs font-semibold text-brand-violet hover:text-white"
                >
                  {useCustomVideo ? 'Choose from Catalog' : '+ Use Custom Video URL'}
                </button>
              </div>

              {useCustomVideo ? (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    placeholder="Custom Video Title (e.g. 'Team Showcase Stream')"
                    value={customVideoTitle}
                    onChange={(e) => setCustomVideoTitle(e.target.value)}
                    className="w-full bg-cinematic-950 border border-cinematic-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
                  />
                  <input
                    type="url"
                    placeholder="Direct media stream URL (MP4, WebM, HLS)..."
                    value={customVideoUrl}
                    onChange={(e) => setCustomVideoUrl(e.target.value)}
                    className="w-full bg-cinematic-950 border border-cinematic-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
                    required={useCustomVideo}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {DEMO_MOVIES.slice(0, 4).map((m, idx) => {
                    const isSelected = selectedMovieIndex === idx;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMovieIndex(idx)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-brand-violet/20 border-brand-violet shadow-lg shadow-brand-violet/10'
                            : 'bg-cinematic-950 border-cinematic-800 hover:border-cinematic-700'
                        }`}
                      >
                        <img
                          src={m.posterPath}
                          alt={m.title}
                          className="w-full aspect-[2/3] object-cover rounded-lg bg-cinematic-800 mb-1.5"
                        />
                        <p className="text-xs font-bold text-white truncate">{m.title}</p>
                        <p className="text-[10px] text-cinematic-500 font-mono">{m.genres[0]}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-violet to-brand-electric hover:opacity-95 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-violet/25 transform hover:-translate-y-0.5 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            {isCreating ? 'Launching Watch Room...' : 'Launch Watch Party Room'}
          </button>
        </form>
      </div>
    </div>
  );
};
