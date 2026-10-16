import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding initial database data...');

  // Create demo user
  const passwordHash = await bcrypt.hash('syncscreen123', 10);
  const demoUser = await prisma.user.upsert({
    where: { username: 'alex_host' },
    update: {},
    create: {
      username: 'alex_host',
      email: 'alex@syncscreen.tv',
      passwordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex',
      isGuest: false,
    },
  });

  // Create default watch room
  const roomCode = 'SYNC-7777';
  const existingRoom = await prisma.watchRoom.findUnique({
    where: { roomCode },
  });

  if (!existingRoom) {
    const room = await prisma.watchRoom.create({
      data: {
        roomCode,
        name: 'Cinematic Sci-Fi Showcase',
        description: 'Synchronized premiere of indie sci-fi & animated masterpieces with live chat.',
        isPublic: true,
        isPasswordProtected: false,
        maxParticipants: 25,
        controlMode: 'collaborative',
        allowGuestVoting: true,
        hostId: demoUser.id,
        playbackState: {
          create: {
            videoId: 'demo-1',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            videoTitle: 'Big Buck Bunny (Director Cut)',
            videoType: 'html5',
            status: 'paused',
            currentTime: 12.0,
            duration: 596.0,
            playbackRate: 1.0,
            lastUpdatedServerTime: BigInt(Date.now()),
            version: 1,
            hostId: demoUser.id,
            hostName: 'alex_host',
          },
        },
        playlist: {
          create: [
            {
              title: 'Tears of Steel — Cyberpunk Amsterdam',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
              videoType: 'html5',
              duration: 734.0,
              posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80',
              overview: 'Dystopian VFX showcase set in Amsterdam featuring robotic mechs.',
              addedById: demoUser.id,
              addedByName: 'alex_host',
              votesJson: '["demo-user-1"]',
            },
            {
              title: 'Sintel — Dragon Fantasy',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
              videoType: 'html5',
              duration: 888.0,
              posterUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
              overview: 'Epic fantasy adventure across snowcapped mountain kingdoms.',
              addedById: demoUser.id,
              addedByName: 'alex_host',
              votesJson: '[]',
            },
          ],
        },
        chatMessages: {
          create: [
            {
              senderId: demoUser.id,
              senderName: 'alex_host',
              avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex',
              message: 'Welcome everyone to the SyncScreen showcase party! Hit play whenever you are ready.',
              isSpoiler: false,
              isSystem: false,
            },
            {
              senderId: 'system',
              senderName: 'SyncScreen Bot',
              avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=bot',
              message: 'Smart Sync Health is active. Playback drift is monitored with sub-100ms accuracy.',
              isSpoiler: false,
              isSystem: true,
            },
          ],
        },
      },
    });

    console.log('[Seed] Created default room:', room.roomCode);
  }

  console.log('[Seed] Finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
