const API_BASE = '/api';

export const api = {
  // Auth
  async register(username: string, email?: string, password?: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Registration failed');
    return res.json();
  },

  async login(username: string, password?: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
    return res.json();
  },

  async createGuest(displayName: string) {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Guest creation failed');
    return res.json();
  },

  async getMe(token: string) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  // Rooms
  async createRoom(roomData: {
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
  }, token?: string) {
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
  },

  async getRoom(roomIdOrCode: string, password?: string) {
    const query = password ? `?password=${encodeURIComponent(password)}` : '';
    const res = await fetch(`${API_BASE}/rooms/${roomIdOrCode}${query}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Room not found');
    }
    return res.json();
  },

  async getPublicRooms() {
    const res = await fetch(`${API_BASE}/rooms/public`);
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return res.json();
  },

  // Movies
  async searchMovies(query: string, genre?: string, year?: string, sort?: string) {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (genre && genre !== 'all') params.set('genre', genre);
    if (year) params.set('year', year);
    if (sort) params.set('sort', sort);

    const res = await fetch(`${API_BASE}/movies?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch movies');
    return res.json();
  },

  async getFeaturedMovies() {
    const res = await fetch(`${API_BASE}/movies/featured`);
    if (!res.ok) throw new Error('Failed to fetch featured movies');
    return res.json();
  },

  // Watchlist & History
  async getWatchlist(token: string) {
    const res = await fetch(`${API_BASE}/user/watchlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch watchlist');
    return res.json();
  },

  async addToWatchlist(token: string, movie: { movieId: string; movieTitle: string; posterPath: string; overview?: string; rating?: number }) {
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
  },

  async removeFromWatchlist(token: string, movieId: string) {
    const res = await fetch(`${API_BASE}/user/watchlist/${movieId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to remove from watchlist');
    return res.json();
  },

  async getHistory(token: string) {
    const res = await fetch(`${API_BASE}/user/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  async saveMemory(roomId: string, data: { notes: string; movieTitle: string; posterUrl?: string }) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save memory');
    return res.json();
  },

  async getMemories(roomId: string) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/memories`);
    if (!res.ok) throw new Error('Failed to fetch memories');
    return res.json();
  },
};
