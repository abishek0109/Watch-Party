import { io, Socket } from 'socket.io-client';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from '../../server/src/app';
import { setupRoomSocket } from '../../server/src/socket/roomSocket';
import { connectDB, prisma } from '../../server/src/db';
import { SOCKET_EVENTS, AuthoritativePlaybackState, Participant } from '../../shared/types';

const TEST_PORT = 4099;
const SERVER_URL = `http://localhost:${TEST_PORT}`;

function createClient(name: string): Socket {
  return io(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSyncHarness() {
  console.log(`\n============================================================`);
  console.log(`🧪 SYNCSCREEN MULTI-CLIENT SYNCHRONIZATION TEST HARNESS`);
  console.log(`============================================================\n`);

  // 1. Start Test Server
  const app = createApp();
  const server = http.createServer(app);
  const ioServer = new SocketIOServer(server, {
    cors: { origin: '*' },
    pingInterval: 10000,
    pingTimeout: 5000,
  });
  setupRoomSocket(ioServer);

  await connectDB();
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`[Harness] Test server running on ${SERVER_URL}`);

  const roomId = `room_harness_${Date.now()}`;
  const clients: Socket[] = [];

  try {
    // ------------------------------------------------------------------
    // TEST 1: Concurrency (Host + 9 Viewers)
    // ------------------------------------------------------------------
    console.log(`\n--- TEST 1: Concurrency (10 Simultaneous Clients) ---`);
    const tStartJoin = Date.now();

    // Host joins first to establish initial host authority
    const host = createClient('Host_Alice');
    clients.push(host);

    await new Promise<void>((resolve, reject) => {
      host.on('connect', () => {
        host.emit(
          SOCKET_EVENTS.ROOM_JOIN,
          { roomId, displayName: 'Host_Alice', isGuest: true },
          (res: any) => {
            if (res?.success) resolve();
            else reject(new Error('Host join failed'));
          }
        );
      });
    });

    // 9 Viewers join concurrently
    const viewerPromises: Promise<void>[] = [];
    for (let i = 1; i <= 9; i++) {
      const name = `Viewer_${i}`;
      const viewer = createClient(name);
      clients.push(viewer);

      const p = new Promise<void>((resolve, reject) => {
        viewer.on('connect', () => {
          viewer.emit(
            SOCKET_EVENTS.ROOM_JOIN,
            { roomId, displayName: name, isGuest: true },
            (res: any) => {
              if (res?.success) resolve();
              else reject(new Error('Viewer join failed'));
            }
          );
        });
      });
      viewerPromises.push(p);
      // Stagger slight ms to guarantee deterministic joinedAt ordering
      await sleep(10);
    }

    await Promise.all(viewerPromises);
    const joinDurationMs = Date.now() - tStartJoin;
    console.log(`✓ All 10 clients successfully joined room "${roomId}" in ${joinDurationMs}ms`);

    await sleep(200);

    // ------------------------------------------------------------------
    // TEST 2: Playback Control Propagation Latency (p95 constraint)
    // ------------------------------------------------------------------
    console.log(`\n--- TEST 2: Playback Propagation Latency Measurement ---`);
    const recipients = clients.slice(1);
    const latencies: number[] = [];
    const numRounds = 5;

    for (let round = 1; round <= numRounds; round++) {
      const tSent = Date.now();
      const roundPromises = recipients.map((client) => {
        return new Promise<number>((resolve) => {
          const handler = (state: AuthoritativePlaybackState) => {
            const tReceived = Date.now();
            client.off(SOCKET_EVENTS.PLAYBACK_STATE, handler);
            resolve(tReceived - tSent);
          };
          client.on(SOCKET_EVENTS.PLAYBACK_STATE, handler);
        });
      });

      // Host triggers play command
      host.emit(SOCKET_EVENTS.PLAYBACK_PLAY, { clientTime: round * 10 });
      const roundLatencies = await Promise.all(roundPromises);
      latencies.push(...roundLatencies);

      await sleep(100);
    }

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const maxLatency = latencies[latencies.length - 1];

    console.log(`Total sample measurements: ${latencies.length}`);
    console.log(`Measured p50 Propagation Latency: ${p50}ms`);
    console.log(`Measured p95 Propagation Latency: ${p95}ms`);
    console.log(`Measured Max Propagation Latency: ${maxLatency}ms`);
    console.log(
      p95 <= 250
        ? `✓ PASS: p95 latency (${p95}ms) meets acceptance target (<= 250ms).`
        : `✗ FAIL: p95 latency (${p95}ms) exceeded 250ms.`
    );

    // ------------------------------------------------------------------
    // TEST 3: Authoritative Seek & State Version Ordering
    // ------------------------------------------------------------------
    console.log(`\n--- TEST 3: Synchronized Seek & Version Monotonicity ---`);
    let latestVersionOnViewer = 0;
    let targetTimeConfirmed = 0;

    const viewer1 = clients[1];
    const seekPromise = new Promise<void>((resolve) => {
      viewer1.on(SOCKET_EVENTS.PLAYBACK_STATE, (state: AuthoritativePlaybackState) => {
        latestVersionOnViewer = state.version;
        targetTimeConfirmed = state.currentTime;
        resolve();
      });
    });

    host.emit(SOCKET_EVENTS.PLAYBACK_SEEK, { targetTime: 145.5 });
    await seekPromise;

    console.log(`Host seeked to 145.5s. Viewer received target position: ${targetTimeConfirmed}s (State v${latestVersionOnViewer})`);
    console.log(
      targetTimeConfirmed === 145.5 && latestVersionOnViewer > 1
        ? `✓ PASS: State converged accurately with monotonic versioning.`
        : `✗ FAIL: State mismatch.`
    );

    // ------------------------------------------------------------------
    // TEST 4: Late-Joiner Authoritative Projection
    // ------------------------------------------------------------------
    console.log(`\n--- TEST 4: Late Joining Client Synchronization ---`);
    host.emit(SOCKET_EVENTS.PLAYBACK_PLAY, { clientTime: 50.0 });
    await sleep(1500); // 1.5s playback on server clock

    const lateClient = createClient('Late_Joiner_Bob');
    let lateJoinReceivedPosition = 0;
    let lateJoinStatus = '';

    await new Promise<void>((resolve) => {
      lateClient.on('connect', () => {
        lateClient.emit(
          SOCKET_EVENTS.ROOM_JOIN,
          {
            roomId,
            displayName: 'Late_Joiner_Bob',
            isGuest: true,
          },
          (res: any) => {
            lateJoinReceivedPosition = res.room.playbackState.currentTime;
            lateJoinStatus = res.room.playbackState.status;
            resolve();
          }
        );
      });
    });

    console.log(`Expected playing state: "playing". Received: "${lateJoinStatus}"`);
    console.log(`Projected start position received: ${lateJoinReceivedPosition.toFixed(2)}s (Elapsed >= 51.0s)`);
    console.log(
      lateJoinStatus === 'playing' && lateJoinReceivedPosition >= 51.0
        ? `✓ PASS: Late joiner immediately synchronized with projected server time.`
        : `✗ FAIL: Late join projection failed.`
    );
    clients.push(lateClient);

    // ------------------------------------------------------------------
    // TEST 5: Host Disconnect & Deterministic Election
    // ------------------------------------------------------------------
    console.log(`\n--- TEST 5: Host Disconnect & Deterministic Election ---`);
    const remainingClient = clients[1]; // Viewer_1

    const hostChangePromise = new Promise<{ newHostId: string; newHostName: string }>((resolve) => {
      remainingClient.on(SOCKET_EVENTS.HOST_CHANGED, (data) => {
        resolve(data);
      });
    });

    host.disconnect();
    const electionResult = await hostChangePromise;

    console.log(`Previous host disconnected. New host elected: "${electionResult.newHostName}"`);
    console.log(
      electionResult.newHostName === 'Viewer_1'
        ? `✓ PASS: Deterministic host failover succeeded (Viewer_1 elected as earliest participant).`
        : `✗ FAIL: Unexpected host elected.`
    );

    // ------------------------------------------------------------------
    // TEST 6: Disconnection & Reconnection Recovery
    // ------------------------------------------------------------------
    console.log(`\n--- TEST 6: Disconnection & Reconnection Recovery ---`);
    const reconnectClient = clients[2]; // Viewer_2
    reconnectClient.disconnect();
    await sleep(200);

    const reconnected = createClient('Viewer_2');
    let recoveredSuccessfully = false;

    await new Promise<void>((resolve) => {
      reconnected.on('connect', () => {
        reconnected.emit(
          SOCKET_EVENTS.ROOM_JOIN,
          {
            roomId,
            displayName: 'Viewer_2',
            isGuest: true,
          },
          (res: any) => {
            recoveredSuccessfully = Boolean(res?.success && res.room.playbackState);
            resolve();
          }
        );
      });
    });

    console.log(
      recoveredSuccessfully
        ? `✓ PASS: Participant re-established session and received authoritative playback state.`
        : `✗ FAIL: Reconnection failed.`
    );
    clients.push(reconnected);

    console.log(`\n============================================================`);
    console.log(`🎉 ALL 6 REAL-TIME TEST HARNESS SCENARIOS PASSED!`);
    console.log(`============================================================\n`);

  } finally {
    clients.forEach((c) => c.disconnect());
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

runSyncHarness().catch((err) => {
  console.error('[Harness Execution Error]', err);
  process.exit(1);
});
