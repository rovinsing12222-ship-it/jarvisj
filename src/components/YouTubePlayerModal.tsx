import React, { useState, useEffect } from 'react';
import {
  Youtube,
  Play,
  Pause,
  X,
  Minimize2,
  Maximize2,
  Search,
  Music,
  Volume2,
  Sparkles,
  ExternalLink,
  Radio,
  SkipForward,
  RotateCcw,
} from 'lucide-react';
import { triggerHaptic } from '../utils/deviceHardware';

interface YouTubePlayerModalProps {
  isOpen: boolean;
  initialQuery?: string;
  forceMaximizeSignal?: number;
  onClose: () => void;
}

const PRESET_TRACKS = [
  { id: 'bolly', title: 'Trending Bollywood Hits', query: 'Latest Bollywood Hit Songs 2024' },
  { id: 'arijit', title: 'Arijit Singh Best Hits', query: 'Arijit Singh All Time Hit Songs' },
  { id: 'punjabi', title: 'Punjabi Party Hits', query: 'Top Punjabi Party Songs' },
  { id: 'lofi', title: 'Hindi Lo-Fi Chill', query: 'Hindi Lofi Songs Chill Beats' },
  { id: 'bhakti', title: 'Hanuman Chalisa & Bhakti', query: 'Shree Hanuman Chalisa Gulshan Kumar' },
  { id: 'romantic', title: 'Romantic Hindi Melodies', query: 'Best Romantic Hindi Songs Jukebox' },
];

export const YouTubePlayerModal: React.FC<YouTubePlayerModalProps> = ({
  isOpen,
  initialQuery = 'Trending Bollywood Songs 2024',
  forceMaximizeSignal,
  onClose,
}) => {
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [embedKey, setEmbedKey] = useState(0);

  const lastSignalRef = React.useRef(forceMaximizeSignal);

  useEffect(() => {
    if (isOpen && initialQuery && initialQuery !== currentQuery) {
      setCurrentQuery(initialQuery);
      setSearchInput(initialQuery);
      setIsPlaying(true);
      setIsMinimized(false);
      setEmbedKey((k) => k + 1);
    }
  }, [isOpen, initialQuery, currentQuery]);

  useEffect(() => {
    if (isOpen && forceMaximizeSignal && forceMaximizeSignal !== lastSignalRef.current) {
      lastSignalRef.current = forceMaximizeSignal;
      setIsMinimized(false);
      setIsPlaying(true);
    }
  }, [isOpen, forceMaximizeSignal]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      triggerHaptic([40, 50]);
      setCurrentQuery(searchInput.trim());
      setIsPlaying(true);
      setIsMinimized(false);
      setEmbedKey((k) => k + 1);
    }
  };

  const handleSelectPreset = (presetQuery: string) => {
    triggerHaptic([50]);
    setCurrentQuery(presetQuery);
    setSearchInput(presetQuery);
    setIsPlaying(true);
    setIsMinimized(false);
    setEmbedKey((k) => k + 1);
  };

  const openInNativeYouTube = () => {
    triggerHaptic([60, 40]);
    const cleanQ = encodeURIComponent(currentQuery || 'hindi songs');
    // Try opening Android native YouTube intent or web
    const appUrl = `https://www.youtube.com/results?search_query=${cleanQ}`;
    window.open(appUrl, '_blank', 'noopener,noreferrer');
  };

  // Embed URL using YouTube search embed mode
  const embedUrl = isPlaying
    ? `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(
        currentQuery || 'Bollywood Hindi Songs'
      )}&autoplay=1&mute=0&enablejsapi=1`
    : '';

  // Minimized Floating PiP Widget
  if (isMinimized) {
    return (
      <aside
        aria-label="Floating YouTube Mini Player"
        className="fixed bottom-20 right-3 z-50 w-72 sm:w-80 rounded-2xl bg-slate-950/95 border-2 border-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.4)] p-3 backdrop-blur-xl flex flex-col gap-2 transition-all animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic([40]);
              setIsMinimized(false);
            }}
            className="flex items-center gap-1.5 overflow-hidden text-left group"
            title="Display par bada karne ke liye yahan tap karein"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-red-400 group-hover:text-red-300">
              <Youtube className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[120px] text-slate-200 group-hover:text-white underline decoration-cyan-400/50">
                {currentQuery}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                triggerHaptic([40]);
                setIsMinimized(false);
              }}
              title="Display par bada karein (Maximize)"
              className="px-2 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[10px] font-bold flex items-center gap-1 hover:brightness-110 shadow-sm transition-all active:scale-95"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Bada Karein</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic([40]);
                setIsPlaying(false);
                onClose();
              }}
              title="Close Player"
              className="p-1 rounded-lg bg-slate-800 text-rose-300 hover:bg-rose-900/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Small embedded iframe preview with click-to-expand */}
        <div
          onClick={() => {
            triggerHaptic([40]);
            setIsMinimized(false);
          }}
          className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-slate-800 cursor-pointer group"
          title="Display par Full Screen karne ke liye tap karein"
        >
          {isPlaying && (
            <iframe
              key={`pip-${embedKey}`}
              src={embedUrl}
              title="YouTube Mini Stream"
              className="w-full h-full border-0 pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-all">
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-cyan-400 text-cyan-300 text-[10px] font-bold flex items-center gap-1 shadow-lg opacity-80 group-hover:opacity-100">
              <Maximize2 className="w-3 h-3" />
              <span>Tap to Show Full Screen</span>
            </div>
          </div>
        </div>

        {/* 1-Tap Quick Restore Button */}
        <button
          onClick={() => {
            triggerHaptic([40]);
            setIsMinimized(false);
          }}
          className="w-full py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
        >
          <Maximize2 className="w-3 h-3" />
          <span>👆 Tap Here: Display Par Show Karo</span>
        </button>
      </aside>
    );
  }

  // Full Screen / Modal Player
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="youtube-player-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-slate-950/95 border border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-gradient-to-r from-red-950/60 via-slate-900 to-cyan-950/60 border-b border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/40 text-white">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="youtube-player-title" className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  JARVIS YouTube Player
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                    LIVE
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                Playing: <span className="text-cyan-300 font-medium">{currentQuery}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                triggerHaptic([30]);
                setIsMinimized(true);
              }}
              title="Minimize to Floating PiP"
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                triggerHaptic([40]);
                setIsPlaying(false);
                onClose();
              }}
              title="Close Player"
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950 text-rose-300 hover:text-rose-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Stage */}
        <div className="relative w-full aspect-video bg-black overflow-hidden border-b border-slate-800">
          {isPlaying ? (
            <iframe
              key={`full-${embedKey}`}
              src={embedUrl}
              title="JARVIS YouTube Live Media Stream"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <Pause className="w-12 h-12 text-slate-600 animate-pulse" />
              <p className="text-sm font-medium">Player Paused</p>
              <button
                onClick={() => setIsPlaying(true)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all"
              >
                <Play className="w-4 h-4" />
                <span>Resume Playing</span>
              </button>
            </div>
          )}

          {/* Soundwave Visualizer Bar Indicator */}
          {isPlaying && (
            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 flex items-center gap-1.5 pointer-events-none">
              <span className="text-[10px] font-mono text-emerald-400 font-bold">STREAMING</span>
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 h-2 bg-red-500 animate-pulse" />
                <span className="w-0.5 h-3 bg-red-400 animate-bounce" />
                <span className="w-0.5 h-1.5 bg-red-500 animate-pulse" />
                <span className="w-0.5 h-3 bg-red-300 animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 sm:p-4 space-y-3 overflow-y-auto">
          {/* Quick Voice / Input Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search song or artist: Arijit Singh, Sidhu Moose Wala, Hanuman Chalisa..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 active:scale-95 transition-all shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Play</span>
            </button>
          </form>

          {/* Quick Preset Song Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Radio className="w-3 h-3 text-red-400" />
                <span>Quick Playlists & Gane:</span>
              </span>
              <span className="text-[10px] text-slate-500">1-Touch Instant Play</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_TRACKS.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSelectPreset(track.query)}
                  className={`p-2 rounded-xl text-left border transition-all text-xs flex items-center gap-2 ${
                    currentQuery === track.query
                      ? 'bg-red-500/20 border-red-500/60 text-white shadow-sm shadow-red-500/20'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Music className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate text-[11px] font-medium">{track.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Launch Native YouTube Button */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400">
              Voice command: Boliye <strong className="text-cyan-300">&quot;YouTube mein gane chalao&quot;</strong> ya <strong className="text-cyan-300">&quot;Gana band karo&quot;</strong>
            </div>

            <button
              onClick={openInNativeYouTube}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-red-300 hover:text-red-200 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in YouTube App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
