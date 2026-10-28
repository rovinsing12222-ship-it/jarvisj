import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Brain,
  Cpu,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Code2,
  Sparkles,
  Smartphone,
  Copy,
  CheckCheck,
  RefreshCw,
  Search,
  Database,
  Layers,
  ShieldCheck,
  Zap,
  Download,
  FileJson,
  PieChart as PieChartIcon,
  MessageSquareQuote,
  HelpCircle,
  Bot,
  User,
  Target,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Award,
  Infinity as InfinityIcon,
  BarChart3,
  TrendingUp,
  Activity,
  ArrowUpRight,
  HardDrive,
  SlidersHorizontal,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { MemoryItem, KotlinBridgeModule, UserTargetItem, TargetStatus } from '../types/memory';
import {
  saveMemory,
  deleteMemory,
  getStoredMemories,
  getStoredQaMemories,
  clearQaMemories,
  deleteQaMemory,
  QaMemoryRecord,
  getStoredTargets,
  saveTarget,
  completeTarget,
  updateTargetStatus,
  deleteTarget,
  clearAllTargets,
  isUnlimitedMemoryActive,
  setUnlimitedMemoryActive,
} from '../utils/smartMemoryEngine';
import {
  GeminiCacheEntry,
  getGeminiCacheList,
  deleteGeminiCacheEntry,
  clearGeminiCache,
  purgeExpiredGeminiCache,
  getGeminiCacheItemRemainingTtlMs,
} from '../utils/hindiKnowledgeHub';
import {
  ANDROID_ROOM_MEMORY_KOTLIN,
  ANDROID_WEBVIEW_BRIDGE_KOTLIN,
} from '../utils/androidMemoryBridge';

interface MemoryCoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryUpdate?: (memories: MemoryItem[]) => void;
  initialTab?: 'memories' | 'qa_memory' | 'targets' | 'kotlin' | 'analytics' | 'gemini_cache';
}

export const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-creator',
    category: 'personal',
    key: 'Creator & Developer / निर्माता',
    value: 'Rovin Pal (रोविन पाल - Creator, Developer & Master of JARVIS)',
    confidence: 100,
    source: 'user_stated',
    updatedAt: 'Permanent Core',
    pinned: true,
  },
  {
    id: 'mem-user-name',
    category: 'personal',
    key: 'User Identity / Name',
    value: 'Rovin Pal (Creator, Master & Primary User)',
    confidence: 100,
    source: 'user_stated',
    updatedAt: 'Just now',
    pinned: true,
  },
  {
    id: 'mem-work-excel',
    category: 'work',
    key: 'Excel All Shortcuts & Smart Work Formulas',
    value: 'AutoSum: Alt+= | Filter: Ctrl+Shift+L | Flash Fill: Ctrl+E | Format: Ctrl+1 | Repeat: F4 | Select Col: Ctrl+Space | Select Row: Shift+Space | Quick Table: Ctrl+T | Duplicate: Ctrl+D / Ctrl+R',
    confidence: 100,
    source: 'user_stated',
    updatedAt: 'Core Knowledge',
    pinned: true,
  },
  {
    id: 'mem-work-pc-speed',
    category: 'work',
    key: 'PC & Laptop Fast Window Snapping & Hotkeys',
    value: 'Win+Arrows (Split/Snap Window) | Alt+Tab (Instant Switch) | Win+V (Clipboard) | Win+Shift+S (Snipping Screenshot) | Ctrl+Shift+Esc (Task Manager)',
    confidence: 99,
    source: 'user_stated',
    updatedAt: 'Core Knowledge',
    pinned: true,
  },
  {
    id: 'mem-health-daily',
    category: 'health',
    key: 'Daily Wellness & Fitness Objective',
    value: 'Drink 3L water daily, 20-min morning workout, 20-20-20 eye rest rule during PC work',
    confidence: 95,
    source: 'user_stated',
    updatedAt: 'Active Goal',
    pinned: false,
  },
  {
    id: 'mem-1',
    category: 'preference',
    key: 'Primary Greeting',
    value: 'Ram Ram ji! (Traditional polite Hindi greeting for Rovin Pal ji)',
    confidence: 100,
    source: 'user_stated',
    updatedAt: 'Just now',
    pinned: true,
  },
  {
    id: 'mem-2',
    category: 'preference',
    key: 'Voice Persona',
    value: 'Indian Girl voice (Devanagari phonetics, pitch 1.10, sweet natural Hindi accent)',
    confidence: 98,
    source: 'user_stated',
    updatedAt: 'Today',
    pinned: true,
  },
  {
    id: 'mem-3',
    category: 'contact_rule',
    key: 'Family Contacts',
    value: 'Dad -> Arvind Stark (+91 98200 11223), Rahul -> Brother (+91 99887 76655)',
    confidence: 96,
    source: 'user_stated',
    updatedAt: 'Yesterday',
    pinned: false,
  },
  {
    id: 'mem-4',
    category: 'routine',
    key: 'Daily Wakeup & Alarm',
    value: '06:30 AM morning jogging alarm with gentle sine wave chime',
    confidence: 92,
    source: 'inferred',
    updatedAt: '2 days ago',
    pinned: false,
  },
  {
    id: 'mem-5',
    category: 'hardware',
    key: 'Hardware Intent Sync',
    value: 'Uses android.content.Intent, TelecomManager, and CameraManager torch APIs',
    confidence: 99,
    source: 'system_default',
    updatedAt: 'Real-time',
    pinned: true,
  },
  {
    id: 'mem-6',
    category: 'routine',
    key: 'Primary Messaging App',
    value: 'WhatsApp (api.whatsapp.com / com.whatsapp package target)',
    confidence: 95,
    source: 'user_stated',
    updatedAt: '3 days ago',
    pinned: false,
  },
  {
    id: 'mem-gov-schemes-core',
    category: 'work',
    key: 'Government Schemes & Welfare (भारत सरकार की नई व महत्वपूर्ण योजनाएं)',
    value: 'PM Surya Ghar: ₹78k subsidy + 300 units free power | NPS Vatsalya: minor pension investment from ₹1,000/yr | UPS: assured 50% pension + ₹10,000 guarantee | PM Vishwakarma: 18 crafts ₹3L loan @ 5% + ₹15k toolkit | Namo Drone Didi: 80% subsidy for women SHGs | Agnipath: 4-yr military + ₹11.71L Seva Nidhi | Lakhpati Didi: ₹1L+ annual income | myScheme: myscheme.gov.in',
    confidence: 100,
    source: 'user_stated',
    updatedAt: 'Auto-Updated Live',
    pinned: true,
  },
  {
    id: 'mem-gov-schemes-auto-sync',
    category: 'preference',
    key: 'Government Schemes Automatic Live Update Engine',
    value: 'Engine is permanently active. Any new central or state scheme announced is automatically synchronized, checked for eligibility, and available for instant voice inquiry.',
    confidence: 100,
    source: 'user_stated',
    updatedAt: 'Live Synced',
    pinned: true,
  },
];

const KOTLIN_MODULES: KotlinBridgeModule[] = [
  {
    id: 'mod-telecom',
    title: 'Telecom & Direct Calling Bridge',
    description: 'Bypasses standard confirmation when ACTION_CALL permission is granted.',
    channelName: 'com.jarvis.assistant/telecom',
    status: 'active',
    kotlinSnippet: `package com.jarvis.assistant.telecom

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.telecom.TelecomManager
import androidx.annotation.RequiresPermission

class JarvisCallBridge(private val context: Context) {
    @RequiresPermission(android.Manifest.permission.CALL_PHONE)
    fun directDial(phoneNumber: String, autoDial: Boolean = true) {
        val sanitized = phoneNumber.replace("[^0-9+]".toRegex(), "")
        val uri = Uri.parse("tel:$sanitized")
        val intent = if (autoDial) {
            Intent(Intent.ACTION_CALL, uri)
        } else {
            Intent(Intent.ACTION_DIAL, uri)
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}`,
  },
  {
    id: 'mod-torch',
    title: 'CameraManager Flashlight & Hardware Service',
    description: 'Hardware CameraManager control for toggling rear LED torch directly in Android.',
    channelName: 'com.jarvis.assistant/hardware',
    status: 'active',
    kotlinSnippet: `package com.jarvis.assistant.hardware

import android.content.Context
import android.hardware.camera2.CameraManager
import android.os.Build

class JarvisHardwareBridge(private val context: Context) {
    private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager

    fun setTorchMode(enabled: Boolean): Boolean {
        return try {
            val cameraId = cameraManager.cameraIdList.firstOrNull { id ->
                val characteristics = cameraManager.getCameraCharacteristics(id)
                characteristics.get(android.hardware.camera2.CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            } ?: "0"
            cameraManager.setTorchMode(cameraId, enabled)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}`,
  },
  {
    id: 'mod-calendar',
    title: 'CalendarProvider & AlarmClock Native Intents',
    description: 'Direct insertion of events and alarms into Android Clock and Calendar content providers.',
    channelName: 'com.jarvis.assistant/schedule',
    status: 'synced',
    kotlinSnippet: `package com.jarvis.assistant.schedule

import android.content.Context
import android.content.Intent
import android.provider.AlarmClock
import android.provider.CalendarContract

class JarvisScheduleBridge(private val context: Context) {
    fun setAlarm(hour: Int, minute: Int, message: String) {
        val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
            putExtra(AlarmClock.EXTRA_HOUR, hour)
            putExtra(AlarmClock.EXTRA_MINUTES, minute)
            putExtra(AlarmClock.EXTRA_MESSAGE, message)
            putExtra(AlarmClock.EXTRA_SKIP_UI, true)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun addCalendarEvent(title: String, startEpochMs: Long, endEpochMs: Long) {
        val intent = Intent(Intent.ACTION_INSERT).apply {
            data = CalendarContract.Events.CONTENT_URI
            putExtra(CalendarContract.Events.TITLE, title)
            putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, startEpochMs)
            putExtra(CalendarContract.EXTRA_EVENT_END_TIME, endEpochMs)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}`,
  },
  {
    id: 'mod-memory',
    title: 'Room Database & SharedPreferences Dual-Store',
    description: 'Thread-safe Android Room DB & SharedPreferences storing JARVIS user key-value memories across app restarts.',
    channelName: 'com.jarvis.assistant/memory',
    status: 'ready',
    kotlinSnippet: ANDROID_ROOM_MEMORY_KOTLIN,
  },
  {
    id: 'mod-bridge',
    title: 'Android WebView JavaScriptInterface Bridge',
    description: 'Bridges JavaScript/React window.AndroidMemoryBridge with native Android Room DB and SharedPreferences.',
    channelName: 'com.jarvis.assistant/bridge',
    status: 'active',
    kotlinSnippet: ANDROID_WEBVIEW_BRIDGE_KOTLIN,
  },
];

export const MemoryCoreModal: React.FC<MemoryCoreModalProps> = ({
  isOpen,
  onClose,
  onMemoryUpdate,
  initialTab = 'memories',
}) => {
  const [activeTab, setActiveTab] = useState<'memories' | 'qa_memory' | 'targets' | 'kotlin' | 'analytics' | 'gemini_cache'>(initialTab);
  const [selectedAnalyticsCategory, setSelectedAnalyticsCategory] = useState<string>('all');
  const [analyticsMetric, setAnalyticsMetric] = useState<'factsCount' | 'charVolume' | 'avgConfidence'>('factsCount');
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');
  const [qaMemories, setQaMemories] = useState<QaMemoryRecord[]>(() => getStoredQaMemories());
  const [qaSearchQuery, setQaSearchQuery] = useState('');

  // Hindi Knowledge Hub Fast Gemini Q&A Cache State (24-Hour TTL)
  const [geminiCacheList, setGeminiCacheList] = useState<GeminiCacheEntry[]>(() => getGeminiCacheList());
  const [geminiCacheSearchQuery, setGeminiCacheSearchQuery] = useState('');
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);

  const [targets, setTargets] = useState<UserTargetItem[]>(() => getStoredTargets());
  const [targetFilter, setTargetFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [targetSearchQuery, setTargetSearchQuery] = useState('');
  const [isAddingTarget, setIsAddingTarget] = useState(false);
  const [newTargetTitle, setNewTargetTitle] = useState('');
  const [newTargetCategory, setNewTargetCategory] = useState<'work' | 'personal' | 'fitness' | 'learning' | 'daily'>('work');
  const [newTargetDueDate, setNewTargetDueDate] = useState('');
  const [newTargetNotes, setNewTargetNotes] = useState('');
  const [unlimitedMemoryOn, setUnlimitedMemoryOn] = useState<boolean>(() => isUnlimitedMemoryActive());

  // Sync targets when updated
  useEffect(() => {
    const handleTargetsUpdate = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail && Array.isArray(custom.detail)) {
        setTargets(custom.detail);
      } else {
        setTargets(getStoredTargets());
      }
    };
    window.addEventListener('jarvis_targets_updated', handleTargetsUpdate);
    window.addEventListener('jarvis:targets-updated', handleTargetsUpdate);
    return () => {
      window.removeEventListener('jarvis_targets_updated', handleTargetsUpdate);
      window.removeEventListener('jarvis:targets-updated', handleTargetsUpdate);
    };
  }, []);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Sync QA memories when new questions are answered
  useEffect(() => {
    const handleQaUpdate = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail && Array.isArray(custom.detail)) {
        setQaMemories(custom.detail);
      } else {
        setQaMemories(getStoredQaMemories());
      }
    };
    window.addEventListener('jarvis_qa_memory_updated', handleQaUpdate);
    return () => window.removeEventListener('jarvis_qa_memory_updated', handleQaUpdate);
  }, []);

  // Sync Gemini Cache and purge expired entries (>24h TTL)
  useEffect(() => {
    const handleCacheUpdate = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail && Array.isArray(custom.detail)) {
        setGeminiCacheList(custom.detail);
      } else {
        setGeminiCacheList(getGeminiCacheList());
      }
    };
    window.addEventListener('jarvis_gemini_cache_updated', handleCacheUpdate);
    return () => window.removeEventListener('jarvis_gemini_cache_updated', handleCacheUpdate);
  }, []);

  // When modal is opened, trigger 24h TTL purge and refresh fresh cache items
  useEffect(() => {
    if (isOpen) {
      const fresh = purgeExpiredGeminiCache();
      setGeminiCacheList(fresh);
    }
  }, [isOpen]);

  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('jarvis_memory_core');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            let updated = [...parsed];
            const hasCreator = updated.some(
              (m: MemoryItem) =>
                (m.key && m.key.toLowerCase().includes('creator')) ||
                (m.key && m.key.toLowerCase().includes('निर्माता')) ||
                (m.value && m.value.toLowerCase().includes('rovin pal (रोविन पाल - creator'))
            );
            if (!hasCreator) {
              const creatorItem: MemoryItem = {
                id: 'mem-creator',
                category: 'personal',
                key: 'Creator & Developer / निर्माता',
                value: 'Rovin Pal (रोविन पाल - Creator, Developer & Master of JARVIS)',
                confidence: 100,
                source: 'user_stated',
                updatedAt: 'Permanent Core',
                pinned: true,
              };
              updated = [creatorItem, ...updated];
            }
            const hasRovin = updated.some(
              (m: MemoryItem) =>
                (m.key && m.key.toLowerCase().includes('user identity')) ||
                (m.value && m.value.toLowerCase().includes('rovin pal'))
            );
            if (!hasRovin) {
              const rovinItem: MemoryItem = {
                id: 'mem-user-name',
                category: 'personal',
                key: 'User Identity / Name',
                value: 'Rovin Pal (Creator, Master & Primary User)',
                confidence: 100,
                source: 'user_stated',
                updatedAt: 'Just now',
                pinned: true,
              };
              updated = [rovinItem, ...updated];
            }
            try {
              localStorage.setItem('jarvis_memory_core', JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          }
        } catch {
          // ignore
        }
      }
    }
    return DEFAULT_MEMORIES;
  });

  // Sync when external commands add to memory
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail && Array.isArray(custom.detail)) {
        setMemories(custom.detail);
      }
    };
    window.addEventListener('jarvis_memory_updated', handleUpdate);
    return () => window.removeEventListener('jarvis_memory_updated', handleUpdate);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // New Memory creation form
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('preference');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);

  // Stable ref for onMemoryUpdate to prevent unintended re-render runs
  const onMemoryUpdateRef = useRef(onMemoryUpdate);
  onMemoryUpdateRef.current = onMemoryUpdate;

  // Persist to localStorage safely
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('jarvis_memory_core', JSON.stringify(memories));
      }
    } catch {}
  }, [memories]);

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    const keyClean = newKey.trim();
    const valClean = newValue.trim();

    saveMemory(keyClean, valClean, newCategory as any);

    const newItem: MemoryItem = {
      id: `mem-${Date.now()}`,
      key: keyClean,
      value: valClean,
      category: newCategory,
      confidence: 100,
      source: 'user_stated',
      updatedAt: 'Just now',
      pinned: false,
    };

    setMemories((prev) => [newItem, ...prev]);
    setNewKey('');
    setNewValue('');
    setIsAdding(false);
  };

  const handleDeleteMemory = (id: string) => {
    const item = memories.find((m) => m.id === id);
    if (item) {
      deleteMemory(item.key);
    }
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleTogglePin = (id: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
    );
  };

  const handleStartEdit = (item: MemoryItem) => {
    setEditingId(item.id);
    setEditValue(item.value);
  };

  const handleSaveEdit = (id: string) => {
    if (!editValue.trim()) return;
    const item = memories.find((m) => m.id === id);
    if (item) {
      saveMemory(item.key, editValue.trim(), item.category as any);
    }
    setMemories((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, value: editValue.trim(), updatedAt: 'Just now' } : m
      )
    );
    setEditingId(null);
  };

  const handleCopySnippet = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleResetDefaults = () => {
    setMemories(DEFAULT_MEMORIES);
  };

  const handleToggleTargetStatus = (id: string) => {
    const target = targets.find((t) => t.id === id);
    if (!target) return;
    const nextStatus: TargetStatus = target.status === 'completed' ? 'pending' : 'completed';
    const updated = updateTargetStatus(id, nextStatus);
    if (updated) {
      setTargets(getStoredTargets());
    }
  };

  const handleCreateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetTitle.trim()) return;
    saveTarget(newTargetTitle.trim(), {
      category: newTargetCategory,
      dueDate: newTargetDueDate.trim() || undefined,
      notes: newTargetNotes.trim() || undefined,
    });
    setTargets(getStoredTargets());
    setNewTargetTitle('');
    setNewTargetDueDate('');
    setNewTargetNotes('');
    setIsAddingTarget(false);
  };

  const handleDeleteTargetItem = (id: string) => {
    deleteTarget(id);
    setTargets(getStoredTargets());
  };

  const handleToggleUnlimitedMemory = () => {
    const nextVal = !unlimitedMemoryOn;
    setUnlimitedMemoryActive(nextVal);
    setUnlimitedMemoryOn(nextVal);
  };

  const handleExportMemories = () => {
    try {
      const storedRecords = getStoredMemories();
      const currentList = memories && memories.length > 0 ? memories : storedRecords;
      const qaRecords = getStoredQaMemories();

      const exportPayload = {
        backupTitle: 'J.A.R.V.I.S. Smart Memory Backup',
        app: 'JARVIS AI Assistant',
        backupVersion: '2.5',
        exportedAt: new Date().toISOString(),
        creator: 'Rovin Pal',
        totalSmartMemoryItems: currentList.length,
        totalQaRecords: qaRecords.length,
        smartMemoryItems: currentList,
        memories: currentList,
        qaMemories: qaRecords,
      };
      const jsonString = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jarvis_smart_memory_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export Smart Memory items as JSON', err);
    }
  };

  // Recharts Category Distribution Metadata & Calculations
  const CATEGORY_META: Record<string, { label: string; color: string }> = {
    personal: { label: 'Personal', color: '#a855f7' },
    work: { label: 'Work', color: '#3b82f6' },
    health: { label: 'Health', color: '#f43f5e' },
    preference: { label: 'Preference', color: '#06b6d4' },
    routine: { label: 'Routine', color: '#f59e0b' },
    contact_rule: { label: 'Contacts', color: '#10b981' },
    hardware: { label: 'Hardware', color: '#6366f1' },
    custom_instruction: { label: 'Custom', color: '#ec4899' },
    identity: { label: 'Identity', color: '#8b5cf6' },
    other: { label: 'Other', color: '#64748b' },
  };

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    memories.forEach((m) => {
      const cat = (m.category || 'other').toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([catKey, count]) => {
      const meta = CATEGORY_META[catKey] || {
        label: catKey.charAt(0).toUpperCase() + catKey.slice(1).replace('_', ' '),
        color: '#06b6d4',
      };
      return {
        name: meta.label,
        categoryKey: catKey,
        value: count,
        color: meta.color,
        percentage: Math.round((count / (memories.length || 1)) * 100),
      };
    });
  }, [memories]);

  // Recharts Bar Chart Data: Memory Density & Categorization Analytics
  const categoryDensityBarData = useMemo(() => {
    // Categories to track
    const categoryAgg: Record<
      string,
      {
        factsCount: number;
        targetsCount: number;
        charVolume: number;
        confidenceSum: number;
      }
    > = {
      work: { factsCount: 0, targetsCount: 0, charVolume: 0, confidenceSum: 0 },
      personal: { factsCount: 0, targetsCount: 0, charVolume: 0, confidenceSum: 0 },
      health: { factsCount: 0, targetsCount: 0, charVolume: 0, confidenceSum: 0 },
      learning: { factsCount: 0, targetsCount: 0, charVolume: 0, confidenceSum: 0 },
      routine: { factsCount: 0, targetsCount: 0, charVolume: 0, confidenceSum: 0 },
      preference: { factsCount: 0, targetsCount: 0, charVolume: 0, confidenceSum: 0 },
      hardware: { factsCount: 0, targetsCount: 0, charVolume: 0, confidenceSum: 0 },
      identity: { factsCount: 0, targetsCount: 0, charVolume: 0, confidenceSum: 0 },
      other: { factsCount: 0, targetsCount: 0, charVolume: 0, confidenceSum: 0 },
    };

    // Aggregate facts / memories
    memories.forEach((m) => {
      const cat = (m.category || 'other').toLowerCase();
      if (!categoryAgg[cat]) {
        categoryAgg[cat] = { factsCount: 0, targetsCount: 0, charVolume: 0, confidenceSum: 0 };
      }
      categoryAgg[cat].factsCount += 1;
      categoryAgg[cat].charVolume += (m.key?.length || 0) + (m.value?.length || 0);
      categoryAgg[cat].confidenceSum += m.confidence || 95;
    });

    // Aggregate targets
    targets.forEach((t) => {
      const cat = (t.category || 'other').toLowerCase();
      if (!categoryAgg[cat]) {
        categoryAgg[cat] = { factsCount: 0, targetsCount: 0, charVolume: 0, confidenceSum: 0 };
      }
      categoryAgg[cat].targetsCount += 1;
    });

    const totalFacts = memories.length || 1;

    return Object.entries(categoryAgg)
      .map(([catKey, agg]) => {
        const meta = CATEGORY_META[catKey] || {
          label: catKey.charAt(0).toUpperCase() + catKey.slice(1).replace('_', ' '),
          color: '#38bdf8',
        };
        const avgConfidence = agg.factsCount > 0 ? Math.round(agg.confidenceSum / agg.factsCount) : 100;
        const densityScore = Math.round((agg.factsCount / totalFacts) * 100);

        return {
          name: meta.label,
          categoryKey: catKey,
          factsCount: agg.factsCount,
          targetsCount: agg.targetsCount,
          charVolume: agg.charVolume,
          avgConfidence,
          densityScore, // Percentage of core memory
          color: meta.color,
          densityKb: (agg.charVolume / 1024).toFixed(1),
        };
      })
      .filter((item) => item.factsCount > 0 || item.targetsCount > 0 || ['work', 'personal', 'learning', 'routine'].includes(item.categoryKey))
      .sort((a, b) => b.factsCount - a.factsCount);
  }, [memories, targets]);

  // Memory Growth & Source Distribution Trends
  const memoryTrendsData = useMemo(() => {
    let permanentCount = 0;
    let userStatedCount = 0;
    let inferredCount = 0;

    memories.forEach((m) => {
      if (m.pinned || m.updatedAt?.toLowerCase().includes('core') || m.updatedAt?.toLowerCase().includes('permanent')) {
        permanentCount += 1;
      } else if (m.source === 'user_stated') {
        userStatedCount += 1;
      } else {
        inferredCount += 1;
      }
    });

    const pendingTargets = targets.filter((t) => t.status !== 'completed').length;
    const completedTargets = targets.filter((t) => t.status === 'completed').length;

    return [
      { layer: 'Core Anchors', facts: permanentCount, fill: '#06b6d4', desc: 'Creator & System Knowledge' },
      { layer: 'User Direct', facts: userStatedCount, fill: '#8b5cf6', desc: 'Direct Voice / User Inputs' },
      { layer: 'Inferred / Routine', facts: inferredCount, fill: '#10b981', desc: 'Learned Behaviors' },
      { layer: 'Active Targets', facts: pendingTargets, fill: '#f59e0b', desc: 'Ongoing User Goals' },
      { layer: 'Target Done', facts: completedTargets, fill: '#22c55e', desc: 'Completed User Targets' },
      { layer: 'Q&A Pairs', facts: qaMemories.length, fill: '#ec4899', desc: 'Realtime Google Questions' },
    ];
  }, [memories, targets, qaMemories]);

  // Analytics KPIs
  const analyticsSummary = useMemo(() => {
    const totalFacts = memories.length;
    const totalChars = memories.reduce((acc, m) => acc + (m.key?.length || 0) + (m.value?.length || 0), 0);
    const avgConfidence = totalFacts > 0 ? Math.round(memories.reduce((acc, m) => acc + (m.confidence || 95), 0) / totalFacts) : 100;
    const activeCategoriesCount = categoryDensityBarData.filter((c) => c.factsCount > 0).length;
    const completedTargets = targets.filter((t) => t.status === 'completed').length;

    return {
      totalFacts,
      totalChars,
      totalCharsKb: (totalChars / 1024).toFixed(1),
      avgConfidence,
      activeCategoriesCount,
      completedTargets,
      totalTargets: targets.length,
    };
  }, [memories, categoryDensityBarData, targets]);

  // Filtered facts for Analytics Category Knowledge Inspector
  const filteredAnalyticsFacts = useMemo(() => {
    return memories.filter((m) => {
      const matchesCat =
        selectedAnalyticsCategory === 'all' ||
        (m.category || 'other').toLowerCase() === selectedAnalyticsCategory.toLowerCase();
      const q = (analyticsSearchQuery || '').toLowerCase().trim();
      const keyStr = (m.key || '').toLowerCase();
      const valStr = (m.value || '').toLowerCase();
      const catStr = (m.category || '').toLowerCase();
      const matchesSearch = !q || keyStr.includes(q) || valStr.includes(q) || catStr.includes(q);
      return matchesCat && matchesSearch;
    });
  }, [memories, selectedAnalyticsCategory, analyticsSearchQuery]);

  const filteredMemories = useMemo(() => {
    return memories.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = (searchQuery || '').toLowerCase().trim();
      const keyStr = (item.key || '').toLowerCase();
      const valStr = (item.value || '').toLowerCase();
      const catStr = (item.category || '').toLowerCase();
      const matchesSearch = !q || keyStr.includes(q) || valStr.includes(q) || catStr.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [memories, selectedCategory, searchQuery]);

  const filteredQaMemories = useMemo(() => {
    const q = (searchQuery || qaSearchQuery || '').toLowerCase().trim();
    if (!q) return qaMemories;
    return qaMemories.filter((item) => {
      const qStr = (item.question || '').toLowerCase();
      const aStr = (item.answer || '').toLowerCase();
      const tagMatch = Array.isArray(item.tags) && item.tags.some((t) => (t || '').toLowerCase().includes(q));
      return qStr.includes(q) || aStr.includes(q) || tagMatch;
    });
  }, [qaMemories, searchQuery, qaSearchQuery]);

  const filteredGeminiCache = useMemo(() => {
    const q = (searchQuery || geminiCacheSearchQuery || '').toLowerCase().trim();
    if (!q) return geminiCacheList;
    return geminiCacheList.filter((item) => {
      const qStr = (item.query || '').toLowerCase();
      const nStr = (item.normalizedQuery || '').toLowerCase();
      const aStr = (item.answer || '').toLowerCase();
      return qStr.includes(q) || nStr.includes(q) || aStr.includes(q);
    });
  }, [geminiCacheList, searchQuery, geminiCacheSearchQuery]);

  const filteredTargets = useMemo(() => {
    let list = targets;
    if (targetFilter === 'pending') {
      list = list.filter((t) => t.status === 'pending' || t.status === 'in_progress');
    } else if (targetFilter === 'completed') {
      list = list.filter((t) => t.status === 'completed');
    }
    const q = (searchQuery || targetSearchQuery || '').toLowerCase().trim();
    if (!q) return list;
    return list.filter((t) => {
      const titleStr = (t.title || '').toLowerCase();
      const notesStr = (t.notes || '').toLowerCase();
      const catStr = (t.category || '').toLowerCase();
      return titleStr.includes(q) || notesStr.includes(q) || catStr.includes(q);
    });
  }, [targets, targetFilter, searchQuery, targetSearchQuery]);

  const targetStats = useMemo(() => {
    const total = targets.length;
    const completed = targets.filter((t) => t.status === 'completed').length;
    const pending = targets.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, rate };
  }, [targets]);

  if (!isOpen) return null;

  return (
    <div
      id="jarvis-memory-core-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="jarvis-memory-core-modal"
        className="bg-slate-900 border border-cyan-500/40 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-wide">
                  JARVIS Interactive Memory Core
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {memories.length} Active Vectors
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <InfinityIcon className="w-3 h-3 text-emerald-400" />
                  Unlimited Memory
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Persistent AI knowledge graph, target goal completion tracking & Android Kotlin bridge
              </p>
            </div>
          </div>

          <button
            id="close-memory-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL NAVIGATION TABS */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="tab-memory-vectors"
              onClick={() => setActiveTab('memories')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'memories'
                  ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Learned Vectors ({memories.length})</span>
            </button>

            <button
              id="tab-memory-targets"
              onClick={() => setActiveTab('targets')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'targets'
                  ? 'bg-amber-500/20 border border-amber-400/60 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Targets & Goals / काम पूरा हुआ या नहीं ({targets.length})</span>
            </button>

            <button
              id="tab-memory-qa"
              onClick={() => setActiveTab('qa_memory')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'qa_memory'
                  ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>Q&A Memory & Google Questions ({qaMemories.length})</span>
            </button>

            <button
              id="tab-memory-gemini-cache"
              onClick={() => setActiveTab('gemini_cache')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'gemini_cache'
                  ? 'bg-amber-500/20 border border-amber-400/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Fast Q&A Cache ({geminiCacheList.length}/10)</span>
            </button>

            <button
              id="tab-memory-kotlin"
              onClick={() => setActiveTab('kotlin')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'kotlin'
                  ? 'bg-purple-500/20 border border-purple-400/60 text-purple-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Kotlin Bridge ({KOTLIN_MODULES.length})</span>
            </button>

            <button
              id="tab-memory-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-500/25 border border-indigo-400/70 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Analytics & Density / विश्लेषण</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-toggle-unlimited-memory"
              onClick={handleToggleUnlimitedMemory}
              title="Toggle Unlimited Voice & Target Memory Engine"
              className={`text-[11px] font-semibold flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-lg cursor-pointer active:scale-95 shadow-sm border ${
                unlimitedMemoryOn
                  ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <InfinityIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unlimited Memory: {unlimitedMemoryOn ? 'ACTIVE' : 'OFF'}</span>
            </button>
            <button
              id="btn-export-memory"
              onClick={handleExportMemories}
              title="Download all saved Smart Memory item records as a JSON file backup"
              className="text-[11px] font-semibold text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-lg cursor-pointer active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{exportSuccess ? 'Exported!' : 'Export Memory'}</span>
            </button>

            <button
              onClick={handleResetDefaults}
              title="Reset memory items to defaults"
              className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* UNIFIED KEYWORD SEARCH BAR ACROSS ALL MEMORY ITEMS & Q&A PAIRS */}
        <div
          id="memory-core-search-container"
          className="px-4 sm:px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-col gap-2 shadow-inner"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="memory-core-global-search"
                type="text"
                placeholder="Search memory items & Q&A pairs by keyword (e.g., Rovin Pal, Excel, Play Store, PC speed)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setQaSearchQuery(e.target.value);
                }}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setQaSearchQuery('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Match Counters */}
            <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab('memories')}
                className={`px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
                  activeTab === 'memories'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-cyan-300'
                }`}
                title="View Memory Vectors"
              >
                Vectors ({filteredMemories.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qa_memory')}
                className={`px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
                  activeTab === 'qa_memory'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-emerald-300'
                }`}
                title="View Q&A Conversation Memory"
              >
                Q&A ({filteredQaMemories.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gemini_cache')}
                className={`px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
                  activeTab === 'gemini_cache'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-300'
                }`}
                title="View Hindi Knowledge Hub Fast Q&A Cache"
              >
                Fast Cache ({filteredGeminiCache.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-indigo-300'
                }`}
                title="View Memory Analytics & Category Density"
              >
                Analytics
              </button>
            </div>
          </div>

          {/* Quick Keyword Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] text-slate-400 scrollbar-none">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 flex-shrink-0">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Keywords:
            </span>
            {['Rovin Pal', 'Excel Shortcuts', 'PC Speed', 'Play Store', 'Health', 'Greeting'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const val = searchQuery === tag ? '' : tag;
                  setSearchQuery(val);
                  setQaSearchQuery(val);
                }}
                className={`px-2.5 py-0.5 rounded-full border text-[10px] font-medium transition-all flex-shrink-0 cursor-pointer ${
                  searchQuery.toLowerCase() === tag.toLowerCase()
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-850 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === 'memories' ? (
            <>
              {/* Category Distribution Donut Chart using Recharts */}
              <div
                id="memory-category-distribution-card"
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner"
              >
                <div className="flex-1 w-full flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <PieChartIcon className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Memory Categories Distribution
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      Recharts Donut
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Visual breakdown of vectors (Personal, Work, Health, Preferences & Routines). Tap to filter:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                    {categoryChartData.map((item) => (
                      <button
                        key={item.categoryKey}
                        type="button"
                        onClick={() =>
                          setSelectedCategory(
                            selectedCategory === item.categoryKey ? 'all' : item.categoryKey
                          )
                        }
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[11px] transition-all cursor-pointer ${
                          selectedCategory === item.categoryKey
                            ? 'border-cyan-400 bg-cyan-950/60 shadow-sm'
                            : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-300 font-medium">{item.name}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-400 text-[10px]">
                          {item.value} ({item.percentage}%)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Donut Chart Visualization */}
                <div className="w-40 h-40 flex-shrink-0 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={56}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry) => (
                          <Cell
                            key={`cell-${entry.categoryKey}`}
                            fill={entry.color}
                            stroke="#0f172a"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          border: '1px solid #1e293b',
                          borderRadius: '0.75rem',
                          fontSize: '11px',
                          color: '#f8fafc',
                        }}
                        formatter={(value: any, name: any) => [`${value} items`, `${name}`]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-bold font-mono text-cyan-300">
                      {memories.length}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">
                      Vectors
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter & Action bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search memory keys or preferences..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="py-2 px-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">All Categories</option>
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="health">Health</option>
                    <option value="preference">Preferences</option>
                    <option value="routine">Routines & Alarms</option>
                    <option value="contact_rule">Contacts</option>
                    <option value="hardware">Hardware</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-export-memory-action-bar"
                    onClick={handleExportMemories}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-cyan-500/30 text-cyan-300 hover:bg-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                    title="Export all saved Smart Memory item records as a JSON file backup"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Memory</span>
                  </button>

                  <button
                    id="btn-add-new-memory"
                    onClick={() => setIsAdding(!isAdding)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-cyan-400 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAdding ? 'Cancel' : 'Teach JARVIS'}</span>
                  </button>
                </div>
              </div>

              {/* Add Memory Form */}
              {isAdding && (
                <form
                  onSubmit={handleAddMemory}
                  className="bg-slate-800/90 border border-cyan-500/40 rounded-2xl p-4 flex flex-col gap-3 shadow-lg animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Add New Memory Vector
                    </span>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="text-xs py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                    >
                      <option value="preference">Preference</option>
                      <option value="work">Work</option>
                      <option value="health">Health</option>
                      <option value="personal">Personal Fact</option>
                      <option value="routine">Routine</option>
                      <option value="contact_rule">Contact Rule</option>
                      <option value="hardware">Hardware</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Memory Key (e.g. Preferred Language)"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      required
                      className="col-span-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="text"
                      placeholder="Memory Fact or Instruction (e.g. Speak Hindi naturally)"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      required
                      className="col-span-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 shadow"
                    >
                      Commit to Memory
                    </button>
                  </div>
                </form>
              )}

              {/* Memory List */}
              <div className="grid grid-cols-1 gap-3">
                {filteredMemories.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-4 border transition-all ${
                      item.pinned
                        ? 'bg-slate-850/90 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-xs font-bold text-white tracking-wide">
                            {item.key}
                          </span>

                          <span
                            className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md border ${
                              item.category === 'preference'
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                                : item.category === 'work'
                                ? 'bg-blue-950 text-blue-300 border-blue-500/30'
                                : item.category === 'health'
                                ? 'bg-rose-950 text-rose-300 border-rose-500/30'
                                : item.category === 'routine'
                                ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                                : item.category === 'hardware'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                                : 'bg-purple-950 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            {item.category.replace('_', ' ')}
                          </span>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.confidence}% confidence
                          </span>

                          {item.pinned && (
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                              PINNED
                            </span>
                          )}
                        </div>

                        {editingId === item.id ? (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-400 text-xs text-white"
                            />
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-300 leading-relaxed">{item.value}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleTogglePin(item.id)}
                          title={item.pinned ? 'Unpin' : 'Pin to core memory'}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            item.pinned
                              ? 'text-cyan-400 bg-cyan-950/80 hover:bg-cyan-900'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(item)}
                          title="Edit memory value"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-700 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMemory(item.id)}
                          title="Delete memory"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : activeTab === 'qa_memory' ? (
            /* QA CONVERSATION MEMORY TAB */
            <div className="space-y-5 animate-fade-in">
              {/* Informational Callout */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-cyan-950/40 border border-emerald-500/40 flex items-start gap-3 shadow-md">
                <HelpCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">
                      Google-Style Questions & Answers Memory Bank:
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      Persistent History
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">
                    जैसे गूगल पर कोई भी सवाल पूछने पर तुरंत जवाब मिलता है, ठीक वैसे ही JARVIS आपके द्वारा पूछे गए सभी प्रश्नों और दिए गए उत्तरों को मेमोरी में सहेज कर रखता है। आप कभी भी पूछ सकते हैं: <span className="text-cyan-300 font-mono">"मैंने पहले क्या पूछा था?"</span> या <span className="text-cyan-300 font-mono">"पहले किस क्वेश्चन पर बात हुई थी?"</span> और JARVIS तुरंत याद दिला देगा।
                  </p>
                </div>
              </div>

              {/* QA Search and Action Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search previous questions, topics, or answers to find & delete..."
                    value={qaSearchQuery}
                    onChange={(e) => setQaSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 transition-all shadow-inner"
                  />
                  {qaSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setQaSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Clear search query"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline mr-1">
                    Showing {filteredQaMemories.length} of {qaMemories.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleExportMemories}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Memory</span>
                  </button>

                  {qaMemories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Clear all stored conversation questions and answers?')) {
                          clearQaMemories();
                          setQaMemories([]);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Q&A</span>
                    </button>
                  )}
                </div>
              </div>

              {/* QA Items List */}
              <div className="space-y-3">
                {filteredQaMemories.map((qaItem) => (
                    <div
                      key={qaItem.id}
                      className="rounded-2xl bg-slate-850/90 border border-slate-750 p-4 space-y-3 shadow-md hover:border-slate-650 transition-all"
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 flex-shrink-0 mt-0.5">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                                Question Asked
                              </span>
                              {qaItem.topic && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {qaItem.topic}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">
                                {qaItem.timestamp} • {qaItem.date}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-white leading-relaxed">
                              "{qaItem.question}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `Q: ${qaItem.question}\nA: ${qaItem.answer}`
                              );
                              setCopiedSnippetId(qaItem.id);
                              setTimeout(() => setCopiedSnippetId(null), 2000);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-750 transition-colors cursor-pointer"
                            title="Copy Question & Answer"
                          >
                            {copiedSnippetId === qaItem.id ? (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteQaMemory(qaItem.id);
                              setQaMemories((prev) => prev.filter((item) => item.id !== qaItem.id));
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete this query from QA memory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Answer Body */}
                      <div className="ml-9 p-3 rounded-xl bg-slate-900/90 border border-cyan-500/25 flex items-start gap-2.5">
                        <Bot className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          {qaItem.answer}
                        </p>
                      </div>
                    </div>
                  ))}

                {filteredQaMemories.length === 0 && qaMemories.length > 0 && (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl space-y-2">
                    <Search className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-300">
                      No Q&A records matching "{searchQuery || qaSearchQuery}"
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Try searching another keyword (e.g., "Excel", "Rovin", "Play Store") or clear the search query.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setQaSearchQuery('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-cyan-300 text-xs font-semibold hover:bg-slate-750 transition-colors"
                    >
                      Clear Search
                    </button>
                  </div>
                )}

                {qaMemories.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl space-y-2">
                    <MessageSquareQuote className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-300">
                      No question records in memory yet
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Ask JARVIS any question via voice or text. Every question and answer is automatically indexed into long-term memory just like Google!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'targets' ? (
            /* TARGETS & GOALS TRACKER TAB (काम पूरा हुआ या नहीं) */
            <div className="space-y-5 animate-fade-in">
              {/* Header Overview Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-orange-950/40 border border-amber-500/40 shadow-lg space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 flex-shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                      <Target className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">
                          लाइव टारगेट एवं टास्क ट्रैकर (काम पूरा हुआ या नहीं)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
                          Live Voice Tracker
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <InfinityIcon className="w-3 h-3 text-emerald-400" />
                          Unlimited Storage
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        आप बोलकर या टाइप करके जो भी टारगेट देंगे, JARVIS उसे याद रखेगा और ट्रैक करेगा कि <span className="text-amber-300 font-semibold">काम पूरा हुआ या बाकी है</span>। कभी भी बोलें: <span className="text-cyan-300 font-mono">"टारगेट पूरा हुआ या नहीं"</span> या <span className="text-cyan-300 font-mono">"काम पूरा हो गया"</span>।
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingTarget((prev) => !prev)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ml-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingTarget ? 'फॉर्म बंद करें' : '+ नया टारगेट जोड़ें'}</span>
                  </button>
                </div>

                {/* Live Target Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-amber-500/20">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">कुल टारगेट (Total)</span>
                    <span className="text-base font-bold text-white">{targetStats.total}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center">
                    <span className="text-[10px] text-amber-300/80 block font-medium">⏳ बाकी काम (Pending)</span>
                    <span className="text-base font-bold text-amber-400">{targetStats.pending}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                    <span className="text-[10px] text-emerald-300/80 block font-medium">✅ काम पूरा हुआ (Done)</span>
                    <span className="text-base font-bold text-emerald-400">{targetStats.completed}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center">
                    <span className="text-[10px] text-cyan-300/80 block font-medium">सफलता दर (Rate)</span>
                    <span className="text-base font-bold text-cyan-300">{targetStats.rate}%</span>
                  </div>
                </div>
              </div>

              {/* Add Target Collapsible Form */}
              {isAddingTarget && (
                <form
                  onSubmit={handleCreateTarget}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/40 shadow-md space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      नया टारगेट / टास्क दर्ज करें
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingTarget(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-medium">
                      टारगेट का नाम / विवरण (Target Description) *
                    </label>
                    <input
                      type="text"
                      value={newTargetTitle}
                      onChange={(e) => setNewTargetTitle(e.target.value)}
                      placeholder="उदा. Excel रिपोर्ट फाइनल करना, शाम 5 बजे क्लाइंट मीटिंग, 100 पुशअप..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1 font-medium">
                        कैटेगरी (Category)
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(['work', 'personal', 'daily', 'fitness', 'learning'] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setNewTargetCategory(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize transition-colors ${
                              newTargetCategory === cat
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {cat === 'work' ? 'काम (Work)' : cat === 'fitness' ? 'फिटनेस (Fitness)' : cat === 'daily' ? 'दैनिक (Daily)' : cat === 'learning' ? 'सीखना (Skill)' : 'व्यक्तिगत (Personal)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1 font-medium">
                        डेडलाइन / समय (Optional Due Date)
                      </label>
                      <input
                        type="text"
                        value={newTargetDueDate}
                        onChange={(e) => setNewTargetDueDate(e.target.value)}
                        placeholder="उदा. आज शाम 6:00 बजे / कल सुबह तक"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-medium">
                      अतिरिक्त नोट्स (Notes / Key Points)
                    </label>
                    <input
                      type="text"
                      value={newTargetNotes}
                      onChange={(e) => setNewTargetNotes(e.target.value)}
                      placeholder="उदा. महत्वपूर्ण फॉर्मूला चेक करना, फाइल अटैच करना..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingTarget(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      रद्द करें
                    </button>
                    <button
                      type="submit"
                      disabled={!newTargetTitle.trim()}
                      className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      टारगेट सेव करें (Save Target)
                    </button>
                  </div>
                </form>
              )}

              {/* Filter Pills & Search Bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setTargetFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                      targetFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    सभी ({targetStats.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetFilter('pending')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      targetFilter === 'pending'
                        ? 'bg-amber-500/20 border border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>बाकी काम ({targetStats.pending})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetFilter('completed')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      targetFilter === 'completed'
                        ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>काम पूरा हुआ ({targetStats.completed})</span>
                  </button>
                </div>

                <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={targetSearchQuery}
                    onChange={(e) => setTargetSearchQuery(e.target.value)}
                    placeholder="टारगेट खोजें (Search target)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Targets List */}
              <div className="space-y-2.5">
                {filteredTargets.map((target) => {
                  const isCompleted = target.status === 'completed';
                  return (
                    <div
                      key={target.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                          : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 shadow-sm'
                      }`}
                    >
                      {/* Left: Interactive Status Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleTargetStatus(target.id)}
                        title={isCompleted ? 'मार्क बाकी करें (Click to mark Pending)' : 'मार्क पूरा करें (Click to mark Completed)'}
                        className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer flex-shrink-0 active:scale-90 border ${
                          isCompleted
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                            : 'bg-slate-950 text-slate-500 border-slate-700 hover:border-amber-400 hover:text-amber-300'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Clock className="w-3.5 h-3.5" />}
                      </button>

                      {/* Middle: Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-xs font-semibold leading-snug transition-colors ${
                              isCompleted
                                ? 'line-through text-slate-400'
                                : 'text-white'
                            }`}
                          >
                            {target.title}
                          </h4>

                          {/* Status Badge */}
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${
                              isCompleted
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                : 'bg-amber-950 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {isCompleted ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                काम पूरा हुआ ✅
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-400" />
                                काम बाकी है ⏳
                              </>
                            )}
                          </span>

                          {/* Category Badge */}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 capitalize font-medium">
                            {target.category || 'work'}
                          </span>
                        </div>

                        {target.notes && (
                          <p className="text-[11px] text-slate-300 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/80 leading-relaxed">
                            {target.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap pt-0.5">
                          <span>
                            बनाया गया:{' '}
                            {new Date(target.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {target.completedAt && (
                            <span className="text-emerald-300">
                              पूरा हुआ:{' '}
                              {new Date(target.completedAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}

                          {target.dueDate && (
                            <span className="text-amber-300 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              डेडलाइन: {target.dueDate}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleTargetStatus(target.id)}
                          className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                            isCompleted
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                              : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {isCompleted ? 'Pending करें' : 'पूरा मार्क करें'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTargetItem(target.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="डिलीट करें (Delete Target)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredTargets.length === 0 && targets.length > 0 && (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl space-y-2">
                    <Search className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-300">
                      इस फिल्टर में कोई टारगेट नहीं मिला
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetFilter('all');
                        setTargetSearchQuery('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-amber-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                    >
                      सभी टारगेट देखें
                    </button>
                  </div>
                )}

                {targets.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl space-y-3">
                    <Target className="w-10 h-10 text-slate-600 mx-auto" />
                    <div>
                      <p className="text-xs font-medium text-slate-300">
                        वर्तमान में कोई टारगेट सेव नहीं है
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-0.5">
                        JARVIS को बोलकर बताएं जैसे: "मेरा टारगेट है आज रिपोर्ट पूरा करना", या नीचे दिए गए क्विक बटन से जोड़ें:
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          saveTarget('Master Excel All Shortcuts and Workflow Tips', { category: 'learning' });
                          setTargets(getStoredTargets());
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs text-amber-300 font-semibold"
                      >
                        + Excel Shortcuts Target
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          saveTarget('Daily PC Fast Window Snapping & Hotkeys Review', { category: 'work' });
                          setTargets(getStoredTargets());
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-300 font-semibold"
                      >
                        + Daily Work Goal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'kotlin' ? (
            /* KOTLIN NATIVE INTEGRATION TAB */
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-purple-200">
                  <span className="font-bold text-white">Native Android Kotlin Architecture:</span>{' '}
                  This assistant exposes an Android IPC & Intent layer enabling direct Telecom calls,
                  CameraManager hardware torch access, and Room DB vector memory persistence for full
                  unrestricted device autonomy.
                </div>
              </div>

              <div className="space-y-4">
                {KOTLIN_MODULES.map((mod) => (
                  <div
                    key={mod.id}
                    className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-3 shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs font-bold text-white">{mod.title}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          {mod.status.toUpperCase()}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopySnippet(mod.kotlinSnippet, mod.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                      >
                        {copiedSnippetId === mod.id ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy Kotlin</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400">{mod.description}</p>

                    <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-3 overflow-x-auto font-mono text-[11px] text-slate-300 leading-relaxed">
                      <pre>{mod.kotlinSnippet}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'analytics' ? (
            /* DEDICATED ANALYTICS & TRENDS VIEW TAB */
            <div id="memory-analytics-view" className="space-y-6">
              {/* Header Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/40 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center flex-shrink-0 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Memory Core Analytics & Density Insights
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Room Vector Engine
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Visualizing memory density per category, byte/character storage volume, and growth patterns of learned facts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedAnalyticsCategory('all');
                      setAnalyticsSearchQuery('');
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3 h-3 text-cyan-400" />
                    <span>Reset Filters</span>
                  </button>
                  <button
                    onClick={handleExportMemories}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3 h-3 text-indigo-400" />
                    <span>Export Analytics JSON</span>
                  </button>
                </div>
              </div>

              {/* KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Total Facts */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span className="text-[11px] font-medium">Stored Facts</span>
                    <Database className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-xl font-bold text-white font-mono">{analyticsSummary.totalFacts}</div>
                  <div className="text-[10px] text-cyan-400/90 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{memories.filter((m) => m.pinned).length} Pinned Core Anchors</span>
                  </div>
                </div>

                {/* Storage Density */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span className="text-[11px] font-medium">Knowledge Density</span>
                    <HardDrive className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-xl font-bold text-white font-mono">{analyticsSummary.totalCharsKb} KB</div>
                  <div className="text-[10px] text-indigo-400/90 mt-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>{analyticsSummary.totalChars.toLocaleString()} characters</span>
                  </div>
                </div>

                {/* Categories Breadth */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 relative overflow-hidden group hover:border-purple-500/40 transition-all">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span className="text-[11px] font-medium">Category Breadth</span>
                    <Layers className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xl font-bold text-white font-mono">{analyticsSummary.activeCategoriesCount} Active</div>
                  <div className="text-[10px] text-purple-400/90 mt-1 flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Multi-domain taxonomy</span>
                  </div>
                </div>

                {/* Average Vector Confidence */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span className="text-[11px] font-medium">Avg Vector Confidence</span>
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-white font-mono">{analyticsSummary.avgConfidence}%</div>
                  <div className="text-[10px] text-emerald-400/90 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>High fidelity recall</span>
                  </div>
                </div>

                {/* Targets & Goals */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 relative overflow-hidden group hover:border-amber-500/40 transition-all col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span className="text-[11px] font-medium">Goals Completed</span>
                    <Target className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {analyticsSummary.completedTargets}/{analyticsSummary.totalTargets}
                  </div>
                  <div className="text-[10px] text-amber-400/90 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{targets.length ? `${Math.round((analyticsSummary.completedTargets / targets.length) * 100)}% completion` : 'No targets yet'}</span>
                  </div>
                </div>
              </div>

              {/* MAIN RECHARTS BAR CHART: Memory Density Per Category */}
              <div
                id="memory-density-barchart-card"
                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      <span>Memory Density Per Category (श्रेणीवार मेमोरी घनत्व)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Visualizing fact distribution, storage footprint, and average vector confidence across domains. Click any bar to inspect facts.
                    </p>
                  </div>

                  {/* Metric Switcher */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setAnalyticsMetric('factsCount')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        analyticsMetric === 'factsCount'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Facts Count
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsMetric('charVolume')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        analyticsMetric === 'charVolume'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Characters (Volume)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsMetric('avgConfidence')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        analyticsMetric === 'avgConfidence'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Confidence %
                    </button>
                  </div>
                </div>

                {/* Recharts BarChart */}
                <div className="w-full h-80 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryDensityBarData}
                      margin={{ top: 20, right: 20, left: -10, bottom: 40 }}
                      onClick={(state: any) => {
                        if (state && state.activePayload && state.activePayload.length > 0) {
                          const payload = state.activePayload[0].payload;
                          if (payload && payload.categoryKey) {
                            setSelectedAnalyticsCategory(
                              selectedAnalyticsCategory === payload.categoryKey ? 'all' : payload.categoryKey
                            );
                          }
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                        height={45}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={(value) => {
                          if (analyticsMetric === 'charVolume') {
                            return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
                          }
                          if (analyticsMetric === 'avgConfidence') {
                            return `${value}%`;
                          }
                          return `${value}`;
                        }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-indigo-500/50 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[200px]">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full inline-block"
                                    style={{ backgroundColor: data.color }}
                                  />
                                  {data.name}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {data.densityScore}% core
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>Stored Facts:</span>
                                <span className="font-bold text-white font-mono">{data.factsCount}</span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>Knowledge Volume:</span>
                                <span className="font-bold text-indigo-300 font-mono">
                                  {data.charVolume} chars ({data.densityKb} KB)
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>Avg Confidence:</span>
                                <span className="font-bold text-emerald-400 font-mono">{data.avgConfidence}%</span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>Associated Goals:</span>
                                <span className="font-bold text-amber-400 font-mono">{data.targetsCount}</span>
                              </div>
                              <div className="pt-1 border-t border-slate-800 text-[10px] text-indigo-300 italic">
                                Click bar to filter facts below
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey={analyticsMetric}
                        name={
                          analyticsMetric === 'factsCount'
                            ? 'Facts Count'
                            : analyticsMetric === 'charVolume'
                            ? 'Characters (Volume)'
                            : 'Confidence %'
                        }
                        radius={[6, 6, 0, 0]}
                        animationDuration={600}
                      >
                        {categoryDensityBarData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            opacity={
                              selectedAnalyticsCategory === 'all' ||
                              selectedAnalyticsCategory === entry.categoryKey
                                ? 1
                                : 0.35
                            }
                            stroke={
                              selectedAnalyticsCategory === entry.categoryKey ? '#ffffff' : 'none'
                            }
                            strokeWidth={2}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Density Pills Under Chart */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 flex-shrink-0">
                    <Filter className="w-3 h-3 text-indigo-400" />
                    Density Share:
                  </span>
                  {categoryDensityBarData.map((cat) => (
                    <button
                      key={cat.categoryKey}
                      type="button"
                      onClick={() =>
                        setSelectedAnalyticsCategory(
                          selectedAnalyticsCategory === cat.categoryKey ? 'all' : cat.categoryKey
                        )
                      }
                      className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                        selectedAnalyticsCategory === cat.categoryKey
                          ? 'bg-slate-800 border-white text-white shadow'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium">{cat.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        ({cat.factsCount} facts • {cat.densityScore}%)
                      </span>
                    </button>
                  ))}
                  {selectedAnalyticsCategory !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedAnalyticsCategory('all')}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-500/30 transition-colors"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>

              {/* SECONDARY VISUAL: Memory Usage Trends & Architecture Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Memory Layer Breakdown Cards */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>Memory Storage Trend Layers & Provenance</span>
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Tiered Storage
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {memoryTrendsData.map((layer) => {
                      const totalSum =
                        memories.length + targets.length + qaMemories.length || 1;
                      const percentage = Math.round((layer.facts / totalSum) * 100);
                      return (
                        <div
                          key={layer.layer}
                          className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/70 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: layer.fill }}
                              />
                              <span className="font-semibold text-white">{layer.layer}</span>
                              <span className="text-[10px] text-slate-400 hidden sm:inline">
                                ({layer.desc})
                              </span>
                            </div>
                            <div className="font-mono text-xs">
                              <span className="text-white font-bold">{layer.facts} items</span>
                              <span className="text-slate-400 text-[10px] ml-1.5">({percentage}%)</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(percentage, 3)}%`,
                                backgroundColor: layer.fill,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Storage Health & Retention Telemetry */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span>Persistence Architecture & Retention</span>
                      </h4>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                        Encrypted
                      </span>
                    </div>

                    <div className="space-y-3 text-xs text-slate-300">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <Cpu className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-white">Unlimited Engine Status: Active</div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Local storage vector caching with Room DB bridge ensures unbounded fact retention across browser restarts and offline states.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <Brain className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-white">Semantic Categorization Accuracy</div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Facts are dynamically indexed into work, personal, learning, fitness, and daily domains with confidence scoring up to 100%.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <Target className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-white">Automated Task & Target Synchronizer</div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Voice instructions containing targets ("yad rakhna kam pura hua ya nahi") are parsed into tracked targets with real-time analytics.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Active Storage Format: UTF-8 JSON / Room Entity</span>
                    <button
                      onClick={() => setActiveTab('targets')}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <span>Manage Targets</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CATEGORY KNOWLEDGE FACT INSPECTOR */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <span>
                        Category Knowledge Inspector: {selectedAnalyticsCategory === 'all' ? 'All Stored Facts' : `${CATEGORY_META[selectedAnalyticsCategory]?.label || selectedAnalyticsCategory} Facts`}
                      </span>
                      <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/40">
                        {filteredAnalyticsFacts.length}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Inspect granular facts and knowledge density records stored within this category.
                    </p>
                  </div>

                  {/* Search inside Analytics view */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter category facts..."
                      value={analyticsSearchQuery}
                      onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    {analyticsSearchQuery && (
                      <button
                        onClick={() => setAnalyticsSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Facts List / Cards */}
                {filteredAnalyticsFacts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {filteredAnalyticsFacts.map((fact) => {
                      const meta = CATEGORY_META[fact.category || 'other'] || {
                        label: fact.category || 'Other',
                        color: '#64748b',
                      };
                      return (
                        <div
                          key={fact.id}
                          className="bg-slate-900/80 border border-slate-800/90 hover:border-indigo-500/50 rounded-xl p-3.5 space-y-2 transition-all shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: meta.color }}
                              />
                              <h5 className="text-xs font-bold text-white line-clamp-1">{fact.key}</h5>
                            </div>
                            <span
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md flex-shrink-0"
                              style={{
                                backgroundColor: `${meta.color}20`,
                                color: meta.color,
                                border: `1px solid ${meta.color}40`,
                              }}
                            >
                              {meta.label}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                            {fact.value}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-850">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                                <Award className="w-3 h-3" />
                                {fact.confidence}% confidence
                              </span>
                              <span>•</span>
                              <span className="text-slate-400">{fact.updatedAt || 'Permanent'}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`${fact.key}: ${fact.value}`);
                              }}
                              className="text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Copy fact"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-900/40 rounded-xl border border-slate-800/60">
                    <p className="text-xs text-slate-400">
                      No facts found matching category "{selectedAnalyticsCategory}" and query "{analyticsSearchQuery}".
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAnalyticsCategory('all');
                        setAnalyticsSearchQuery('');
                      }}
                      className="mt-2 text-xs text-indigo-400 hover:underline"
                    >
                      Clear search & view all categories
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'gemini_cache' ? (
            /* DEDICATED HINDI KNOWLEDGE HUB FAST CACHE TAB */
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/20 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 flex-shrink-0 mt-0.5 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Hindi Knowledge Hub • Google Gemini Fast Q&A Cache
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {geminiCacheList.length}/10 Stored
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        24h TTL Auto-Purge
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Stores the last 10 common user questions and Gemini-provided responses for instant 0ms replies. Items older than 24 hours are automatically purged to guarantee replies stay fresh.
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      const fresh = purgeExpiredGeminiCache();
                      setGeminiCacheList(fresh);
                      setCacheNotice('Purged all cache items exceeding the 24-hour TTL window.');
                      setTimeout(() => setCacheNotice(null), 3500);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                    title="Purge items exceeding the 24-hour TTL window"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Purge Expired (&gt;24h)</span>
                  </button>

                  {geminiCacheList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Clear all stored Fast Q&A Cache items from Hindi Knowledge Hub?')) {
                          clearGeminiCache();
                          setGeminiCacheList([]);
                          setCacheNotice('Cleared all fast cache entries.');
                          setTimeout(() => setCacheNotice(null), 3000);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Cache</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notification Toast */}
              {cacheNotice && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-2 animate-fade-in shadow-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{cacheNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCacheNotice(null)}
                    className="text-emerald-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Cache Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search cached questions, normalized keywords, or Gemini answers..."
                    value={geminiCacheSearchQuery}
                    onChange={(e) => setGeminiCacheSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-all shadow-inner"
                  />
                  {geminiCacheSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setGeminiCacheSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono self-end sm:self-center">
                  <span>Showing {filteredGeminiCache.length} of {geminiCacheList.length}</span>
                </div>
              </div>

              {/* Cached Items List */}
              <div className="space-y-3">
                {filteredGeminiCache.map((item, idx) => {
                  const remainingMs = getGeminiCacheItemRemainingTtlMs(item);
                  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
                  const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                  const isNearExpiry = remainingHours < 2;

                  return (
                    <div
                      key={`${item.normalizedQuery}-${item.timestamp}-${idx}`}
                      className="rounded-2xl bg-slate-850/90 border border-amber-500/25 p-4 space-y-3 shadow-md hover:border-amber-500/50 transition-all group"
                    >
                      {/* Query Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 flex-shrink-0 mt-0.5">
                            <Zap className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                                Cache Slot #{idx + 1}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                                  isNearExpiry
                                    ? 'bg-rose-950/70 text-rose-300 border-rose-500/30'
                                    : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                Expires in {remainingHours}h {remainingMins}m
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Saved {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                              "{item.query}"
                            </p>

                            <div className="mt-1 text-[11px] text-slate-400 font-mono flex items-center gap-1 truncate">
                              <span className="text-slate-500">Normalized Index:</span>
                              <span className="text-amber-200/90 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800">
                                {item.normalizedQuery}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`Q: ${item.query}\nA: ${item.answer}`);
                              setCopiedSnippetId(`cache-${idx}`);
                              setTimeout(() => setCopiedSnippetId(null), 2000);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-750 transition-colors cursor-pointer"
                            title="Copy Cached Question & Answer"
                          >
                            {copiedSnippetId === `cache-${idx}` ? (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteGeminiCacheEntry(item.query);
                              setGeminiCacheList((prev) => prev.filter((c) => c.normalizedQuery !== item.normalizedQuery));
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete this query from Fast Cache"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Gemini Answer Body */}
                      <div className="ml-9 p-3.5 rounded-xl bg-slate-900/95 border border-amber-500/20 space-y-1.5 shadow-inner">
                        <div className="flex items-center justify-between text-[10px] font-mono text-amber-400/90">
                          <span className="flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5 text-amber-400" />
                            Google Gemini Verified Answer
                          </span>
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Instant 0ms Replay
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {filteredGeminiCache.length === 0 && geminiCacheList.length > 0 && (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl space-y-2">
                    <Search className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-300">
                      No cached queries matching "{geminiCacheSearchQuery}"
                    </p>
                    <button
                      type="button"
                      onClick={() => setGeminiCacheSearchQuery('')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-amber-300 text-xs font-semibold hover:bg-slate-750 transition-colors"
                    >
                      Clear Search
                    </button>
                  </div>
                )}

                {geminiCacheList.length === 0 && (
                  <div className="p-10 text-center border border-dashed border-slate-800 rounded-2xl space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">No Cached Q&A Pairs Yet</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                        When you ask questions through voice or text (e.g., "black hole kya hota hai", "Bharat ke pradhan mantri", science, math, or GK), Gemini's answers are automatically cached here for 24 hours to enable instant 0ms responses without re-calling the API!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Local Persistent Vector Store • Encrypted Room Architecture</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-export-memory-footer"
              onClick={handleExportMemories}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Download memory backup JSON file"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{exportSuccess ? 'Exported JSON' : 'Export Memory'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-colors"
            >
              Close Core
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
