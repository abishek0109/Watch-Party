import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { SOCKET_EVENTS, Participant, PlaylistItem, Poll, PollOption, CinemaMoment } from '../../../shared/types';
import { syncEngine } from '../services/syncEngine';
import { prisma } from '../db';

export function setupRoomSocket(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let participantId: string | null = null;

    // Clock Sync Ping-Pong (NTP-style)
    socket.on(SOCKET_EVENTS.PING_SYNC, ({ clientSendTime }: { clientSendTime: number }) => {
      socket.emit(SOCKET_EVENTS.PONG_SYNC, {
        clientSendTime,
        serverTime: Date.now(),
      });
    });

    // Room Join
    socket.on(SOCKET_EVENTS.ROOM_JOIN, async (data: {
      roomId: string;
      userId?: string;
      displayName: string;
      avatarUrl?: string;
      isGuest?: boolean;
    }, callback?: (res: any) => void) => {
      try {
        const { roomId, userId, displayName, avatarUrl, isGuest = true } = data;
        currentRoomId = roomId;
        participantId = socket.id;

        const runtime = await syncEngine.getOrCreateRoomState(roomId);

        // Check Room Capacity
        if (runtime.participants.size >= runtime.details.settings.maxParticipants) {
          if (callback) callback({ error: 'Room has reached maximum capacity.' });
          socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Room is full' });
          return;
        }

        // Determine if first participant should become host
        const isHost = runtime.participants.size === 0 || runtime.details.hostId === socket.id;
        if (runtime.participants.size === 0) {
          runtime.details.hostId = socket.id;
          runtime.details.playbackState.hostId = socket.id;
          runtime.details.playbackState.hostName = displayName;
        }

        const participant: Participant = {
          id: socket.id,
          userId: userId || undefined,
          displayName: displayName || `Guest_${socket.id.slice(0, 4)}`,
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName || socket.id)}`,
          isHost,
          isGuest,
          joinedAt: Date.now(),
        };

        runtime.participants.set(socket.id, participant);
        socket.join(roomId);

        // Calculate latest authoritative projected position for late-joining participant
        const projectedPosition = syncEngine.computeProjectedPosition(runtime.details.playbackState);

        // Fetch recent chat history
        const recentMessages = await prisma.chatMessage.findMany({
          where: { roomId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        const chatHistory = recentMessages.reverse().map((m) => ({
          id: m.id,
          roomId: m.roomId,
          senderId: m.senderId,
          senderName: m.senderName,
          avatarUrl: m.avatarUrl,
          message: m.message,
          timestamp: m.createdAt.getTime(),
          isSpoiler: m.isSpoiler,
          systemMessage: m.isSystem,
        }));

        // Send full state to joining client
        const roomSnapshot = {
          details: runtime.details,
          playbackState: {
            ...runtime.details.playbackState,
            currentTime: projectedPosition,
          },
          participants: Array.from(runtime.participants.values()),
          playlist: runtime.details.playlist,
          activePoll: runtime.details.activePoll,
          cinemaMoments: runtime.cinemaMoments,
          chatHistory,
        };

        socket.emit(SOCKET_EVENTS.ROOM_STATE, roomSnapshot);

        // Broadcast updated participants list to everyone in room
        io.to(roomId).emit(SOCKET_EVENTS.ROOM_PARTICIPANTS, Array.from(runtime.participants.values()));

        // Broadcast system join message
        const joinMsg = {
          id: uuidv4(),
          roomId,
          senderId: 'system',
          senderName: 'SyncScreen',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
          message: `${participant.displayName} joined the watch party.`,
          timestamp: Date.now(),
          isSpoiler: false,
          systemMessage: true,
        };
        io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, joinMsg);

        if (callback) callback({ success: true, room: roomSnapshot });
      } catch (err: any) {
        console.error('[Socket room:join error]', err);
        if (callback) callback({ error: 'Failed to join room' });
      }
    });

    // Playback: Play
    socket.on(SOCKET_EVENTS.PLAYBACK_PLAY, async (data: { clientTime?: number }, callback?: (res: any) => void) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const participant = runtime.participants.get(socket.id);

      // Verify host authority if room is in host-only mode
      if (runtime.details.settings.controlMode === 'host-only' && !participant?.isHost) {
        if (callback) callback({ error: 'Only the host can control playback.' });
        return;
      }

      const updated = syncEngine.handlePlay(runtime, socket.id, data?.clientTime);
      io.to(currentRoomId).emit(SOCKET_EVENTS.PLAYBACK_STATE, updated);
      if (callback) callback({ success: true, state: updated });
    });

    // Playback: Pause
    socket.on(SOCKET_EVENTS.PLAYBACK_PAUSE, async (data: { clientTime?: number }, callback?: (res: any) => void) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const participant = runtime.participants.get(socket.id);

      if (runtime.details.settings.controlMode === 'host-only' && !participant?.isHost) {
        if (callback) callback({ error: 'Only the host can control playback.' });
        return;
      }

      const updated = syncEngine.handlePause(runtime, socket.id, data?.clientTime);
      io.to(currentRoomId).emit(SOCKET_EVENTS.PLAYBACK_STATE, updated);
      if (callback) callback({ success: true, state: updated });
    });

    // Playback: Seek
    socket.on(SOCKET_EVENTS.PLAYBACK_SEEK, async (data: { targetTime: number }, callback?: (res: any) => void) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const participant = runtime.participants.get(socket.id);

      if (runtime.details.settings.controlMode === 'host-only' && !participant?.isHost) {
        if (callback) callback({ error: 'Only the host can seek.' });
        return;
      }

      const updated = syncEngine.handleSeek(runtime, socket.id, data.targetTime);
      io.to(currentRoomId).emit(SOCKET_EVENTS.PLAYBACK_STATE, updated);
      if (callback) callback({ success: true, state: updated });
    });

    // Playback: Rate
    socket.on(SOCKET_EVENTS.PLAYBACK_RATE, async (data: { playbackRate: number }) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const updated = syncEngine.handleRateChange(runtime, socket.id, data.playbackRate);
      io.to(currentRoomId).emit(SOCKET_EVENTS.PLAYBACK_STATE, updated);
    });

    // Playback: Video Change
    socket.on(SOCKET_EVENTS.PLAYBACK_VIDEO_CHANGE, async (data: {
      videoId: string;
      videoUrl: string;
      videoTitle: string;
      videoType: 'html5' | 'youtube';
      duration?: number;
    }) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const updated = syncEngine.handleVideoChange(runtime, socket.id, data);
      io.to(currentRoomId).emit(SOCKET_EVENTS.PLAYBACK_STATE, updated);

      const changeMsg = {
        id: uuidv4(),
        roomId: currentRoomId,
        senderId: 'system',
        senderName: 'SyncScreen',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
        message: `Now watching: "${data.videoTitle}"`,
        timestamp: Date.now(),
        isSpoiler: false,
        systemMessage: true,
      };
      io.to(currentRoomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, changeMsg);
    });

    // Playback: Drift telemetry report from client
    socket.on(SOCKET_EVENTS.PLAYBACK_DRIFT_REPORT, async (data: { driftMs: number }) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const participant = runtime.participants.get(socket.id);
      if (participant) {
        participant.currentDriftMs = data.driftMs;
      }
    });

    // Host Transfer
    socket.on(SOCKET_EVENTS.HOST_TRANSFER, async (data: { targetSocketId: string }) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const newHost = syncEngine.handleHostTransfer(runtime, socket.id, data.targetSocketId);
      if (newHost) {
        io.to(currentRoomId).emit(SOCKET_EVENTS.HOST_CHANGED, {
          newHostId: newHost.id,
          newHostName: newHost.displayName,
        });
        io.to(currentRoomId).emit(SOCKET_EVENTS.ROOM_PARTICIPANTS, Array.from(runtime.participants.values()));
      }
    });

    // Live Chat
    socket.on(SOCKET_EVENTS.CHAT_SEND, async (data: { message: string; isSpoiler?: boolean }) => {
      if (!currentRoomId || !data.message || data.message.trim() === '') return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const participant = runtime.participants.get(socket.id);
      if (!participant) return;

      const chatMsg = {
        id: uuidv4(),
        roomId: currentRoomId,
        senderId: participant.id,
        senderName: participant.displayName,
        avatarUrl: participant.avatarUrl,
        message: data.message.trim().slice(0, 1000), // length validation
        timestamp: Date.now(),
        isSpoiler: Boolean(data.isSpoiler),
        systemMessage: false,
      };

      io.to(currentRoomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, chatMsg);

      // Async save to db
      try {
        await prisma.chatMessage.create({
          data: {
            id: chatMsg.id,
            roomId: currentRoomId,
            senderId: chatMsg.senderId,
            senderName: chatMsg.senderName,
            avatarUrl: chatMsg.avatarUrl,
            message: chatMsg.message,
            isSpoiler: chatMsg.isSpoiler,
            isSystem: false,
          },
        });
      } catch (e) {
        console.warn('[Chat DB save error]', (e as any)?.message);
      }
    });

    // Live Floating Reactions
    socket.on(SOCKET_EVENTS.REACTION_SEND, async (data: { emoji: string }) => {
      if (!currentRoomId || !data.emoji) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const participant = runtime.participants.get(socket.id);
      if (!participant) return;

      const reaction = {
        id: uuidv4(),
        roomId: currentRoomId,
        senderId: participant.id,
        senderName: participant.displayName,
        emoji: data.emoji,
        timestamp: Date.now(),
        xOffsetRatio: 0.15 + Math.random() * 0.7, // Random horizontal position across video
      };

      io.to(currentRoomId).emit(SOCKET_EVENTS.REACTION_NEW, reaction);
    });

    // Playlist Add
    socket.on(SOCKET_EVENTS.PLAYLIST_ADD, async (data: {
      title: string;
      url: string;
      videoType: 'html5' | 'youtube';
      duration?: number;
      posterUrl?: string;
      overview?: string;
      genres?: string[];
    }) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const participant = runtime.participants.get(socket.id);
      if (!participant) return;

      const item: PlaylistItem = {
        id: uuidv4(),
        roomId: currentRoomId,
        title: data.title,
        url: data.url,
        videoType: data.videoType || 'html5',
        duration: data.duration || 500,
        posterUrl: data.posterUrl,
        overview: data.overview,
        genres: data.genres,
        addedBy: {
          id: participant.id,
          displayName: participant.displayName,
        },
        votes: [participant.id],
        addedAt: Date.now(),
      };

      runtime.details.playlist.push(item);
      io.to(currentRoomId).emit(SOCKET_EVENTS.PLAYLIST_UPDATE, runtime.details.playlist);

      // Async DB persist
      try {
        await prisma.playlistItem.create({
          data: {
            id: item.id,
            roomId: currentRoomId,
            title: item.title,
            url: item.url,
            videoType: item.videoType,
            duration: item.duration,
            posterUrl: item.posterUrl || null,
            overview: item.overview || null,
            genres: item.genres ? JSON.stringify(item.genres) : null,
            addedById: participant.id,
            addedByName: participant.displayName,
            votesJson: JSON.stringify(item.votes),
          },
        });
      } catch (e) {
        console.warn('[Playlist DB error]', (e as any)?.message);
      }
    });

    // Playlist Vote
    socket.on(SOCKET_EVENTS.PLAYLIST_VOTE, async (data: { playlistItemId: string }) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const item = runtime.details.playlist.find((p) => p.id === data.playlistItemId);
      if (!item) return;

      const userIndex = item.votes.indexOf(socket.id);
      if (userIndex >= 0) {
        item.votes.splice(userIndex, 1); // unvote
      } else {
        item.votes.push(socket.id); // vote
      }

      // Sort playlist by votes descending
      runtime.details.playlist.sort((a, b) => b.votes.length - a.votes.length);
      io.to(currentRoomId).emit(SOCKET_EVENTS.PLAYLIST_UPDATE, runtime.details.playlist);
    });

    // Playlist Remove
    socket.on(SOCKET_EVENTS.PLAYLIST_REMOVE, async (data: { playlistItemId: string }) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      runtime.details.playlist = runtime.details.playlist.filter((p) => p.id !== data.playlistItemId);
      io.to(currentRoomId).emit(SOCKET_EVENTS.PLAYLIST_UPDATE, runtime.details.playlist);
    });

    // Group Poll Create
    socket.on(SOCKET_EVENTS.POLL_CREATE, async (data: {
      question: string;
      options: Array<{ text: string; movieData?: any }>;
      durationSeconds?: number;
    }) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const participant = runtime.participants.get(socket.id);
      if (!participant) return;

      const durationSeconds = data.durationSeconds || 60;
      const now = Date.now();
      const endsAt = now + durationSeconds * 1000;

      const poll: Poll = {
        id: uuidv4(),
        roomId: currentRoomId,
        question: data.question,
        options: data.options.map((opt) => ({
          id: uuidv4(),
          text: opt.text,
          movieData: opt.movieData,
          votes: [],
        })),
        createdBy: {
          id: participant.id,
          displayName: participant.displayName,
        },
        durationSeconds,
        createdAt: now,
        endsAt,
        closed: false,
      };

      runtime.details.activePoll = poll;
      io.to(currentRoomId).emit(SOCKET_EVENTS.POLL_UPDATE, poll);

      // Auto-end poll after duration
      if (runtime.pollTimer) clearTimeout(runtime.pollTimer);
      runtime.pollTimer = setTimeout(() => {
        if (runtime.details.activePoll && runtime.details.activePoll.id === poll.id) {
          endPollInternal(runtime, currentRoomId!, io);
        }
      }, durationSeconds * 1000);
    });

    // Group Poll Vote
    socket.on(SOCKET_EVENTS.POLL_VOTE, async (data: { optionId: string }) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const poll = runtime.details.activePoll;
      if (!poll || poll.closed) return;

      // Remove existing vote by this participant on other options
      poll.options.forEach((opt) => {
        opt.votes = opt.votes.filter((uid) => uid !== socket.id);
      });

      // Add vote to chosen option
      const targetOpt = poll.options.find((opt) => opt.id === data.optionId);
      if (targetOpt) {
        targetOpt.votes.push(socket.id);
      }

      io.to(currentRoomId).emit(SOCKET_EVENTS.POLL_UPDATE, poll);
    });

    // Group Poll End
    socket.on(SOCKET_EVENTS.POLL_END, async () => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      endPollInternal(runtime, currentRoomId, io);
    });

    // Creative Feature: VibeMatch Submit & Recommendations
    socket.on(SOCKET_EVENTS.VIBEMATCH_SUBMIT, async (data: { vibes: string[]; preferredPace?: any }) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const participant = runtime.participants.get(socket.id);
      if (!participant) return;

      runtime.vibeSubmissions.set(socket.id, {
        userId: socket.id,
        userName: participant.displayName,
        selectedVibes: data.vibes,
        preferredPace: data.preferredPace,
      });

      const recommendations = syncEngine.computeVibeMatch(runtime);
      io.to(currentRoomId).emit(SOCKET_EVENTS.VIBEMATCH_RESULTS, {
        submissionsCount: runtime.vibeSubmissions.size,
        totalParticipants: runtime.participants.size,
        recommendations,
      });
    });

    // Creative Feature: Cinema Moments Bookmark
    socket.on(SOCKET_EVENTS.CINEMA_MOMENT_ADD, async (data: { timestamp: number; label: string; note?: string }) => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const participant = runtime.participants.get(socket.id);
      if (!participant) return;

      const moment: CinemaMoment = {
        id: uuidv4(),
        roomId: currentRoomId,
        timestamp: Math.max(0, data.timestamp),
        label: data.label.trim() || 'Epic Moment',
        note: data.note?.trim(),
        createdByName: participant.displayName,
        createdAt: Date.now(),
      };

      runtime.cinemaMoments.unshift(moment);
      io.to(currentRoomId).emit(SOCKET_EVENTS.CINEMA_MOMENTS_UPDATE, runtime.cinemaMoments);

      // Async DB persist
      try {
        await prisma.cinemaMoment.create({
          data: {
            id: moment.id,
            roomId: currentRoomId,
            timestamp: moment.timestamp,
            label: moment.label,
            note: moment.note || null,
            createdByName: moment.createdByName,
          },
        });
      } catch (e) {
        console.warn('[CinemaMoment DB error]', (e as any)?.message);
      }
    });

    // Room Leave & Disconnect
    const handleLeave = async () => {
      if (!currentRoomId) return;
      const runtime = await syncEngine.getOrCreateRoomState(currentRoomId);
      const participant = runtime.participants.get(socket.id);
      const pName = participant?.displayName || 'A participant';

      const newHost = syncEngine.handleHostDisconnect(runtime, socket.id);
      socket.leave(currentRoomId);

      // Notify room about updated participants
      io.to(currentRoomId).emit(SOCKET_EVENTS.ROOM_PARTICIPANTS, Array.from(runtime.participants.values()));

      if (newHost) {
        io.to(currentRoomId).emit(SOCKET_EVENTS.HOST_CHANGED, {
          newHostId: newHost.id,
          newHostName: newHost.displayName,
        });

        const hostNotice = {
          id: uuidv4(),
          roomId: currentRoomId,
          senderId: 'system',
          senderName: 'SyncScreen',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
          message: `${newHost.displayName} is now the host.`,
          timestamp: Date.now(),
          isSpoiler: false,
          systemMessage: true,
        };
        io.to(currentRoomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, hostNotice);
      }

      const leaveMsg = {
        id: uuidv4(),
        roomId: currentRoomId,
        senderId: 'system',
        senderName: 'SyncScreen',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
        message: `${pName} left the room.`,
        timestamp: Date.now(),
        isSpoiler: false,
        systemMessage: true,
      };
      io.to(currentRoomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, leaveMsg);

      currentRoomId = null;
    };

    socket.on(SOCKET_EVENTS.ROOM_LEAVE, handleLeave);
    socket.on('disconnect', handleLeave);
  });
}

function endPollInternal(runtime: any, roomId: string, io: SocketIOServer) {
  const poll = runtime.details.activePoll;
  if (!poll || poll.closed) return;

  poll.closed = true;

  // Determine winning option (highest votes, with tie-break choosing the earlier option)
  let winningOpt: PollOption | null = null;
  let maxVotes = -1;

  for (const opt of poll.options) {
    if (opt.votes.length > maxVotes) {
      maxVotes = opt.votes.length;
      winningOpt = opt;
    }
  }

  if (winningOpt && maxVotes > 0) {
    poll.winningOptionId = winningOpt.id;

    // If winning option has movieData, optionally add to playlist
    if (winningOpt.movieData) {
      const movie = winningOpt.movieData;
      const playlistItem: PlaylistItem = {
        id: uuidv4(),
        roomId,
        title: movie.title,
        url: movie.url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoType: 'html5',
        duration: 600,
        posterUrl: movie.posterUrl,
        overview: movie.overview,
        addedBy: {
          id: 'poll-winner',
          displayName: '🏆 Group Vote Winner',
        },
        votes: [],
        addedAt: Date.now(),
      };
      runtime.details.playlist.push(playlistItem);
      io.to(roomId).emit(SOCKET_EVENTS.PLAYLIST_UPDATE, runtime.details.playlist);
    }
  }

  io.to(roomId).emit(SOCKET_EVENTS.POLL_UPDATE, poll);

  const winnerAnnouncement = {
    id: uuidv4(),
    roomId,
    senderId: 'system',
    senderName: 'Poll Result',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=poll',
    message: winningOpt
      ? `🏆 Poll ended! Winner: "${winningOpt.text}" with ${winningOpt.votes.length} votes!`
      : `Poll ended without votes.`,
    timestamp: Date.now(),
    isSpoiler: false,
    systemMessage: true,
  };
  io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, winnerAnnouncement);
}
