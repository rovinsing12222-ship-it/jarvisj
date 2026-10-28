import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  Plus,
  CheckCircle2,
  Trash2,
  ExternalLink,
  AlarmClock,
  AlertTriangle,
  Volume2,
  Download,
  CalendarPlus,
  RefreshCw,
  Briefcase,
  User,
  Heart,
  Activity,
  CreditCard,
  BookOpen,
  ShoppingCart,
  Home,
  Tag,
  Sparkles,
  Filter,
  Layers,
  FolderPlus,
  X,
  Search,
  Check,
} from 'lucide-react';
import { ScheduleItem } from '../types';
import {
  setNativeAndroidAlarm,
  openNativeClock,
  addNativeCalendarEvent,
  openNativeCalendar,
  downloadICalendarFile,
  triggerHaptic,
  sendLocalNotification,
} from '../utils/deviceHardware';
import { playAlertSound, speakJarvis } from '../utils/audioSynth';
import { ScheduleTravelEtaCard } from './ScheduleTravelEtaCard';

export interface CustomCategoryDef {
  id: string;
  name: string;
  iconKey: string;
  color: 'sky' | 'rose' | 'emerald' | 'amber' | 'blue' | 'purple' | 'cyan' | 'violet' | 'yellow' | 'fuchsia';
  isCustom?: boolean;
}

export const PRESET_CATEGORIES: CustomCategoryDef[] = [
  { id: 'work', name: 'Work', iconKey: 'briefcase', color: 'sky' },
  { id: 'personal', name: 'Personal', iconKey: 'user', color: 'rose' },
  { id: 'health', name: 'Health', iconKey: 'activity', color: 'emerald' },
  { id: 'meeting', name: 'Meeting', iconKey: 'calendar', color: 'blue' },
  { id: 'alarm', name: 'Alarm', iconKey: 'alarm', color: 'purple' },
  { id: 'reminder', name: 'Reminder', iconKey: 'bell', color: 'amber' },
  { id: 'task', name: 'Task', iconKey: 'check', color: 'cyan' },
  { id: 'finance', name: 'Finance', iconKey: 'dollar', color: 'yellow' },
  { id: 'study', name: 'Study', iconKey: 'book', color: 'violet' },
  { id: 'home', name: 'Home', iconKey: 'home', color: 'fuchsia' },
];

const AVAILABLE_ICONS = [
  { key: 'briefcase', label: 'Work', IconComponent: Briefcase },
  { key: 'user', label: 'Personal', IconComponent: User },
  { key: 'activity', label: 'Health', IconComponent: Activity },
  { key: 'heart', label: 'Heart', IconComponent: Heart },
  { key: 'calendar', label: 'Meeting', IconComponent: Calendar },
  { key: 'alarm', label: 'Alarm', IconComponent: AlarmClock },
  { key: 'bell', label: 'Reminder', IconComponent: Bell },
  { key: 'check', label: 'Task', IconComponent: CheckCircle2 },
  { key: 'dollar', label: 'Finance', IconComponent: CreditCard },
  { key: 'book', label: 'Study', IconComponent: BookOpen },
  { key: 'shopping', label: 'Shopping', IconComponent: ShoppingCart },
  { key: 'home', label: 'Home', IconComponent: Home },
  { key: 'tag', label: 'General', IconComponent: Tag },
];

const AVAILABLE_COLORS: Array<CustomCategoryDef['color']> = [
  'sky',
  'rose',
  'emerald',
  'amber',
  'blue',
  'purple',
  'cyan',
  'violet',
  'yellow',
  'fuchsia',
];

export function getCategoryIconElement(iconKey: string, className = 'w-3.5 h-3.5') {
  switch (iconKey.toLowerCase()) {
    case 'briefcase':
    case 'work':
      return <Briefcase className={className} />;
    case 'user':
    case 'personal':
      return <User className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'activity':
    case 'health':
      return <Activity className={className} />;
    case 'dollar':
    case 'creditcard':
    case 'finance':
      return <CreditCard className={className} />;
    case 'book':
    case 'study':
      return <BookOpen className={className} />;
    case 'shopping':
    case 'cart':
      return <ShoppingCart className={className} />;
    case 'home':
      return <Home className={className} />;
    case 'alarm':
    case 'clock':
      return <AlarmClock className={className} />;
    case 'calendar':
    case 'meeting':
      return <Calendar className={className} />;
    case 'bell':
    case 'reminder':
      return <Bell className={className} />;
    case 'check':
    case 'task':
      return <CheckCircle2 className={className} />;
    default:
      return <Tag className={className} />;
  }
}

export function getColorClasses(color: CustomCategoryDef['color']) {
  switch (color) {
    case 'sky':
      return {
        badgeBg: 'bg-sky-950/70',
        badgeText: 'text-sky-300',
        badgeBorder: 'border-sky-500/40',
        iconBg: 'bg-sky-500/20 text-sky-400 border border-sky-500/40',
        cardBorder: 'hover:border-sky-500/50 border-sky-500/30 bg-sky-950/20',
        dotBg: 'bg-sky-400',
        glow: 'shadow-[0_0_12px_rgba(14,165,233,0.3)]',
      };
    case 'rose':
      return {
        badgeBg: 'bg-rose-950/70',
        badgeText: 'text-rose-300',
        badgeBorder: 'border-rose-500/40',
        iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
        cardBorder: 'hover:border-rose-500/50 border-rose-500/30 bg-rose-950/20',
        dotBg: 'bg-rose-400',
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]',
      };
    case 'emerald':
      return {
        badgeBg: 'bg-emerald-950/70',
        badgeText: 'text-emerald-300',
        badgeBorder: 'border-emerald-500/40',
        iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
        cardBorder: 'hover:border-emerald-500/50 border-emerald-500/30 bg-emerald-950/20',
        dotBg: 'bg-emerald-400',
        glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
      };
    case 'amber':
      return {
        badgeBg: 'bg-amber-950/70',
        badgeText: 'text-amber-300',
        badgeBorder: 'border-amber-500/40',
        iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
        cardBorder: 'hover:border-amber-500/50 border-amber-500/30 bg-amber-950/20',
        dotBg: 'bg-amber-400',
        glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
      };
    case 'blue':
      return {
        badgeBg: 'bg-blue-950/70',
        badgeText: 'text-blue-300',
        badgeBorder: 'border-blue-500/40',
        iconBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
        cardBorder: 'hover:border-blue-500/50 border-blue-500/30 bg-blue-950/20',
        dotBg: 'bg-blue-400',
        glow: 'shadow-[0_0_12px_rgba(59,130,246,0.3)]',
      };
    case 'purple':
      return {
        badgeBg: 'bg-purple-950/70',
        badgeText: 'text-purple-300',
        badgeBorder: 'border-purple-500/40',
        iconBg: 'bg-purple-500/20 text-purple-400 border border-purple-500/40',
        cardBorder: 'hover:border-purple-500/50 border-purple-500/30 bg-purple-950/20',
        dotBg: 'bg-purple-400',
        glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]',
      };
    case 'violet':
      return {
        badgeBg: 'bg-violet-950/70',
        badgeText: 'text-violet-300',
        badgeBorder: 'border-violet-500/40',
        iconBg: 'bg-violet-500/20 text-violet-400 border border-violet-500/40',
        cardBorder: 'hover:border-violet-500/50 border-violet-500/30 bg-violet-950/20',
        dotBg: 'bg-violet-400',
        glow: 'shadow-[0_0_12px_rgba(139,92,246,0.3)]',
      };
    case 'yellow':
      return {
        badgeBg: 'bg-yellow-950/70',
        badgeText: 'text-yellow-300',
        badgeBorder: 'border-yellow-500/40',
        iconBg: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
        cardBorder: 'hover:border-yellow-500/50 border-yellow-500/30 bg-yellow-950/20',
        dotBg: 'bg-yellow-400',
        glow: 'shadow-[0_0_12px_rgba(234,179,8,0.3)]',
      };
    case 'fuchsia':
      return {
        badgeBg: 'bg-fuchsia-950/70',
        badgeText: 'text-fuchsia-300',
        badgeBorder: 'border-fuchsia-500/40',
        iconBg: 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/40',
        cardBorder: 'hover:border-fuchsia-500/50 border-fuchsia-500/30 bg-fuchsia-950/20',
        dotBg: 'bg-fuchsia-400',
        glow: 'shadow-[0_0_12px_rgba(217,70,239,0.3)]',
      };
    default:
      return {
        badgeBg: 'bg-cyan-950/70',
        badgeText: 'text-cyan-300',
        badgeBorder: 'border-cyan-500/40',
        iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40',
        cardBorder: 'hover:border-cyan-500/50 border-cyan-500/30 bg-gray-950/70',
        dotBg: 'bg-cyan-400',
        glow: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]',
      };
  }
}

export function resolveCategoryMeta(rawCategory: string, categoriesList: CustomCategoryDef[]) {
  const norm = (rawCategory || '').trim().toLowerCase();

  // Direct match by id or name
  const found = categoriesList.find(
    (c) => c.id.toLowerCase() === norm || c.name.toLowerCase() === norm
  );
  if (found) {
    return {
      name: found.name,
      iconKey: found.iconKey,
      color: found.color,
      styles: getColorClasses(found.color),
    };
  }

  // Smart heuristic match based on keyword substrings
  if (norm.includes('work') || norm.includes('office') || norm.includes('job') || norm.includes('client')) {
    return { name: rawCategory, iconKey: 'briefcase', color: 'sky' as const, styles: getColorClasses('sky') };
  }
  if (norm.includes('health') || norm.includes('gym') || norm.includes('fit') || norm.includes('med') || norm.includes('walk') || norm.includes('run')) {
    return { name: rawCategory, iconKey: 'activity', color: 'emerald' as const, styles: getColorClasses('emerald') };
  }
  if (norm.includes('person') || norm.includes('family') || norm.includes('friend') || norm.includes('self') || norm.includes('dinner')) {
    return { name: rawCategory, iconKey: 'user', color: 'rose' as const, styles: getColorClasses('rose') };
  }
  if (norm.includes('finance') || norm.includes('money') || norm.includes('bill') || norm.includes('pay') || norm.includes('bank')) {
    return { name: rawCategory, iconKey: 'dollar', color: 'yellow' as const, styles: getColorClasses('yellow') };
  }
  if (norm.includes('study') || norm.includes('exam') || norm.includes('book') || norm.includes('course') || norm.includes('read')) {
    return { name: rawCategory, iconKey: 'book', color: 'violet' as const, styles: getColorClasses('violet') };
  }
  if (norm.includes('shop') || norm.includes('buy') || norm.includes('grocery') || norm.includes('store')) {
    return { name: rawCategory, iconKey: 'shopping', color: 'fuchsia' as const, styles: getColorClasses('fuchsia') };
  }
  if (norm.includes('home') || norm.includes('house') || norm.includes('flat')) {
    return { name: rawCategory, iconKey: 'home', color: 'fuchsia' as const, styles: getColorClasses('fuchsia') };
  }
  if (norm.includes('meet') || norm.includes('sync') || norm.includes('agenda')) {
    return { name: rawCategory, iconKey: 'calendar', color: 'blue' as const, styles: getColorClasses('blue') };
  }
  if (norm.includes('alarm') || norm.includes('wake')) {
    return { name: rawCategory, iconKey: 'alarm', color: 'purple' as const, styles: getColorClasses('purple') };
  }
  if (norm.includes('remind')) {
    return { name: rawCategory, iconKey: 'bell', color: 'amber' as const, styles: getColorClasses('amber') };
  }

  // Fallback
  return { name: rawCategory || 'Task', iconKey: 'tag', color: 'cyan' as const, styles: getColorClasses('cyan') };
}

interface ScheduleAlarmManagerProps {
  schedule: ScheduleItem[];
  onAddScheduleItem: (item: Omit<ScheduleItem, 'id'>) => void;
  onToggleComplete: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onSnoozeItem: (id: string, minutes: number) => void;
  onNotifyDueItem: (item: ScheduleItem) => void;
  notificationPermission: NotificationPermission;
  onRequestNotificationPermission: () => void;
  onUpdateItemLocation?: (itemId: string, newLocation: string) => void;
}

const CATEGORIES_STORAGE_KEY = 'jarvis_schedule_custom_categories';

export const ScheduleAlarmManager: React.FC<ScheduleAlarmManagerProps> = ({
  schedule,
  onAddScheduleItem,
  onToggleComplete,
  onDeleteItem,
  onSnoozeItem,
  onNotifyDueItem,
  notificationPermission,
  onRequestNotificationPermission,
  onUpdateItemLocation,
}) => {
  // Persistent Custom & Preset Categories State
  const [categories, setCategories] = useState<CustomCategoryDef[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Ensure standard presets are present
          const map = new Map<string, CustomCategoryDef>();
          PRESET_CATEGORIES.forEach((c) => map.set(c.id.toLowerCase(), c));
          parsed.forEach((c) => {
            if (c && typeof c.id === 'string') {
              map.set(c.id.toLowerCase(), c);
            }
          });
          return Array.from(map.values());
        }
      }
    } catch {}
    return PRESET_CATEGORIES;
  });

  // Filter & Search states
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryManagerModal, setShowCategoryManagerModal] = useState(false);

  // Form State for creating task
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Work');
  const [newTime, setNewTime] = useState('17:00');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newLocation, setNewLocation] = useState('');
  const [syncNative, setSyncNative] = useState(true);

  // Inline Category Creator State (Inside Modal)
  const [isAddingInlineCategory, setIsAddingInlineCategory] = useState(false);
  const [customCatName, setCustomCatName] = useState('');
  const [customCatIcon, setCustomCatIcon] = useState('briefcase');
  const [customCatColor, setCustomCatColor] = useState<CustomCategoryDef['color']>('sky');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Save categories to localStorage
  const saveCategories = (cats: CustomCategoryDef[]) => {
    setCategories(cats);
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cats));
    } catch {}
  };

  const handleCreateNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCatName.trim()) return;

    triggerHaptic([30, 50]);
    const cleanName = customCatName.trim();
    const slug = cleanName.toLowerCase().replace(/\s+/g, '-');

    // Check duplicate
    const existing = categories.find((c) => c.id.toLowerCase() === slug);
    if (existing) {
      setNewCategory(existing.name);
      setIsAddingInlineCategory(false);
      setCustomCatName('');
      return;
    }

    const newDef: CustomCategoryDef = {
      id: slug,
      name: cleanName,
      iconKey: customCatIcon,
      color: customCatColor,
      isCustom: true,
    };

    const updated = [...categories, newDef];
    saveCategories(updated);
    setNewCategory(cleanName);
    setIsAddingInlineCategory(false);
    setCustomCatName('');

    setFeedbackToast(`Custom category "${cleanName}" created!`);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleDeleteCategory = (catId: string) => {
    triggerHaptic([40]);
    const updated = categories.filter((c) => c.id !== catId);
    saveCategories(updated);
    if (newCategory.toLowerCase() === catId.toLowerCase()) {
      setNewCategory('Work');
    }
    if (activeCategoryFilter.toLowerCase() === catId.toLowerCase()) {
      setActiveCategoryFilter('all');
    }
  };

  // Distinct categories present in schedule + all defined categories
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    schedule.forEach((item) => {
      const norm = (item.category || 'task').toLowerCase();
      counts[norm] = (counts[norm] || 0) + 1;
    });
    return counts;
  }, [schedule]);

  // Filtered Items logic
  const filteredItems = useMemo(() => {
    return schedule.filter((item) => {
      // 1. Category Filter
      if (activeCategoryFilter !== 'all') {
        const itemCatLower = (item.category || '').toLowerCase();
        const filterLower = activeCategoryFilter.toLowerCase();

        // Handle composite filters
        if (filterLower === 'reminders') {
          if (itemCatLower !== 'reminder' && itemCatLower !== 'task') return false;
        } else if (filterLower === 'events') {
          if (itemCatLower !== 'meeting') return false;
        } else if (filterLower === 'alarms') {
          if (itemCatLower !== 'alarm') return false;
        } else {
          // Direct match against category id or name
          if (itemCatLower !== filterLower) {
            const meta = resolveCategoryMeta(item.category, categories);
            if (meta.name.toLowerCase() !== filterLower) return false;
          }
        }
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = item.title.toLowerCase().includes(q);
        const catMatch = (item.category || '').toLowerCase().includes(q);
        const locMatch = (item.location || '').toLowerCase().includes(q);
        if (!titleMatch && !catMatch && !locMatch) return false;
      }

      return true;
    });
  }, [schedule, activeCategoryFilter, searchQuery, categories]);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    triggerHaptic([30, 60]);
    const [h, m] = newTime.split(':').map((v) => parseInt(v, 10));

    const itemData: Omit<ScheduleItem, 'id'> = {
      title: newTitle.trim(),
      category: newCategory,
      customCategory: newCategory,
      time: newTime,
      date: newDate,
      hour: isNaN(h) ? 12 : h,
      minute: isNaN(m) ? 0 : m,
      location: newLocation.trim() || undefined,
      completed: false,
      syncedNative: syncNative,
    };

    onAddScheduleItem(itemData);

    // Native Integration triggers
    if (syncNative) {
      if (newCategory.toLowerCase() === 'alarm') {
        setNativeAndroidAlarm(itemData.hour || 7, itemData.minute || 0, itemData.title);
      } else {
        const start = new Date(`${newDate}T${newTime}:00`);
        addNativeCalendarEvent({
          title: itemData.title,
          description: `Jarvis Assistant: ${itemData.category.toUpperCase()}`,
          location: itemData.location,
          startDate: isNaN(start.getTime()) ? new Date() : start,
        });
      }
    }

    setNewTitle('');
    setNewLocation('');
    setShowAddModal(false);
  };

  const handleDirectSyncNative = (item: ScheduleItem) => {
    triggerHaptic([50, 50, 100]);
    if (item.category.toLowerCase() === 'alarm') {
      const timeParts = typeof item.time === 'string' ? item.time.split(':') : ['7', '0'];
      const h = parseInt(timeParts[0] || '7', 10);
      const m = parseInt(timeParts[1] || '0', 10);
      setNativeAndroidAlarm(isNaN(h) ? 7 : h, isNaN(m) ? 0 : m, item.title);
    } else {
      const datePart = item.date || new Date().toISOString().split('T')[0];
      const start = new Date(`${datePart}T${item.time}:00`);
      addNativeCalendarEvent({
        title: item.title,
        description: `Scheduled via JARVIS Personal Assistant [${item.category}]`,
        location: item.location,
        startDate: isNaN(start.getTime()) ? new Date() : start,
      });
    }
  };

  const handleDownloadIcs = (item: ScheduleItem) => {
    const datePart = item.date || new Date().toISOString().split('T')[0];
    const start = new Date(`${datePart}T${item.time}:00`);
    downloadICalendarFile(
      item.title,
      isNaN(start.getTime()) ? new Date() : start,
      undefined,
      item.location ? `Category: ${item.category} | Location: ${item.location}` : `Category: ${item.category}`
    );
  };

  const handleTestNotification = () => {
    playAlertSound();
    triggerHaptic([200, 100, 200]);
    sendLocalNotification('JARVIS Alert Test', {
      body: 'Sir, your scheduled event and category notification system is fully operational.',
    });
    speakJarvis('Notification test executed, Sir. Audio, visual telemetry, and category indicators are fully functional.');
  };

  return (
    <div className="w-full bg-slate-900/85 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-[0_0_25px_rgba(0,0,0,0.6)] text-slate-100">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono tracking-wider text-cyan-100 uppercase">
              PERSONAL ASSISTANT: SCHEDULE & ALARMS
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              Custom Categories Active
            </span>
          </div>
          <p className="text-[11px] text-cyan-400/70 font-mono mt-0.5">
            Voice-managed reminders, custom Work/Personal/Health agendas, and native device clock/calendar sync.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Open Native Clock App Button */}
          <button
            id="btn-open-native-clock"
            onClick={openNativeClock}
            title="Open Android Native Clock app"
            className="px-2.5 py-1.5 rounded-lg bg-gray-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono hover:bg-cyan-900/40 flex items-center gap-1.5 transition-all"
          >
            <AlarmClock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">ANDROID CLOCK</span>
          </button>

          {/* Open Native Calendar App Button */}
          <button
            id="btn-open-native-calendar"
            onClick={openNativeCalendar}
            title="Open Android Native Calendar app"
            className="px-2.5 py-1.5 rounded-lg bg-gray-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono hover:bg-cyan-900/40 flex items-center gap-1.5 transition-all"
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">ANDROID CALENDAR</span>
          </button>

          {/* Manage Categories Button */}
          <button
            id="btn-manage-categories"
            onClick={() => setShowCategoryManagerModal(true)}
            title="Manage custom user-defined categories"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-200 text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>CATEGORIES</span>
          </button>

          {/* Create New Item Button */}
          <button
            id="btn-add-schedule-item"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.4)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW TASK</span>
          </button>
        </div>
      </div>

      {/* Permission Warning Banner if notifications not granted */}
      {notificationPermission !== 'granted' && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Enable browser notifications to receive timely audio/visual alerts when your alarms or category reminders trigger.
            </span>
          </div>
          <button
            id="btn-grant-notifications"
            onClick={onRequestNotificationPermission}
            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-mono font-semibold text-[11px] whitespace-nowrap transition-colors cursor-pointer"
          >
            ENABLE ALERTS
          </button>
        </div>
      )}

      {/* Quick Category Summary Breakdown Bar (Clickable Filter Chips) */}
      <div className="mb-3.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={() => {
            triggerHaptic([20]);
            setActiveCategoryFilter('all');
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
            activeCategoryFilter === 'all'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)] font-black'
              : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-cyan-300'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>ALL ({schedule.length})</span>
        </button>

        {/* Dynamic Category Chips with category-specific icons */}
        {categories.map((cat) => {
          const count = categoriesWithCounts[cat.id.toLowerCase()] || 0;
          const styles = getColorClasses(cat.color);
          const isSelected = activeCategoryFilter.toLowerCase() === cat.id.toLowerCase() || activeCategoryFilter.toLowerCase() === cat.name.toLowerCase();

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                triggerHaptic([20]);
                setActiveCategoryFilter(cat.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? `${styles.badgeBg} ${styles.badgeText} border ${styles.badgeBorder} shadow-sm font-bold ring-1 ring-cyan-400/50`
                  : 'bg-slate-950/60 border border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {getCategoryIconElement(cat.iconKey, 'w-3 h-3')}
              <span>{cat.name}</span>
              {count > 0 && (
                <span className="text-[10px] opacity-80 font-bold px-1 rounded bg-slate-900/60">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Input & Test Trigger Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-cyan-400/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, location or category..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-400 text-xs text-cyan-100 placeholder-slate-500 font-sans focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <span className="text-[11px] font-mono text-slate-400">
            Showing <strong className="text-cyan-300">{filteredItems.length}</strong> of {schedule.length}
          </span>
          <button
            id="btn-test-alert-sound"
            onClick={handleTestNotification}
            title="Test Timely Alarm/Notification chime"
            className="text-[11px] font-mono text-cyan-400/80 hover:text-cyan-200 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-cyan-500/20 hover:border-cyan-500/40 transition-all cursor-pointer"
          >
            <Volume2 className="w-3 h-3 text-cyan-400" />
            <span>TEST ALERTS</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {feedbackToast && (
        <div className="mb-3 p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Live GPS Travel Time & Distance to Item #1 Estimator Card */}
      {schedule.length > 0 && (
        <div className="mb-4">
          <ScheduleTravelEtaCard
            schedule={schedule}
            onUpdateItemLocation={onUpdateItemLocation}
          />
        </div>
      )}

      {/* Schedule Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-slate-950/50 border border-dashed border-cyan-500/20 text-cyan-400/60">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-400" />
          <p className="text-xs font-mono font-semibold">No items match this category filter.</p>
          <p className="text-[11px] font-sans mt-1 text-slate-400">
            Click <strong>&quot;NEW TASK&quot;</strong> above to create a task in &quot;Work&quot;, &quot;Personal&quot;, or &quot;Health&quot;, or tell Jarvis: &quot;Remind me to review design at 5 PM&quot;.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const meta = resolveCategoryMeta(item.category, categories);
            const isAlarm = item.category.toLowerCase() === 'alarm';
            const isMeeting = item.category.toLowerCase() === 'meeting';

            return (
              <div
                key={item.id}
                className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  item.completed
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                    : `${meta.styles.cardBorder} shadow-sm backdrop-blur-sm`
                }`}
              >
                {/* Left: Category Icon & Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    id={`btn-complete-${item.id}`}
                    onClick={() => {
                      triggerHaptic([25]);
                      onToggleComplete(item.id);
                    }}
                    title={item.completed ? 'Mark incomplete' : 'Mark completed'}
                    className="p-1 text-cyan-400/60 hover:text-cyan-300 transition-colors shrink-0 cursor-pointer"
                  >
                    <CheckCircle2
                      className={`w-5 h-5 ${item.completed ? 'text-emerald-400' : 'text-slate-600 hover:text-cyan-400'}`}
                    />
                  </button>

                  {/* Distinctive Category-Specific Icon Badge */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.styles.iconBg} ${
                      !item.completed ? meta.styles.glow : ''
                    }`}
                  >
                    {getCategoryIconElement(meta.iconKey, 'w-4 h-4')}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          item.completed ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {item.title}
                      </h4>

                      {/* Category Badge Pill with Category-Specific Icon */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 border ${meta.styles.badgeBg} ${meta.styles.badgeText} ${meta.styles.badgeBorder}`}
                      >
                        {getCategoryIconElement(meta.iconKey, 'w-3 h-3')}
                        <span>{meta.name}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {item.time}
                      </span>
                      {item.date && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {item.date}
                          </span>
                        </>
                      )}
                      {item.location && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-cyan-300/80 truncate max-w-[140px]">
                            {item.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Sync to Native Android Button */}
                  <button
                    id={`btn-sync-native-${item.id}`}
                    onClick={() => handleDirectSyncNative(item)}
                    title={
                      isAlarm
                        ? 'Dispatch to Android Native Clock Alarm'
                        : `Dispatch to Android Calendar [${meta.name}]`
                    }
                    className="p-1.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 hover:text-cyan-100 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  {/* Export iCalendar for calendar events */}
                  {!isAlarm && (
                    <button
                      id={`btn-download-ics-${item.id}`}
                      onClick={() => handleDownloadIcs(item)}
                      title="Download .ics event file"
                      className="p-1.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 hover:text-cyan-100 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Snooze 5 minutes */}
                  {!item.completed && (
                    <button
                      id={`btn-snooze-${item.id}`}
                      onClick={() => onSnoozeItem(item.id, 5)}
                      title="Snooze 5 minutes"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-cyan-200 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    id={`btn-delete-${item.id}`}
                    onClick={() => onDeleteItem(item.id)}
                    title="Delete item"
                    className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:text-rose-200 hover:bg-rose-900/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Creation Modal with Custom Category Selection & Inline Creator */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-950 border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_40px_rgba(6,182,212,0.3)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-4">
              <h3 className="text-sm font-mono font-bold text-cyan-100 flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-cyan-400" />
                <span>NEW SCHEDULE ENTRY / TASK</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setIsAddingInlineCategory(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              {/* Category Selector with Category-Specific Icons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-mono text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-cyan-400" />
                    <span>SELECT CATEGORY:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingInlineCategory(!isAddingInlineCategory)}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-200 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAddingInlineCategory ? 'Close Creator' : '+ Custom Category'}</span>
                  </button>
                </div>

                {/* Inline Category Creator Panel */}
                {isAddingInlineCategory && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-3 mb-3 animate-fade-in shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Create Custom Category</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">e.g. Work, Personal, Health</span>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={customCatName}
                        onChange={(e) => setCustomCatName(e.target.value)}
                        placeholder="Category Name (e.g. Work, Health, Study...)"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Icon Selection */}
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block mb-1">SELECT ICON:</span>
                      <div className="grid grid-cols-7 gap-1.5">
                        {AVAILABLE_ICONS.map((ic) => (
                          <button
                            key={ic.key}
                            type="button"
                            onClick={() => setCustomCatIcon(ic.key)}
                            title={ic.label}
                            className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              customCatIcon === ic.key
                                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold scale-105'
                                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-300'
                            }`}
                          >
                            <ic.IconComponent className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Selection */}
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block mb-1">ACCENT COLOR:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {AVAILABLE_COLORS.map((col) => {
                          const cStyle = getColorClasses(col);
                          return (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setCustomCatColor(col)}
                              className={`w-6 h-6 rounded-full transition-all cursor-pointer ${cStyle.dotBg} ${
                                customCatColor === col ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateNewCategory}
                      disabled={!customCatName.trim()}
                      className="w-full py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      Save Category & Select
                    </button>
                  </div>
                )}

                {/* Category Options Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const isSelected = newCategory.toLowerCase() === cat.name.toLowerCase();
                    const styles = getColorClasses(cat.color);

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic([15]);
                          setNewCategory(cat.name);
                        }}
                        className={`p-2 rounded-xl text-xs font-mono font-semibold border flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? `${styles.badgeBg} ${styles.badgeText} border ${styles.badgeBorder} shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-1 ring-white/50`
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-1 rounded-md ${styles.iconBg}`}>
                          {getCategoryIconElement(cat.iconKey, 'w-3.5 h-3.5')}
                        </div>
                        <span className="truncate">{cat.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-[11px] font-mono text-cyan-300 mb-1 font-bold">
                  TITLE / PURPOSE:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={
                    newCategory.toLowerCase() === 'work'
                      ? 'Client deliverable review or code sync'
                      : newCategory.toLowerCase() === 'health'
                      ? 'Gym workout, vitamins or doctor checkup'
                      : newCategory.toLowerCase() === 'personal'
                      ? 'Family dinner or call home'
                      : newCategory.toLowerCase() === 'alarm'
                      ? 'Morning Gym Alarm'
                      : newCategory.toLowerCase() === 'meeting'
                      ? 'Team Sync / Project Review'
                      : 'Task description'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-100 text-xs font-sans focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Time & Date */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-mono text-cyan-400/80 mb-1">TIME:</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-cyan-400/80 mb-1">DATE:</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Location (optional for all, helpful for meetings/work/personal) */}
              <div>
                <label className="block text-[11px] font-mono text-cyan-400/80 mb-1">
                  LOCATION / NOTES (OPTIONAL):
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Google Meet, Gym Center, Home, Office"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-100 text-xs font-sans focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Native Android Sync Checkbox */}
              <label className="flex items-center gap-2 text-xs font-mono text-cyan-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={syncNative}
                  onChange={(e) => setSyncNative(e.target.checked)}
                  className="rounded border-cyan-500/40 text-cyan-500 focus:ring-0"
                />
                <span>
                  {newCategory.toLowerCase() === 'alarm'
                    ? 'Sync immediately to Native Android Clock App'
                    : 'Sync immediately to Native Android Calendar App'}
                </span>
              </label>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-cyan-500/20">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
                >
                  SAVE & SCHEDULE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_35px_rgba(6,182,212,0.3)]">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-4">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>USER-DEFINED CATEGORIES MANAGER</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryManagerModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              Manage custom categories with category-specific icons and colors. Presets like Work, Personal, and Health help Jarvis organize and announce your tasks accurately.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const styles = getColorClasses(cat.color);
                return (
                  <div
                    key={cat.id}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${styles.iconBg}`}>
                        {getCategoryIconElement(cat.iconKey, 'w-4 h-4')}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{cat.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 capitalize">
                          Theme: {cat.color} • Icon: {cat.iconKey}
                        </span>
                      </div>
                    </div>

                    {cat.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        title="Delete custom category"
                        className="p-1 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCategoryManagerModal(false)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold cursor-pointer"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
