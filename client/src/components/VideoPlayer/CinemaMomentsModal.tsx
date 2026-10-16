import React, { useState } from 'react';
import { Bookmark, Clock, X, Plus, Sparkles } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';
import { socketService } from '../../services/socket';
import { SOCKET_EVENTS } from '../../../../shared/types';

interface CinemaMomentsModalProps {
  currentTime: number;
  isOpen: boolean;
  onClose: () => void;
  onSeekTo: (timestamp: number) => void;
}

export const CinemaMomentsModal: React.FC<CinemaMomentsModalProps> = ({
  currentTime,
  isOpen,
  onClose,
  onSeekTo,
}) => {
  const cinemaMoments = useRoomStore((state) => state.cinemaMoments);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleAddMoment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.CINEMA_MOMENT_ADD, {
        timestamp: currentTime,
        label: label.trim(),
        note: note.trim() || undefined,
      });
      setLabel('');
      setNote('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel-elevated rounded-2xl p-6 border border-brand-violet/40 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-cinematic-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-violet/20 text-brand-violet">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Cinema Moments</h3>
              <p className="text-xs text-cinematic-400">
                Synchronized memory bookmarks at memorable timestamps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cinematic-400 hover:text-white hover:bg-cinematic-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form to bookmark current timestamp */}
        <form onSubmit={handleAddMoment} className="mb-6 p-4 rounded-xl bg-cinematic-900/80 border border-cinematic-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-brand-electricBlue flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Bookmark Timestamp: {formatTime(currentTime)}
            </span>
            <span className="text-[10px] text-cinematic-500 uppercase tracking-wider">Live Time</span>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Moment Title (e.g. 'Epic Plot Twist' or 'Hilarious Scene')"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-cinematic-950 border border-cinematic-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
              required
            />
            <input
              type="text"
              placeholder="Optional short note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-cinematic-950 border border-cinematic-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
            />
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-brand-violet to-brand-electric hover:opacity-95 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-violet/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Save Moment at {formatTime(currentTime)}
            </button>
          </div>
        </form>

        {/* Moments List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-cinematic-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
            Bookmarked Moments ({cinemaMoments.length})
          </h4>

          {cinemaMoments.length === 0 ? (
            <p className="text-xs text-cinematic-500 text-center py-6 bg-cinematic-900/40 rounded-xl border border-dashed border-cinematic-800">
              No moments saved yet. Bookmark favorite scenes while watching!
            </p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {cinemaMoments.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-cinematic-900/60 hover:bg-cinematic-850 border border-cinematic-800 transition-colors group"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white truncate">{m.label}</span>
                      <span className="text-[10px] text-cinematic-500 font-mono">
                        by {m.createdByName}
                      </span>
                    </div>
                    {m.note && <p className="text-[11px] text-cinematic-400 truncate mt-0.5">{m.note}</p>}
                  </div>
                  <button
                    onClick={() => {
                      onSeekTo(m.timestamp);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-violet/10 hover:bg-brand-violet text-brand-violet hover:text-white font-mono text-xs font-bold transition-all shrink-0"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(m.timestamp)}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
