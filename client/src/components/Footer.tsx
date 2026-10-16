import React from 'react';
import { Play, Activity, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-cinematic-800/80 bg-cinematic-950 py-10 mt-auto text-cinematic-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-violet to-brand-electric flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
              <span className="font-display font-bold text-lg text-white">SyncScreen</span>
            </div>
            <p className="text-sm text-cinematic-400 max-w-sm mb-4">
              Same screen. Same moment. Anywhere. Experience movies and video streams synchronized in real-time with sub-second accuracy across remote friends.
            </p>
            <div className="flex items-center gap-3 text-xs text-brand-success font-medium bg-brand-success/10 border border-brand-success/20 px-3 py-1.5 rounded-full w-fit">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Real-Time Authoritative Sync Engine: Active</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cinematic-200 mb-3">
              Features
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/discover" className="hover:text-white transition-colors">
                  Movie Discovery
                </Link>
              </li>
              <li>
                <Link to="/create-room" className="hover:text-white transition-colors">
                  Create Watch Party
                </Link>
              </li>
              <li>
                <Link to="/join" className="hover:text-white transition-colors">
                  Join with Room Code
                </Link>
              </li>
              <li>
                <span className="text-cinematic-500">VibeMatch Recommendations</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cinematic-200 mb-3">
              Integrity & Media
            </h4>
            <ul className="space-y-2 text-sm text-cinematic-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-electric" />
                <span>Authorized Media URLs</span>
              </li>
              <li>Open-Source Blender Animations</li>
              <li>TMDB Metadata Fallback</li>
              <li>Zero DRM Circumvention</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cinematic-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-cinematic-500">
          <p>© {new Date().getFullYear()} SyncScreen. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Crafted for synchronized cinematic shared moments
          </p>
        </div>
      </div>
    </footer>
  );
};
