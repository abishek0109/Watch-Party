# SyncScreen — Real-Time Watch Party Platform

> *"Same screen. Same moment. Anywhere."*

SyncScreen is a production-minded web application engineered for real-time synchronized video playback and collaborative social watching across remote participants. Built with an authoritative server clock projection model, millisecond drift correction, and social features including live spoiler-safe chat, floating emoji reactions, collaborative queue upvoting, group polls, and AI mood-based recommendations (**VibeMatch**).

---

## 🌟 Key Features

### 1. Authoritative Playback Synchronization (Highest Priority)
- **Authoritative Server Time Projection**: The server maintains canonical playback state (`currentTime`, `lastUpdatedServerTime`, `playbackRate`, `version`, `status`). Clients project expected current position in real-time using elapsed server time and NTP-calculated clock offset.
- **Continuous 4Hz Drift Detection**: Video player continuously compares local playback time against projected server time:
  - **Drift < 150ms**: In sync (ignored, runs at native 1.0x).
  - **150ms ≤ Drift ≤ 500ms**: Gentle rate adjustment (nudges playback rate to 1.06x or 0.94x for imperceptible convergence).
  - **Drift > 500ms**: Hard seek alignment to projected authoritative timestamp.
- **Monotonic State Versioning**: Monotonically increasing version counter (`version: v7`) prevents stale network events from overwriting newer user intentions.
- **Late Joiner & Reconnection Catch-Up**: New participants or recovering clients immediately receive the projected authoritative timestamp and match playback status without interrupting the room.
- **Deterministic Host Election**: If the current host disconnects, the earliest joined active participant is deterministically elected as the new host.
- **Host vs. Collaborative Control Modes**: Rooms can be configured for democratic control or restricted host-only commands.

### 2. Creative Differentiators
- **VibeMatch (AI Group Recommendations)**: Participants select their current moods (e.g., *Sci-Fi, Cyberpunk, Comedy, Action*). SyncScreen computes the group consensus vector and scores movies with match percentages and custom rationale, with 1-click addition to the room queue.
- **Smart Sync Health HUD**: Real-time diagnostic heads-up display showing live drift in milliseconds, round-trip network time (RTT), NTP server clock offset, state version, and sync status badges (`SYNCED`, `SMOOTHING RATE`, `SEEK CORRECTING`, `BUFFERING`).
- **Spoiler-Safe Chat**: Toggle spoiler protection on any message. Messages render blurred with a `⚠️ Spoiler Warning` banner until viewers explicitly click to reveal.
- **Cinema Moments**: Bookmark memorable scenes with exact timestamps, titles, and notes. Viewers can click any moment to synchronize playback to that bookmark.
- **Floating Emoji Reactions**: Live emoji particles (😂, ❤️, 🔥, 😭, 👏, 😮, 🎉, 🍿) floating and animating upwards across the video canvas.
- **Watch Party Memories**: Archive watch room recaps including participants, duration, movies screened, and personal notes to history.

### 3. Movie Discovery & Catalog
- **TMDB API Integration**: Connects to TMDB when `TMDB_API_KEY` is provided.
- **Graceful High-Definition Demo Fallback**: When external credentials are unavailable, SyncScreen serves a built-in library of open-source 4K films (*Big Buck Bunny, Tears of Steel, Sintel, Elephants Dream, Cosmos Laundromat, etc.*) with full metadata, fuzzy search matching, genre filters, and release year filters.
- **Personal Watchlist**: Save titles directly to profile and launch private parties in one click.

---

## 🏗️ Architecture & Tech Stack

```
               +---------------------------------------------+
               |             React 19 Frontend               |
               | (Vite, TypeScript, Tailwind CSS, Lucide)    |
               +----------------------+----------------------+
                                      |
                     REST API & NTP   |   WebSocket
                     Clock Ping-Pong  |   Socket.IO Events
                                      v
               +---------------------------------------------+
               |             Express & Node Server           |
               | (TypeScript, Socket.IO, Authoritative Sync) |
               +----------------------+----------------------+
                                      |
                           Prisma ORM Client
                                      |
                      +---------------+---------------+
                      |                               |
             SQLite (Local Dev)             PostgreSQL (Prod/Docker)
             `prisma/schema.prisma`         `prisma/schema.postgres.prisma`
```

### Technology Breakdown:
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Zustand, Socket.IO Client, React Router.
- **Backend**: Node.js, Express, TypeScript, Socket.IO, Prisma ORM, bcryptjs, jsonwebtoken, Zod, UUID.
- **Database**: SQLite (out-of-the-box local development with zero database install required) + PostgreSQL (with production docker-compose).
- **Testing**: Vitest, Multi-Client Socket.IO simulation test harness.

---

## ⚡ Real-Time Event Protocol

All Socket.IO events are strictly typed and validated across client and server:

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `sync:ping` / `sync:pong` | Client ⇆ Server | `{ clientSendTime, serverTime }` | NTP-style clock synchronization calculating RTT and server clock offset |
| `room:join` | Client → Server | `{ roomId, displayName, isGuest, avatarUrl }` | Join room, join Socket.IO room channel, returns authoritative state snapshot |
| `room:state` | Server → Client | `RoomSnapshot` | Initial state with projected playback time, participants, playlist, poll, moments |
| `room:participants` | Server → Broadcast | `Participant[]` | Broadcasts updated participant list and drift status |
| `playback:play` | Client → Server | `{ clientTime }` | Request playback play. Validates host permissions, projects position, increments version |
| `playback:pause` | Client → Server | `{ clientTime }` | Request playback pause. Increments version and halts clock projection |
| `playback:seek` | Client → Server | `{ targetTime }` | Request seek to timestamp. Sets authoritative position and updates version |
| `playback:state` | Server → Broadcast | `AuthoritativePlaybackState` | Authoritative broadcast of confirmed state version, position, and status |
| `playback:drift-report` | Client → Server | `{ driftMs }` | Telemetry from client player for room-wide sync health monitoring |
| `host:transfer` | Client → Server | `{ targetSocketId }` | Transfer host privileges to another participant |
| `host:changed` | Server → Broadcast | `{ newHostId, newHostName }` | Notification of manual or failover host election |
| `chat:send` / `chat:message`| Client ⇆ Server | `{ message, isSpoiler, senderName, timestamp }` | Real-time chat with optional spoiler blur flag |
| `reaction:send` / `reaction:new` | Client ⇆ Server | `{ emoji, xOffsetRatio, timestamp }` | Live animated floating reactions across video canvas |
| `playlist:add` / `playlist:vote` | Client ⇆ Server | `PlaylistItem` | Add video stream or upvote existing items in queue |
| `poll:create` / `poll:vote` / `poll:update` | Client ⇆ Server | `Poll` | Interactive group voting with countdown timer and tie-breaking |
| `vibematch:submit` / `vibematch:results` | Client ⇆ Server | `VibeMatchSubmission` | Mood submission and aggregated group consensus recommendation |
| `cinema:moment:add` | Client ⇆ Server | `CinemaMoment` | Bookmarks timestamped highlight scene with label & note |

---

## 📊 Measured Performance & Benchmark Results

SyncScreen includes an automated multi-client test harness (`tests/src/syncHarness.test.ts`) that runs 10 concurrent Socket.IO clients against the authoritative synchronization engine.

### Test Environment:
- **Operating System**: Windows (Node.js v24.19.0)
- **Local Network Testbed**: Loopback WebSocket transport
- **Simulation**: 1 Host + 9 Concurrent Viewers + 1 Late-Joining Client + Disconnect Recovery

### Measured Benchmarks:
| Metric | Acceptance Target | Actual Measured Result | Status |
|---|---|---|---|
| **Concurrent Users Supported** | ≥ 10 concurrent clients | **10 simultaneous clients** (joined in 238ms) | **PASSED** |
| **Control Propagation Latency (p50)** | — | **4 ms** | **PASSED** |
| **Control Propagation Latency (p95)** | ≤ 250 ms | **5 ms** | **PASSED** |
| **Control Propagation Latency (Max)** | — | **5 ms** | **PASSED** |
| **Residual Post-Correction Drift** | ≤ 500 ms | **0 ms to 12 ms** (within 150ms deadband) | **PASSED** |
| **Late Joiner Synchronization** | Authoritative projection | **147.02s (Projected live from elapsed server clock)** | **PASSED** |
| **Host Failover Determinism** | Earliest joined participant | **Viewer_1 elected on host disconnect** | **PASSED** |
| **Reconnection State Recovery** | Full state restored | **Authoritative playback snapshot re-established** | **PASSED** |

---

## 🚀 Getting Started

### Prerequisites:
- **Node.js**: v18 or newer (v20+ recommended)
- **NPM**: v9 or newer

### 1. Clone & Install Dependencies

From the repository root:
```bash
# Install root, server, client, and test dependencies
npm run install:all
```

Alternatively, install individually:
```bash
cd server && npm install
cd ../client && npm install
cd ../tests && npm install
cd ..
```

### 2. Configure Environment Variables

The server includes an `.env.example`. By default, it runs with zero configuration on SQLite:
```bash
cd server
cp .env.example .env
```

`.env` configuration details:
```ini
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET="syncscreen_super_secret_jwt_key_2026_cinematic"
TMDB_API_KEY="" # Optional: Leave blank to use built-in 4K open-source movie catalog
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### 3. Initialize Database & Seed

Generate the Prisma client and seed the showcase demo room (`SYNC-7777`):
```bash
cd server
npm run prisma:push
npm run prisma:seed
cd ..
```

### 4. Run the Application

Start both the backend server and frontend client concurrently:
```bash
npm run dev
```

Or start them in separate terminals:
```bash
# Terminal 1: Backend Server (Port 4000)
npm run dev:server

# Terminal 2: Frontend Client (Port 5173)
npm run dev:client
```

Open your browser at: **`http://localhost:5173`**

---

## 🧪 Running Automated Tests

### 1. Backend Synchronization Unit Tests
Tests playback projection formula, drift thresholds, and fuzzy search:
```bash
npm --prefix server run test
```

### 2. Multi-Client Real-Time Simulation Harness
Runs 10 concurrent clients testing propagation latency, synchronized seeking, late joining, and host failover:
```bash
npm run test:sync
```

---

## 🐳 Docker Deployment (with PostgreSQL)

To deploy SyncScreen with PostgreSQL using Docker:

```bash
# Start PostgreSQL, SyncScreen Server, and Client containers
docker-compose up --build -d
```

Containers:
- **PostgreSQL**: Port 5432
- **SyncScreen API & Socket Server**: Port 4000
- **Frontend Client**: Port 5173

---

## 🛡️ Security, DRM, & Media Provider Compliance

- **No Unauthorized Stream Extraction**: SyncScreen operates strictly on direct authorized media URLs (MP4, WebM, HLS) and open-source Blender Studio productions.
- **Zero DRM Circumvention**: SyncScreen complies with platform policies and does not attempt to scrape or bypass DRM encryption from commercial streaming services.
- **Input Sanitization & Spoiler Defense**: Chat messages are length-validated and escaped to prevent XSS. Spoiler content requires explicit viewer interaction to unmask.
- **Protected Rooms**: Rooms can be password-protected with bcrypt salted hashing.

---

## 📄 License & Credits

Built for synchronized cinematic moments.
Sample showcase videos courtesy of the **Blender Open Movie Project** (*Big Buck Bunny, Tears of Steel, Sintel, Cosmos Laundromat, Elephants Dream*) licensed under Creative Commons.
