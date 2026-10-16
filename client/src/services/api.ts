import { DEMO_MOVIES, filterAndSearchMovies } from './movieCatalog';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const API_BASE = `${BACKEND_URL}/api`;

export const api = {
  // Auth
  async register(username: string, email?: string, password?: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Registration failed');
      return res.json();
    } catch (e: any) {
      // Local fallback for static deployment preview
      const user = {
        id: `user_${Date.now()}`,
        username,
        email,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
        isGuest: false,
      };
      return { token: `demo_token_${Date.now()}`, user };
    }
  },

  async login(username: string, password?: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
      return res.json();
    } catch (e: any) {
      const user = {
        id: `user_${Date.now()}`,
        username,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
        isGuest: false,
      };
      return { token: `demo_token_${Date.now()}`, user };
    }
  },

  async createGuest(displayName: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Guest creation failed');
      return res.json();
    } catch (e: any) {
      const name = displayName?.trim() || `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
      const user = {
        id: `guest_${Date.now()}`,
        username: name,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        isGuest: true,
      };
      return { token: `demo_guest_token_${Date.now()}`, user };
    }
  },

  async getMe(token: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();
    } catch (e) {
      const stored = localStorage.getItem('syncscreen_user');
      if (stored) return { user: JSON.parse(stored) };
      throw new Error('Not authenticated');
    }
  },

  // Rooms
  async createRoom(
    roomData: {
      name: string;
      description?: string;
      isPublic: boolean;
      isPasswordProtected: boolean;
      password?: string;
      maxParticipants: number;
      controlMode: 'host-only' | 'collaborative';
      allowGuestVoting: boolean;
      hostName: string;
      initialVideo?: {
        title: string;
        url: string;
        videoType: 'html5' | 'youtube';
        posterUrl?: string;
      };
    },
    token?: string
  ) {
    try {
      const res = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(roomData),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Room creation failed');
      return res.json();
    } catch (e) {
      // Fallback room for static preview
      const id = `room_${Date.now()}`;
      const roomCode = `SYNC-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        id,
        roomCode,
        name: roomData.name,
        description: roomData.description,
        isPublic: roomData.isPublic,
        isPasswordProtected: roomData.isPasswordProtected,
        maxParticipants: roomData.maxParticipants,
        controlMode: roomData.controlMode,
        hostId: 'current-user',
        playbackState: {
          roomId: id,
          videoId: 'demo-1',
          videoUrl: roomData.initialVideo?.url || DEMO_MOVIES[0].playableDemoUrl,
          videoTitle: roomData.initialVideo?.title || DEMO_MOVIES[0].title,
          videoType: 'html5',
          status: 'paused',
          currentTime: 0,
          duration: 596,
          playbackRate: 1.0,
          lastUpdatedServerTime: Date.now(),
          version: 1,
          hostId: 'current-user',
          hostName: roomData.hostName,
        },
      };
    }
  },

  async getRoom(roomIdOrCode: string, password?: string) {
    try {
      const query = password ? `?password=${encodeURIComponent(password)}` : '';
      const res = await fetch(`${API_BASE}/rooms/${roomIdOrCode}${query}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Room not found');
      }
      return res.json();
    } catch (e: any) {
      // Fallback mock room
      const id = roomIdOrCode;
      const roomCode = roomIdOrCode.startsWith('SYNC-') ? roomIdOrCode : 'SYNC-7777';
      const m = DEMO_MOVIES[0];
      return {
        id,
        roomCode,
        name: 'Showcase Premiere Party',
        description: 'Real-time synchronized group screening.',
        isPublic: true,
        isPasswordProtected: false,
        maxParticipants: 25,
        controlMode: 'collaborative',
        allowGuestVoting: true,
        hostId: 'host-1',
        playbackState: {
          roomId: id,
          videoId: m.id,
          videoUrl: m.playableDemoUrl,
          videoTitle: m.title,
          videoType: 'html5',
          status: 'paused',
          currentTime: 14.0,
          duration: 596,
          playbackRate: 1.0,
          lastUpdatedServerTime: Date.now(),
          version: 1,
          hostId: 'host-1',
          hostName: 'Alex (Host)',
        },
        participants: [
          {
            id: 'host-1',
            displayName: 'Alex (Host)',
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex',
            isHost: true,
            isGuest: false,
            joinedAt: Date.now() - 60000,
          },
        ],
        playlist: [
          {
            id: 'pl-1',
            roomId: id,
            title: DEMO_MOVIES[1].title,
            url: DEMO_MOVIES[1].playableDemoUrl,
            videoType: 'html5',
            duration: 734,
            posterUrl: DEMO_MOVIES[1].posterPath,
            addedBy: { id: 'host-1', displayName: 'Alex' },
            votes: ['host-1'],
            addedAt: Date.now(),
          },
        ],
        activePoll: null,
        cinemaMoments: [],
      };
    }
  },

  async getPublicRooms() {
    try {
      const res = await fetch(`${API_BASE}/rooms/public`);
      if (!res.ok) throw new Error('Failed to fetch rooms');
      return res.json();
    } catch (e) {
      return [
        {
          id: 'room-demo-showcase',
          roomCode: 'SYNC-7777',
          name: 'Cinematic Sci-Fi Showcase',
          description: 'Synchronized premiere of animated & sci-fi masterpieces.',
          isPasswordProtected: false,
          participantCount: 4,
          maxParticipants: 25,
          videoTitle: 'Big Buck Bunny (Director Cut)',
          videoType: 'html5',
          status: 'playing',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'room-demo-cyberpunk',
          roomCode: 'SYNC-CYBER',
          name: 'Amsterdam 2099 VFX Room',
          description: 'Robotic invasion and high-end visual effects stream.',
          isPasswordProtected: false,
          participantCount: 6,
          maxParticipants: 20,
          videoTitle: 'Tears of Steel',
          videoType: 'html5',
          status: 'paused',
          createdAt: new Date().toISOString(),
        },
      ];
    }
  },

  // Movies
  async searchMovies(query: string, genre?: string, year?: string, sort?: string) {
    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (genre && genre !== 'all') params.set('genre', genre);
      if (year) params.set('year', year);
      if (sort) params.set('sort', sort);

      const res = await fetch(`${API_BASE}/movies?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch movies');
      return res.json();
    } catch (e) {
      const filtered = filterAndSearchMovies(DEMO_MOVIES, query, genre, year, sort);
      return { source: 'demo_catalog', movies: filtered };
    }
  },

  async getFeaturedMovies() {
    try {
      const res = await fetch(`${API_BASE}/movies/featured`);
      if (!res.ok) throw new Error('Failed to fetch featured movies');
      return res.json();
    } catch (e) {
      return {
        featured: DEMO_MOVIES.slice(0, 4),
        trending: DEMO_MOVIES.slice(2, 6),
      };
    }
  },

  // Watchlist & History
  async getWatchlist(token: string) {
    try {
      const res = await fetch(`${API_BASE}/user/watchlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch watchlist');
      return res.json();
    } catch (e) {
      const saved = localStorage.getItem('syncscreen_watchlist');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async addToWatchlist(
    token: string,
    movie: { movieId: string; movieTitle: string; posterPath: string; overview?: string; rating?: number }
  ) {
    try {
      const res = await fetch(`${API_BASE}/user/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(movie),
      });
      if (!res.ok) throw new Error('Failed to add to watchlist');
      return res.json();
    } catch (e) {
      const saved = localStorage.getItem('syncscreen_watchlist');
      const list = saved ? JSON.parse(saved) : [];
      list.unshift({ ...movie, id: `wl_${Date.now()}`, addedAt: new Date().toISOString() });
      localStorage.setItem('syncscreen_watchlist', JSON.stringify(list));
      return movie;
    }
  },

  async removeFromWatchlist(token: string, movieId: string) {
    try {
      const res = await fetch(`${API_BASE}/user/watchlist/${movieId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove from watchlist');
      return res.json();
    } catch (e) {
      const saved = localStorage.getItem('syncscreen_watchlist');
      if (saved) {
        const list = JSON.parse(saved).filter((item: any) => item.movieId !== movieId);
        localStorage.setItem('syncscreen_watchlist', JSON.stringify(list));
      }
      return { success: true };
    }
  },

  async getHistory(token: string) {
    try {
      const res = await fetch(`${API_BASE}/user/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json();
    } catch (e) {
      return [
        {
          id: 'hist-1',
          movieTitle: 'Big Buck Bunny (Director Cut)',
          roomName: 'Cinematic Sci-Fi Showcase',
          watchedAt: new Date(Date.now() - 3600000).toISOString(),
          durationMinutes: 10,
        },
      ];
    }
  },

  async saveMemory(roomId: string, data: { notes: string; movieTitle: string; posterUrl?: string }) {
    try {
      const res = await fetch(`${API_BASE}/rooms/${roomId}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save memory');
      return res.json();
    } catch (e) {
      const saved = localStorage.getItem('syncscreen_memories');
      const list = saved ? JSON.parse(saved) : [];
      const item = {
        id: `mem_${Date.now()}`,
        roomId,
        roomName: 'Watch Party',
        movieTitle: data.movieTitle,
        posterUrl: data.posterUrl,
        participantCount: 4,
        notes: data.notes,
        memoryDate: new Date().toISOString(),
      };
      list.unshift(item);
      localStorage.setItem('syncscreen_memories', JSON.stringify(list));
      return item;
    }
  },

  async getMemories(roomId: string) {
    try {
      const res = await fetch(`${API_BASE}/rooms/${roomId}/memories`);
      if (!res.ok) throw new Error('Failed to fetch memories');
      return res.json();
    } catch (e) {
      const saved = localStorage.getItem('syncscreen_memories');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'mem-default-1',
              roomId,
              roomName: 'Cinematic Sci-Fi Showcase',
              movieTitle: 'Big Buck Bunny',
              participantCount: 4,
              notes: 'Premiered the remastered cut with friends! Super smooth sync.',
              memoryDate: new Date().toISOString(),
              participants: ['Alex', 'Sarah', 'Bob', 'Jordan'],
            },
          ];
    }
  },
};
