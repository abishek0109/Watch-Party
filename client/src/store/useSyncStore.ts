import { create } from 'zustand';

interface SyncStore {
  driftMs: number;
  serverOffsetMs: number;
  rttMs: number;
  status: 'synced' | 'adjusting' | 'correcting' | 'buffering';
  appliedCorrections: number;
  lastCorrectionTime: number | null;
  authoritativeVersion: number;
  isHudOpen: boolean;

  setTelemetry: (data: {
    driftMs?: number;
    serverOffsetMs?: number;
    rttMs?: number;
    status?: 'synced' | 'adjusting' | 'correcting' | 'buffering';
    version?: number;
  }) => void;
  recordCorrection: () => void;
  toggleHud: () => void;
  setHudOpen: (open: boolean) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  driftMs: 0,
  serverOffsetMs: 0,
  rttMs: 0,
  status: 'synced',
  appliedCorrections: 0,
  lastCorrectionTime: null,
  authoritativeVersion: 1,
  isHudOpen: false,

  setTelemetry: (data) => {
    set((prev) => ({
      driftMs: data.driftMs !== undefined ? data.driftMs : prev.driftMs,
      serverOffsetMs: data.serverOffsetMs !== undefined ? data.serverOffsetMs : prev.serverOffsetMs,
      rttMs: data.rttMs !== undefined ? data.rttMs : prev.rttMs,
      status: data.status || prev.status,
      authoritativeVersion: data.version !== undefined ? data.version : prev.authoritativeVersion,
    }));
  },

  recordCorrection: () => {
    set((prev) => ({
      appliedCorrections: prev.appliedCorrections + 1,
      lastCorrectionTime: Date.now(),
      status: 'correcting',
    }));
  },

  toggleHud: () => {
    set((prev) => ({ isHudOpen: !prev.isHudOpen }));
  },

  setHudOpen: (open: boolean) => {
    set({ isHudOpen: open });
  },
}));
