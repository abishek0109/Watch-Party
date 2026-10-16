import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { syncEngine } from '../services/syncEngine';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SYNC-${code}`;
}

export const roomController = {
  async createRoom(req: AuthRequest, res: Response) {
    try {
      const {
        name,
        description,
        isPublic = true,
        isPasswordProtected = false,
        password,
        maxParticipants = 20,
        controlMode = 'collaborative',
        allowGuestVoting = true,
        hostName,
        initialVideo,
      } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Room name is required' });
      }

      const hostId = req.user?.id || `host_${uuidv4().slice(0, 8)}`;
      const resolvedHostName = hostName || req.user?.username || 'Host';

      let passwordHash: string | null = null;
      if (isPasswordProtected && password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      // Generate unique room code
      let roomCode = generateRoomCode();
      while (await prisma.watchRoom.findUnique({ where: { roomCode } })) {
        roomCode = generateRoomCode();
      }

      const defaultVideo = initialVideo || {
        title: 'Big Buck Bunny',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoType: 'html5',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      };

      const now = Date.now();

      const room = await prisma.watchRoom.create({
        data: {
          roomCode,
          name: name.trim(),
          description: description?.trim() || null,
          isPublic: Boolean(isPublic),
          isPasswordProtected: Boolean(isPasswordProtected),
          passwordHash,
          maxParticipants: Number(maxParticipants) || 20,
          controlMode,
          allowGuestVoting: Boolean(allowGuestVoting),
          hostId,
          playbackState: {
            create: {
              videoId: uuidv4(),
              videoUrl: defaultVideo.url,
              videoTitle: defaultVideo.title,
              videoType: defaultVideo.videoType || 'html5',
              status: 'paused',
              currentTime: 0,
              duration: 596,
              playbackRate: 1.0,
              lastUpdatedServerTime: BigInt(now),
              version: 1,
              hostId,
              hostName: resolvedHostName,
            },
          },
          playlist: {
            create: [
              {
                title: defaultVideo.title,
                url: defaultVideo.url,
                videoType: defaultVideo.videoType || 'html5',
                duration: 596,
                posterUrl: defaultVideo.posterUrl || null,
                addedById: hostId,
                addedByName: resolvedHostName,
                votesJson: '[]',
              },
            ],
          },
        },
        include: {
          playbackState: true,
          playlist: true,
        },
      });

      // Initialize in SyncEngine
      await syncEngine.getOrCreateRoomState(room.id);

      return res.status(201).json({
        id: room.id,
        roomCode: room.roomCode,
        name: room.name,
        description: room.description,
        isPublic: room.isPublic,
        isPasswordProtected: room.isPasswordProtected,
        maxParticipants: room.maxParticipants,
        controlMode: room.controlMode,
        hostId: room.hostId,
        playbackState: room.playbackState,
      });
    } catch (err: any) {
      console.error('[Create Room Error]', err);
      return res.status(500).json({ message: 'Failed to create room' });
    }
  },

  async getRoom(req: Request, res: Response) {
    try {
      const roomIdOrCode = String(req.params.roomIdOrCode);
      const password = req.query.password ? String(req.query.password) : undefined;

      // Find by id or roomCode
      const room = await prisma.watchRoom.findFirst({
        where: {
          OR: [{ id: roomIdOrCode }, { roomCode: roomIdOrCode.toUpperCase() }],
        },
        include: {
          playbackState: true,
          playlist: true,
          cinemaMoments: true,
        },
      });

      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      // Check password if protected
      if (room.isPasswordProtected && room.passwordHash) {
        if (!password) {
          return res.status(403).json({
            message: 'Password required',
            isPasswordProtected: true,
            roomCode: room.roomCode,
            name: room.name,
          });
        }
        const valid = await bcrypt.compare(String(password), room.passwordHash);
        if (!valid) {
          return res.status(401).json({ message: 'Incorrect room password' });
        }
      }

      // SyncEngine projected state
      const runtime = await syncEngine.getOrCreateRoomState(room.id);
      const projectedPosition = syncEngine.computeProjectedPosition(runtime.details.playbackState);

      const activeParticipants = Array.from(runtime.participants.values());

      return res.json({
        id: room.id,
        roomCode: room.roomCode,
        name: room.name,
        description: room.description,
        isPublic: room.isPublic,
        isPasswordProtected: room.isPasswordProtected,
        maxParticipants: room.maxParticipants,
        controlMode: room.controlMode,
        allowGuestVoting: room.allowGuestVoting,
        hostId: runtime.details.hostId,
        playbackState: {
          ...runtime.details.playbackState,
          currentTime: projectedPosition,
        },
        participants: activeParticipants,
        playlist: runtime.details.playlist,
        activePoll: runtime.details.activePoll,
        cinemaMoments: runtime.cinemaMoments,
      });
    } catch (err: any) {
      console.error('[Get Room Error]', err);
      return res.status(500).json({ message: 'Failed to retrieve room' });
    }
  },

  async getPublicRooms(req: Request, res: Response) {
    try {
      const rooms = await prisma.watchRoom.findMany({
        where: { isPublic: true },
        include: {
          playbackState: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const mapped = await Promise.all(
        rooms.map(async (r) => {
          const runtime = await syncEngine.getOrCreateRoomState(r.id);
          return {
            id: r.id,
            roomCode: r.roomCode,
            name: r.name,
            description: r.description,
            isPasswordProtected: r.isPasswordProtected,
            participantCount: runtime.participants.size,
            maxParticipants: r.maxParticipants,
            videoTitle: runtime.details.playbackState.videoTitle,
            videoType: runtime.details.playbackState.videoType,
            status: runtime.details.playbackState.status,
            createdAt: r.createdAt,
          };
        })
      );

      return res.json(mapped);
    } catch (err: any) {
      console.error('[Get Public Rooms Error]', err);
      return res.status(500).json({ message: 'Failed to fetch public rooms' });
    }
  },

  async saveMemory(req: Request, res: Response) {
    try {
      const roomId = String(req.params.roomId);
      const { notes, movieTitle, posterUrl } = req.body;

      const runtime = await syncEngine.getOrCreateRoomState(roomId);
      const participantNames = Array.from(runtime.participants.values()).map((p) => p.displayName);

      const memory = await prisma.roomMemory.create({
        data: {
          roomId,
          roomName: runtime.details.name,
          movieTitle: movieTitle || runtime.details.playbackState.videoTitle,
          posterUrl: posterUrl || null,
          participantCount: Math.max(1, runtime.participants.size),
          notes: notes || 'Great watch party with friends!',
          participantsJson: JSON.stringify(participantNames),
        },
      });

      return res.status(201).json(memory);
    } catch (err: any) {
      console.error('[Save Memory Error]', err);
      return res.status(500).json({ message: 'Failed to save room memory' });
    }
  },

  async getMemories(req: Request, res: Response) {
    try {
      const roomId = String(req.params.roomId);
      const memories = await prisma.roomMemory.findMany({
        where: { roomId },
        orderBy: { createdAt: 'desc' },
      });

      const parsed = memories.map((m) => ({
        ...m,
        participants: JSON.parse(m.participantsJson || '[]'),
      }));

      return res.json(parsed);
    } catch (err: any) {
      console.error('[Get Memories Error]', err);
      return res.status(500).json({ message: 'Failed to retrieve memories' });
    }
  },
};
