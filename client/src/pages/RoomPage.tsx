import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Share2,
  Sparkles,
  Camera,
  MessageSquare,
  ListVideo,
  Vote,
  Users,
  Copy,
  Check,
  Radio,
  WifiOff,
  LogOut,
} from 'lucide-react';
import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';
import { socketService } from '../services/socket';
import { SOCKET_EVENTS } from '../../../shared/types';
import { VideoPlayer } from '../components/VideoPlayer/VideoPlayer';
import { ChatPanel } from '../components/Chat/ChatPanel';
import { QueuePanel } from '../components/Queue/QueuePanel';
import { PollsPanel } from '../components/Polls/PollsPanel';
import { ParticipantsList } from '../components/Participants/ParticipantsList';
import { VibeMatchModal } from '../components/VibeMatch/VibeMatchModal';
import { MemoriesModal } from '../components/Memories/MemoriesModal';

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const { user, createGuest } = useAuthStore();
  const {
    roomDetails,
    connectionStatus,
    activeTab,
    unreadChatCount,
    setRoomState,
    updateAuthoritativePlayback,
    setParticipants,
    setPlaylist,
    setActivePoll,
    setCinemaMoments,
    addChatMessage,
    addReaction,
    setConnectionStatus,
    setActiveTab,
    leaveRoom,
  } = useRoomStore();

  const [copiedLink, setCopiedLink] = useState(false);
  const [isVibeMatchOpen, setIsVibeMatchOpen] = useState(false);
  const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;

    async function initRoomConnection() {
      // If user isn't logged in, initialize guest
      let currentUser = user;
      if (!currentUser) {
        try {
          currentUser = await createGuest(`Guest_${Math.floor(1000 + Math.random() * 9000)}`);
        } catch (e) {
          console.warn('Guest creation error:', e);
        }
      }

      setConnectionStatus('connecting');
      const socket = socketService.connect();

      // Setup Listeners
      socket.on('connect', () => {
        if (!isMounted) return;
        setConnectionStatus('connected');
        socket.emit(
          SOCKET_EVENTS.ROOM_JOIN,
          {
            roomId,
            userId: currentUser?.id,
            displayName: currentUser?.username || 'Guest',
            avatarUrl: currentUser?.avatarUrl,
            isGuest: currentUser?.isGuest ?? true,
          },
          (res: any) => {
            if (res?.error) {
              console.error('Room Join Error:', res.error);
            }
          }
        );
      });

      socket.on(SOCKET_EVENTS.ROOM_STATE, (snapshot: any) => {
        if (!isMounted) return;
        setRoomState(snapshot);
      });

      socket.on(SOCKET_EVENTS.ROOM_PARTICIPANTS, (participantsList: any) => {
        if (!isMounted) return;
        setParticipants(participantsList);
      });

      socket.on(SOCKET_EVENTS.PLAYBACK_STATE, (state: any) => {
        if (!isMounted) return;
        updateAuthoritativePlayback(state);
      });

      socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (msg: any) => {
        if (!isMounted) return;
        addChatMessage(msg);
      });

      socket.on(SOCKET_EVENTS.REACTION_NEW, (reaction: any) => {
        if (!isMounted) return;
        addReaction(reaction);
      });

      socket.on(SOCKET_EVENTS.PLAYLIST_UPDATE, (playlist: any) => {
        if (!isMounted) return;
        setPlaylist(playlist);
      });

      socket.on(SOCKET_EVENTS.POLL_UPDATE, (poll: any) => {
        if (!isMounted) return;
        setActivePoll(poll);
      });

      socket.on(SOCKET_EVENTS.CINEMA_MOMENTS_UPDATE, (moments: any) => {
        if (!isMounted) return;
        setCinemaMoments(moments);
      });

      socket.on('disconnect', (reason) => {
        if (!isMounted) return;
        setConnectionStatus('reconnecting');
      });

      // If socket already connected, emit immediately
      if (socket.connected) {
        socket.emit(SOCKET_EVENTS.ROOM_JOIN, {
          roomId,
          userId: currentUser?.id,
          displayName: currentUser?.username || 'Guest',
          avatarUrl: currentUser?.avatarUrl,
          isGuest: currentUser?.isGuest ?? true,
        });
      }
    }

    initRoomConnection();

    return () => {
      isMounted = false;
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit(SOCKET_EVENTS.ROOM_LEAVE);
        socketService.disconnect();
      }
      leaveRoom();
    };
  }, [roomId]);

  const handleCopyInvitation = () => {
    const inviteUrl = window.location.href;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleExitRoom = () => {
    navigate('/');
  };

  return (
    <div className="max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-4">
      {/* Top Room Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl glass-panel border border-cinematic-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-violet/20 flex items-center justify-center text-brand-violet">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-base sm:text-lg text-white truncate max-w-xs sm:max-w-md">
                {roomDetails?.name || 'Watch Party Room'}
              </h1>
              {roomDetails?.roomCode && (
                <span className="font-mono text-xs font-bold text-brand-electricBlue bg-brand-electricBlue/15 px-2.5 py-0.5 rounded-full border border-brand-electricBlue/30">
                  {roomDetails.roomCode}
                </span>
              )}
            </div>
            <p className="text-[11px] text-cinematic-400 truncate max-w-sm">
              {roomDetails?.description || 'Synchronized live party'}
            </p>
          </div>
        </div>

        {/* Room Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Share Invitation Link */}
          <button
            onClick={handleCopyInvitation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              copiedLink
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-cinematic-850 hover:bg-cinematic-800 text-cinematic-200 border-cinematic-700/80'
            }`}
            title="Copy invitation link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Invite Friends'}</span>
          </button>

          {/* VibeMatch Modal Trigger */}
          <button
            onClick={() => setIsVibeMatchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-violet to-brand-electric text-white text-xs font-bold shadow-md shadow-brand-violet/20 hover:opacity-90 transition-all"
            title="Group Movie Mood Recommendations"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">VibeMatch</span>
          </button>

          {/* Watch Party Memory Trigger */}
          <button
            onClick={() => setIsMemoriesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cinematic-850 hover:bg-cinematic-800 text-brand-coral border border-brand-coral/30 text-xs font-bold transition-all"
            title="Save Party Memory"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Memory</span>
          </button>

          {/* Exit Room */}
          <button
            onClick={handleExitRoom}
            className="p-2 rounded-xl text-cinematic-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Leave Watch Party"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Theatre Grid: Video Player on Left, Collaboration Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-185px)] min-h-[600px]">
        {/* Left Video Area (8 cols on desktop) */}
        <div className="lg:col-span-8 flex flex-col justify-center">
          <VideoPlayer />
        </div>

        {/* Right Collaboration Panel (4 cols on desktop) */}
        <div className="lg:col-span-4 flex flex-col h-full bg-cinematic-950/70 rounded-2xl border border-cinematic-800/80 overflow-hidden shadow-xl">
          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-cinematic-800/80 bg-cinematic-900/60 p-1.5 gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 relative transition-all ${
                activeTab === 'chat'
                  ? 'bg-brand-violet text-white shadow-md shadow-brand-violet/20'
                  : 'text-cinematic-400 hover:text-white hover:bg-cinematic-800/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
              {unreadChatCount > 0 && activeTab !== 'chat' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-coral text-white text-[9px] flex items-center justify-center font-bold animate-pulse">
                  {unreadChatCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'queue'
                  ? 'bg-brand-violet text-white shadow-md shadow-brand-violet/20'
                  : 'text-cinematic-400 hover:text-white hover:bg-cinematic-800/50'
              }`}
            >
              <ListVideo className="w-3.5 h-3.5" />
              <span>Queue</span>
            </button>

            <button
              onClick={() => setActiveTab('polls')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'polls'
                  ? 'bg-brand-violet text-white shadow-md shadow-brand-violet/20'
                  : 'text-cinematic-400 hover:text-white hover:bg-cinematic-800/50'
              }`}
            >
              <Vote className="w-3.5 h-3.5" />
              <span>Polls</span>
            </button>

            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'participants'
                  ? 'bg-brand-violet text-white shadow-md shadow-brand-violet/20'
                  : 'text-cinematic-400 hover:text-white hover:bg-cinematic-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 min-h-0">
            {activeTab === 'chat' && <ChatPanel />}
            {activeTab === 'queue' && <QueuePanel />}
            {activeTab === 'polls' && <PollsPanel />}
            {activeTab === 'participants' && <ParticipantsList />}
          </div>
        </div>
      </div>

      {/* VibeMatch Modal */}
      <VibeMatchModal isOpen={isVibeMatchOpen} onClose={() => setIsVibeMatchOpen(false)} />

      {/* Watch Party Memories Modal */}
      <MemoriesModal isOpen={isMemoriesOpen} onClose={() => setIsMemoriesOpen(false)} />
    </div>
  );
};
