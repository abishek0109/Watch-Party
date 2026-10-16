import React, { useState, useEffect } from 'react';
import { History, Camera, Users, Film, Calendar, Play, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [defaultMemories, setDefaultMemories] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      api.getHistory(token)
        .then((data) => setHistoryItems(data))
        .catch(console.warn);
    }

    // Fetch sample memories from demo room SYNC-7777 if available
    api.getRoom('SYNC-7777')
      .then((room) => {
        if (room?.id) {
          api.getMemories(room.id).then((m) => setDefaultMemories(m)).catch(console.warn);
        }
      })
      .catch(console.warn);
  }, [token]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          Watch Party Memories & History
        </h1>
        <p className="text-sm text-cinematic-400 mt-1 max-w-xl">
          Review saved room memories, participants who attended, and memorable scenes bookmarked during live streams.
        </p>
      </div>

      {/* Watch Party Memories Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-brand-coral" />
          <h2 className="font-display font-bold text-xl text-white">Saved Party Memories</h2>
        </div>

        {defaultMemories.length === 0 ? (
          <div className="p-8 rounded-3xl bg-cinematic-900/50 border border-cinematic-800 text-center space-y-3">
            <Camera className="w-10 h-10 text-cinematic-600 mx-auto" />
            <h3 className="font-bold text-sm text-white">No party memories saved yet</h3>
            <p className="text-xs text-cinematic-400 max-w-sm mx-auto">
              When hosting or joining a party, click the 'Memory' button in the room header to archive your session recap!
            </p>
            <Link
              to="/join"
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-brand-violet hover:bg-brand-violetDark text-white font-bold text-xs"
            >
              Join a Watch Room
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {defaultMemories.map((mem) => (
              <div
                key={mem.id}
                className="p-5 rounded-2xl glass-panel-elevated border border-brand-violet/30 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-coral uppercase tracking-wider">
                      {mem.roomName}
                    </span>
                    <span className="text-[10px] text-cinematic-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(mem.memoryDate).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-brand-electricBlue shrink-0" />
                    <span>{mem.movieTitle}</span>
                  </h3>

                  {mem.notes && (
                    <p className="text-xs text-cinematic-300 italic bg-cinematic-950/60 p-3 rounded-xl border border-cinematic-800/80 mt-2">
                      "{mem.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-cinematic-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-cinematic-400">
                    <Users className="w-3.5 h-3.5 text-brand-violet" />
                    <span>{mem.participantCount} Participants attended</span>
                  </div>

                  <Link
                    to={`/room/${mem.roomId}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-violet/20 hover:bg-brand-violet text-brand-violet hover:text-white text-xs font-bold transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" /> Re-open Room
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Watch History */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-brand-gold" />
          <h2 className="font-display font-bold text-xl text-white">Recent Screening History</h2>
        </div>

        {historyItems.length === 0 ? (
          <p className="text-xs text-cinematic-500 p-6 rounded-2xl bg-cinematic-900/30 border border-cinematic-800 text-center">
            Your recent watch history will populate automatically as you watch movies with friends.
          </p>
        ) : (
          <div className="space-y-2.5">
            {historyItems.map((h) => (
              <div
                key={h.id}
                className="p-3.5 rounded-xl bg-cinematic-900/80 border border-cinematic-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cinematic-800 text-brand-electricBlue">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{h.movieTitle}</h4>
                    <p className="text-[10px] text-cinematic-400 font-mono">
                      Watched in {h.roomName} • {new Date(h.watchedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {h.roomId && (
                  <Link
                    to={`/room/${h.roomId}`}
                    className="p-2 rounded-lg bg-cinematic-800 hover:bg-brand-violet text-cinematic-300 hover:text-white transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
