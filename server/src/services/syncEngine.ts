import {
  AuthoritativePlaybackState,
  Participant,
  PlaylistItem,
  Poll,
  PollOption,
  CinemaMoment,
  VibeMatchSubmission,
  VibeRecommendation,
  RoomDetails,
  MovieMetadata,
} from '../../../shared/types';
import { prisma } from '../db';
import { DEMO_MOVIES } from '../../../shared/movieCatalog';

export interface RoomRuntimeState {
  details: RoomDetails;
  participants: Map<string, Participant>; // socketId -> Participant
  cinemaMoments: CinemaMoment[];
  vibeSubmissions: Map<string, VibeMatchSubmission>;
  pollTimer: NodeJS.Timeout | null;
  lastPersistTime: number;
}

export class SyncEngine {
  private rooms: Map<string, RoomRuntimeState> = new Map();

  // Project position based on authoritative server clock and playback status
  public computeProjectedPosition(state: AuthoritativePlaybackState, now: number = Date.now()): number {
    if (state.status !== 'playing') {
      return state.currentTime;
    }
    const elapsedSeconds = (now - state.lastUpdatedServerTime) / 1000;
    const projected = state.currentTime + elapsedSeconds * state.playbackRate;
    return Math.max(0, Math.min(state.duration, projected));
  }

  // Get or initialize room in-memory runtime state
  public async getOrCreateRoomState(roomId: string): Promise<RoomRuntimeState> {
    let runtime = this.rooms.get(roomId);
    if (runtime) {
      return runtime;
    }

    // Try loading from Database
    const dbRoom = await prisma.watchRoom.findUnique({
      where: { id: roomId },
      include: {
        playbackState: true,
        participants: true,
        playlist: true,
        polls: {
          include: { options: true },
        },
        cinemaMoments: true,
      },
    });

    const now = Date.now();

    if (dbRoom) {
      const pb = dbRoom.playbackState || {
        videoId: 'demo-1',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoTitle: 'Big Buck Bunny',
        videoType: 'html5',
        status: 'paused',
        currentTime: 0,
        duration: 596,
        playbackRate: 1.0,
        lastUpdatedServerTime: BigInt(now),
        version: 1,
        hostId: dbRoom.hostId,
        hostName: 'Host',
      };

      const authoritativeState: AuthoritativePlaybackState = {
        roomId: dbRoom.id,
        videoId: pb.videoId,
        videoUrl: pb.videoUrl,
        videoTitle: pb.videoTitle,
        videoType: pb.videoType as any,
        status: pb.status as any,
        currentTime: pb.currentTime,
        duration: pb.duration,
        playbackRate: pb.playbackRate,
        lastUpdatedServerTime: Number(pb.lastUpdatedServerTime) || now,
        version: pb.version,
        hostId: pb.hostId,
        hostName: pb.hostName,
      };

      const playlistItems: PlaylistItem[] = dbRoom.playlist.map((item) => ({
        id: item.id,
        roomId: item.roomId,
        title: item.title,
        url: item.url,
        videoType: item.videoType as any,
        duration: item.duration,
        posterUrl: item.posterUrl || undefined,
        overview: item.overview || undefined,
        genres: item.genres ? JSON.parse(item.genres) : [],
        addedBy: {
          id: item.addedById,
          displayName: item.addedByName,
        },
        votes: item.votesJson ? JSON.parse(item.votesJson) : [],
        addedAt: item.addedAt.getTime(),
      }));

      // Find active poll if any
      let activePoll: Poll | null = null;
      const latestDbPoll = dbRoom.polls.find((p) => !p.closed && p.endsAt.getTime() > now);
      if (latestDbPoll) {
        activePoll = {
          id: latestDbPoll.id,
          roomId: latestDbPoll.roomId,
          question: latestDbPoll.question,
          options: latestDbPoll.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            movieData: opt.movieJson ? JSON.parse(opt.movieJson) : undefined,
            votes: opt.votesJson ? JSON.parse(opt.votesJson) : [],
          })),
          createdBy: {
            id: latestDbPoll.createdById,
            displayName: latestDbPoll.createdByName,
          },
          durationSeconds: latestDbPoll.durationSeconds,
          createdAt: latestDbPoll.createdAt.getTime(),
          endsAt: latestDbPoll.endsAt.getTime(),
          closed: latestDbPoll.closed,
          winningOptionId: latestDbPoll.winningOptionId || undefined,
        };
      }

      runtime = {
        details: {
          id: dbRoom.id,
          roomCode: dbRoom.roomCode,
          name: dbRoom.name,
          description: dbRoom.description || undefined,
          createdAt: dbRoom.createdAt.getTime(),
          hostId: dbRoom.hostId,
          settings: {
            isPublic: dbRoom.isPublic,
            isPasswordProtected: dbRoom.isPasswordProtected,
            maxParticipants: dbRoom.maxParticipants,
            controlMode: dbRoom.controlMode as any,
            allowGuestVoting: dbRoom.allowGuestVoting,
          },
          playbackState: authoritativeState,
          participants: [],
          playlist: playlistItems,
          activePoll,
        },
        participants: new Map(),
        cinemaMoments: dbRoom.cinemaMoments.map((cm) => ({
          id: cm.id,
          roomId: cm.roomId,
          timestamp: cm.timestamp,
          label: cm.label,
          note: cm.note || undefined,
          createdByName: cm.createdByName,
          createdAt: cm.createdAt.getTime(),
        })),
        vibeSubmissions: new Map(),
        pollTimer: null,
        lastPersistTime: now,
      };

      this.rooms.set(roomId, runtime);
      return runtime;
    }

    // Default Fallback Room
    const defaultAuthoritative: AuthoritativePlaybackState = {
      roomId,
      videoId: 'demo-1',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      videoTitle: 'Big Buck Bunny',
      videoType: 'html5',
      status: 'paused',
      currentTime: 0,
      duration: 596,
      playbackRate: 1.0,
      lastUpdatedServerTime: now,
      version: 1,
      hostId: 'system-host',
      hostName: 'Host',
    };

    runtime = {
      details: {
        id: roomId,
        roomCode: 'SYNC-ROOM',
        name: 'SyncScreen Watch Room',
        createdAt: now,
        hostId: 'system-host',
        settings: {
          isPublic: true,
          isPasswordProtected: false,
          maxParticipants: 20,
          controlMode: 'collaborative',
          allowGuestVoting: true,
        },
        playbackState: defaultAuthoritative,
        participants: [],
        playlist: [],
        activePoll: null,
      },
      participants: new Map(),
      cinemaMoments: [],
      vibeSubmissions: new Map(),
      pollTimer: null,
      lastPersistTime: now,
    };

    this.rooms.set(roomId, runtime);
    return runtime;
  }

  // Handle Play Event
  public handlePlay(
    runtime: RoomRuntimeState,
    participantId: string,
    clientReportedTime?: number
  ): AuthoritativePlaybackState {
    const now = Date.now();
    const current = runtime.details.playbackState;

    // Projected position at moment of play command
    let newPosition = this.computeProjectedPosition(current, now);
    if (typeof clientReportedTime === 'number' && !isNaN(clientReportedTime)) {
      // If client reported position is reasonably close (<2s), use it to smooth out latency
      if (Math.abs(clientReportedTime - newPosition) < 2.0) {
        newPosition = clientReportedTime;
      }
    }

    runtime.details.playbackState = {
      ...current,
      status: 'playing',
      currentTime: Math.max(0, Math.min(current.duration, newPosition)),
      lastUpdatedServerTime: now,
      version: current.version + 1,
    };

    this.schedulePersist(runtime);
    return runtime.details.playbackState;
  }

  // Handle Pause Event
  public handlePause(
    runtime: RoomRuntimeState,
    participantId: string,
    clientReportedTime?: number
  ): AuthoritativePlaybackState {
    const now = Date.now();
    const current = runtime.details.playbackState;

    let newPosition = this.computeProjectedPosition(current, now);
    if (typeof clientReportedTime === 'number' && !isNaN(clientReportedTime)) {
      if (Math.abs(clientReportedTime - newPosition) < 2.0) {
        newPosition = clientReportedTime;
      }
    }

    runtime.details.playbackState = {
      ...current,
      status: 'paused',
      currentTime: Math.max(0, Math.min(current.duration, newPosition)),
      lastUpdatedServerTime: now,
      version: current.version + 1,
    };

    this.schedulePersist(runtime);
    return runtime.details.playbackState;
  }

  // Handle Seek Event
  public handleSeek(
    runtime: RoomRuntimeState,
    participantId: string,
    targetTime: number
  ): AuthoritativePlaybackState {
    const now = Date.now();
    const current = runtime.details.playbackState;
    const clampedTime = Math.max(0, Math.min(current.duration, targetTime));

    runtime.details.playbackState = {
      ...current,
      currentTime: clampedTime,
      lastUpdatedServerTime: now,
      version: current.version + 1,
    };

    this.schedulePersist(runtime);
    return runtime.details.playbackState;
  }

  // Handle Video Change
  public handleVideoChange(
    runtime: RoomRuntimeState,
    participantId: string,
    videoData: {
      videoId: string;
      videoUrl: string;
      videoTitle: string;
      videoType: 'html5' | 'youtube';
      duration?: number;
    }
  ): AuthoritativePlaybackState {
    const now = Date.now();
    const current = runtime.details.playbackState;

    runtime.details.playbackState = {
      ...current,
      videoId: videoData.videoId,
      videoUrl: videoData.videoUrl,
      videoTitle: videoData.videoTitle,
      videoType: videoData.videoType,
      status: 'paused',
      currentTime: 0,
      duration: videoData.duration || 596,
      playbackRate: 1.0,
      lastUpdatedServerTime: now,
      version: current.version + 1,
    };

    this.schedulePersist(runtime);
    return runtime.details.playbackState;
  }

  // Handle Playback Rate
  public handleRateChange(
    runtime: RoomRuntimeState,
    participantId: string,
    playbackRate: number
  ): AuthoritativePlaybackState {
    const now = Date.now();
    const current = runtime.details.playbackState;
    const currentPosition = this.computeProjectedPosition(current, now);

    runtime.details.playbackState = {
      ...current,
      currentTime: currentPosition,
      playbackRate: Math.max(0.25, Math.min(2.0, playbackRate)),
      lastUpdatedServerTime: now,
      version: current.version + 1,
    };

    this.schedulePersist(runtime);
    return runtime.details.playbackState;
  }

  // Host Election & Failover
  public handleHostDisconnect(runtime: RoomRuntimeState, disconnectedSocketId: string): Participant | null {
    runtime.participants.delete(disconnectedSocketId);

    // If the disconnected user was the host, elect the earliest joined participant
    if (runtime.details.hostId === disconnectedSocketId) {
      const remaining = Array.from(runtime.participants.values()).sort((a, b) => {
        if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt;
        return a.displayName.localeCompare(b.displayName);
      });
      if (remaining.length > 0) {
        const newHost = remaining[0];
        newHost.isHost = true;
        runtime.details.hostId = newHost.id;
        runtime.details.playbackState.hostId = newHost.id;
        runtime.details.playbackState.hostName = newHost.displayName;
        return newHost;
      }
    }
    return null;
  }

  // Host Manual Transfer
  public handleHostTransfer(
    runtime: RoomRuntimeState,
    currentHostSocketId: string,
    targetSocketId: string
  ): Participant | null {
    if (runtime.details.hostId !== currentHostSocketId) {
      return null; // Unauthorized
    }

    const target = runtime.participants.get(targetSocketId);
    if (!target) return null;

    const previousHost = runtime.participants.get(currentHostSocketId);
    if (previousHost) previousHost.isHost = false;

    target.isHost = true;
    runtime.details.hostId = target.id;
    runtime.details.playbackState.hostId = target.id;
    runtime.details.playbackState.hostName = target.displayName;

    return target;
  }

  // VibeMatch Recommendation Algorithm
  public computeVibeMatch(runtime: RoomRuntimeState): VibeRecommendation[] {
    const submissions = Array.from(runtime.vibeSubmissions.values());
    if (submissions.length === 0) {
      return [];
    }

    // Count frequency of all selected vibes
    const vibeCounts: Record<string, number> = {};
    for (const sub of submissions) {
      for (const vibe of sub.selectedVibes) {
        vibeCounts[vibe] = (vibeCounts[vibe] || 0) + 1;
      }
    }

    const totalParticipants = submissions.length;

    // Score movies against group vibes
    const scored: VibeRecommendation[] = DEMO_MOVIES.map((movie: MovieMetadata) => {
      let matchedCount = 0;
      let matchedVibes: string[] = [];

      for (const [vibe, count] of Object.entries(vibeCounts)) {
        const matchesGenre = movie.genres.some((g: string) => g.toLowerCase().includes(vibe.toLowerCase()));
        const matchesOverview = movie.overview.toLowerCase().includes(vibe.toLowerCase());

        if (matchesGenre || matchesOverview) {
          matchedCount += count;
          matchedVibes.push(vibe);
        }
      }

      // Base score on proportion of votes + movie rating
      const vibeScore = totalParticipants > 0 ? (matchedCount / (totalParticipants * 3)) * 60 : 0;
      const ratingScore = (movie.voteAverage / 10) * 40;
      const matchScore = Math.min(99, Math.max(65, Math.round(vibeScore + ratingScore)));

      const rationale =
        matchedVibes.length > 0
          ? `Top match for your group's request for ${matchedVibes.join(', ')} (${Math.round((matchedCount / totalParticipants) * 100)}% agreement)`
          : `Crowd pleaser with ${movie.voteAverage}/10 community rating`;

      return {
        movieId: movie.id,
        title: movie.title,
        posterUrl: movie.posterPath,
        overview: movie.overview,
        genres: movie.genres,
        matchScore,
        rationale,
        url: movie.playableDemoUrl,
      };
    });

    scored.sort((a: VibeRecommendation, b: VibeRecommendation) => b.matchScore - a.matchScore);
    return scored.slice(0, 4);
  }

  // Periodic Debounced Persistence to DB
  private async schedulePersist(runtime: RoomRuntimeState) {
    const now = Date.now();
    // Don't hammer the database on every micro-event, debounce every 3 seconds
    if (now - runtime.lastPersistTime < 3000) {
      return;
    }
    runtime.lastPersistTime = now;

    try {
      const state = runtime.details.playbackState;
      await prisma.playbackState.upsert({
        where: { roomId: state.roomId },
        update: {
          videoId: state.videoId,
          videoUrl: state.videoUrl,
          videoTitle: state.videoTitle,
          videoType: state.videoType,
          status: state.status,
          currentTime: state.currentTime,
          duration: state.duration,
          playbackRate: state.playbackRate,
          lastUpdatedServerTime: BigInt(state.lastUpdatedServerTime),
          version: state.version,
          hostId: state.hostId,
          hostName: state.hostName,
        },
        create: {
          roomId: state.roomId,
          videoId: state.videoId,
          videoUrl: state.videoUrl,
          videoTitle: state.videoTitle,
          videoType: state.videoType,
          status: state.status,
          currentTime: state.currentTime,
          duration: state.duration,
          playbackRate: state.playbackRate,
          lastUpdatedServerTime: BigInt(state.lastUpdatedServerTime),
          version: state.version,
          hostId: state.hostId,
          hostName: state.hostName,
        },
      });
    } catch (e) {
      // In-memory runtime state remains 100% authoritative
      console.warn('[SyncEngine] DB checkpoint skipped:', (e as any)?.message);
    }
  }
}

export const syncEngine = new SyncEngine();
