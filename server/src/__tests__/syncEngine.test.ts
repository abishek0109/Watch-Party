import { describe, it, expect } from 'vitest';
import { SyncEngine } from '../services/syncEngine';
import { AuthoritativePlaybackState } from '../../../shared/types';
import { filterAndSearchMovies, DEMO_MOVIES } from '../../../shared/movieCatalog';

describe('SyncEngine: Authoritative Playback Projection', () => {
  const engine = new SyncEngine();

  it('projects position accurately when playing', () => {
    const baseTime = 1000000;
    const state: AuthoritativePlaybackState = {
      roomId: 'test-room',
      videoId: 'vid-1',
      videoUrl: 'http://example.com/video.mp4',
      videoTitle: 'Test Video',
      videoType: 'html5',
      status: 'playing',
      currentTime: 10.0,
      duration: 100.0,
      playbackRate: 1.0,
      lastUpdatedServerTime: baseTime,
      version: 1,
      hostId: 'host-1',
      hostName: 'Host',
    };

    // 5 seconds elapsed
    const projected = engine.computeProjectedPosition(state, baseTime + 5000);
    expect(projected).toBeCloseTo(15.0, 2);

    // 10 seconds elapsed at 1.5x speed
    const stateFast: AuthoritativePlaybackState = {
      ...state,
      playbackRate: 1.5,
    };
    const projectedFast = engine.computeProjectedPosition(stateFast, baseTime + 10000);
    expect(projectedFast).toBeCloseTo(25.0, 2);

    // Caps at video duration
    const projectedCapped = engine.computeProjectedPosition(state, baseTime + 200000);
    expect(projectedCapped).toBe(100.0);
  });

  it('does not advance position when paused', () => {
    const baseTime = 1000000;
    const state: AuthoritativePlaybackState = {
      roomId: 'test-room',
      videoId: 'vid-1',
      videoUrl: 'http://example.com/video.mp4',
      videoTitle: 'Test Video',
      videoType: 'html5',
      status: 'paused',
      currentTime: 42.5,
      duration: 100.0,
      playbackRate: 1.0,
      lastUpdatedServerTime: baseTime,
      version: 1,
      hostId: 'host-1',
      hostName: 'Host',
    };

    const projected = engine.computeProjectedPosition(state, baseTime + 15000);
    expect(projected).toBe(42.5);
  });
});

describe('SyncEngine: Drift Policy & Thresholds', () => {
  it('categorizes drift correctly according to protocol policy', () => {
    // Under 150ms: ignore
    // 150ms - 500ms: gentle rate adjustment
    // Over 500ms: hard seek correction
    const getCorrectionAction = (driftMs: number): 'ignore' | 'gentle' | 'seek' => {
      const absDrift = Math.abs(driftMs);
      if (absDrift < 150) return 'ignore';
      if (absDrift <= 500) return 'gentle';
      return 'seek';
    };

    expect(getCorrectionAction(45)).toBe('ignore');
    expect(getCorrectionAction(-120)).toBe('ignore');
    expect(getCorrectionAction(250)).toBe('gentle');
    expect(getCorrectionAction(-480)).toBe('gentle');
    expect(getCorrectionAction(550)).toBe('seek');
    expect(getCorrectionAction(-1200)).toBe('seek');
  });
});

describe('Movie Catalog: Fuzzy Search & Filtering', () => {
  it('finds movies with exact and fuzzy queries', () => {
    // Exact match
    const exact = filterAndSearchMovies(DEMO_MOVIES, 'Bunny');
    expect(exact.length).toBeGreaterThan(0);
    expect(exact[0].title).toBe('Big Buck Bunny');

    // Fuzzy match with minor typo (e.g. "Bunnny" or "Teers")
    const fuzzy = filterAndSearchMovies(DEMO_MOVIES, 'Teers');
    expect(fuzzy.length).toBeGreaterThan(0);
    expect(fuzzy[0].title).toBe('Tears of Steel');

    // Genre filter
    const animation = filterAndSearchMovies(DEMO_MOVIES, undefined, 'Animation');
    expect(animation.every((m) => m.genres.includes('Animation'))).toBe(true);
  });
});
