import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Play, Bookmark, Star, Calendar, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { MovieMetadata } from '../../../shared/types';
import { DEMO_MOVIES, filterAndSearchMovies } from '../services/movieCatalog';

const GENRES = ['all', 'Sci-Fi', 'Animation', 'Action', 'Comedy', 'Fantasy', 'Thriller', 'Documentary'];
const YEARS = ['all', '2024', '2023', '2021', '2015', '2012', '2010', '2008'];

export const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [movies, setMovies] = useState<MovieMetadata[]>(DEMO_MOVIES);
  const [addedWatchlist, setAddedWatchlist] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await api.searchMovies(query, selectedGenre, selectedYear, sortBy);
        setMovies(res.movies || []);
      } catch (e) {
        // Fallback to local filter
        const filtered = filterAndSearchMovies(DEMO_MOVIES, query, selectedGenre, selectedYear, sortBy);
        setMovies(filtered);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, selectedGenre, selectedYear, sortBy]);

  const handleCreateWithMovie = (movie: MovieMetadata) => {
    navigate('/create-room', {
      state: {
        initialMovie: {
          title: movie.title,
          url: movie.playableDemoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          posterUrl: movie.posterPath,
          videoType: 'html5',
        },
      },
    });
  };

  const handleAddToWatchlist = async (movie: MovieMetadata) => {
    if (!token) {
      navigate('/profile');
      return;
    }
    try {
      await api.addToWatchlist(token, {
        movieId: String(movie.id),
        movieTitle: movie.title,
        posterPath: movie.posterPath,
        overview: movie.overview,
        rating: movie.voteAverage,
      });
      setAddedWatchlist((prev) => ({ ...prev, [String(movie.id)]: true }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          Discover Movies & Video Streams
        </h1>
        <p className="text-sm text-cinematic-400 mt-1 max-w-xl">
          Browse open-source cinema, trending trailers, and curated watch party releases with instant synchronized rooms.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-cinematic-800 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinematic-400" />
            <input
              type="text"
              placeholder="Search by title, keyword, or genre (fuzzy search supported)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-cinematic-900 border border-cinematic-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-cinematic-500 focus:outline-none focus:border-brand-violet transition-colors"
            />
          </div>

          {/* Year and Sort Selectors */}
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-cinematic-900 border border-cinematic-700/80 rounded-xl px-3 py-2.5 text-xs text-cinematic-200 focus:outline-none focus:border-brand-violet cursor-pointer"
            >
              <option value="all">All Years</option>
              {YEARS.filter((y) => y !== 'all').map((y) => (
                <option key={y} value={y}>
                  Year: {y}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-cinematic-900 border border-cinematic-700/80 rounded-xl px-3 py-2.5 text-xs text-cinematic-200 focus:outline-none focus:border-brand-violet cursor-pointer"
            >
              <option value="rating">Top Rated</option>
              <option value="date">Release Date</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-cinematic-800/60">
          {GENRES.map((g) => {
            const isSelected = selectedGenre === g;
            return (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  isSelected
                    ? 'bg-brand-violet text-white shadow-md shadow-brand-violet/20'
                    : 'bg-cinematic-850 text-cinematic-400 hover:text-white hover:bg-cinematic-800'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Movie Grid */}
      {movies.length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-2xl border border-cinematic-800">
          <Sparkles className="w-10 h-10 text-cinematic-500 mx-auto mb-3" />
          <h3 className="font-bold text-base text-white">No titles found</h3>
          <p className="text-xs text-cinematic-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search spelling, selecting 'All Genres', or clearing the filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((m) => {
            const isWatchlisted = addedWatchlist[String(m.id)];
            return (
              <div
                key={m.id}
                className="group relative rounded-2xl overflow-hidden bg-cinematic-900 border border-cinematic-800/80 hover:border-brand-violet/50 transition-all duration-300 hover:shadow-2xl flex flex-col justify-between"
              >
                <div className="aspect-[2/3] w-full overflow-hidden relative bg-cinematic-950">
                  <img
                    src={m.posterPath}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-bold text-amber-400 border border-amber-400/30">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{m.voteAverage}</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-cinematic-400 mb-1">
                      <span className="font-bold text-brand-electric uppercase tracking-wider">
                        {m.genres[0]}
                      </span>
                      <span>{m.releaseDate.split('-')[0]}</span>
                    </div>

                    <h3 className="font-bold text-sm text-white group-hover:text-brand-violet transition-colors truncate">
                      {m.title}
                    </h3>
                    <p className="text-xs text-cinematic-400 line-clamp-2 mt-1">
                      {m.overview}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleCreateWithMovie(m)}
                      className="flex-1 py-2 px-3 rounded-xl bg-brand-violet hover:bg-brand-violetDark text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-violet/20 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Host Party
                    </button>

                    <button
                      onClick={() => handleAddToWatchlist(m)}
                      className={`p-2 rounded-xl border transition-colors ${
                        isWatchlisted
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-cinematic-850 hover:bg-cinematic-800 text-cinematic-300 hover:text-white border-cinematic-700/60'
                      }`}
                      title={isWatchlisted ? 'Added to Watchlist' : 'Add to Watchlist'}
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
