import React from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Tv,
  Users,
  Activity,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Flame,
  CheckCircle,
  Clock,
  Compass,
} from 'lucide-react';
import { DEMO_MOVIES } from '../services/movieCatalog';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 lg:pt-28 overflow-hidden">
        {/* Cinematic Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-violet/20 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-brand-electric/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cinematic-850/90 border border-brand-violet/30 text-brand-electricBlue text-xs font-semibold mb-6 shadow-lg shadow-brand-violet/10">
            <Activity className="w-3.5 h-3.5 text-brand-violet animate-pulse" />
            <span>Real-time Multi-Client Video Synchronization</span>
          </div>

          {/* Heading with Tagline */}
          <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
            Same screen.{' '}
            <span className="bg-gradient-to-r from-brand-violet via-brand-electric to-brand-coral bg-clip-text text-transparent">
              Same moment.
            </span>{' '}
            Anywhere.
          </h1>

          <p className="text-base sm:text-xl text-cinematic-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            SyncScreen brings remote friends into the same cinematic theatre with sub-100ms authoritative playback synchronization, live spoiler-safe chat, group voting, and smart mood matching.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <Link
              to="/create-room"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-violet to-brand-electric hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-brand-violet/25 transform hover:-translate-y-0.5 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              Start a Watch Party
            </Link>

            <Link
              to="/join"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-cinematic-850 hover:bg-cinematic-800 border border-cinematic-700/80 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all"
            >
              <Tv className="w-4 h-4 text-brand-coral" />
              Join a Room
            </Link>
          </div>

          {/* Interactive Live-Looking Interface Preview */}
          <div className="relative max-w-5xl mx-auto rounded-2xl p-2 sm:p-3 glass-panel-elevated border border-brand-violet/30 shadow-2xl">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-cinematic-950 border border-cinematic-800">
              <img
                src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80"
                alt="Live Watch Party Preview"
                className="w-full h-full object-cover opacity-80"
              />

              {/* Overlay HUD Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-emerald-400 font-mono text-xs font-bold border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-0.5" />
                  SYNCED • 0ms DRIFT
                </span>
                <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-cinematic-200 text-xs font-semibold border border-cinematic-700/60 hidden sm:inline-block">
                  Big Buck Bunny Premiere (Blender 4K)
                </span>
              </div>

              {/* Floating Emojis in Preview */}
              <div className="absolute bottom-20 left-1/4 animate-bounce text-3xl filter drop-shadow">
                🔥
              </div>
              <div className="absolute bottom-28 right-1/3 animate-pulse text-3xl filter drop-shadow">
                😂
              </div>

              {/* Player Bottom Bar Preview */}
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-brand-violet text-white">
                    <Play className="w-4 h-4 fill-white" />
                  </div>
                  <div className="w-48 sm:w-72 h-1.5 bg-cinematic-700/80 rounded-full overflow-hidden">
                    <div className="w-2/5 h-full bg-gradient-to-r from-brand-violet to-brand-electric rounded-full" />
                  </div>
                  <span className="text-xs font-mono text-cinematic-300">03:45 / 09:56</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                    👑 Host: Alex
                  </span>
                  <span className="text-xs font-semibold text-cinematic-200 bg-black/60 px-2.5 py-1 rounded-full">
                    8 Viewers
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Showcase Movies */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
              Trending for Watch Parties
            </h2>
            <p className="text-xs sm:text-sm text-cinematic-400 mt-1">
              Premieres with zero-latency synchronization ready to stream.
            </p>
          </div>
          <Link
            to="/discover"
            className="flex items-center gap-1.5 text-xs font-bold text-brand-electricBlue hover:text-white transition-colors"
          >
            Explore All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {DEMO_MOVIES.slice(0, 4).map((movie) => (
            <div
              key={movie.id}
              className="group relative rounded-2xl overflow-hidden bg-cinematic-900 border border-cinematic-800 hover:border-brand-violet/50 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-violet/10 flex flex-col"
            >
              <div className="aspect-[2/3] w-full overflow-hidden relative">
                <img
                  src={movie.posterPath}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-bold text-amber-400 border border-amber-400/30">
                  ★ {movie.voteAverage}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-brand-electricBlue mb-1">
                    {movie.genres.slice(0, 2).join(' • ')}
                  </div>
                  <h3 className="font-bold text-sm text-white group-hover:text-brand-violet transition-colors truncate">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-cinematic-400 line-clamp-2 mt-1">
                    {movie.overview}
                  </p>
                </div>
                <Link
                  to={`/create-room`}
                  className="mt-4 w-full py-2 rounded-xl bg-cinematic-800 hover:bg-brand-violet text-cinematic-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Host Watch Party
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Pillar Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display font-black text-3xl sm:text-4xl text-white mb-3">
            Engineered for Perfect Synchronization
          </h2>
          <p className="text-sm text-cinematic-400">
            Say goodbye to "3, 2, 1, press play!" SyncScreen continuously synchronizes playback with authoritative server projection and millisecond drift correction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl glass-panel border border-cinematic-800 hover:border-brand-violet/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-brand-violet/20 text-brand-violet flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-2">
              Smart Sync Engine
            </h3>
            <p className="text-xs text-cinematic-300 leading-relaxed">
              Monotonically versioned server timestamps project true position. Small drifts are smoothed by adjusting playback speed, while larger drifts perform immediate seek alignment.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl glass-panel border border-cinematic-800 hover:border-brand-electric/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-brand-electric/20 text-brand-electric flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-2">
              Spoiler-Safe Chat & Emojis
            </h3>
            <p className="text-xs text-cinematic-300 leading-relaxed">
              Tag plot reveals as spoilers so friends only see them when clicked. Send floating emoji reactions that animate across everyone's screen in real time.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl glass-panel border border-cinematic-800 hover:border-brand-coral/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-brand-coral/20 text-brand-coral flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-2">
              VibeMatch AI & Voting
            </h3>
            <p className="text-xs text-cinematic-300 leading-relaxed">
              Can't agree on what to watch? VibeMatch aggregates the group's preferred moods and genres, calculating the highest match with clear explanations.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-14 overflow-hidden border border-brand-violet/40 bg-gradient-to-r from-cinematic-900 via-cinematic-850 to-brand-violet/20 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-white mb-2">
              Ready to watch together?
            </h2>
            <p className="text-xs sm:text-sm text-cinematic-300 max-w-xl">
              Create a free private or public watch room in seconds. No complex installations or screen-sharing lag required.
            </p>
          </div>
          <Link
            to="/create-room"
            className="px-8 py-4 rounded-xl bg-brand-violet hover:bg-brand-violetDark text-white font-bold text-sm shadow-xl shadow-brand-violet/30 shrink-0 transition-all transform hover:scale-105"
          >
            Create Watch Room Now
          </Link>
        </div>
      </section>
    </div>
  );
};
