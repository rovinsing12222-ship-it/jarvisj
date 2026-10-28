import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ListTodo,
  Sparkles,
  Flame,
  FileSpreadsheet,
  Laptop,
  Briefcase,
  Heart,
  User,
  TrendingUp,
  BarChart2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Target,
  Award,
  Trophy,
  PartyPopper,
  X,
  CheckCheck,
} from 'lucide-react';
import { triggerHaptic } from '../utils/deviceHardware';
import {
  playActionExecutedSound,
  playCommandRecognizedPingSound,
  playCelebrationFanfare,
} from '../utils/audioSynth';

export interface DailyGoal {
  id: string;
  text: string;
  completed: boolean;
  progress: number; // 0 - 100%
  category: 'Personal' | 'Work' | 'Health' | 'Excel' | 'Tech';
  priority: 'high' | 'medium' | 'low';
  createdAt: number;
}

export interface DayTrendPoint {
  dateKey: string; // 'YYYY-MM-DD'
  dayLabel: string; // 'Mon', 'Tue', ... 'Today'
  displayDate: string; // 'Oct 24'
  completed: number;
  total: number;
  completionRate: number; // 0 - 100%
  isToday: boolean;
}

const STORAGE_KEY = 'jarvis_daily_goals';
const HISTORY_STORAGE_KEY = 'jarvis_daily_goals_history';

const DEFAULT_GOALS: DailyGoal[] = [
  {
    id: 'goal-1',
    text: 'Master Excel shortcuts (Ctrl+Shift+L Filter, Alt+= AutoSum, Ctrl+E Flash Fill)',
    completed: false,
    progress: 40,
    category: 'Excel',
    priority: 'high',
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'goal-2',
    text: 'Export JARVIS Memory Core JSON backup file',
    completed: false,
    progress: 60,
    category: 'Tech',
    priority: 'medium',
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'goal-3',
    text: 'Practice PC laptop fast window split (Win + Left/Right arrow)',
    completed: true,
    progress: 100,
    category: 'Work',
    priority: 'medium',
    createdAt: Date.now() - 3600000 * 1,
  },
  {
    id: 'goal-4',
    text: 'Rovin Pal morning productivity check-in with JARVIS',
    completed: true,
    progress: 100,
    category: 'Personal',
    priority: 'high',
    createdAt: Date.now() - 3600000 * 4,
  },
];

// Helper to format Date into YYYY-MM-DD
const formatDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const DailyGoalsCard: React.FC = () => {
  const [goals, setGoals] = useState<DailyGoal[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize legacy goals that might not have a progress property
          return parsed.map((item: any) => ({
            ...item,
            progress:
              typeof item.progress === 'number'
                ? Math.min(100, Math.max(0, item.progress))
                : item.completed
                ? 100
                : 0,
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored daily goals', e);
    }
    return DEFAULT_GOALS;
  });

  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DailyGoal['category']>('Work');
  const [selectedPriority, setSelectedPriority] = useState<DailyGoal['priority']>('medium');
  const [selectedInitialProgress, setSelectedInitialProgress] = useState<number>(0);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Visualization state
  const [showTrendChart, setShowTrendChart] = useState(true);
  const [trendMetric, setTrendMetric] = useState<'rate' | 'count'>('rate');

  // Celebratory state & animations
  const [showCelebrationBanner, setShowCelebrationBanner] = useState(true);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const prevAllCompletedRef = useRef<boolean>(
    goals.length > 0 && goals.every((g) => g.completed)
  );

  // Stored historical data map: { 'YYYY-MM-DD': { completed: number, total: number, completionRate: number } }
  const [historyMap, setHistoryMap] = useState<Record<string, { completed: number; total: number; completionRate: number }>>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse goals history', e);
    }
    return {};
  });

  // Save goals to localStorage and broadcast global update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
      window.dispatchEvent(new CustomEvent('jarvis:goals-updated', { detail: { goals } }));
    } catch (e) {
      console.error('Failed to save daily goals to localStorage', e);
    }
  }, [goals]);

  // Sync today's completion stats into historyMap and localStorage whenever goals change
  useEffect(() => {
    const today = new Date();
    const todayKey = formatDateKey(today);
    const todayCompleted = goals.filter((g) => g.completed).length;
    const todayTotal = goals.length;
    const todayRate =
      todayTotal > 0
        ? Math.round(
            goals.reduce((acc, g) => acc + (g.completed ? 100 : g.progress || 0), 0) /
              todayTotal
          )
        : 0;

    setHistoryMap((prev) => {
      const updated = {
        ...prev,
        [todayKey]: {
          completed: todayCompleted,
          total: todayTotal,
          completionRate: todayRate,
        },
      };
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save historyMap', err);
      }
      return updated;
    });
  }, [goals]);

  // Generate 7-day trend array ending with today
  const trendData = useMemo<DayTrendPoint[]>(() => {
    const points: DayTrendPoint[] = [];
    const today = new Date();
    const todayKey = formatDateKey(today);

    // Default realistic baseline completion rates for prior days if no user history exists yet
    const baselineRates = [75, 60, 80, 100, 70, 85];
    const baselineTotals = [4, 5, 5, 4, 6, 4];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      const dateKey = formatDateKey(d);
      const isToday = dateKey === todayKey;

      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
      const monthDay = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      if (isToday) {
        // Today is always calculated live from the current goals state
        const total = goals.length;
        const completed = goals.filter((g) => g.completed).length;
        const rate =
          total > 0
            ? Math.round(
                goals.reduce((acc, g) => acc + (g.completed ? 100 : g.progress || 0), 0) /
                  total
              )
            : 0;

        points.push({
          dateKey,
          dayLabel: 'Today',
          displayDate: monthDay,
          completed,
          total,
          completionRate: rate,
          isToday: true,
        });
      } else {
        // Past days: lookup from saved historyMap, or fallback to sensible baseline
        const saved = historyMap[dateKey];
        if (saved) {
          points.push({
            dateKey,
            dayLabel: dayName,
            displayDate: monthDay,
            completed: saved.completed,
            total: saved.total,
            completionRate: saved.completionRate,
            isToday: false,
          });
        } else {
          const fallbackIdx = (6 - i) % baselineRates.length;
          const fallbackRate = baselineRates[fallbackIdx];
          const fallbackTotal = baselineTotals[fallbackIdx];
          const fallbackCompleted = Math.round((fallbackRate / 100) * fallbackTotal);

          points.push({
            dateKey,
            dayLabel: dayName,
            displayDate: monthDay,
            completed: fallbackCompleted,
            total: fallbackTotal,
            completionRate: fallbackRate,
            isToday: false,
          });
        }
      }
    }

    return points;
  }, [goals, historyMap]);

  // Trend summary statistics
  const trendStats = useMemo(() => {
    if (trendData.length === 0) return { avgRate: 0, totalCompleted: 0, bestDay: 0, streak: 0 };

    const totalCompleted = trendData.reduce((acc, d) => acc + d.completed, 0);
    const avgRate = Math.round(
      trendData.reduce((acc, d) => acc + d.completionRate, 0) / trendData.length
    );
    const bestDay = Math.max(...trendData.map((d) => d.completionRate));

    // Calculate active streak (consecutive days with >= 50% completion ending today)
    let streak = 0;
    for (let i = trendData.length - 1; i >= 0; i--) {
      if (trendData[i].completionRate >= 50) {
        streak++;
      } else {
        break;
      }
    }

    return { avgRate, totalCompleted, bestDay, streak };
  }, [trendData]);

  // Celebratory Confetti & Harmonic Audio Trigger
  const triggerCelebration = useCallback(() => {
    // 1. Play triumphant harmonic fanfare
    playCelebrationFanfare();

    // 2. High-energy celebratory haptics pattern
    triggerHaptic([40, 60, 40, 80, 50, 100]);

    // 3. Activate visual glowing celebration state
    setIsCelebrating(true);
    setShowCelebrationBanner(true);
    setTimeout(() => {
      setIsCelebrating(false);
    }, 4500);

    // 4. Multi-stage confetti fireworks with Stark Cyberpunk hues (cyan, emerald, gold, violet, white)
    const particleColors = [
      '#06b6d4', // cyan-500
      '#22d3ee', // cyan-400
      '#10b981', // emerald-500
      '#34d399', // emerald-400
      '#f59e0b', // amber-500
      '#fbbf24', // amber-400
      '#8b5cf6', // violet-500
      '#ffffff', // bright spark white
    ];

    try {
      // Stage 1: Center blast
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.65 },
        colors: particleColors,
        zIndex: 9999,
        disableForReducedMotion: true,
      });

      // Stage 2: Left cannon after 160ms
      setTimeout(() => {
        confetti({
          particleCount: 65,
          angle: 60,
          spread: 65,
          origin: { x: 0.05, y: 0.7 },
          colors: particleColors,
          zIndex: 9999,
          disableForReducedMotion: true,
        });
      }, 160);

      // Stage 3: Right cannon after 280ms
      setTimeout(() => {
        confetti({
          particleCount: 65,
          angle: 120,
          spread: 65,
          origin: { x: 0.95, y: 0.7 },
          colors: particleColors,
          zIndex: 9999,
          disableForReducedMotion: true,
        });
      }, 280);

      // Stage 4: Cascading gentle stars after 450ms
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 120,
          origin: { y: 0.4 },
          scalar: 1.2,
          colors: ['#38bdf8', '#34d399', '#fbbf24', '#ffffff'],
          zIndex: 9999,
          disableForReducedMotion: true,
        });
      }, 450);
    } catch (e) {
      console.warn('Confetti effect execution notice:', e);
    }
  }, []);

  // Toggle completion status with a tap and snap progress accordingly
  const handleToggleGoal = (id: string) => {
    triggerHaptic([30, 40]);
    setGoals((prev) => {
      const next = prev.map((g) => {
        if (g.id !== id) return g;
        const willComplete = !g.completed;
        return {
          ...g,
          completed: willComplete,
          progress: willComplete ? 100 : g.progress === 100 ? 0 : g.progress,
        };
      });

      const wasAllCompleted = prev.length > 0 && prev.every((g) => g.completed);
      const isNowAllCompleted = next.length > 0 && next.every((g) => g.completed);

      if (isNowAllCompleted && !wasAllCompleted) {
        // Just achieved 100% completion on all goals!
        setTimeout(() => triggerCelebration(), 120);
      } else {
        const toggledItem = next.find((g) => g.id === id);
        if (toggledItem?.completed) {
          playActionExecutedSound();
        } else {
          playCommandRecognizedPingSound();
        }
      }

      prevAllCompletedRef.current = isNowAllCompleted;
      return next;
    });
  };

  // Adjust granular progress for an individual goal
  const handleAdjustProgress = (id: string, newProgress: number) => {
    triggerHaptic([25]);
    const clamped = Math.min(100, Math.max(0, newProgress));
    setGoals((prev) => {
      const next = prev.map((g) => {
        if (g.id !== id) return g;
        const isComplete = clamped === 100;
        return {
          ...g,
          progress: clamped,
          completed: isComplete,
        };
      });

      const wasAllCompleted = prev.length > 0 && prev.every((g) => g.completed);
      const isNowAllCompleted = next.length > 0 && next.every((g) => g.completed);

      if (isNowAllCompleted && !wasAllCompleted) {
        setTimeout(() => triggerCelebration(), 120);
      }

      prevAllCompletedRef.current = isNowAllCompleted;
      return next;
    });
  };

  const handleDeleteGoal = (id: string) => {
    triggerHaptic([40]);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const isComplete = selectedInitialProgress === 100;
    const newGoal: DailyGoal = {
      id: `goal-${Date.now()}`,
      text: inputText.trim(),
      completed: isComplete,
      progress: selectedInitialProgress,
      category: selectedCategory,
      priority: selectedPriority,
      createdAt: Date.now(),
    };

    setGoals((prev) => [newGoal, ...prev]);
    setInputText('');
    setSelectedInitialProgress(0);
    setShowAddForm(false);
    triggerHaptic([40, 30]);
    playCommandRecognizedPingSound();
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const totalCount = goals.length;
  const isAllGoalsCompleted = totalCount > 0 && completedCount === totalCount;

  const overallProgressPercent =
    totalCount > 0
      ? Math.round(
          goals.reduce((acc, g) => acc + (g.completed ? 100 : g.progress || 0), 0) /
            totalCount
        )
      : 0;

  const filteredGoals = goals.filter((g) => {
    if (filter === 'active') return !g.completed;
    if (filter === 'completed') return g.completed;
    return true;
  });

  const getCategoryIcon = (cat: DailyGoal['category']) => {
    switch (cat) {
      case 'Excel':
        return <FileSpreadsheet className="w-3 h-3 text-emerald-400" />;
      case 'Work':
        return <Briefcase className="w-3 h-3 text-cyan-400" />;
      case 'Personal':
        return <User className="w-3 h-3 text-violet-400" />;
      case 'Health':
        return <Heart className="w-3 h-3 text-rose-400" />;
      case 'Tech':
      default:
        return <Laptop className="w-3 h-3 text-blue-400" />;
    }
  };

  // Custom HUD Tooltip for Recharts
  const CustomTrendTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as DayTrendPoint;
      return (
        <div className="bg-slate-950/95 border border-cyan-500/50 rounded-xl p-3 shadow-[0_0_20px_rgba(6,182,212,0.35)] backdrop-blur-md text-xs font-mono min-w-[170px] space-y-1.5">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1">
            <span className="font-bold text-cyan-200">
              {dataPoint.dayLabel} · {dataPoint.displayDate}
            </span>
            {dataPoint.isToday && (
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                Live
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Completion Rate:</span>
            <span className="font-bold text-cyan-300 tabular-nums">
              {dataPoint.completionRate}%
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Tasks Finished:</span>
            <span className="font-bold text-emerald-300 tabular-nums">
              {dataPoint.completed} / {dataPoint.total}
            </span>
          </div>
          {/* Mini progress bar inside tooltip */}
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
              style={{ width: `${dataPoint.completionRate}%` }}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="daily-goals-card"
      className={`bg-gradient-to-b from-slate-900/90 to-slate-950/90 border transition-all duration-500 rounded-3xl p-4 sm:p-6 backdrop-blur-xl space-y-4 relative ${
        isCelebrating
          ? 'border-emerald-400/80 shadow-[0_0_50px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/50'
          : isAllGoalsCompleted
          ? 'border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
          : 'border-slate-800 shadow-xl'
      }`}
    >
      {/* CARD HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
              isAllGoalsCompleted
                ? 'bg-gradient-to-br from-emerald-500/25 to-teal-500/25 border-emerald-400/60 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
            }`}
          >
            {isAllGoalsCompleted ? (
              <Trophy className="w-5 h-5 text-amber-300 animate-pulse" />
            ) : (
              <ListTodo className="w-5 h-5 text-cyan-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Daily Goals & Tasks
              </h3>
              <span
                className={`text-xs font-mono tabular-nums font-semibold ${
                  isAllGoalsCompleted ? 'text-emerald-400' : 'text-cyan-400'
                }`}
              >
                {completedCount}/{totalCount} Completed
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tap any goal to toggle status · Progress tracks in LocalStorage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Replay Confetti Button if all completed */}
          {isAllGoalsCompleted && (
            <button
              type="button"
              id="btn-celebrate-goals"
              onClick={triggerCelebration}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              title="Launch celebratory confetti burst"
            >
              <PartyPopper className="w-3.5 h-3.5 text-amber-300" />
              <span>Celebrate</span>
            </button>
          )}

          {/* Toggle Trend Chart View */}
          <button
            type="button"
            id="btn-toggle-goals-trend"
            onClick={() => {
              triggerHaptic([20]);
              setShowTrendChart((prev) => !prev);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
              showTrendChart
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle 7-day completion trend visualization"
          >
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>7-Day Trend</span>
            {showTrendChart ? (
              <ChevronUp className="w-3 h-3 text-cyan-400/70" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-500" />
            )}
          </button>

          <button
            type="button"
            id="btn-add-goal-toggle"
            onClick={() => {
              triggerHaptic([30]);
              setShowAddForm((prev) => !prev);
            }}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Close' : 'Add Goal'}</span>
          </button>
        </div>
      </div>

      {/* OVERALL AGGREGATE PROGRESS BAR */}
      <div className="space-y-1.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <Flame className={`w-3.5 h-3.5 ${isAllGoalsCompleted ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>Aggregate Daily Completion</span>
            {isAllGoalsCompleted && (
              <span className="text-[11px] text-emerald-400 font-bold ml-1 flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" />
                <span>All Objectives Achieved!</span>
              </span>
            )}
          </span>
          <span
            className={`font-mono font-bold tabular-nums ${
              isAllGoalsCompleted ? 'text-emerald-400' : 'text-cyan-400'
            }`}
          >
            {overallProgressPercent}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAllGoalsCompleted
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
            }`}
            style={{ width: `${overallProgressPercent}%` }}
          />
        </div>
      </div>

      {/* CELEBRATORY BANNER WHEN ALL GOALS ARE COMPLETED */}
      {isAllGoalsCompleted && showCelebrationBanner && (
        <div
          id="goals-all-completed-celebration-banner"
          className="relative overflow-hidden bg-gradient-to-r from-emerald-950/85 via-teal-950/75 to-cyan-950/85 border border-emerald-500/50 rounded-2xl p-4 shadow-[0_0_35px_rgba(16,185,129,0.3)] transition-all animate-fade-in"
        >
          {/* Subtle Ambient Glowing Background Accents */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)] flex-shrink-0 animate-bounce">
                <Trophy className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                    <span>All Daily Objectives Achieved!</span>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </h4>
                  <span className="text-[11px] font-mono text-emerald-300 font-bold tabular-nums px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">
                    100% COMPLETE
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  Flawless execution! All {totalCount} goals completed today. Stark Industries operating at peak productivity.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <button
                type="button"
                id="btn-celebrate-again"
                onClick={triggerCelebration}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all active:scale-95 cursor-pointer"
                title="Replay celebratory confetti burst"
              >
                <PartyPopper className="w-3.5 h-3.5 text-slate-950" />
                <span>Replay Confetti</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCelebrationBanner(false)}
                className="p-1.5 rounded-lg text-emerald-400/70 hover:text-white hover:bg-emerald-950/60 transition-colors"
                title="Dismiss celebration banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7-DAY COMPLETION TREND VISUALIZATION (RECHARTS) */}
      {showTrendChart && (
        <div
          id="goals-7day-trend-section"
          className="bg-slate-950/70 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 space-y-3 relative overflow-hidden transition-all duration-300"
        >
          {/* Subtle Cyberpunk HUD Corner Accents */}
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-xl pointer-events-none" />

          {/* Trend Section Header with Mode Selector */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>7-Day Goal Completion Trend</span>
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                · Rolling 7 days
              </span>
            </div>

            {/* Mode Selector Buttons */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([15]);
                  setTrendMetric('rate');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  trendMetric === 'rate'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rate (%)
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([15]);
                  setTrendMetric('count');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  trendMetric === 'count'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tasks Count
              </button>
            </div>
          </div>

          {/* Summary KPI Stats Row (Clean unboxed metadata per design constitution) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/70 text-xs">
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-2">
              <span className="text-[10px] text-slate-400 block">7-Day Average</span>
              <span className="font-mono text-cyan-300 font-bold text-sm tabular-nums">
                {trendStats.avgRate}%
              </span>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-2">
              <span className="text-[10px] text-slate-400 block">Current Streak</span>
              <span className="font-mono text-emerald-400 font-bold text-sm tabular-nums">
                {trendStats.streak} {trendStats.streak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-2">
              <span className="text-[10px] text-slate-400 block">Tasks Done (7D)</span>
              <span className="font-mono text-violet-300 font-bold text-sm tabular-nums">
                {trendStats.totalCompleted} tasks
              </span>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-2">
              <span className="text-[10px] text-slate-400 block">Peak Completion</span>
              <span className="font-mono text-amber-300 font-bold text-sm tabular-nums">
                {trendStats.bestDay}%
              </span>
            </div>
          </div>

          {/* Recharts Chart Visualization */}
          <div className="w-full h-44 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {trendMetric === 'rate' ? (
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="goalRateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                      <stop offset="60%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="dayLabel"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip content={<CustomTrendTooltip />} />
                  <ReferenceLine
                    y={70}
                    stroke="#059669"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    label={{
                      value: 'Target 70%',
                      position: 'insideTopRight',
                      fill: '#10b981',
                      fontSize: 10,
                      fontFamily: 'monospace',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completionRate"
                    name="Completion Rate"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#goalRateGradient)"
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (!cx || !cy) return null;
                      const isTodayPoint = payload?.isToday;
                      return (
                        <circle
                          key={`dot-${payload?.dateKey}`}
                          cx={cx}
                          cy={cy}
                          r={isTodayPoint ? 5 : 3.5}
                          fill={isTodayPoint ? '#38bdf8' : '#06b6d4'}
                          stroke={isTodayPoint ? '#ffffff' : '#0f172a'}
                          strokeWidth={isTodayPoint ? 2 : 1.5}
                          className={isTodayPoint ? 'animate-pulse' : ''}
                        />
                      );
                    }}
                    activeDot={{
                      r: 6,
                      fill: '#38bdf8',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="goalBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="dayLabel"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTrendTooltip />} />
                  <Bar
                    dataKey="completed"
                    name="Completed Tasks"
                    fill="url(#goalBarGradient)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
            <span>Dynamic Real-Time Sync</span>
            <span className="text-cyan-400">Tapping goals updates today's trend</span>
          </div>
        </div>
      )}

      {/* ADD GOAL FORM */}
      {showAddForm && (
        <form
          onSubmit={handleAddGoal}
          className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 space-y-3.5 shadow-lg animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Daily Objective</span>
            </span>
          </div>

          <input
            type="text"
            id="input-new-goal-text"
            placeholder="e.g. Master Excel shortcuts Alt + = for AutoSum"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            autoFocus
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="Excel">Excel</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Tech">Tech</option>
                <option value="Health">Health</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Initial Progress:{' '}
                <span className="text-cyan-300 font-mono font-bold tabular-nums">
                  {selectedInitialProgress}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={selectedInitialProgress}
                onChange={(e) => setSelectedInitialProgress(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all shadow cursor-pointer active:scale-95"
            >
              Save Goal
            </button>
          </div>
        </form>
      )}

      {/* FILTER BUTTONS */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          {(['all', 'active', 'completed'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                triggerHaptic([20]);
                setFilter(mode);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                filter === mode
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode} (
              {mode === 'all'
                ? goals.length
                : mode === 'active'
                ? goals.filter((g) => !g.completed).length
                : completedCount}
              )
            </button>
          ))}
        </div>

        {completedCount > 0 && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic([30]);
              setGoals((prev) => prev.filter((g) => !g.completed));
            }}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
          >
            Clear completed
          </button>
        )}
      </div>

      {/* GOALS LIST WITH INDIVIDUAL PROGRESS BARS AND 1-TAP TOGGLE */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredGoals.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">
              {filter === 'completed'
                ? 'No completed tasks yet. Keep moving forward!'
                : filter === 'active'
                ? 'All daily goals achieved! Outstanding work.'
                : 'No goals set. Tap "Add Goal" to create your first objective.'}
            </p>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const currentProgress = goal.completed ? 100 : goal.progress ?? 0;

            return (
              <div
                key={goal.id}
                onClick={() => handleToggleGoal(goal.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggleGoal(goal.id);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 group cursor-pointer select-none relative ${
                  goal.completed
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-80 hover:opacity-100'
                    : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 shadow-sm'
                }`}
                title="Tap anywhere to toggle completion status"
              >
                {/* TOP ROW: Checkbox, Text, Metadata & Delete */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleGoal(goal.id);
                      }}
                      className={`flex-shrink-0 mt-0.5 transition-transform active:scale-90 cursor-pointer ${
                        goal.completed ? 'text-emerald-400' : 'text-slate-500 hover:text-cyan-400'
                      }`}
                      title={goal.completed ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {goal.completed ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs md:text-sm font-medium transition-all ${
                            goal.completed
                              ? 'line-through text-slate-500'
                              : 'text-slate-100'
                          }`}
                        >
                          {goal.text}
                        </span>
                      </div>

                      {/* Clean Unboxed Metadata (Zero-pill discipline per design constitution) */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(goal.category)}
                          <span className="text-slate-300">{goal.category}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`capitalize ${
                            goal.priority === 'high'
                              ? 'text-rose-400 font-semibold'
                              : goal.priority === 'medium'
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {goal.priority} Priority
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-cyan-300 font-semibold tabular-nums">
                          {currentProgress}%
                        </span>
                        {goal.completed && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-400 font-medium">Done</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Delete Button */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGoal(goal.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* INDIVIDUAL PROGRESS BAR FOR THIS GOAL */}
                <div
                  className="w-full space-y-1 pt-1"
                  onClick={(e) => {
                    // Clicking the progress bar container still allows intuitive interaction
                    e.stopPropagation();
                  }}
                >
                  <div className="w-full h-1.5 sm:h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 relative">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        goal.completed || currentProgress === 100
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          : currentProgress > 50
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                          : currentProgress > 0
                          ? 'bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.3)]'
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${currentProgress}%` }}
                    />
                  </div>

                  {/* Quick Progress Adjust Buttons on hover/focus */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="text-[10px] text-slate-400 font-sans">
                      Tap card to {goal.completed ? 'mark incomplete' : 'complete'}
                    </span>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      {[
                        { label: '0%', val: 0 },
                        { label: '50%', val: 50 },
                        { label: '100%', val: 100 },
                      ].map((step) => (
                        <button
                          key={step.label}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustProgress(goal.id, step.val);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                            currentProgress === step.val
                              ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                          title={`Set progress to ${step.label}`}
                        >
                          {step.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
