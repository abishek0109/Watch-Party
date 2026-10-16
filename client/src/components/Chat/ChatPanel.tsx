import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertTriangle, Eye, ShieldAlert, Sparkles } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';
import { socketService } from '../../services/socket';
import { SOCKET_EVENTS } from '../../../../shared/types';

export const ChatPanel: React.FC = () => {
  const chatMessages = useRoomStore((state) => state.chatMessages);
  const [inputText, setInputText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.CHAT_SEND, {
        message: inputText.trim(),
        isSpoiler,
      });
      setInputText('');
      setIsSpoiler(false);
    }
  };

  const toggleSpoilerReveal = (id: string) => {
    setRevealedSpoilers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatTimestamp = (epoch: number) => {
    const d = new Date(epoch);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-cinematic-900/60 rounded-2xl border border-cinematic-800/80 overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-cinematic-500">
            <Sparkles className="w-8 h-8 text-brand-violet/40 mb-2" />
            <p className="text-xs font-semibold text-cinematic-400">Welcome to the Live Chat</p>
            <p className="text-[11px] text-cinematic-500 mt-1 max-w-xs">
              Say hi to your watch party! Use the spoiler toggle to hide plot twists.
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            if (msg.systemMessage) {
              return (
                <div
                  key={msg.id}
                  className="text-center py-1 px-3 my-1 rounded-full bg-cinematic-850/80 border border-cinematic-700/40 text-[11px] text-cinematic-400 font-medium max-w-xs mx-auto"
                >
                  {msg.message}
                </div>
              );
            }

            const isRevealed = revealedSpoilers[msg.id];

            return (
              <div key={msg.id} className="flex items-start gap-2.5 group">
                <img
                  src={msg.avatarUrl}
                  alt={msg.senderName}
                  className="w-7 h-7 rounded-full bg-cinematic-800 border border-cinematic-700 object-cover shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-bold text-cinematic-200 truncate">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-cinematic-500 font-mono">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>

                  {/* Message Body with Spoiler Protection */}
                  {msg.isSpoiler && !isRevealed ? (
                    <div
                      onClick={() => toggleSpoilerReveal(msg.id)}
                      className="cursor-pointer p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-all text-xs text-amber-300 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-semibold text-[11px]">Spoiler Warning</span>
                      </div>
                      <span className="text-[10px] text-amber-400/80 font-mono flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Click to reveal
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`text-xs text-cinematic-100 break-words leading-relaxed ${
                        msg.isSpoiler
                          ? 'p-2 rounded-xl bg-amber-500/10 border border-amber-500/30'
                          : ''
                      }`}
                    >
                      {msg.isSpoiler && (
                        <div className="text-[9px] uppercase font-bold text-amber-400 tracking-wider mb-1 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Revealed Spoiler:
                        </div>
                      )}
                      {msg.message}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form with Spoiler-Safe Toggle */}
      <form onSubmit={handleSend} className="p-3 bg-cinematic-950/90 border-t border-cinematic-800/80">
        <div className="flex items-center justify-between mb-2 px-1">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-cinematic-400 cursor-pointer select-none hover:text-amber-300 transition-colors">
            <input
              type="checkbox"
              checked={isSpoiler}
              onChange={(e) => setIsSpoiler(e.target.checked)}
              className="rounded bg-cinematic-800 border-cinematic-700 text-amber-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
            />
            <AlertTriangle className={`w-3.5 h-3.5 ${isSpoiler ? 'text-amber-400' : 'text-cinematic-500'}`} />
            <span className={isSpoiler ? 'text-amber-300 font-bold' : ''}>Spoiler-Safe Blur</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Send a chat message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-cinematic-900 border border-cinematic-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-xl bg-brand-violet hover:bg-brand-violetDark disabled:opacity-40 disabled:hover:bg-brand-violet text-white transition-all transform active:scale-95 shadow-md shadow-brand-violet/20"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
