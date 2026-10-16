import { create } from 'zustand';
import {
  AuthoritativePlaybackState,
  Participant,
  PlaylistItem,
  Poll,
  ChatMessage,
  EmojiReaction,
  CinemaMoment,
  RoomDetails,
} from '../../../shared/types';

interface RoomStore {
  roomDetails: RoomDetails | null;
  authoritativeState: AuthoritativePlaybackState | null;
  participants: Participant[];
  playlist: PlaylistItem[];
  activePoll: Poll | null;
  cinemaMoments: CinemaMoment[];
  chatMessages: ChatMessage[];
  reactions: EmojiReaction[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  unreadChatCount: number;
  activeTab: 'chat' | 'queue' | 'polls' | 'participants' | 'moments';
  error: string | null;

  setRoomState: (snapshot: any) => void;
  updateAuthoritativePlayback: (state: AuthoritativePlaybackState) => void;
  setParticipants: (participants: Participant[]) => void;
  setPlaylist: (playlist: PlaylistItem[]) => void;
  setActivePoll: (poll: Poll | null) => void;
  setCinemaMoments: (moments: CinemaMoment[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  addReaction: (reaction: EmojiReaction) => void;
  removeReaction: (id: string) => void;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting') => void;
  setActiveTab: (tab: 'chat' | 'queue' | 'polls' | 'participants' | 'moments') => void;
  resetUnreadChat: () => void;
  setError: (err: string | null) => void;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomDetails: null,
  authoritativeState: null,
  participants: [],
  playlist: [],
  activePoll: null,
  cinemaMoments: [],
  chatMessages: [],
  reactions: [],
  connectionStatus: 'disconnected',
  unreadChatCount: 0,
  activeTab: 'chat',
  error: null,

  setRoomState: (snapshot: any) => {
    set({
      roomDetails: snapshot.details,
      authoritativeState: snapshot.playbackState,
      participants: snapshot.participants || [],
      playlist: snapshot.playlist || [],
      activePoll: snapshot.activePoll || null,
      cinemaMoments: snapshot.cinemaMoments || [],
      chatMessages: snapshot.chatHistory || [],
      connectionStatus: 'connected',
      error: null,
    });
  },

  updateAuthoritativePlayback: (state: AuthoritativePlaybackState) => {
    set({ authoritativeState: state });
  },

  setParticipants: (participants: Participant[]) => {
    set({ participants });
  },

  setPlaylist: (playlist: PlaylistItem[]) => {
    set({ playlist });
  },

  setActivePoll: (poll: Poll | null) => {
    set({ activePoll: poll });
  },

  setCinemaMoments: (moments: CinemaMoment[]) => {
    set({ cinemaMoments: moments });
  },

  addChatMessage: (message: ChatMessage) => {
    set((prev) => ({
      chatMessages: [...prev.chatMessages, message],
      unreadChatCount: prev.activeTab === 'chat' ? 0 : prev.unreadChatCount + 1,
    }));
  },

  addReaction: (reaction: EmojiReaction) => {
    set((prev) => ({
      reactions: [...prev.reactions.slice(-15), reaction],
    }));
  },

  removeReaction: (id: string) => {
    set((prev) => ({
      reactions: prev.reactions.filter((r) => r.id !== id),
    }));
  },

  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
  },

  setActiveTab: (tab) => {
    set({
      activeTab: tab,
      unreadChatCount: tab === 'chat' ? 0 : get().unreadChatCount,
    });
  },

  resetUnreadChat: () => {
    set({ unreadChatCount: 0 });
  },

  setError: (err) => {
    set({ error: err });
  },

  leaveRoom: () => {
    set({
      roomDetails: null,
      authoritativeState: null,
      participants: [],
      playlist: [],
      activePoll: null,
      cinemaMoments: [],
      chatMessages: [],
      reactions: [],
      connectionStatus: 'disconnected',
      unreadChatCount: 0,
      error: null,
    });
  },
}));
