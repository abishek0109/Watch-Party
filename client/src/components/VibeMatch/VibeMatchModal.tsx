import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Flame, Plus, X, Users, Compass } from 'lucide-react';
import { socketService } from '../../services/socket';
import { SOCKET_EVENTS, VibeRecommendation } from '../../../../shared/types';
import { useRoomStore } from '../../store/useRoomStore';

const VIBE_TAGS = [
  'Sci-Fi',
  'Animation',
  'Comedy',
  'Action',
  'Cyberpunk',
  'Fantasy',
  'Thriller',
  'Mystery',
  'Documentary',
  'Adventure',
];

interface VibeMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VibeMatchModal: React.FC<VibeMatchModalProps> = ({ isOpen, onClose }) => {
  const participants = useRoomStore((state) => state.participants);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [results, setResults] = useState<{
    submissionsCount: number;
    totalParticipants: number;
    recommendations: VibeRecommendation[];
  } | null>(null);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const onResults = (data: any) => {
      setResults(data);
    };

    socket.on(SOCKET_EVENTS.VIBEMATCH_RESULTS, onResults);
    return () => {
      socket.off(SOCKET_EVENTS.VIBEMATCH_RESULTS, onResults);
    };
  }, []);

  if (!isOpen) return null;

  const toggleVibe = (vibe: string) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter((v) => v !== vibe));
    } else {
      if (selectedVibes.length < 3) {
        setSelectedVibes([...selectedVibes, vibe]);
      }
    }
  };

  const handleSubmitVibes = () => {
    if (selectedVibes.length === 0) return;
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.VIBEMATCH_SUBMIT, { vibes: selectedVibes });
      setHasSubmitted(true);
    }
  };

  const handleQueueMovie = (movie: VibeRecommendation) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.PLAYLIST_ADD, {
        title: movie.title,
        url: movie.url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoType: 'html5',
        duration: 596,
        posterUrl: movie.posterUrl,
        overview: movie.overview,
        genres: movie.genres,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-panel-elevated rounded-2xl p-6 border border-brand-violet/40 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cinematic-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-electric text-white shadow-lg shadow-brand-violet/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                VibeMatch AI
                <span className="text-[10px] font-mono uppercase bg-brand-violet/20 text-brand-violet px-2 py-0.5 rounded-full border border-brand-violet/30">
                  Group Recommendation
                </span>
              </h3>
              <p className="text-xs text-cinematic-400">
                Select your vibe. Our algorithm calculates the group consensus and matches the best movies.
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

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Vibe Selection Step */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cinematic-300">
                Pick up to 3 moods:
              </span>
              <span className="text-xs font-mono text-brand-electricBlue">
                {selectedVibes.length}/3 Selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {VIBE_TAGS.map((vibe) => {
                const isSelected = selectedVibes.includes(vibe);
                return (
                  <button
                    key={vibe}
                    onClick={() => toggleVibe(vibe)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-brand-violet border-brand-violet text-white shadow-md shadow-brand-violet/30 scale-105'
                        : 'bg-cinematic-900 border-cinematic-700/80 text-cinematic-300 hover:text-white hover:border-cinematic-500'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 inline mr-1" />}
                    {vibe}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={handleSubmitVibes}
                disabled={selectedVibes.length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-violet to-brand-electric hover:opacity-95 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-brand-violet/25 transition-all"
              >
                <Flame className="w-4 h-4" />
                {hasSubmitted ? 'Update My Vibes' : 'Submit My Vibes'}
              </button>

              {results && (
                <div className="flex items-center gap-1.5 text-xs text-cinematic-400 font-mono">
                  <Users className="w-4 h-4 text-brand-electricBlue" />
                  <span>
                    {results.submissionsCount} of {participants.length || 1} voted
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* VibeMatch Results Display */}
          {results && results.recommendations.length > 0 && (
            <div className="border-t border-cinematic-800 pt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-electricBlue mb-3 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                Group Consensus Recommendations
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {results.recommendations.map((rec) => (
                  <div
                    key={rec.movieId}
                    className="p-3.5 rounded-xl bg-cinematic-900/80 border border-cinematic-700/60 hover:border-brand-violet/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-2.5">
                        <img
                          src={rec.posterUrl}
                          alt={rec.title}
                          className="w-12 h-16 object-cover rounded-lg bg-cinematic-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-white truncate">{rec.title}</h5>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              {rec.matchScore}% Match
                            </span>
                            <span className="text-[10px] text-cinematic-500">
                              {rec.genres[0]}
                            </span>
                          </div>
                          <p className="text-[11px] text-cinematic-400 line-clamp-2 mt-1">
                            {rec.rationale}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleQueueMovie(rec)}
                      className="w-full mt-2 py-1.5 rounded-lg bg-brand-violet/20 hover:bg-brand-violet text-brand-violet hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Room Queue
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
