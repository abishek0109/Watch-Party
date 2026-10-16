import React, { useState, useEffect } from 'react';
import { Vote, Clock, Trophy, Plus, CheckCircle, BarChart3, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRoomStore } from '../../store/useRoomStore';
import { socketService } from '../../services/socket';
import { SOCKET_EVENTS } from '../../../../shared/types';
import { DEMO_MOVIES } from '../../services/movieCatalog';

export const PollsPanel: React.FC = () => {
  const activePoll = useRoomStore((state) => state.activePoll);
  const socket = socketService.getSocket();

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(60);

  // Countdown timer for active poll
  useEffect(() => {
    if (!activePoll || activePoll.closed) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.round((activePoll.endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && !activePoll.closed) {
        socketService.getSocket()?.emit(SOCKET_EVENTS.POLL_END);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activePoll]);

  // Trigger confetti when poll closes with winner
  useEffect(() => {
    if (activePoll?.closed && activePoll.winningOptionId) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [activePoll?.closed, activePoll?.winningOptionId]);

  const handleVote = (optionId: string) => {
    if (socket && activePoll && !activePoll.closed) {
      socket.emit(SOCKET_EVENTS.POLL_VOTE, { optionId });
    }
  };

  const handleAddOptionField = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.filter((o) => o.trim() !== '');
    if (!question.trim() || validOptions.length < 2) return;

    if (socket) {
      socket.emit(SOCKET_EVENTS.POLL_CREATE, {
        question: question.trim(),
        options: validOptions.map((text) => ({ text })),
        durationSeconds: duration,
      });
      setQuestion('');
      setOptions(['', '']);
      setIsCreateModalOpen(false);
    }
  };

  // Quick Movie Poll Preset
  const handleCreateMovieBattlePoll = () => {
    if (socket) {
      const m1 = DEMO_MOVIES[0];
      const m2 = DEMO_MOVIES[1];
      socket.emit(SOCKET_EVENTS.POLL_CREATE, {
        question: 'What movie should we watch next?',
        options: [
          { text: m1.title, movieData: { id: m1.id, title: m1.title, posterUrl: m1.posterPath, url: m1.playableDemoUrl } },
          { text: m2.title, movieData: { id: m2.id, title: m2.title, posterUrl: m2.posterPath, url: m2.playableDemoUrl } },
        ],
        durationSeconds: 60,
      });
      setIsCreateModalOpen(false);
    }
  };

  // Calculate total votes
  const totalVotes = activePoll
    ? activePoll.options.reduce((acc, opt) => acc + opt.votes.length, 0)
    : 0;

  return (
    <div className="flex flex-col h-full bg-cinematic-900/60 rounded-2xl border border-cinematic-800/80 overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 border-b border-cinematic-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vote className="w-4 h-4 text-brand-gold" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Group Polls
          </span>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-violet hover:bg-brand-violetDark text-white text-xs font-semibold shadow-md shadow-brand-violet/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Start Poll
        </button>
      </div>

      {/* Poll Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {!activePoll ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-cinematic-500">
            <BarChart3 className="w-8 h-8 text-brand-gold/40 mb-2" />
            <p className="text-xs font-semibold text-cinematic-400">No active poll right now</p>
            <p className="text-[11px] text-cinematic-500 mt-1 max-w-xs mb-4">
              Start a 60-second group vote on what genre or movie to watch next.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-violet/20 hover:bg-brand-violet text-brand-violet hover:text-white text-xs font-bold transition-all"
            >
              Launch Quick Poll
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Poll Status Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-cinematic-800">
              <span className="text-xs font-semibold text-cinematic-300">
                Created by {activePoll.createdBy.displayName}
              </span>
              {!activePoll.closed ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeLeft}s remaining</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Poll Ended</span>
                </div>
              )}
            </div>

            {/* Poll Question */}
            <h3 className="font-display font-bold text-sm text-white">{activePoll.question}</h3>

            {/* Options List */}
            <div className="space-y-2.5">
              {activePoll.options.map((opt) => {
                const isUserChoice = opt.votes.includes(socket?.id || '');
                const isWinner = activePoll.closed && activePoll.winningOptionId === opt.id;
                const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;

                return (
                  <button
                    key={opt.id}
                    disabled={activePoll.closed}
                    onClick={() => handleVote(opt.id)}
                    className={`w-full relative overflow-hidden p-3 rounded-xl border text-left transition-all ${
                      isWinner
                        ? 'bg-amber-500/20 border-amber-500/50 shadow-lg shadow-amber-500/10'
                        : isUserChoice
                        ? 'bg-brand-violet/20 border-brand-violet/60'
                        : 'bg-cinematic-850 border-cinematic-750 hover:border-cinematic-600'
                    }`}
                  >
                    {/* Animated Progress Bar fill */}
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                        isWinner
                          ? 'bg-amber-500/25'
                          : isUserChoice
                          ? 'bg-brand-violet/30'
                          : 'bg-cinematic-700/30'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isUserChoice && <CheckCircle className="w-4 h-4 text-brand-electric shrink-0" />}
                        {isWinner && <Trophy className="w-4 h-4 text-brand-gold shrink-0" />}
                        <span className="text-xs font-bold text-white">{opt.text}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-cinematic-300">
                        {percentage}% ({opt.votes.length})
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-cinematic-500 text-center font-mono pt-2">
              Total Votes: {totalVotes} • Ties break in favor of earlier submission
            </p>
          </div>
        )}
      </div>

      {/* Create Poll Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel-elevated rounded-2xl p-6 border border-brand-violet/40 shadow-2xl">
            <h3 className="font-display font-bold text-lg text-white mb-1">Create Group Poll</h3>
            <p className="text-xs text-cinematic-400 mb-4">
              Ask participants to vote on the next movie or room activity.
            </p>

            <form onSubmit={handleCreatePoll} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-cinematic-300 mb-1">
                  Question
                </label>
                <input
                  type="text"
                  placeholder="What should we watch next?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-cinematic-950 border border-cinematic-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-cinematic-300 mb-1">
                  Options
                </label>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...options];
                        newOpts[idx] = e.target.value;
                        setOptions(newOpts);
                      }}
                      className="w-full bg-cinematic-950 border border-cinematic-700 rounded-lg px-3.5 py-1.5 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet"
                      required
                    />
                  ))}
                </div>
                {options.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddOptionField}
                    className="mt-2 text-[11px] font-semibold text-brand-violet hover:text-white"
                  >
                    + Add another option
                  </button>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCreateMovieBattlePoll}
                  className="flex-1 py-2 rounded-lg bg-cinematic-800 hover:bg-cinematic-700 text-cinematic-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                  Quick Movie Battle
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-brand-violet hover:bg-brand-violetDark text-white text-xs font-bold"
                >
                  Start Poll
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs text-cinematic-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
