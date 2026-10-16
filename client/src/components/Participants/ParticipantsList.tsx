import React from 'react';
import { Crown, UserCheck, Shield, ArrowRightLeft } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';
import { socketService } from '../../services/socket';
import { SOCKET_EVENTS } from '../../../../shared/types';

export const ParticipantsList: React.FC = () => {
  const participants = useRoomStore((state) => state.participants);
  const socket = socketService.getSocket();

  const isCurrentUserHost = participants.find((p) => p.id === socket?.id)?.isHost ?? false;

  const handleTransferHost = (targetSocketId: string) => {
    if (socket && isCurrentUserHost) {
      socket.emit(SOCKET_EVENTS.HOST_TRANSFER, { targetSocketId });
    }
  };

  return (
    <div className="flex flex-col h-full bg-cinematic-900/60 rounded-2xl border border-cinematic-800/80 overflow-hidden">
      <div className="p-3.5 border-b border-cinematic-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-brand-electric" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Participants ({participants.length})
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {participants.map((p) => {
          const isYou = p.id === socket?.id;
          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-cinematic-850/80 border border-cinematic-700/50 hover:border-cinematic-600 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <img
                    src={p.avatarUrl}
                    alt={p.displayName}
                    className="w-8 h-8 rounded-full bg-cinematic-800 border border-cinematic-700 object-cover"
                  />
                  {p.isHost && (
                    <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-amber-500 text-black">
                      <Crown className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">{p.displayName}</span>
                    {isYou && (
                      <span className="text-[10px] text-brand-electric font-semibold">(You)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-cinematic-400 font-mono">
                    <span>{p.isHost ? 'Host' : 'Viewer'}</span>
                    {p.currentDriftMs !== undefined && (
                      <span
                        className={
                          Math.abs(p.currentDriftMs) < 150
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }
                      >
                        • {p.currentDriftMs > 0 ? `+${p.currentDriftMs}ms` : `${p.currentDriftMs}ms`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Host Transfer Option */}
              {isCurrentUserHost && !p.isHost && (
                <button
                  onClick={() => handleTransferHost(p.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cinematic-800 hover:bg-brand-violet text-cinematic-300 hover:text-white text-[11px] font-semibold transition-colors"
                  title="Make Host"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span className="hidden sm:inline">Make Host</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
