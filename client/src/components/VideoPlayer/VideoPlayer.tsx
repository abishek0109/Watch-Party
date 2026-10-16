import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Activity,
  Bookmark,
  Sparkles,
  Crown,
  WifiOff,
  RotateCcw,
} from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';
import { useSyncStore } from '../../store/useSyncStore';
import { useVideoSync } from '../../hooks/useVideoSync';
import { socketService } from '../../services/socket';
import { SOCKET_EVENTS } from '../../../../shared/types';
import { FloatingReactions } from './FloatingReactions';
import { SyncHealthHUD } from './SyncHealthHUD';
import { CinemaMomentsModal } from './CinemaMomentsModal';

const REACTION_EMOJIS = ['😂', '❤️', '🔥', '😭', '👏', '😮', '🎉', '🍿'];

export const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const authoritativeState = useRoomStore((state) => state.authoritativeState);
  const connectionStatus = useRoomStore((state) => state.connectionStatus);
  const { driftMs, toggleHud, isHudOpen, status } = useSyncStore();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(596);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isMomentsModalOpen, setIsMomentsModalOpen] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    canControl,
    isHost,
    isScrubbing,
    setIsScrubbing,
    setIsBuffering,
    autoplayBlocked,
    resumeAutoplay,
    handlePlay,
    handlePause,
    handleSeek,
  } = useVideoSync(videoRef);

  // Time updates from local video element
  const handleTimeUpdate = () => {
    if (videoRef.current && !isScrubbing) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 596);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Seekbar scrubbing
  const onSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const onSeekStart = () => {
    setIsScrubbing(true);
  };

  const onSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsScrubbing(false);
    const target = e.currentTarget as HTMLInputElement;
    const newTime = parseFloat(target.value);
    handleSeek(newTime);
  };

  // Volume
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
      setIsMuted(v === 0);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  // Controls auto-hide on inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (authoritativeState?.status === 'playing') {
        setShowControls(false);
      }
    }, 3500);
  };

  // Emoji Reaction Sender
  const sendReaction = (emoji: string) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.REACTION_SEND, { emoji });
    }
  };

  const isPlaying = authoritativeState?.status === 'playing';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-cinematic-800/80 group select-none"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        className="w-full h-full object-contain cursor-pointer"
        onClick={() => {
          if (canControl) {
            isPlaying ? handlePause() : handlePlay();
          }
        }}
      />

      {/* Floating Animated Emojis Overlay */}
      <FloatingReactions />

      {/* Smart Sync Health HUD */}
      <SyncHealthHUD />

      {/* Reconnecting / Offline Banner */}
      {connectionStatus === 'reconnecting' && (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/90 text-black text-xs font-bold animate-pulse">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Reconnecting to room...</span>
        </div>
      )}

      {/* Autoplay Blocked Banner */}
      {autoplayBlocked && (
        <div className="absolute inset-0 z-40 bg-black/70 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-2xl bg-brand-violet/20 border border-brand-violet/40 max-w-sm">
            <Sparkles className="w-8 h-8 text-brand-violet mx-auto mb-2 animate-bounce" />
            <h4 className="text-white font-bold text-base mb-1">Synchronized Playback Ready</h4>
            <p className="text-xs text-cinematic-300 mb-4">
              Your browser paused autoplay. Click below to unmute and lock in with room playback.
            </p>
            <button
              onClick={resumeAutoplay}
              className="w-full py-2 px-4 rounded-xl bg-brand-violet hover:bg-brand-violetDark text-white text-xs font-bold shadow-lg shadow-brand-violet/30 transition-all"
            >
              Unmute & Sync Video
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar inside Video */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="font-display font-bold text-sm sm:text-base text-white truncate max-w-md drop-shadow">
            {authoritativeState?.videoTitle || 'SyncScreen Player'}
          </span>
          {isHost && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
              <Crown className="w-3 h-3" />
              Host Control
            </span>
          )}
        </div>

        {/* Smart Sync Health Toggle Pill */}
        <button
          onClick={toggleHud}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-all ${
            isHudOpen
              ? 'bg-brand-violet text-white border-brand-violet shadow-lg shadow-brand-violet/30'
              : 'bg-black/60 hover:bg-black/80 text-cinematic-200 border-cinematic-700/80 backdrop-blur-md'
          }`}
          title="Toggle Smart Sync Health Diagnostic HUD"
        >
          <Activity className="w-3.5 h-3.5 text-brand-electric animate-pulse" />
          <span>
            {Math.abs(driftMs) < 150 ? 'SYNCED' : status.toUpperCase()}:{' '}
            {driftMs > 0 ? `+${driftMs}ms` : `${driftMs}ms`}
          </span>
        </button>
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Seek Slider */}
        <div className="relative mb-3 flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={onSeekChange}
            onMouseDown={onSeekStart}
            onMouseUp={onSeekEnd}
            onTouchStart={onSeekStart}
            onTouchEnd={onSeekEnd}
            disabled={!canControl}
            className="w-full seek-slider"
          />
        </div>

        {/* Controls Layout */}
        <div className="flex items-center justify-between gap-3">
          {/* Left Controls: Play/Pause, Volume, Time */}
          <div className="flex items-center gap-3">
            {canControl ? (
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="p-2 rounded-xl bg-white/10 hover:bg-brand-violet text-white transition-all transform active:scale-95"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>
            ) : (
              <div
                className="p-2 rounded-xl bg-cinematic-800/60 text-cinematic-500 cursor-not-allowed"
                title="Only host can control playback in this room"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </div>
            )}

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={toggleMute}
                className="text-cinematic-300 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={onVolumeChange}
                className="w-16 h-1 bg-cinematic-700 rounded-lg appearance-none cursor-pointer accent-brand-violet"
              />
            </div>

            {/* Timestamps */}
            <span className="text-xs font-mono text-cinematic-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Center Reactions Trigger */}
          <div className="hidden sm:flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-cinematic-700/60">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="hover:scale-130 transform transition-transform px-1 py-0.5 text-base active:scale-95"
                title={`Send ${emoji} reaction`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Right Controls: Cinema Moment, Fullscreen */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMomentsModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-brand-violet text-cinematic-200 hover:text-white text-xs font-semibold transition-all"
              title="Bookmark Cinema Moment"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Moment</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-cinematic-300 hover:text-white hover:bg-white/10 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Cinema Moments Modal */}
      <CinemaMomentsModal
        currentTime={currentTime}
        isOpen={isMomentsModalOpen}
        onClose={() => setIsMomentsModalOpen(false)}
        onSeekTo={(t) => handleSeek(t)}
      />
    </div>
  );
};
