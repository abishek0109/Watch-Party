import React, { useState } from 'react';
import { Camera, Calendar, Users, Film, Check, X, BookmarkCheck } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';
import { api } from '../../services/api';

interface MemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoriesModal: React.FC<MemoriesModalProps> = ({ isOpen, onClose }) => {
  const roomDetails = useRoomStore((state) => state.roomDetails);
  const authoritativeState = useRoomStore((state) => state.authoritativeState);
  const participants = useRoomStore((state) => state.participants);

  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !roomDetails) return null;

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.saveMemory(roomDetails.id, {
        notes: notes.trim() || 'Awesome watch party with friends!',
        movieTitle: authoritativeState?.videoTitle || 'Movie Premiere',
        posterUrl: roomDetails.playlist[0]?.posterUrl,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel-elevated rounded-2xl p-6 border border-brand-violet/40 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-cinematic-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand-coral/20 text-brand-coral">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Watch Party Memories</h3>
              <p className="text-xs text-cinematic-400">
                Capture this moment to your watch party history archive.
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

        {/* Recap Preview Card */}
        <div className="p-4 rounded-xl bg-cinematic-900/80 border border-cinematic-800 mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-white">{roomDetails.name}</h4>
            <span className="text-[10px] font-mono font-bold text-brand-violet bg-brand-violet/15 px-2 py-0.5 rounded-full">
              {roomDetails.roomCode}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-cinematic-300">
            <span className="flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-brand-electricBlue" />
              {authoritativeState?.videoTitle || 'Showcase'}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand-coral" />
              {participants.length} Participant{participants.length === 1 ? '' : 's'}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-cinematic-400">
              <Calendar className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString()}
            </span>
          </div>

          {/* Participant Avatars */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-cinematic-800">
            <span className="text-[11px] text-cinematic-500 mr-1">Party:</span>
            {participants.map((p) => (
              <span
                key={p.id}
                className="text-[10px] bg-cinematic-800 text-cinematic-300 px-2 py-0.5 rounded-full border border-cinematic-700/60"
              >
                {p.displayName} {p.isHost && '👑'}
              </span>
            ))}
          </div>
        </div>

        {/* Note input */}
        <form onSubmit={handleSaveMemory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cinematic-300 mb-1.5">
              Party Note & Thoughts
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Watched the season premiere with the crew! Amazing twist at minute 42."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-cinematic-950 border border-cinematic-700 rounded-xl p-3 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving || savedSuccess}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-violet to-brand-coral hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-violet/20 transition-all"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Memory Saved to History!</span>
              </>
            ) : (
              <>
                <BookmarkCheck className="w-4 h-4" />
                <span>{isSaving ? 'Archiving Memory...' : 'Save Watch Party Memory'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
