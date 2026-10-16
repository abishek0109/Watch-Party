import React, { useEffect } from 'react';
import { useRoomStore } from '../../store/useRoomStore';

export const FloatingReactions: React.FC = () => {
  const reactions = useRoomStore((state) => state.reactions);
  const removeReaction = useRoomStore((state) => state.removeReaction);

  useEffect(() => {
    if (reactions.length === 0) return;
    const timers = reactions.map((r) => {
      return setTimeout(() => {
        removeReaction(r.id);
      }, 3000);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [reactions, removeReaction]);

  if (reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {reactions.map((r) => {
        const leftPercentage = Math.round(r.xOffsetRatio * 100);
        return (
          <div
            key={r.id}
            className="absolute bottom-16 animate-float-up flex flex-col items-center"
            style={{ left: `${leftPercentage}%` }}
          >
            <span className="text-4xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              {r.emoji}
            </span>
            <span className="text-[10px] font-bold text-white/80 bg-black/60 px-1.5 py-0.5 rounded-full mt-1 backdrop-blur-sm">
              {r.senderName}
            </span>
          </div>
        );
      })}
    </div>
  );
};
