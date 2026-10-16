import http from 'http';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { connectDB, prisma } from './db';
import { setupRoomSocket } from './socket/roomSocket';

dotenv.config();

const PORT = process.env.PORT || 4000;
const app = createApp();
const server = http.createServer(app);

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const io = new SocketIOServer(server, {
  cors: {
    origin: [allowedOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

setupRoomSocket(io);

async function start() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🎬 SyncScreen Real-time Server Running`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`⚡ Socket.IO listening for watch party rooms`);
    console.log(`===============================================`);
  });
}

// Graceful shutdown
const shutdown = async () => {
  console.log('\n[Server] Graceful shutdown initiated...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[Server] Connections closed. Bye!');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start().catch((err) => {
  console.error('[Server Start Error]', err);
  process.exit(1);
});
