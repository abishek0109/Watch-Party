import React, { useState } from 'react';
import { ListVideo, ThumbsUp, Play, Plus, Trash2, Film, Check } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';
import { socketService } from '../../services/socket';
import { SOCKET_EVENTS } from '../../../../shared/types';
import { DEMO_MOVIES } from '../../services/movieCatalog';

export const QueuePanel: React.FC = () => {
  const playlist = useRoomStore((state) => state.playlist);
  const authoritativeState = useRoomStore((state) => state.authoritativeState);
  const participants = useRoomStore((state) => state.participants);
  const socket = socketService.getSocket();

  const isHost = participants.find((p) => p.id === socket?.id)?.isHost ?? false;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  const handleVote = (itemId: string) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.PLAYLIST_VOTE, { playlistItemId: itemId });
    }
  };

  const handlePlayNow = (item: any) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.PLAYBACK_VIDEO_CHANGE, {
        videoId: item.id,
        videoUrl: item.url,
        videoTitle: item.title,
        videoType: item.videoType || 'html5',
        duration: item.duration,
      });
    }
  };

  const handleRemove = (itemId: string) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.PLAYLIST_REMOVE, { playlistItemId: itemId });
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customUrl.trim()) return;

    if (socket) {
      socket.emit(SOCKET_EVENTS.PLAYLIST_ADD, {
        title: customTitle.trim(),
        url: customUrl.trim(),
        videoType: 'html5',
        duration: 500,
      });
      setCustomTitle('');
      setCustomUrl('');
      setIsAddModalOpen(false);
    }
  };

  const handleAddDemoMovie = (movie: any) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.PLAYLIST_ADD, {
        title: movie.title,
        url: movie.playableDemoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoType: 'html5',
        duration: 596,
        posterUrl: movie.posterPath,
        overview: movie.overview,
        genres: movie.genres,
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-cinematic-900/60 rounded-2xl border border-cinematic-800/80 overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 border-b border-cinematic-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListVideo className="w-4 h-4 text-brand-electricBlue" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Up Next Queue ({playlist.length})
          </span>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-violet hover:bg-brand-violetDark text-white text-xs font-semibold shadow-md shadow-brand-violet/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Video
        </button>
      </div>

      {/* Playlist List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {playlist.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-cinematic-500">
            <Film className="w-8 h-8 text-brand-electricBlue/40 mb-2" />
            <p className="text-xs font-semibold text-cinematic-400">Queue is empty</p>
            <p className="text-[11px] text-cinematic-500 mt-1 max-w-xs">
              Add movies from the catalog or paste an authorized video URL.
            </p>
          </div>
        ) : (
          playlist.map((item, idx) => {
            const isCurrentlyPlaying = authoritativeState?.videoUrl === item.url;
            const hasVoted = item.votes.includes(socket?.id || '');

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isCurrentlyPlaying
                    ? 'bg-brand-violet/15 border-brand-violet/40 shadow-lg shadow-brand-violet/10'
                    : 'bg-cinematic-850/60 border-cinematic-700/40 hover:border-cinematic-600'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-cinematic-800 shrink-0 border border-cinematic-700/60">
                    <img
                      src={
                        item.posterUrl ||
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {isCurrentlyPlaying && (
                      <div className="absolute inset-0 bg-brand-violet/60 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                    <p className="text-[10px] text-cinematic-400 font-mono mt-0.5">
                      Added by {item.addedBy?.displayName || 'Guest'}
                    </p>
                  </div>
                </div>

                {/* Actions: Vote, Play Now, Remove */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleVote(item.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                      hasVoted
                        ? 'bg-brand-electric text-black font-extrabold'
                        : 'bg-cinematic-800 text-cinematic-300 hover:text-white'
                    }`}
                    title="Upvote item"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{item.votes.length}</span>
                  </button>

                  {isHost && !isCurrentlyPlaying && (
                    <button
                      onClick={() => handlePlayNow(item)}
                      className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white transition-all"
                      title="Play this video now"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 rounded-lg text-cinematic-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add to Queue Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel-elevated rounded-2xl p-6 border border-brand-violet/40 shadow-2xl">
            <h3 className="font-display font-bold text-lg text-white mb-1">Add to Room Queue</h3>
            <p className="text-xs text-cinematic-400 mb-4">
              Select a showcase movie or enter a custom authorized direct video stream.
            </p>

            {/* Custom URL Form */}
            <form onSubmit={handleAddCustom} className="mb-5 space-y-2.5">
              <input
                type="text"
                placeholder="Video Title..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-cinematic-950 border border-cinematic-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
              />
              <input
                type="url"
                placeholder="Direct Media URL (MP4, WebM, HLS)..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full bg-cinematic-950 border border-cinematic-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
              />
              <button
                type="submit"
                disabled={!customTitle.trim() || !customUrl.trim()}
                className="w-full py-2 rounded-lg bg-brand-violet hover:bg-brand-violetDark disabled:opacity-40 text-white text-xs font-bold transition-all"
              >
                Add Custom Media URL
              </button>
            </form>

            {/* Quick Demo Catalog Grid */}
            <div className="border-t border-cinematic-800 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cinematic-400 mb-3">
                Quick Add Showcase Titles
              </h4>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {DEMO_MOVIES.slice(0, 6).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleAddDemoMovie(m)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-cinematic-900 hover:bg-cinematic-800 border border-cinematic-800 text-left transition-colors group"
                  >
                    <img
                      src={m.posterPath}
                      alt={m.title}
                      className="w-9 h-12 object-cover rounded bg-cinematic-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-brand-electricBlue">
                        {m.title}
                      </p>
                      <p className="text-[10px] text-cinematic-500">{m.genres[0]}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-cinematic-800 hover:bg-cinematic-700 text-xs font-semibold text-cinematic-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
