import React, { useState, useEffect } from 'react';
import {
  Sun,
  Calendar,
  Bell,
  Volume2,
  Square,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  MapPin,
} from 'lucide-react';
import { ScheduleItem } from '../types';
import { WeatherData } from './WeatherWidget';

interface MorningBriefingCardProps {
  schedule: ScheduleItem[];
  weather: WeatherData | null;
  isSpeaking: boolean;
  onPlayBriefing: (briefingText: string) => void;
  onStopSpeaking: () => void;
}

export function buildMorningBriefingText(
  schedule: ScheduleItem[],
  weather: WeatherData | null
): { speechText: string; isMorningTime: boolean } {
  const now = new Date();
  const currentHour = now.getHours();
  const isMorningTime = currentHour >= 4 && currentHour < 12;
  const todayStr = now.toISOString().split('T')[0];

  // 1. Polite Greeting
  let greeting = isMorningTime
    ? 'Good morning Sir, Ram Ram ji! Shubh prabhat.'
    : 'Ram Ram ji! Mai aapki daily schedule aur weather briefing pesh kar rahi hu.';

  // 2. Weather Section
  let weatherSection = '';
  if (weather) {
    weatherSection = `Is samay ${weather.city} me temperature ${weather.tempC}°C hai, mausam ${weather.condition.toLowerCase()} hai, aur humidity ${weather.humidity}% hai.`;
  } else {
    weatherSection = 'Aapke local area ka mausam pleasant aur normal rehne ki ummeed hai.';
  }

  // 3. Today's Events / Meetings
  const safeSchedule = Array.isArray(schedule) ? schedule : [];
  const todayEvents = safeSchedule.filter(
    (item) => !item.completed && (item.date === todayStr || item.category === 'meeting')
  );

  let scheduleSection = '';
  if (todayEvents.length > 0) {
    const eventSummaries = todayEvents
      .slice(0, 3)
      .map((ev) => `${ev.title} ${ev.time} baje`)
      .join(', ');
    scheduleSection = `Aaj aapke calendar me ${todayEvents.length} important events hain: ${eventSummaries}.`;
  } else {
    scheduleSection = 'Aaj ke din aapka calendar bilkul clear hai aur koi urgent meeting nahi hai.';
  }

  // 4. Pending Reminders & Alarms
  const pendingReminders = safeSchedule.filter(
    (item) => !item.completed && (item.category === 'reminder' || item.category === 'alarm')
  );

  let reminderSection = '';
  if (pendingReminders.length > 0) {
    const titles = pendingReminders.slice(0, 2).map((r) => r.title).join(' aur ');
    reminderSection = `Aapke paas ${pendingReminders.length} pending reminders hain, jaise ki ${titles}.`;
  } else {
    reminderSection = 'Aapke sabhi purane reminders complete ho chuke hain.';
  }

  // 5. Sign-off
  const signOff = 'Maine sabhi phone controls ready kar diye hain. Have a productive and wonderful day, Sir!';

  const speechText = `${greeting} ${weatherSection} ${scheduleSection} ${reminderSection} ${signOff}`;

  return { speechText, isMorningTime };
}

export const MorningBriefingCard: React.FC<MorningBriefingCardProps> = ({
  schedule,
  weather,
  isSpeaking,
  onPlayBriefing,
  onStopSpeaking,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const now = new Date();
  const currentHour = now.getHours();
  const isMorningTime = currentHour >= 4 && currentHour < 12;

  const { speechText } = buildMorningBriefingText(schedule, weather);

  const todayStr = now.toISOString().split('T')[0];
  const todayEvents = schedule.filter(
    (item) => !item.completed && (item.date === todayStr || item.category === 'meeting')
  );
  const pendingReminders = schedule.filter(
    (item) => !item.completed && (item.category === 'reminder' || item.category === 'alarm')
  );

  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const handleTogglePlay = () => {
    if (isSpeaking) {
      onStopSpeaking();
    } else {
      onPlayBriefing(speechText);
    }
  };

  return (
    <div
      id="jarvis-morning-briefing-card"
      className="bg-gradient-to-br from-amber-950/25 via-slate-900/90 to-slate-950/90 border border-amber-500/30 hover:border-amber-400/50 rounded-3xl p-5 backdrop-blur-xl shadow-xl transition-all relative overflow-hidden group"
    >
      {/* Ambient solar morning glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* CARD HEADER */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Sun className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold text-white tracking-wide uppercase flex items-center gap-1.5">
                <span>{isMorningTime ? 'Morning Briefing' : 'Daily Briefing'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30">
                  {isMorningTime ? '☀️ AM Brief' : '📋 Today Report'}
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>{formattedDate}</span>
              <span>•</span>
              <span className="text-amber-300/90">Jarvis Voice AI</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-play-morning-briefing"
            onClick={handleTogglePlay}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer ${
              isSpeaking
                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300 animate-pulse'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
            }`}
            title={isSpeaking ? 'Stop Briefing' : 'Listen to Morning Briefing'}
          >
            {isSpeaking ? (
              <>
                <Square className="w-3.5 h-3.5 fill-rose-300" />
                <span>Stop Voice</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Speak Briefing</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-white transition-all"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3 SUMMARY PILLARS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        {/* Pillar 1: Local Weather */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
              Weather
            </span>
            <p className="text-xs font-bold text-white truncate">
              {weather ? `${weather.tempC}°C, ${weather.condition}` : 'Loading weather...'}
            </p>
            <span className="text-[10px] text-cyan-300 truncate block">
              {weather ? weather.city : 'Detecting GPS'}
            </span>
          </div>
        </div>

        {/* Pillar 2: Today's Schedule */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
              Schedule
            </span>
            <p className="text-xs font-bold text-white truncate">
              {todayEvents.length > 0 ? `${todayEvents.length} Events Today` : 'Calendar Clear'}
            </p>
            <span className="text-[10px] text-indigo-300 truncate block">
              {todayEvents[0] ? `${todayEvents[0].title} (${todayEvents[0].time})` : 'No meetings'}
            </span>
          </div>
        </div>

        {/* Pillar 3: Pending Reminders */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
              Reminders
            </span>
            <p className="text-xs font-bold text-white truncate">
              {pendingReminders.length > 0
                ? `${pendingReminders.length} Active Tasks`
                : 'All Caught Up'}
            </p>
            <span className="text-[10px] text-emerald-300 truncate block">
              {pendingReminders[0] ? pendingReminders[0].title : '0 pending'}
            </span>
          </div>
        </div>
      </div>

      {/* EXPANDABLE FULL BRIEFING TEXT & SPEECH ANIMATION */}
      {isExpanded && (
        <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Voice Briefing Script:</span>
            </span>
            {isSpeaking && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                <span className="inline-block w-1.5 h-3 bg-amber-400 animate-pulse rounded-full" />
                <span className="inline-block w-1.5 h-4 bg-amber-400 animate-pulse rounded-full delay-75" />
                <span className="inline-block w-1.5 h-2 bg-amber-400 animate-pulse rounded-full delay-150" />
                <span className="ml-1 text-[10px]">Speaking...</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-normal">
            "{speechText}"
          </p>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
            <span>Automatically speaks on morning app launch</span>
            <button
              onClick={() => onPlayBriefing(speechText)}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Replay Audio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
