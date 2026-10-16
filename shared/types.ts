// SyncScreen Shared Types and Real-time Protocol Definitions

export type PlaybackStatus = 'playing' | 'paused' | 'buffering';

export type VideoType = 'html5' | 'youtube';

export interface AuthoritativePlaybackState {
  roomId: string;
  videoId: string;
  videoUrl: string;
  videoTitle: string;
  videoType: VideoType;
  status: PlaybackStatus;
  currentTime: number; // in seconds
  duration: number; // in seconds
  playbackRate: number; // e.g. 1.0
  lastUpdatedServerTime: number; // epoch ms (Server Clock)
  version: number; // monotonically increasing counter
  hostId: string;
  hostName: string;
}

export interface Participant {
  id: string; // Socket or User ID
  userId?: string;
  displayName: string;
  avatarUrl: string;
  isHost: boolean;
  isGuest: boolean;
  joinedAt: number;
  lastPing?: number;
  currentDriftMs?: number;
  clientPlaybackStatus?: PlaybackStatus;
}

export interface RoomSettings {
  isPublic: boolean;
  isPasswordProtected: boolean;
  password?: string;
  maxParticipants: number;
  controlMode: 'host-only' | 'collaborative'; // who can play/pause/seek
  allowGuestVoting: boolean;
}

export interface RoomDetails {
  id: string; // e.g. uuid
  roomCode: string; // e.g. "SYNC-7489"
  name: string;
  description?: string;
  createdAt: number;
  hostId: string;
  settings: RoomSettings;
  playbackState: AuthoritativePlaybackState;
  participants: Participant[];
  playlist: PlaylistItem[];
  activePoll?: Poll | null;
}

export interface PlaylistItem {
  id: string;
  roomId: string;
  title: string;
  url: string;
  videoType: VideoType;
  duration: number;
  posterUrl?: string;
  overview?: string;
  genres?: string[];
  addedBy: {
    id: string;
    displayName: string;
  };
  votes: string[]; // user IDs who upvoted
  addedAt: number;
}

export interface PollOption {
  id: string;
  text: string;
  movieData?: {
    id: string | number;
    title: string;
    posterUrl: string;
    url?: string;
    overview?: string;
  };
  votes: string[]; // user IDs who voted
}

export interface Poll {
  id: string;
  roomId: string;
  question: string;
  options: PollOption[];
  createdBy: {
    id: string;
    displayName: string;
  };
  durationSeconds: number;
  createdAt: number;
  endsAt: number;
  closed: boolean;
  winningOptionId?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  avatarUrl: string;
  message: string;
  timestamp: number;
  isSpoiler?: boolean;
  systemMessage?: boolean;
}

export interface EmojiReaction {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  emoji: string;
  timestamp: number;
  xOffsetRatio: number; // 0.1 to 0.9 for visual spread
}

export interface CinemaMoment {
  id: string;
  roomId: string;
  timestamp: number; // video timestamp in seconds
  label: string;
  note?: string;
  createdByName: string;
  createdAt: number;
}

export interface VibeMatchSubmission {
  userId: string;
  userName: string;
  selectedVibes: string[]; // e.g. ["Sci-Fi", "Late Night", "Thrilling"]
  preferredPace?: 'fast' | 'slow' | 'balanced';
}

export interface VibeRecommendation {
  movieId: string | number;
  title: string;
  posterUrl: string;
  overview: string;
  genres: string[];
  matchScore: number; // 0 - 100%
  rationale: string;
  url?: string;
}

export interface SyncHealthMetrics {
  serverClockOffsetMs: number; // clientTime - serverTime
  roundTripTimeMs: number;
  driftMs: number; // local video time - authoritative projected time
  status: 'synced' | 'adjusting' | 'correcting' | 'buffering';
  appliedCorrectionsCount: number;
  lastCorrectionTime?: number;
  authoritativeVersion: number;
}

export interface MovieMetadata {
  id: number | string;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath?: string;
  releaseDate: string;
  voteAverage: number;
  genres: string[];
  trailerUrl?: string;
  playableDemoUrl?: string;
}

// Socket.IO Real-time Events
export const SOCKET_EVENTS = {
  // Room Lifecycle
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_STATE: 'room:state',
  ROOM_PARTICIPANTS: 'room:participants',
  ROOM_ERROR: 'room:error',
  ROOM_SETTINGS_UPDATE: 'room:settings:update',

  // Playback Control
  PLAYBACK_PLAY: 'playback:play',
  PLAYBACK_PAUSE: 'playback:pause',
  PLAYBACK_SEEK: 'playback:seek',
  PLAYBACK_STATE: 'playback:state',
  PLAYBACK_RATE: 'playback:rate',
  PLAYBACK_BUFFERING: 'playback:buffering',
  PLAYBACK_VIDEO_CHANGE: 'playback:video-change',
  PLAYBACK_DRIFT_REPORT: 'playback:drift-report',

  // Host Control
  HOST_TRANSFER: 'host:transfer',
  HOST_CHANGED: 'host:changed',

  // Chat & Social
  CHAT_SEND: 'chat:send',
  CHAT_MESSAGE: 'chat:message',
  REACTION_SEND: 'reaction:send',
  REACTION_NEW: 'reaction:new',

  // Playlist & Polls
  PLAYLIST_ADD: 'playlist:add',
  PLAYLIST_REMOVE: 'playlist:remove',
  PLAYLIST_VOTE: 'playlist:vote',
  PLAYLIST_UPDATE: 'playlist:update',
  POLL_CREATE: 'poll:create',
  POLL_VOTE: 'poll:vote',
  POLL_UPDATE: 'poll:update',
  POLL_END: 'poll:end',

  // Creative Features
  VIBEMATCH_SUBMIT: 'vibematch:submit',
  VIBEMATCH_RESULTS: 'vibematch:results',
  CINEMA_MOMENT_ADD: 'cinema:moment:add',
  CINEMA_MOMENTS_UPDATE: 'cinema:moments:update',

  // Clock Sync / Heartbeat (NTP-style)
  PING_SYNC: 'sync:ping',
  PONG_SYNC: 'sync:pong',
} as const;
