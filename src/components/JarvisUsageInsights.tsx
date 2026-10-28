import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PhoneCall,
  Bell,
  Sliders,
  Smartphone,
  Calendar,
  Sparkles,
  Zap,
  Layers,
  PieChart as PieIcon,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { JarvisAction } from '../types';

interface JarvisUsageInsightsProps {
  commandHistory?: {
    query: string;
    response: string;
    timestamp: string;
    actions?: JarvisAction[];
  }[];
}

interface DayData {
  day: string;
  fullDate: string;
  Reminders: number;
  Calls: number;
  Settings: number;
  Apps: number;
  total: number;
}

// Color palette matching Stark Industries / JARVIS HUD Cyberpunk theme
const CATEGORY_CONFIG = {
  Reminders: {
    label: 'Reminders & Alarms',
    color: '#06b6d4', // cyan-500
    glow: 'rgba(6, 182, 212, 0.4)',
    icon: Bell,
    description: 'Schedules, meetings & wake alerts',
  },
  Calls: {
    label: 'Calls & Comms',
    color: '#10b981', // emerald-500
    glow: 'rgba(16, 185, 129, 0.4)',
    icon: PhoneCall,
    description: 'Speed dial, WhatsApp & messaging',
  },
  Settings: {
    label: 'Hardware & Settings',
    color: '#f59e0b', // amber-500
    glow: 'rgba(245, 158, 11, 0.4)',
    icon: Sliders,
    description: 'Torch, vibrate, audio & telemetry',
  },
  Apps: {
    label: 'Apps & Navigation',
    color: '#8b5cf6', // purple-500
    glow: 'rgba(139, 92, 246, 0.4)',
    icon: Smartphone,
    description: 'YouTube, Camera, Maps & launches',
  },
};

export const JarvisUsageInsights: React.FC<JarvisUsageInsightsProps> = ({ commandHistory = [] }) => {
  const [activeView, setActiveView] = useState<'stacked' | 'grouped' | 'trend' | 'pie'>('stacked');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Compute live session additions by category
  const sessionStats = useMemo(() => {
    let remindersCount = 0;
    let callsCount = 0;
    let settingsCount = 0;
    let appsCount = 0;

    commandHistory.forEach((cmd) => {
      const q = cmd.query.toLowerCase();
      const actions = cmd.actions || [];

      const hasAction = (name: string) => actions.some((a) => a.name === name);

      if (
        hasAction('manageSchedule') ||
        q.includes('remind') ||
        q.includes('alarm') ||
        q.includes('meeting') ||
        q.includes('calendar') ||
        q.includes('baje') ||
        q.includes('schedule')
      ) {
        remindersCount++;
      } else if (
        hasAction('makePhoneCall') ||
        hasAction('searchContacts') ||
        hasAction('sendTextMessage') ||
        q.includes('call') ||
        q.includes('whatsapp') ||
        q.includes('message') ||
        q.includes('contact') ||
        q.includes('doctor') ||
        q.includes('phone')
      ) {
        callsCount++;
      } else if (
        hasAction('managePhoneSettings') ||
        q.includes('torch') ||
        q.includes('flashlight') ||
        q.includes('vibrate') ||
        q.includes('battery') ||
        q.includes('setting') ||
        q.includes('volume') ||
        q.includes('wifi')
      ) {
        settingsCount++;
      } else {
        appsCount++;
      }
    });

    return { remindersCount, callsCount, settingsCount, appsCount };
  }, [commandHistory]);

  // Baseline 7-day data representing realistic past-week usage, with Today incorporating live session commands
  const weeklyData: DayData[] = useMemo(() => {
    const days = [
      { day: 'Mon', fullDate: 'Aug 28', baseReminders: 7, baseCalls: 9, baseSettings: 4, baseApps: 3 },
      { day: 'Tue', fullDate: 'Aug 29', baseReminders: 9, baseCalls: 12, baseSettings: 5, baseApps: 4 },
      { day: 'Wed', fullDate: 'Aug 30', baseReminders: 8, baseCalls: 14, baseSettings: 6, baseApps: 5 },
      { day: 'Thu', fullDate: 'Aug 31', baseReminders: 11, baseCalls: 10, baseSettings: 3, baseApps: 6 },
      { day: 'Fri', fullDate: 'Sep 01', baseReminders: 13, baseCalls: 16, baseSettings: 8, baseApps: 7 },
      { day: 'Sat', fullDate: 'Sep 02', baseReminders: 6, baseCalls: 8, baseSettings: 4, baseApps: 5 },
      {
        day: 'Today',
        fullDate: 'Sep 03',
        baseReminders: 10 + sessionStats.remindersCount,
        baseCalls: 11 + sessionStats.callsCount,
        baseSettings: 5 + sessionStats.settingsCount,
        baseApps: 4 + sessionStats.appsCount,
      },
    ];

    return days.map((d) => {
      const Reminders = d.baseReminders;
      const Calls = d.baseCalls;
      const Settings = d.baseSettings;
      const Apps = d.baseApps;
      const total = Reminders + Calls + Settings + Apps;
      return {
        day: d.day,
        fullDate: d.fullDate,
        Reminders,
        Calls,
        Settings,
        Apps,
        total,
      };
    });
  }, [sessionStats]);

  // Aggregate totals
  const totals = useMemo(() => {
    const totalReminders = weeklyData.reduce((acc, curr) => acc + curr.Reminders, 0);
    const totalCalls = weeklyData.reduce((acc, curr) => acc + curr.Calls, 0);
    const totalSettings = weeklyData.reduce((acc, curr) => acc + curr.Settings, 0);
    const totalApps = weeklyData.reduce((acc, curr) => acc + curr.Apps, 0);
    const totalAll = totalReminders + totalCalls + totalSettings + totalApps;

    return {
      totalReminders,
      totalCalls,
      totalSettings,
      totalApps,
      totalAll,
      peakDay: weeklyData.reduce((max, d) => (d.total > max.total ? d : max), weeklyData[0]),
    };
  }, [weeklyData]);

  // Pie chart data
  const pieData = useMemo(() => {
    return [
      { name: 'Reminders', value: totals.totalReminders, color: CATEGORY_CONFIG.Reminders.color },
      { name: 'Calls', value: totals.totalCalls, color: CATEGORY_CONFIG.Calls.color },
      { name: 'Settings', value: totals.totalSettings, color: CATEGORY_CONFIG.Settings.color },
      { name: 'Apps', value: totals.totalApps, color: CATEGORY_CONFIG.Apps.color },
    ];
  }, [totals]);

  // Custom HUD Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayEntry = weeklyData.find((d) => d.day === label);
      const totalForDay = dayEntry ? dayEntry.total : payload.reduce((sum: number, p: any) => sum + p.value, 0);

      return (
        <div className="bg-gray-950/95 border border-cyan-400/60 rounded-xl p-3 shadow-[0_0_20px_rgba(6,182,212,0.35)] backdrop-blur-md text-xs font-mono min-w-[170px]">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 mb-2">
            <span className="font-bold text-cyan-200 tracking-wider">
              {label} {dayEntry ? `(${dayEntry.fullDate})` : ''}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              {totalForDay} cmds
            </span>
          </div>

          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              const cfg = (CATEGORY_CONFIG as any)[entry.name] || { label: entry.name, color: entry.color };
              const percent = totalForDay > 0 ? Math.round((entry.value / totalForDay) * 100) : 0;

              return (
                <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block shadow-sm"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span className="text-gray-300 text-[11px]">{entry.name}:</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold">
                    <span style={{ color: cfg.color }}>{entry.value}</span>
                    <span className="text-[10px] text-gray-400/80">({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="jarvis-usage-insights-section"
      className="w-full bg-gray-900/70 border border-cyan-500/30 rounded-3xl p-4 sm:p-6 backdrop-blur-md shadow-[0_0_35px_rgba(0,0,0,0.7)] text-cyan-100 flex flex-col gap-5 relative overflow-hidden"
    >
      {/* Decorative HUD Corner Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-2xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/60 rounded-br-2xl pointer-events-none" />

      {/* HEADER: Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold font-mono tracking-wider text-cyan-100 uppercase">
              JARVIS USAGE INSIGHTS
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-semibold">
              WEEKLY TELEMETRY
            </span>
          </div>
          <p className="text-xs text-cyan-400/70 font-mono mt-1">
            Weekly frequency distribution across Reminders, Calls, Settings, and Native App directives.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-gray-950/80 border border-cyan-500/20 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveView('stacked')}
            title="Stacked Breakdown"
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              activeView === 'stacked'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-cyan-400/60 hover:text-cyan-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Stacked</span>
          </button>

          <button
            onClick={() => setActiveView('grouped')}
            title="Grouped Side-by-Side"
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              activeView === 'grouped'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-cyan-400/60 hover:text-cyan-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Grouped</span>
          </button>

          <button
            onClick={() => setActiveView('trend')}
            title="Area Activity Trend"
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              activeView === 'trend'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-cyan-400/60 hover:text-cyan-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Trends</span>
          </button>

          <button
            onClick={() => setActiveView('pie')}
            title="Category Share"
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              activeView === 'pie'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-cyan-400/60 hover:text-cyan-200'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Share</span>
          </button>
        </div>
      </div>

      {/* TOP KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Reminders Card */}
        <div
          onClick={() => setSelectedCategory(selectedCategory === 'Reminders' ? null : 'Reminders')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'Reminders'
              ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.4)]'
              : 'bg-gray-950/70 border-cyan-500/20 hover:border-cyan-400/50 hover:bg-gray-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono font-semibold text-cyan-300 uppercase">
                Reminders
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/60">
              {Math.round((totals.totalReminders / totals.totalAll) * 100)}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-100 tracking-tight">
              {totals.totalReminders}
            </span>
            <span className="text-[10px] font-mono text-cyan-400/70">cmds / wk</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-1 mt-2.5 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${(totals.totalReminders / totals.totalAll) * 100}%` }}
            />
          </div>
        </div>

        {/* Calls Card */}
        <div
          onClick={() => setSelectedCategory(selectedCategory === 'Calls' ? null : 'Calls')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'Calls'
              ? 'bg-emerald-950/80 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.4)]'
              : 'bg-gray-950/70 border-cyan-500/20 hover:border-emerald-400/50 hover:bg-gray-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-mono font-semibold text-emerald-300 uppercase">
                Calls & Comms
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/60">
              {Math.round((totals.totalCalls / totals.totalAll) * 100)}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-100 tracking-tight">
              {totals.totalCalls}
            </span>
            <span className="text-[10px] font-mono text-emerald-400/70">cmds / wk</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-1 mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${(totals.totalCalls / totals.totalAll) * 100}%` }}
            />
          </div>
        </div>

        {/* Settings Card */}
        <div
          onClick={() => setSelectedCategory(selectedCategory === 'Settings' ? null : 'Settings')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'Settings'
              ? 'bg-amber-950/80 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.4)]'
              : 'bg-gray-950/70 border-cyan-500/20 hover:border-amber-400/50 hover:bg-gray-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-mono font-semibold text-amber-300 uppercase">
                Settings & Torch
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-400/60">
              {Math.round((totals.totalSettings / totals.totalAll) * 100)}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-100 tracking-tight">
              {totals.totalSettings}
            </span>
            <span className="text-[10px] font-mono text-amber-400/70">cmds / wk</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-1 mt-2.5 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${(totals.totalSettings / totals.totalAll) * 100}%` }}
            />
          </div>
        </div>

        {/* Total Directives & Peak Day Card */}
        <div className="p-3.5 rounded-2xl bg-gray-950/70 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-mono font-semibold text-purple-300 uppercase">
                Total Directives
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
              7 DAYS
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-100 tracking-tight">
              {totals.totalAll}
            </span>
            <span className="text-[10px] font-mono text-purple-400/70">total queries</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400/70 pt-2 border-t border-cyan-500/10 mt-2">
            <span>Peak Day:</span>
            <strong className="text-cyan-200">
              {totals.peakDay.day} ({totals.peakDay.total} cmds)
            </strong>
          </div>
        </div>
      </div>

      {/* RECHARTS VISUALIZATION CONTAINER */}
      <div className="bg-gray-950/80 border border-cyan-500/20 rounded-2xl p-4 sm:p-5 relative min-h-[300px]">
        {selectedCategory && (
          <div className="mb-3 flex items-center justify-between text-xs font-mono bg-cyan-950/50 border border-cyan-400/30 px-3 py-1.5 rounded-lg">
            <span>
              Filtered to: <strong className="text-cyan-200 uppercase">{selectedCategory}</strong>
            </span>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-cyan-400 hover:text-cyan-100 underline text-[11px]"
            >
              Reset Filter
            </button>
          </div>
        )}

        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            {activeView === 'stacked' ? (
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#083344" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#0891b2"
                  fontSize={11}
                  tickLine={false}
                  fontFamily="monospace"
                />
                <YAxis stroke="#0891b2" fontSize={11} tickLine={false} fontFamily="monospace" />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                {(!selectedCategory || selectedCategory === 'Reminders') && (
                  <Bar
                    dataKey="Reminders"
                    name="Reminders"
                    stackId="a"
                    fill={CATEGORY_CONFIG.Reminders.color}
                    radius={[0, 0, 0, 0]}
                  />
                )}
                {(!selectedCategory || selectedCategory === 'Calls') && (
                  <Bar
                    dataKey="Calls"
                    name="Calls"
                    stackId="a"
                    fill={CATEGORY_CONFIG.Calls.color}
                    radius={[0, 0, 0, 0]}
                  />
                )}
                {(!selectedCategory || selectedCategory === 'Settings') && (
                  <Bar
                    dataKey="Settings"
                    name="Settings"
                    stackId="a"
                    fill={CATEGORY_CONFIG.Settings.color}
                    radius={[0, 0, 0, 0]}
                  />
                )}
                {(!selectedCategory || selectedCategory === 'Apps') && (
                  <Bar
                    dataKey="Apps"
                    name="Apps & Media"
                    stackId="a"
                    fill={CATEGORY_CONFIG.Apps.color}
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            ) : activeView === 'grouped' ? (
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#083344" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#0891b2"
                  fontSize={11}
                  tickLine={false}
                  fontFamily="monospace"
                />
                <YAxis stroke="#0891b2" fontSize={11} tickLine={false} fontFamily="monospace" />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                {(!selectedCategory || selectedCategory === 'Reminders') && (
                  <Bar
                    dataKey="Reminders"
                    name="Reminders"
                    fill={CATEGORY_CONFIG.Reminders.color}
                    radius={[4, 4, 0, 0]}
                  />
                )}
                {(!selectedCategory || selectedCategory === 'Calls') && (
                  <Bar
                    dataKey="Calls"
                    name="Calls"
                    fill={CATEGORY_CONFIG.Calls.color}
                    radius={[4, 4, 0, 0]}
                  />
                )}
                {(!selectedCategory || selectedCategory === 'Settings') && (
                  <Bar
                    dataKey="Settings"
                    name="Settings"
                    fill={CATEGORY_CONFIG.Settings.color}
                    radius={[4, 4, 0, 0]}
                  />
                )}
                {(!selectedCategory || selectedCategory === 'Apps') && (
                  <Bar
                    dataKey="Apps"
                    name="Apps"
                    fill={CATEGORY_CONFIG.Apps.color}
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            ) : activeView === 'trend' ? (
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReminders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CATEGORY_CONFIG.Reminders.color} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={CATEGORY_CONFIG.Reminders.color} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CATEGORY_CONFIG.Calls.color} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={CATEGORY_CONFIG.Calls.color} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSettings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CATEGORY_CONFIG.Settings.color} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={CATEGORY_CONFIG.Settings.color} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CATEGORY_CONFIG.Apps.color} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={CATEGORY_CONFIG.Apps.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#083344" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#0891b2"
                  fontSize={11}
                  tickLine={false}
                  fontFamily="monospace"
                />
                <YAxis stroke="#0891b2" fontSize={11} tickLine={false} fontFamily="monospace" />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                {(!selectedCategory || selectedCategory === 'Reminders') && (
                  <Area
                    type="monotone"
                    dataKey="Reminders"
                    name="Reminders"
                    stroke={CATEGORY_CONFIG.Reminders.color}
                    fillOpacity={1}
                    fill="url(#colorReminders)"
                    strokeWidth={2}
                  />
                )}
                {(!selectedCategory || selectedCategory === 'Calls') && (
                  <Area
                    type="monotone"
                    dataKey="Calls"
                    name="Calls"
                    stroke={CATEGORY_CONFIG.Calls.color}
                    fillOpacity={1}
                    fill="url(#colorCalls)"
                    strokeWidth={2}
                  />
                )}
                {(!selectedCategory || selectedCategory === 'Settings') && (
                  <Area
                    type="monotone"
                    dataKey="Settings"
                    name="Settings"
                    stroke={CATEGORY_CONFIG.Settings.color}
                    fillOpacity={1}
                    fill="url(#colorSettings)"
                    strokeWidth={2}
                  />
                )}
                {(!selectedCategory || selectedCategory === 'Apps') && (
                  <Area
                    type="monotone"
                    dataKey="Apps"
                    name="Apps"
                    stroke={CATEGORY_CONFIG.Apps.color}
                    fillOpacity={1}
                    fill="url(#colorApps)"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-around h-full gap-4">
                <div className="w-full sm:w-1/2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#030712" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-2 text-xs font-mono">
                  {pieData.map((item) => {
                    const pct = Math.round((item.value / totals.totalAll) * 100);
                    return (
                      <div
                        key={item.name}
                        onClick={() =>
                          setSelectedCategory(selectedCategory === item.name ? null : item.name)
                        }
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-900/60 border border-cyan-500/10 hover:border-cyan-400/40 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-gray-200">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{item.value}</span>
                          <span className="text-gray-400 text-[10px]">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* FOOTER INTELLIGENCE BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-cyan-400/70 pt-2 border-t border-cyan-500/10">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>
            Telemetry Sync: <strong>Continuous Loop</strong> • Most Requested Category:{' '}
            <strong className="text-emerald-300">
              {totals.totalCalls >= totals.totalReminders ? 'Calls & Messaging' : 'Reminders & Alarms'}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-cyan-300/80">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Engine Status: 99.8% Neural Synthesis Efficiency</span>
        </div>
      </div>
    </div>
  );
};
