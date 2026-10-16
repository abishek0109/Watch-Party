import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../../shared/types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/';

class SocketService {
  private socket: Socket | null = null;
  private serverOffsetMs: number = 0;
  private rttMs: number = 0;
  private pingInterval: any = null;

  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 8000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected with id:', this.socket?.id);
      this.startClockSync();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.stopClockSync();
    });

    this.socket.on(
      SOCKET_EVENTS.PONG_SYNC,
      ({ clientSendTime, serverTime }: { clientSendTime: number; serverTime: number }) => {
        const now = Date.now();
        this.rttMs = now - clientSendTime;
        this.serverOffsetMs = serverTime - (clientSendTime + this.rttMs / 2);
      }
    );

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public disconnect() {
    this.stopClockSync();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private startClockSync() {
    this.stopClockSync();
    this.sendPing();
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 5000);
  }

  private stopClockSync() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public sendPing() {
    if (this.socket && this.socket.connected) {
      this.socket.emit(SOCKET_EVENTS.PING_SYNC, { clientSendTime: Date.now() });
    }
  }

  public getServerEstimatedTime(): number {
    return Date.now() + this.serverOffsetMs;
  }

  public getMetrics() {
    return {
      rttMs: this.rttMs,
      serverOffsetMs: this.serverOffsetMs,
      connected: this.socket?.connected || false,
    };
  }
}

export const socketService = new SocketService();
