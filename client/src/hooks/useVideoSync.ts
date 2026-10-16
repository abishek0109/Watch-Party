import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import { useSyncStore } from '../store/useSyncStore';
import { socketService } from '../services/socket';
import { SOCKET_EVENTS, AuthoritativePlaybackState } from '../../../shared/types';

export function useVideoSync(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const authoritativeState = useRoomStore((state) => state.authoritativeState);
  const roomDetails = useRoomStore((state) => state.roomDetails);
  const participants = useRoomStore((state) => state.participants);
  const setTelemetry = useSyncStore((state) => state.setTelemetry);
  const recordCorrection = useSyncStore((state) => state.recordCorrection);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const lastSeekTimeRef = useRef<number>(0);
  const lastStateVersionRef = useRef<number>(0);
  const socket = socketService.getSocket();

  // Determine if current user can control playback
  const isHost = participants.find((p) => p.id === socket?.id)?.isHost ?? false;
  const canControl = roomDetails?.settings.controlMode === 'collaborative' || isHost;

  // Compute expected authoritative position right now
  const computeExpectedPosition = useCallback(
    (state: AuthoritativePlaybackState): number => {
      if (state.status !== 'playing') {
        return state.currentTime;
      }
      const nowServer = socketService.getServerEstimatedTime();
      const elapsed = (nowServer - state.lastUpdatedServerTime) / 1000;
      const projected = state.currentTime + elapsed * state.playbackRate;
      return Math.max(0, Math.min(state.duration, projected));
    },
    []
  );

  // Apply authoritative state changes to local video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !authoritativeState) return;

    // Detect if this is a newer state version
    const isNewVersion = authoritativeState.version > lastStateVersionRef.current;
    lastStateVersionRef.current = authoritativeState.version;

    const expectedPosition = computeExpectedPosition(authoritativeState);

    // If video URL changed
    if (video.src !== authoritativeState.videoUrl && authoritativeState.videoUrl) {
      video.src = authoritativeState.videoUrl;
      video.currentTime = expectedPosition;
    }

    if (authoritativeState.status === 'playing') {
      // Seek if distance is significant (>300ms) or on new version
      if (Math.abs(video.currentTime - expectedPosition) > 0.35 || isNewVersion) {
        video.currentTime = expectedPosition;
        lastSeekTimeRef.current = Date.now();
      }

      if (video.paused) {
        video.play().catch((err) => {
          console.warn('[Autoplay blocked]', err);
          setAutoplayBlocked(true);
        });
      }
    } else if (authoritativeState.status === 'paused') {
      if (!video.paused) {
        video.pause();
      }
      if (Math.abs(video.currentTime - authoritativeState.currentTime) > 0.25) {
        video.currentTime = authoritativeState.currentTime;
      }
    }
  }, [authoritativeState, computeExpectedPosition]);

  // Periodic Drift Detection and Correction Loop (Runs every 250ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || !authoritativeState || isScrubbing || isBuffering) {
        return;
      }

      const now = Date.now();
      const expectedTime = computeExpectedPosition(authoritativeState);
      const driftSeconds = video.currentTime - expectedTime;
      const driftMs = Math.round(driftSeconds * 1000);
      const absDriftMs = Math.abs(driftMs);

      const metrics = socketService.getMetrics();

      // Don't correct if we just performed a seek within the last 1200ms
      const inCooldown = now - lastSeekTimeRef.current < 1200;

      if (!inCooldown && authoritativeState.status === 'playing') {
        if (absDriftMs < 150) {
          // Perfectly in sync
          if (video.playbackRate !== 1.0) {
            video.playbackRate = 1.0;
          }
          setTelemetry({
            driftMs,
            serverOffsetMs: metrics.serverOffsetMs,
            rttMs: metrics.rttMs,
            status: 'synced',
            version: authoritativeState.version,
          });
        } else if (absDriftMs <= 500) {
          // Gentle rate adjustment (nudges playback rate to smoothly catch up or slow down)
          if (driftMs < 0) {
            // Local video is falling behind -> speed up slightly
            video.playbackRate = 1.06;
          } else {
            // Local video is ahead -> slow down slightly
            video.playbackRate = 0.94;
          }
          setTelemetry({
            driftMs,
            serverOffsetMs: metrics.serverOffsetMs,
            rttMs: metrics.rttMs,
            status: 'adjusting',
            version: authoritativeState.version,
          });
        } else {
          // Large drift (>500ms) -> Seek correction
          video.currentTime = expectedTime;
          video.playbackRate = 1.0;
          lastSeekTimeRef.current = now;
          recordCorrection();
          setTelemetry({
            driftMs,
            serverOffsetMs: metrics.serverOffsetMs,
            rttMs: metrics.rttMs,
            status: 'correcting',
            version: authoritativeState.version,
          });
        }
      } else {
        setTelemetry({
          driftMs,
          serverOffsetMs: metrics.serverOffsetMs,
          rttMs: metrics.rttMs,
          status: isBuffering ? 'buffering' : 'synced',
          version: authoritativeState.version,
        });
      }

      // Periodically report drift telemetry to server
      if (socket && socket.connected) {
        socket.emit(SOCKET_EVENTS.PLAYBACK_DRIFT_REPORT, { driftMs });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [authoritativeState, computeExpectedPosition, isScrubbing, isBuffering, setTelemetry, recordCorrection]);

  // Video Player Control Handlers
  const handlePlay = () => {
    if (!canControl) return;
    const video = videoRef.current;
    if (socket) {
      socket.emit(SOCKET_EVENTS.PLAYBACK_PLAY, { clientTime: video?.currentTime });
    }
  };

  const handlePause = () => {
    if (!canControl) return;
    const video = videoRef.current;
    if (socket) {
      socket.emit(SOCKET_EVENTS.PLAYBACK_PAUSE, { clientTime: video?.currentTime });
    }
  };

  const handleSeek = (targetTime: number) => {
    if (!canControl) return;
    lastSeekTimeRef.current = Date.now();
    if (socket) {
      socket.emit(SOCKET_EVENTS.PLAYBACK_SEEK, { targetTime });
    }
  };

  const handleRateChange = (rate: number) => {
    if (!canControl) return;
    if (socket) {
      socket.emit(SOCKET_EVENTS.PLAYBACK_RATE, { playbackRate: rate });
    }
  };

  const resumeAutoplay = () => {
    const video = videoRef.current;
    if (video) {
      video.play().then(() => setAutoplayBlocked(false)).catch(console.error);
    }
  };

  return {
    canControl,
    isHost,
    isScrubbing,
    setIsScrubbing,
    isBuffering,
    setIsBuffering,
    autoplayBlocked,
    resumeAutoplay,
    handlePlay,
    handlePause,
    handleSeek,
    handleRateChange,
  };
}
