import React, { useState, useEffect, useCallback } from 'react';
import {
  Navigation,
  MapPin,
  Clock,
  Compass,
  Car,
  Bike,
  Train,
  Footprints,
  Volume2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Share2,
} from 'lucide-react';
import { ScheduleItem } from '../types';
import {
  TravelCalculationResult,
  calculateTravelToFirstScheduleItem,
  calculateTravelToScheduleItem,
} from '../utils/scheduleTravelCalculator';
import { getHighAccuracyLiveLocation } from '../utils/geolocationService';
import { triggerHaptic } from '../utils/hapticEngine';
import { playBeepSound, speakJarvis } from '../utils/audioSynth';

interface ScheduleTravelEtaCardProps {
  schedule: ScheduleItem[];
  onUpdateItemLocation?: (itemId: string, newLocation: string) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export const ScheduleTravelEtaCard: React.FC<ScheduleTravelEtaCardProps> = ({
  schedule,
  onUpdateItemLocation,
  className = '',
  defaultExpanded = true,
}) => {
  const [result, setResult] = useState<TravelCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'driving' | 'twoWheeler' | 'transit' | 'walking'>('driving');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [customLocationInput, setCustomLocationInput] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  // Compute travel calculation
  const performCalculation = useCallback(
    async (forceGpsRefresh: boolean = false) => {
      if (!schedule || schedule.length === 0) {
        setResult(null);
        return;
      }

      setIsLoading(true);
      try {
        let liveCoordsOverride: { latitude: number; longitude: number; city?: string } | undefined = undefined;

        if (forceGpsRefresh) {
          triggerHaptic([40, 60]);
          playBeepSound();
          try {
            const liveLoc = await getHighAccuracyLiveLocation(4500);
            liveCoordsOverride = {
              latitude: liveLoc.latitude,
              longitude: liveLoc.longitude,
              city: liveLoc.city,
            };
          } catch (gpsErr) {
            console.warn('[ScheduleTravelEta] Failed live GPS query, using cached/auto:', gpsErr);
          }
        }

        const calculated = await calculateTravelToFirstScheduleItem(schedule, liveCoordsOverride);
        setResult(calculated);
      } catch (err) {
        console.error('[ScheduleTravelEta] Calculation error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [schedule]
  );

  // Re-run whenever schedule changes
  useEffect(() => {
    performCalculation(false);
  }, [performCalculation]);

  // Voice readout handler
  const handleSpeakEta = () => {
    if (!result) return;
    triggerHaptic([30, 40]);
    setIsSpeaking(true);

    const speechText = result.destination.isVirtualMeeting
      ? result.verbalSummaryHi
      : `${result.verbalSummaryHi} Navigation shuru karne ke liye Google Maps button dabayein.`;

    speakJarvis(speechText, {
      force: true,
      onEnd: () => setIsSpeaking(false),
    });
  };

  // Quick location update
  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !customLocationInput.trim()) return;
    triggerHaptic([40]);
    const clean = customLocationInput.trim();
    if (onUpdateItemLocation) {
      onUpdateItemLocation(result.item.id, clean);
    }
    setIsEditingLocation(false);
    // Instant recompute with this location
    calculateTravelToScheduleItem(result.origin, {
      ...result.item,
      location: clean,
    }).then(setResult);
  };

  if (!schedule || schedule.length === 0) {
    return null;
  }

  const firstItem = schedule.find((s) => !s.completed) || schedule[0];
  if (!firstItem) return null;

  const currentEta = result ? result.etas[selectedMode] : null;

  return (
    <div
      className={`rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950 p-4 sm:p-5 shadow-[0_0_25px_rgba(6,182,212,0.12)] backdrop-blur-xl relative overflow-hidden transition-all ${className}`}
    >
      {/* Background Cyber Glow Accent */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      {/* Top Header & Collapse Toggle */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center flex-shrink-0 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Navigation className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                JARVIS GPS ROUTE & ETA
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-200">
                Item #1
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-100 truncate flex items-center gap-1.5">
              <span>{firstItem.title}</span>
              <span className="text-xs font-mono text-cyan-300 font-semibold">({firstItem.time})</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Refresh GPS Button */}
          <button
            type="button"
            onClick={() => performCalculation(true)}
            disabled={isLoading}
            className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 active:scale-95 transition-all text-xs font-mono flex items-center gap-1 cursor-pointer"
            title="Recalculate with live GPS satellite coordinate update"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">GPS Sync</span>
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer"
            title={isExpanded ? 'Collapse ETA Card' : 'Expand ETA Card'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {isExpanded && (
        <div className="pt-3 flex flex-col gap-3.5">
          {/* Origin & Destination Route Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Origin (Live GPS) */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2">
              <Compass className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Origin (Your GPS)
                </span>
                <p className="text-xs font-medium text-slate-200 truncate">
                  {result?.origin.locationName || 'Live GPS Position'}
                </p>
                {result?.origin && (
                  <span className="text-[10px] font-mono text-emerald-400/80">
                    {result.origin.latitude.toFixed(4)}°, {result.origin.longitude.toFixed(4)}°
                  </span>
                )}
              </div>
            </div>

            {/* Destination (Schedule #1) */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Destination
                  </span>
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {result?.destination.locationName || firstItem.location || 'Scheduled Location'}
                  </p>
                  <span className="text-[10px] font-mono text-cyan-300">
                    Scheduled at: {firstItem.time}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCustomLocationInput(result?.destination.locationName || firstItem.location || '');
                  setIsEditingLocation(!isEditingLocation);
                }}
                className="text-[10px] text-cyan-400 hover:text-cyan-200 font-mono underline flex-shrink-0"
              >
                {isEditingLocation ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>

          {/* Quick Location Edit Input (if clicked) */}
          {isEditingLocation && (
            <form onSubmit={handleSaveLocation} className="flex gap-2">
              <input
                type="text"
                value={customLocationInput}
                onChange={(e) => setCustomLocationInput(e.target.value)}
                placeholder="e.g. DLF Cyber City, Connaught Place, Office..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-sans"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                Update
              </button>
            </form>
          )}

          {/* Primary Telemetry Stats (Distance + ETA) */}
          {result && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-950/50 border border-cyan-500/40 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
              {/* Distance readout */}
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold block">
                    Travel Distance
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {result.roadDistanceKm}
                    </span>
                    <span className="text-sm font-bold text-cyan-300">km</span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({result.roadDistanceMiles} mi)
                    </span>
                  </div>
                </div>
              </div>

              {/* ETA Readout for Selected Mode */}
              {currentEta && (
                <div className="flex items-center gap-3 border-l border-cyan-500/20 pl-4">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold flex items-center gap-1">
                      <span>{currentEta.icon}</span>
                      <span>ETA ({currentEta.label})</span>
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-300 tracking-tight">
                        {currentEta.durationFormatted}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transport Mode Switcher Tabs */}
          {result && (
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-950/90 border border-slate-800">
              {(
                [
                  { mode: 'driving', icon: <Car className="w-3.5 h-3.5" />, label: 'Car / Cab' },
                  { mode: 'twoWheeler', icon: <Bike className="w-3.5 h-3.5" />, label: 'Bike' },
                  { mode: 'transit', icon: <Train className="w-3.5 h-3.5" />, label: 'Metro' },
                  { mode: 'walking', icon: <Footprints className="w-3.5 h-3.5" />, label: 'Walk' },
                ] as const
              ).map((tab) => {
                const isSelected = selectedMode === tab.mode;
                const etaInfo = result.etas[tab.mode];
                return (
                  <button
                    key={tab.mode}
                    type="button"
                    onClick={() => {
                      setSelectedMode(tab.mode);
                      triggerHaptic([25]);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {tab.icon}
                      <span className="text-[11px] font-bold">{tab.label}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono leading-none ${
                        isSelected ? 'text-slate-950 font-extrabold' : 'text-slate-400'
                      }`}
                    >
                      {etaInfo.durationFormatted}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Departure Recommendation Alert Box */}
          {currentEta && (
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
                <span className="font-semibold truncate">
                  {currentEta.departureTimeRecommendation} (with parking/buffer time)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold flex-shrink-0">
                Departure Time
              </span>
            </div>
          )}

          {/* Action Buttons: Google Maps Navigation & Jarvis Voice Speech */}
          <div className="flex items-center gap-2 pt-1">
            {/* Primary Google Maps Navigation Button */}
            {result?.googleMapsDirectionsUrl && (
              <a
                href={result.googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic([50])}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-98 transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate in Google Maps</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            )}

            {/* Jarvis Speak ETA Button */}
            <button
              type="button"
              onClick={handleSpeakEta}
              disabled={isSpeaking || !result}
              className={`py-2.5 px-3.5 rounded-xl border transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-500/20 border-rose-400 text-rose-200 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-cyan-400 hover:text-cyan-300'
              }`}
              title="Jarvis will speak the travel time and distance aloud"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-rose-400 animate-bounce' : 'text-cyan-400'}`} />
              <span className="hidden sm:inline">{isSpeaking ? 'Speaking...' : 'Speak ETA'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
