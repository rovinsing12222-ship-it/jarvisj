import React, { useState, useEffect } from 'react';
import {
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  PhoneCall,
  AlarmClock,
  Calendar,
  Clock,
  ArrowRight,
  Zap,
  Music,
  Lock,
  Unlock,
  Power,
  Play,
  Download,
  UserCheck,
  Wheat,
  Headphones,
  Vibrate,
  Smartphone,
} from 'lucide-react';
import { triggerHaptic } from '../utils/deviceHardware';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface SuggestedCommandItem {
  id: string;
  label: string;
  prompt: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  colorTheme: {
    bg: string;
    border: string;
    hoverBorder: string;
    iconBg: string;
    iconColor: string;
    textHover: string;
    badgeBg: string;
    badgeText: string;
  };
}

interface SuggestedCommandsProps {
  onExecuteCommand: (prompt: string) => void;
}

function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getPeriodConfig(period: TimeOfDay) {
  switch (period) {
    case 'morning':
      return {
        title: 'Morning Suggestions',
        sub: 'Start your morning with timely actions',
        badge: 'Morning Focus',
        timeRange: '05:00 AM – 12:00 PM',
        icon: Sunrise,
        badgeColor: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
        glowColor: 'bg-amber-500/5',
      };
    case 'afternoon':
      return {
        title: 'Afternoon Suggestions',
        sub: 'Stay organized through your mid-day flow',
        badge: 'Afternoon Routine',
        timeRange: '12:00 PM – 05:00 PM',
        icon: Sun,
        badgeColor: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300',
        glowColor: 'bg-cyan-500/5',
      };
    case 'evening':
      return {
        title: 'Evening Suggestions',
        sub: 'Wind down, review accomplishments & catch up',
        badge: 'Evening Wind-Down',
        timeRange: '05:00 PM – 09:00 PM',
        icon: Sunset,
        badgeColor: 'bg-orange-950/70 border-orange-500/40 text-orange-300',
        glowColor: 'bg-orange-500/5',
      };
    case 'night':
    default:
      return {
        title: 'Night Suggestions',
        sub: 'Prepare alarms, review tomorrow & rest safely',
        badge: 'Night Rest & Prep',
        timeRange: '09:00 PM – 05:00 AM',
        icon: Moon,
        badgeColor: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300',
        glowColor: 'bg-indigo-500/5',
      };
  }
}

function getCommandsForPeriod(period: TimeOfDay): SuggestedCommandItem[] {
  switch (period) {
    case 'morning':
      return [
        {
          id: 'morning-alarm',
          label: 'Set 8 AM Alarm',
          prompt: 'Set 8 AM Alarm for morning routine',
          subLabel: 'Schedule morning task alarm',
          icon: AlarmClock,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-amber-500/30',
            hoverBorder: 'hover:border-amber-400',
            iconBg: 'bg-amber-500/10 border border-amber-500/30',
            iconColor: 'text-amber-400',
            textHover: 'group-hover/btn:text-amber-300',
            badgeBg: 'bg-amber-950/80',
            badgeText: 'text-amber-300',
          },
        },
        {
          id: 'morning-schedule',
          label: "Show me today's schedule",
          prompt: "Show me today's schedule",
          subLabel: 'Review meetings & daily agenda',
          icon: Calendar,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-cyan-500/30',
            hoverBorder: 'hover:border-cyan-400',
            iconBg: 'bg-cyan-500/10 border border-cyan-500/30',
            iconColor: 'text-cyan-400',
            textHover: 'group-hover/btn:text-cyan-300',
            badgeBg: 'bg-cyan-950/80',
            badgeText: 'text-cyan-300',
          },
        },
        {
          id: 'morning-call-mom',
          label: 'Call Mom',
          prompt: 'Call Mom',
          subLabel: 'Morning family check-in',
          icon: PhoneCall,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-pink-500/30',
            hoverBorder: 'hover:border-pink-400',
            iconBg: 'bg-pink-500/10 border border-pink-500/30',
            iconColor: 'text-pink-400',
            textHover: 'group-hover/btn:text-pink-300',
            badgeBg: 'bg-pink-950/80',
            badgeText: 'text-pink-300',
          },
        },
      ];

    case 'afternoon':
      return [
        {
          id: 'afternoon-schedule',
          label: "Show me today's schedule",
          prompt: "Show me today's schedule",
          subLabel: 'Track upcoming meetings & tasks',
          icon: Calendar,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-cyan-500/30',
            hoverBorder: 'hover:border-cyan-400',
            iconBg: 'bg-cyan-500/10 border border-cyan-500/30',
            iconColor: 'text-cyan-400',
            textHover: 'group-hover/btn:text-cyan-300',
            badgeBg: 'bg-cyan-950/80',
            badgeText: 'text-cyan-300',
          },
        },
        {
          id: 'afternoon-call-mom',
          label: 'Call Mom',
          prompt: 'Call Mom',
          subLabel: 'Mid-day family check-in call',
          icon: PhoneCall,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-pink-500/30',
            hoverBorder: 'hover:border-pink-400',
            iconBg: 'bg-pink-500/10 border border-pink-500/30',
            iconColor: 'text-pink-400',
            textHover: 'group-hover/btn:text-pink-300',
            badgeBg: 'bg-pink-950/80',
            badgeText: 'text-pink-300',
          },
        },
        {
          id: 'afternoon-alarm',
          label: 'Set 8 AM Alarm',
          prompt: 'Set 8 AM Alarm for tomorrow morning',
          subLabel: 'Schedule tomorrow morning wakeup',
          icon: AlarmClock,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-amber-500/30',
            hoverBorder: 'hover:border-amber-400',
            iconBg: 'bg-amber-500/10 border border-amber-500/30',
            iconColor: 'text-amber-400',
            textHover: 'group-hover/btn:text-amber-300',
            badgeBg: 'bg-amber-950/80',
            badgeText: 'text-amber-300',
          },
        },
        {
          id: 'afternoon-sing-song',
          label: 'Gana ga kar sunao',
          prompt: 'Gana ga kar sunao',
          subLabel: 'Digital Art Avatar live singing & music',
          icon: Music,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-fuchsia-500/30',
            hoverBorder: 'hover:border-fuchsia-400',
            iconBg: 'bg-fuchsia-500/10 border border-fuchsia-500/30',
            iconColor: 'text-fuchsia-400',
            textHover: 'group-hover/btn:text-fuchsia-300',
            badgeBg: 'bg-fuchsia-950/80',
            badgeText: 'text-fuchsia-300',
          },
        },
      ];

    case 'evening':
      return [
        {
          id: 'evening-sing-song',
          label: 'Gana ga kar sunao',
          prompt: 'Gana ga kar sunao',
          subLabel: 'Surila geet aur digital art animation',
          icon: Music,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-fuchsia-500/30',
            hoverBorder: 'hover:border-fuchsia-400',
            iconBg: 'bg-fuchsia-500/10 border border-fuchsia-500/30',
            iconColor: 'text-fuchsia-400',
            textHover: 'group-hover/btn:text-fuchsia-300',
            badgeBg: 'bg-fuchsia-950/80',
            badgeText: 'text-fuchsia-300',
          },
        },
        {
          id: 'evening-call-mom',
          label: 'Call Mom',
          prompt: 'Call Mom',
          subLabel: 'Evening family catch-up',
          icon: PhoneCall,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-pink-500/30',
            hoverBorder: 'hover:border-pink-400',
            iconBg: 'bg-pink-500/10 border border-pink-500/30',
            iconColor: 'text-pink-400',
            textHover: 'group-hover/btn:text-pink-300',
            badgeBg: 'bg-pink-950/80',
            badgeText: 'text-pink-300',
          },
        },
        {
          id: 'evening-schedule',
          label: "Show me today's schedule",
          prompt: "Show me today's schedule",
          subLabel: 'Review completed agenda',
          icon: Calendar,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-cyan-500/30',
            hoverBorder: 'hover:border-cyan-400',
            iconBg: 'bg-cyan-500/10 border border-cyan-500/30',
            iconColor: 'text-cyan-400',
            textHover: 'group-hover/btn:text-cyan-300',
            badgeBg: 'bg-cyan-950/80',
            badgeText: 'text-cyan-300',
          },
        },
        {
          id: 'evening-alarm',
          label: 'Set 8 AM Alarm',
          prompt: 'Set 8 AM Alarm for tomorrow morning',
          subLabel: 'Prep wakeup alarm for tomorrow',
          icon: AlarmClock,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-amber-500/30',
            hoverBorder: 'hover:border-amber-400',
            iconBg: 'bg-amber-500/10 border border-amber-500/30',
            iconColor: 'text-amber-400',
            textHover: 'group-hover/btn:text-amber-300',
            badgeBg: 'bg-amber-950/80',
            badgeText: 'text-amber-300',
          },
        },
      ];

    case 'night':
    default:
      return [
        {
          id: 'night-alarm',
          label: 'Set 8 AM Alarm',
          prompt: 'Set 8 AM Alarm for tomorrow morning',
          subLabel: 'Wakeup alarm for tomorrow',
          icon: AlarmClock,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-amber-500/30',
            hoverBorder: 'hover:border-amber-400',
            iconBg: 'bg-amber-500/10 border border-amber-500/30',
            iconColor: 'text-amber-400',
            textHover: 'group-hover/btn:text-amber-300',
            badgeBg: 'bg-amber-950/80',
            badgeText: 'text-amber-300',
          },
        },
        {
          id: 'night-schedule',
          label: "Show me today's schedule",
          prompt: "Show me today's schedule",
          subLabel: 'Check agenda & tomorrow prep',
          icon: Calendar,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-cyan-500/30',
            hoverBorder: 'hover:border-cyan-400',
            iconBg: 'bg-cyan-500/10 border border-cyan-500/30',
            iconColor: 'text-cyan-400',
            textHover: 'group-hover/btn:text-cyan-300',
            badgeBg: 'bg-cyan-950/80',
            badgeText: 'text-cyan-300',
          },
        },
        {
          id: 'night-call-mom',
          label: 'Call Mom',
          prompt: 'Call Mom',
          subLabel: 'Goodnight family call',
          icon: PhoneCall,
          colorTheme: {
            bg: 'bg-slate-950/70',
            border: 'border-pink-500/30',
            hoverBorder: 'hover:border-pink-400',
            iconBg: 'bg-pink-500/10 border border-pink-500/30',
            iconColor: 'text-pink-400',
            textHover: 'group-hover/btn:text-pink-300',
            badgeBg: 'bg-pink-950/80',
            badgeText: 'text-pink-300',
          },
        },
      ];
  }
}

export const SuggestedCommands: React.FC<SuggestedCommandsProps> = ({ onExecuteCommand }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  // Optional override for previewing different times of day
  const [overridePeriod, setOverridePeriod] = useState<TimeOfDay | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const effectivePeriod = overridePeriod || getTimeOfDay(currentDate);
  const periodConfig = getPeriodConfig(effectivePeriod);
  const PeriodIcon = periodConfig.icon;
  const commands = getCommandsForPeriod(effectivePeriod);

  const formattedTime = currentDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      id="jarvis-suggested-commands-section"
      className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-xl transition-all relative overflow-hidden group"
    >
      {/* Dynamic ambient background glow */}
      <div
        className={`absolute top-0 right-1/4 w-64 h-64 ${periodConfig.glowColor} rounded-full blur-3xl pointer-events-none transition-colors duration-700`}
      />

      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/15 to-indigo-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                <span>Suggested Commands</span>
              </h3>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${periodConfig.badgeColor}`}
              >
                <PeriodIcon className="w-2.5 h-2.5" />
                <span>{periodConfig.badge}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              <span>{periodConfig.sub}</span>
              <span className="mx-1.5 text-slate-600">•</span>
              <span className="font-mono text-slate-400">{formattedTime}</span>
            </p>
          </div>
        </div>

        {/* Time-of-day Quick Mode Switcher (Allows testing Morning/Afternoon/Evening/Night) */}
        <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800 p-0.5 rounded-xl self-start sm:self-auto text-[10px]">
          {(['morning', 'afternoon', 'evening', 'night'] as TimeOfDay[]).map((period) => {
            const isSelected = effectivePeriod === period;
            const Icon =
              period === 'morning'
                ? Sunrise
                : period === 'afternoon'
                ? Sun
                : period === 'evening'
                ? Sunset
                : Moon;

            return (
              <button
                key={period}
                onClick={() => {
                  triggerHaptic([20]);
                  setOverridePeriod(overridePeriod === period ? null : period);
                }}
                className={`px-2 py-1 rounded-lg capitalize font-medium flex items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Switch to ${period} suggestions`}
              >
                <Icon className="w-2.5 h-2.5" />
                <span className="hidden xs:inline">{period}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* THREE CONTEXTUAL QUICK-ACTION BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {commands.map((cmd) => {
          const CmdIcon = cmd.icon;
          return (
            <button
              key={cmd.id}
              id={`btn-suggested-${cmd.id}`}
              onClick={() => {
                triggerHaptic([40, 40]);
                onExecuteCommand(cmd.prompt);
              }}
              className={`group/btn relative text-left p-3 rounded-2xl ${cmd.colorTheme.bg} border ${cmd.colorTheme.border} ${cmd.colorTheme.hoverBorder} hover:shadow-lg transition-all duration-200 active:scale-[0.98] flex flex-col justify-between overflow-hidden`}
            >
              {/* Top row: Icon and Prompt Label */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-xl ${cmd.colorTheme.iconBg} flex items-center justify-center ${cmd.colorTheme.iconColor} transition-transform group-hover/btn:scale-110`}
                  >
                    <CmdIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover/btn:text-slate-300 flex items-center gap-0.5 transition-colors">
                    <span>Ask Jarvis</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>

                <h4
                  className={`text-xs font-bold text-slate-100 ${cmd.colorTheme.textHover} transition-colors line-clamp-1`}
                >
                  {cmd.label}
                </h4>

                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 leading-snug">
                  {cmd.subLabel}
                </p>
              </div>

              {/* Bottom prompt snippet hint */}
              <div className="mt-2.5 pt-1.5 border-t border-slate-850 flex items-center gap-1.5 text-[10px] text-slate-500 truncate">
                <span className="text-cyan-400 font-mono">"</span>
                <span className="italic truncate text-slate-400">{cmd.prompt}</span>
                <span className="text-cyan-400 font-mono">"</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* PHONE LOCK & HARDWARE BUTTON QUICK ROW */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-semibold text-slate-400 shrink-0 uppercase tracking-wider">Fast Hardware & Schemes:</span>
        <button
          type="button"
          id="btn-fast-farmer-id"
          onClick={() => {
            triggerHaptic([30]);
            onExecuteCommand('Farmer id ka option do kisano ke liye');
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          title="Digital Farmer ID (AgriStack) & All Kisan Services"
        >
          <Wheat className="w-3 h-3 text-emerald-400" />
          <span>🌾 Farmer ID (किसान पहचान पत्र)</span>
        </button>
        <button
          type="button"
          id="btn-fast-customer-service"
          onClick={() => {
            triggerHaptic([30]);
            onExecuteCommand('customer service add karo');
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          title="24x7 Customer Care Directory & Jan Sunwai Grievance"
        >
          <Headphones className="w-3 h-3 text-cyan-400" />
          <span>🎧 24x7 ग्राहक सेवा (Customer Service)</span>
        </button>
        <button
          type="button"
          id="btn-fast-haptic-patterns"
          onClick={() => {
            triggerHaptic([30]);
            onExecuteCommand('customize alert haptic patterns for alarms messages calls');
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 hover:text-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          title="Customize Haptic Vibration Patterns for Alarms, Messages, and Calls"
        >
          <Vibrate className="w-3 h-3 text-cyan-400" />
          <span>⚡ Haptic Patterns (Alarm, SMS, Call)</span>
        </button>
        <button
          type="button"
          id="btn-fast-pc-android-launchers"
          onClick={() => {
            triggerHaptic([30]);
            onExecuteCommand('pc control kholo');
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          title="Open PC Control workspace & custom Android app launchers bar"
        >
          <Smartphone className="w-3 h-3 text-cyan-400" />
          <span>🖥️ PC Quick Access: Android Apps</span>
        </button>
        <button
          type="button"
          id="btn-fast-gov-schemes"
          onClick={() => {
            triggerHaptic([30]);
            onExecuteCommand('sarkari yojana');
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          title="All Government Schemes & Auto-Update Engine"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>सरकारी योजनाएं (Auto-Update)</span>
        </button>
        <button
          type="button"
          id="btn-fast-pm-surya-ghar"
          onClick={() => {
            triggerHaptic([30]);
            onExecuteCommand('pm surya ghar yojana');
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:text-yellow-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
          title="PM Surya Ghar Muft Bijli Yojana"
        >
          <Sun className="w-3 h-3 text-yellow-400" />
          <span>PM सूर्य घर (300 यूनिट मुफ्त)</span>
        </button>
        <button
          type="button"
          id="btn-fast-lock-phone"
          onClick={() => {
            triggerHaptic([50]);
            onExecuteCommand('Phone lock karo');
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Lock className="w-3 h-3 text-rose-400" />
          <span>Lock Phone</span>
        </button>
        <button
          type="button"
          id="btn-fast-unlock-phone"
          onClick={() => {
            triggerHaptic([50]);
            onExecuteCommand('Phone unlock karo');
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Unlock className="w-3 h-3 text-emerald-400" />
          <span>Unlock Phone</span>
        </button>
        <button
          type="button"
          id="btn-fast-power-gemini"
          onClick={() => {
            triggerHaptic([50]);
            onExecuteCommand('Lock button se Gemini open kaise karein');
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Power className="w-3 h-3 text-cyan-400" />
          <span>Lock Button = Gemini Guide</span>
        </button>
        <button
          type="button"
          id="btn-fast-playstore-guide"
          onClick={() => {
            triggerHaptic([50]);
            onExecuteCommand('play store mein kaise install karen');
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 hover:text-teal-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Play className="w-3 h-3 text-teal-400 fill-teal-400/30" />
          <span>Play Store me Install Guide</span>
        </button>
        <button
          type="button"
          id="btn-fast-only-name-call"
          onClick={() => {
            triggerHaptic([50]);
            onExecuteCommand('Papa');
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
          title="Only saved contact name call"
        >
          <UserCheck className="w-3 h-3 text-indigo-400" />
          <span>Only Name Call: "Papa"</span>
        </button>
        <button
          type="button"
          id="btn-fast-send-saved-number"
          onClick={() => {
            triggerHaptic([50]);
            onExecuteCommand('Dad ka number bhejo');
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:text-sky-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
        >
          <PhoneCall className="w-3 h-3 text-sky-400" />
          <span>Dad ka Number Send Karo</span>
        </button>
      </div>
    </div>
  );
};
