import React from 'react';
import { Activity, X, Zap, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { useSyncStore } from '../../store/useSyncStore';

export const SyncHealthHUD: React.FC = () => {
  const {
    driftMs,
    serverOffsetMs,
    rttMs,
    status,
    appliedCorrections,
    authoritativeVersion,
    isHudOpen,
    setHudOpen,
  } = useSyncStore();

  if (!isHudOpen) return null;

  const absDrift = Math.abs(driftMs);
  let statusBadge = {
    text: 'SYNCED',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  if (status === 'adjusting') {
    statusBadge = {
      text: 'SMOOTHING RATE',
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
  } else if (status === 'correcting') {
    statusBadge = {
      text: 'SEEK CORRECTING',
      color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    };
  } else if (status === 'buffering') {
    statusBadge = {
      text: 'BUFFERING',
      color: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    };
  }

  return (
    <div className="absolute top-4 left-4 z-40 w-80 glass-panel-elevated rounded-xl p-4 text-xs font-mono border border-brand-violet/30 shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-cinematic-700/60 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-electric animate-pulse" />
          <span className="font-sans font-bold text-sm text-white tracking-wide">
            Smart Sync Health
          </span>
        </div>
        <button
          onClick={() => setHudOpen(false)}
          className="text-cinematic-400 hover:text-white p-1 rounded-md hover:bg-cinematic-700/50 transition-colors"
          title="Close HUD"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2.5">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-cinematic-400">Sync Status:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wider ${statusBadge.color}`}
          >
            {statusBadge.text}
          </span>
        </div>

        {/* Live Drift */}
        <div className="flex items-center justify-between">
          <span className="text-cinematic-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-brand-violet" />
            Playback Drift:
          </span>
          <span
            className={`font-bold ${
              absDrift < 150
                ? 'text-emerald-400'
                : absDrift <= 500
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {driftMs > 0 ? `+${driftMs} ms` : `${driftMs} ms`}
          </span>
        </div>

        {/* Round Trip Time (RTT) */}
        <div className="flex items-center justify-between">
          <span className="text-cinematic-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-electricBlue" />
            Network RTT:
          </span>
          <span className="text-cinematic-200 font-semibold">{rttMs} ms</span>
        </div>

        {/* NTP Server Clock Offset */}
        <div className="flex items-center justify-between">
          <span className="text-cinematic-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-coral" />
            Server Clock Offset:
          </span>
          <span className="text-cinematic-200">{serverOffsetMs} ms</span>
        </div>

        {/* Authoritative State Version */}
        <div className="flex items-center justify-between">
          <span className="text-cinematic-400 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-brand-gold" />
            Authoritative Version:
          </span>
          <span className="text-brand-gold font-bold">v{authoritativeVersion}</span>
        </div>

        {/* Corrections Count */}
        <div className="flex items-center justify-between pt-2 border-t border-cinematic-800">
          <span className="text-cinematic-400">Applied Corrections:</span>
          <span className="text-cinematic-100 font-bold">{appliedCorrections}</span>
        </div>
      </div>

      <div className="mt-3 pt-2 text-[10px] text-cinematic-500 font-sans leading-tight border-t border-cinematic-800/80">
        Continuous authoritative projection running at 4Hz. Residual drift target: &lt;500ms.
      </div>
    </div>
  );
};
