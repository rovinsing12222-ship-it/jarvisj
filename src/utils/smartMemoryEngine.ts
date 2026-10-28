/**
 * J.A.R.V.I.S. Smart Memory System & Personal Context Engine
 * Stores, manages, updates, and recalls user-defined memories across conversations
 * with local persistence (localStorage / Android SharedPreferences & Room DB).
 */

import { SmartMemoryItem, SmartMemoryCategory, UserTargetItem, TargetStatus } from '../types';

export const MEMORY_STORAGE_KEY = 'jarvis_smart_memories';
export const LEGACY_MEMORY_STORAGE_KEY = 'jarvis_memory_core';
export const TARGETS_STORAGE_KEY = 'jarvis_user_targets';
export const UNLIMITED_MEMORY_FLAG_KEY = 'jarvis_unlimited_memory_enabled';

export const INITIAL_DEFAULT_TARGETS: UserTargetItem[] = [
  {
    id: 'target-init-1',
    title: 'Master Excel all shortcuts and smart workflow techniques',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    notes: 'AutoSum Alt+=, Flash Fill Ctrl+E, Table Ctrl+T, Filter Ctrl+Shift+L, Format Cells Ctrl+1',
    category: 'work',
    progressPercent: 100,
  },
  {
    id: 'target-init-2',
    title: 'JARVIS All Unlimited Memory & Target Tracking System Setup',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    completedAt: new Date().toISOString(),
    notes: 'Unlimited permanent storage of user words, instructions, and target completion status',
    category: 'learning',
    progressPercent: 100,
  },
  {
    id: 'target-init-3',
    title: 'Daily productivity target & key tasks review',
    status: 'pending',
    createdAt: new Date().toISOString(),
    notes: 'Check target completion and track work status',
    category: 'daily',
    progressPercent: 50,
  },
];

const INITIAL_DEFAULT_MEMORIES: SmartMemoryItem[] = [
  {
    id: 'mem-init-1',
    key: 'name',
    value: 'Rovin Pal',
    category: 'identity',
    rawPrompt: 'My name is Rovin Pal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-init-2',
    key: 'preferred_title',
    value: 'Rovin Sir',
    category: 'identity',
    rawPrompt: 'Always address me with respect as Rovin Sir',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-init-3',
    key: 'role',
    value: 'Chief Architect & Boss of JARVIS',
    category: 'personal',
    rawPrompt: 'I am the boss and creator of JARVIS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-init-4',
    key: 'voice_preference',
    value: 'AOEDE Cute Indian Girl Voice Model',
    category: 'preference',
    rawPrompt: 'Use AOEDE sweet cute voice for responses',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-init-excel-shortcuts',
    key: 'excel_all_shortcuts',
    value: 'MS Excel All Essential Shortcuts: [Navigation]: Ctrl+Home (A1), Ctrl+End (Last cell), Ctrl+Arrow (Jump edge), Ctrl+PageDown/Up (Next/Prev Sheet). [Formatting]: Ctrl+1 (Format Cells), Ctrl+Shift+$ (Currency), Ctrl+Shift+% (Percent), Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+U (Underline). [Formulas]: Alt+= (AutoSum instant total), F4 (Cycle Absolute $A$1 / Repeat action), Ctrl+` (Show Formulas), Shift+F3 (Insert Function). [Rows & Columns]: Ctrl+Space (Select Column), Shift+Space (Select Row), Ctrl++ (Insert Row/Col), Ctrl+- (Delete Row/Col), Alt+H+O+I (Auto-fit Width), Alt+H+O+A (Auto-fit Height). [Smart Work]: Ctrl+E (Flash Fill), Ctrl+T (Create Table), Ctrl+Shift+L (Filter), Ctrl+D (Fill Down), Ctrl+R (Fill Right), Ctrl+Alt+V (Paste Special), F12 (Save As).',
    category: 'custom_instruction',
    rawPrompt: 'Excel ke all shortcut keys',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-init-excel-work-smart',
    key: 'excel_work_smart_tips',
    value: 'Excel mein fast work aur kaam kam karne ke 7 best smart tips: 1) Flash Fill (Ctrl+E) - Text split/combine kare bina formula ke. 2) AutoSum (Alt+=) - 1 second me rows & columns ka total. 3) Tables (Ctrl+T) - Auto-expanding formulas & style. 4) XLOOKUP - Modern 2-way search formula without errors. 5) Pivot Table (Alt+N+V) - Lakhon rows ka summary 2 clicks me. 6) Data Validation (Alt+A+V+V) - Dropdown list lagakar typing mistakes rokein. 7) Excel Macro (Alt+F11) - Repetitive daily work automate karein.',
    category: 'custom_instruction',
    rawPrompt: 'Excel mein work kaise karein aur kaam kam kaise karein',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-init-unlimited-engine',
    key: 'unlimited_memory_mode',
    value: 'Unlimited Memory & Target Tracker: Active (All user words, voice statements, targets, and work completion statuses tracked permanently)',
    category: 'custom_instruction',
    rawPrompt: 'All unlimited memory and target tracking',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Normalizes a key string into clean snake_case identifier
 * e.g., "Favorite Food" -> "favorite_food", "गाड़ी नंबर" -> "car_number"
 */
export function normalizeMemoryKey(keyStr: string): string {
  let cleaned = keyStr
    .toLowerCase()
    .trim()
    .replace(/^(my|mera|meri|mere|the|apna|apni)\s+/i, '')
    .replace(/\s+(is|hai|hain|tha|thi|ko|ka|ki|ke)$/i, '')
    .trim();

  // Known Hindi-English key mappings
  const keyMap: Record<string, string> = {
    naam: 'name',
    'नाम': 'name',
    'car number': 'car_number',
    'गाड़ी नंबर': 'car_number',
    'कार नंबर': 'car_number',
    'phone number': 'phone_number',
    'mobile number': 'phone_number',
    'मोबाइल नंबर': 'phone_number',
    'फोन नंबर': 'phone_number',
    birthday: 'birthday',
    'जन्मदिन': 'birthday',
    janamdin: 'birthday',
    'favorite food': 'favorite_food',
    'favourite food': 'favorite_food',
    'पसंदीदा खाना': 'favorite_food',
    khana: 'favorite_food',
    'favorite color': 'favorite_color',
    'favourite color': 'favorite_color',
    'पसंदीदा रंग': 'favorite_color',
    wifi: 'wifi_password',
    'wifi password': 'wifi_password',
    address: 'home_address',
    'home address': 'home_address',
    'पता': 'home_address',
    location: 'home_address',
    city: 'city',
    'blood group': 'blood_group',
    office: 'office_location',
    profession: 'profession',
    occupation: 'profession',
    job: 'profession',
    work: 'profession',
    school: 'school',
    college: 'college',
    email: 'email',
    hobby: 'hobby',
    title: 'preferred_title',
    excel: 'excel_all_shortcuts',
    'excel shortcut': 'excel_all_shortcuts',
    'excel shortcuts': 'excel_all_shortcuts',
    'excel shortcut key': 'excel_all_shortcuts',
    'excel shortcut keys': 'excel_all_shortcuts',
    'एक्सेल शॉर्टकट': 'excel_all_shortcuts',
    'excel work': 'excel_work_smart_tips',
    'excel tips': 'excel_work_smart_tips',
    'excel work tips': 'excel_work_smart_tips',
    'excel me kaam': 'excel_work_smart_tips',
  };

  if (keyMap[cleaned]) {
    return keyMap[cleaned];
  }

  return cleaned
    .replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Determines likely category from key or content
 */
export function inferMemoryCategory(key: string, value: string): SmartMemoryCategory {
  const lowerKey = key.toLowerCase();
  const lowerVal = value.toLowerCase();

  if (lowerKey.includes('name') || lowerKey.includes('naam') || lowerKey.includes('title')) {
    return 'identity';
  }
  if (
    lowerKey.includes('favorite') ||
    lowerKey.includes('preference') ||
    lowerKey.includes('pasand') ||
    lowerKey.includes('color') ||
    lowerKey.includes('food') ||
    lowerKey.includes('song') ||
    lowerKey.includes('music')
  ) {
    return 'preference';
  }
  if (
    lowerKey.includes('birthday') ||
    lowerKey.includes('car') ||
    lowerKey.includes('address') ||
    lowerKey.includes('city') ||
    lowerKey.includes('phone') ||
    lowerKey.includes('blood') ||
    lowerKey.includes('profession') ||
    lowerKey.includes('job') ||
    lowerKey.includes('office') ||
    lowerKey.includes('age')
  ) {
    return 'personal';
  }
  if (
    lowerVal.includes('always') ||
    lowerVal.includes('never') ||
    lowerVal.includes('call me') ||
    lowerVal.includes('rule') ||
    lowerVal.includes('instruction')
  ) {
    return 'custom_instruction';
  }
  return 'personal';
}

/**
 * Checks for sensitive information (passwords, PIN, bank details, card numbers)
 */
export function isSensitiveData(text: string): boolean {
  const lower = text.toLowerCase();
  const sensitiveKeywords = [
    'credit card',
    'debit card',
    'cvv',
    'atm pin',
    'bank account',
    'otp',
    'netbanking password',
    'secret pin',
  ];
  return sensitiveKeywords.some((kw) => lower.includes(kw));
}

/**
 * Syncs memory with native Android bridge if running inside Android WebView
 */
function syncWithAndroidBridge(action: 'save' | 'delete' | 'clear', key?: string, value?: string): void {
  if (typeof window === 'undefined') return;
  const bridge = (window as any).AndroidMemoryBridge;
  if (!bridge) return;

  try {
    if (action === 'save' && key && value !== undefined) {
      if (typeof bridge.saveMemory === 'function') {
        bridge.saveMemory(key, value);
      }
    } else if (action === 'delete' && key) {
      if (typeof bridge.deleteMemory === 'function') {
        bridge.deleteMemory(key);
      }
    } else if (action === 'clear') {
      if (typeof bridge.clearAllMemories === 'function') {
        bridge.clearAllMemories();
      }
    }
  } catch (err) {
    console.warn('[AndroidMemoryBridge] Bridge synchronization warning:', err);
  }
}

/**
 * Retrieves all stored memories from persistent storage
 */
export function getStoredMemories(): SmartMemoryItem[] {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_MEMORIES;
  try {
    const rawSmart = localStorage.getItem(MEMORY_STORAGE_KEY);
    const rawLegacy = localStorage.getItem(LEGACY_MEMORY_STORAGE_KEY);

    let parsed: SmartMemoryItem[] = [];
    if (rawSmart) {
      try {
        const arr = JSON.parse(rawSmart);
        if (Array.isArray(arr) && arr.length > 0) parsed = arr;
      } catch {}
    }

    if (parsed.length === 0 && rawLegacy) {
      try {
        const arr = JSON.parse(rawLegacy);
        if (Array.isArray(arr) && arr.length > 0) {
          parsed = arr.map((item: any) => ({
            id: item.id || `mem-${Date.now()}`,
            key: item.key || 'fact',
            value: item.value || '',
            category: item.category || 'personal',
            confidence: item.confidence,
            source: item.source || 'user_stated',
            pinned: item.pinned,
            updatedAt: item.updatedAt || new Date().toISOString(),
            createdAt: item.createdAt || new Date().toISOString(),
          }));
        }
      } catch {}
    }

    if (parsed.length > 0) {
      return parsed;
    }

    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_MEMORIES));
    localStorage.setItem(LEGACY_MEMORY_STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_MEMORIES));
    return INITIAL_DEFAULT_MEMORIES;
  } catch (err) {
    console.warn('[SmartMemory] Failed to read from localStorage:', err);
    return INITIAL_DEFAULT_MEMORIES;
  }
}

/**
 * Returns all memories (alias for getStoredMemories for standard API parity)
 */
export function getAllMemories(): SmartMemoryItem[] {
  return getStoredMemories();
}

/**
 * Internal helper to save entire memory array to persistent storage
 */
function persistMemories(memories: SmartMemoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(memories);
    localStorage.setItem(MEMORY_STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_MEMORY_STORAGE_KEY, serialized);

    window.dispatchEvent(
      new CustomEvent('jarvis:memories-updated', { detail: { memories } })
    );
    window.dispatchEvent(
      new CustomEvent('jarvis_memory_updated', { detail: memories })
    );
  } catch (err) {
    console.warn('[SmartMemory] Failed to persist memories:', err);
  }
}

/**
 * saveMemory(key, value)
 * Stores or overwrites a memory item in structured JSON format and syncs to persistence
 */
export function saveMemory(
  key: string,
  value: string,
  category?: SmartMemoryCategory,
  rawPrompt?: string
): SmartMemoryItem {
  const normKey = normalizeMemoryKey(key);
  const memories = getStoredMemories();
  const now = new Date().toISOString();
  const cat = category || inferMemoryCategory(normKey, value);

  const existingIdx = memories.findIndex(
    (m) => m.key.toLowerCase() === normKey.toLowerCase()
  );

  let updatedItem: SmartMemoryItem;

  if (existingIdx >= 0) {
    // Update existing item
    updatedItem = {
      ...memories[existingIdx],
      value: value.trim(),
      category: cat,
      rawPrompt: rawPrompt || memories[existingIdx].rawPrompt,
      updatedAt: now,
    };
    memories[existingIdx] = updatedItem;
  } else {
    // Insert new item
    updatedItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      key: normKey,
      value: value.trim(),
      category: cat,
      rawPrompt: rawPrompt || `${key}: ${value}`,
      createdAt: now,
      updatedAt: now,
    };
    memories.unshift(updatedItem);
  }

  persistMemories(memories);
  syncWithAndroidBridge('save', normKey, value.trim());
  return updatedItem;
}

/**
 * getMemory(key)
 * Standard handler function: returns string value or null
 */
export function getMemory(key: string): string | null {
  const item = getMemoryByKey(key);
  if (item) return item.value;

  // Optional fallback from Android Native bridge if in WebView
  if (typeof window !== 'undefined' && (window as any).AndroidMemoryBridge?.getMemory) {
    try {
      const nativeVal = (window as any).AndroidMemoryBridge.getMemory(normalizeMemoryKey(key));
      if (nativeVal && typeof nativeVal === 'string' && nativeVal.trim()) {
        return nativeVal.trim();
      }
    } catch {}
  }

  return null;
}

/**
 * Retrieves a single memory item object by key
 */
export function getMemoryByKey(key: string): SmartMemoryItem | null {
  const normKey = normalizeMemoryKey(key).toLowerCase();
  const memories = getStoredMemories();
  return (
    memories.find(
      (m) =>
        m.key.toLowerCase() === normKey ||
        normalizeMemoryKey(m.key).toLowerCase() === normKey
    ) || null
  );
}

/**
 * Checks if a memory key exists
 */
export function hasMemory(key: string): boolean {
  return getMemoryByKey(key) !== null;
}

/**
 * updateMemory(key, value)
 * Updates an existing memory value by key (or inserts if not found)
 */
export function updateMemory(key: string, value: string): SmartMemoryItem | null {
  const normKey = normalizeMemoryKey(key);
  const memories = getStoredMemories();
  const existingIdx = memories.findIndex(
    (m) =>
      m.key.toLowerCase() === normKey.toLowerCase() ||
      normalizeMemoryKey(m.key).toLowerCase() === normKey.toLowerCase()
  );

  if (existingIdx === -1) {
    return saveMemory(normKey, value);
  }

  const updated: SmartMemoryItem = {
    ...memories[existingIdx],
    value: value.trim(),
    updatedAt: new Date().toISOString(),
  };

  memories[existingIdx] = updated;
  persistMemories(memories);
  syncWithAndroidBridge('save', normKey, value.trim());
  return updated;
}

/**
 * deleteMemory(key)
 * Deletes a memory item by key or by ID
 */
export function deleteMemory(keyOrId: string): boolean {
  const memories = getStoredMemories();
  const normKey = normalizeMemoryKey(keyOrId).toLowerCase();

  const filtered = memories.filter(
    (m) =>
      m.id !== keyOrId &&
      m.key.toLowerCase() !== normKey &&
      normalizeMemoryKey(m.key).toLowerCase() !== normKey
  );

  if (filtered.length !== memories.length) {
    persistMemories(filtered);
    syncWithAndroidBridge('delete', normKey);
    return true;
  }
  return false;
}

/**
 * clearMemory(keyOrId)
 * Alias for deleteMemory
 */
export function clearMemory(keyOrId: string): boolean {
  return deleteMemory(keyOrId);
}

/**
 * Clears all user memories
 */
export function clearAllMemories(): void {
  persistMemories([]);
  syncWithAndroidBridge('clear');
}

/**
 * Returns the effective user name from stored memories
 * Checks: name, user_name, preferred_title, user_identity
 */
export function getEffectiveUserName(memories: SmartMemoryItem[] = getStoredMemories()): string {
  if (typeof window !== 'undefined') {
    try {
      const activeName = localStorage.getItem('jarvis_active_user_name') || localStorage.getItem('jarvis_admin_name');
      if (activeName && activeName.trim()) {
        return activeName.trim();
      }
    } catch {}
  }

  if (!memories || memories.length === 0) return 'Sir';

  // Check name key
  const nameItem = memories.find((m) => m.key.toLowerCase() === 'name' || m.key.toLowerCase() === 'user_name');
  if (nameItem && nameItem.value.trim()) {
    // Strip trailing suffixes like "(Creator & Master)"
    const raw = nameItem.value.trim().split('(')[0].trim();
    return raw || nameItem.value.trim();
  }

  // Check preferred title
  const titleItem = memories.find((m) => m.key.toLowerCase() === 'preferred_title');
  if (titleItem && titleItem.value.trim()) {
    return titleItem.value.trim();
  }

  // Check identity category
  const ident = memories.find((m) => m.category === 'identity' && m.value.trim());
  if (ident) {
    return ident.value.trim().split('(')[0].trim();
  }

  return 'Sir';
}

/**
 * Searches stored memories by keyword query
 */
export function searchMemories(query: string): SmartMemoryItem[] {
  if (!query || !query.trim()) return getStoredMemories();
  const q = query.toLowerCase().trim();
  const memories = getStoredMemories();
  return memories.filter(
    (m) =>
      m.key.toLowerCase().includes(q) ||
      m.value.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
  );
}

/**
 * Formats all memories as structured Markdown lines for Gemini System Prompt injection
 */
export function formatMemoriesForPrompt(memories: SmartMemoryItem[] = getStoredMemories()): string {
  if (!memories || memories.length === 0) return '';
  return memories
    .map((m) => `• [${m.category.toUpperCase()}] ${m.key}: ${m.value}`)
    .join('\n');
}

/**
 * Exports all memories as formatted JSON string
 */
export function exportMemoriesAsJson(): string {
  const smartMemoryItems = getStoredMemories();
  const qaMemories = getStoredQaMemories();
  const targets = getStoredTargets();
  const unlimitedMemory = isUnlimitedMemoryActive();
  return JSON.stringify(
    {
      backupTitle: 'J.A.R.V.I.S. Smart Memory & Unlimited Target Backup',
      exportDate: new Date().toISOString(),
      creator: 'Rovin Pal',
      unlimitedMemoryActive: unlimitedMemory,
      totalSmartMemoryItems: smartMemoryItems.length,
      totalQaRecords: qaMemories.length,
      totalTargets: targets.length,
      smartMemoryItems,
      memories: smartMemoryItems,
      qaMemories,
      targets,
    },
    null,
    2
  );
}

/**
 * Imports memories from JSON string
 */
export function importMemoriesFromJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      persistMemories(parsed);
      return true;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.smartMemoryItems)) {
        persistMemories(parsed.smartMemoryItems);
      } else if (Array.isArray(parsed.memories)) {
        persistMemories(parsed.memories);
      }
      if (Array.isArray(parsed.targets)) {
        persistTargets(parsed.targets);
      }
      if (Array.isArray(parsed.qaMemories) && typeof window !== 'undefined') {
        try {
          localStorage.setItem(QA_MEMORY_STORAGE_KEY, JSON.stringify(parsed.qaMemories));
        } catch {}
      }
      if (parsed.unlimitedMemoryActive !== undefined) {
        setUnlimitedMemoryActive(Boolean(parsed.unlimitedMemoryActive));
      }
      return true;
    }
  } catch {}
  return false;
}

export interface QaMemoryRecord {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  date: string;
  topic?: string;
}

export const QA_MEMORY_STORAGE_KEY = 'jarvis_qa_memory';

export const INITIAL_DEFAULT_QA: QaMemoryRecord[] = [
  {
    id: 'qa-init-1',
    question: 'Excel ke all shortcut keys aur smart work tips batao',
    answer: 'AutoSum: Alt+=, Flash Fill: Ctrl+E, Table: Ctrl+T, Filter: Ctrl+Shift+L, Format Cells: Ctrl+1, Lock: F4. Inse aapka ghanton ka kaam minutes mein hoga!',
    timestamp: '10:15 AM',
    date: new Date().toISOString().slice(0, 10),
    topic: 'Excel Productivity',
  },
  {
    id: 'qa-init-2',
    question: 'PC laptop par fast speed se work kaise karein?',
    answer: 'Win+Arrows split window, Alt+Tab instant app switch, Win+V clipboard history, Win+Shift+S snipping screenshot, Win+R run commands.',
    timestamp: '09:40 AM',
    date: new Date().toISOString().slice(0, 10),
    topic: 'PC Speed',
  },
  {
    id: 'qa-init-3',
    question: 'Rovin Pal ka JARVIS mein kya role hai?',
    answer: 'Rovin Pal ji JARVIS AI ke Creator, Chief Architect, Master aur Primary User hain.',
    timestamp: 'Yesterday',
    date: new Date().toISOString().slice(0, 10),
    topic: 'Identity',
  },
];

/**
 * Retrieves all stored Q&A conversation memory records (unlimited storage)
 */
export function getStoredQaMemories(): QaMemoryRecord[] {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_QA;
  try {
    const raw = localStorage.getItem(QA_MEMORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_DEFAULT_QA;
}

/**
 * Stores a question and answer into persistent JARVIS unlimited memory
 */
export function saveQaMemory(question: string, answer: string, topic?: string): QaMemoryRecord {
  const qClean = question.trim();
  const aClean = answer.trim();
  const list = getStoredQaMemories();
  const now = new Date();
  const record: QaMemoryRecord = {
    id: `qa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    question: qClean,
    answer: aClean,
    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: now.toISOString().slice(0, 10),
    topic: topic || 'General Q&A',
  };

  // Unlimited memory store: retains up to 10,000 conversational interactions
  const updated = [record, ...list.slice(0, 9999)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(QA_MEMORY_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('jarvis_qa_memory_updated', { detail: updated }));
    } catch (e) {
      console.warn('Failed to save QA memory to localStorage', e);
    }
  }
  return record;
}

/**
 * Clears all stored Q&A memories
 */
export function clearQaMemories(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(QA_MEMORY_STORAGE_KEY, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('jarvis_qa_memory_updated', { detail: [] }));
    } catch {}
  }
}

/**
 * Deletes a single Q&A memory record by ID
 */
export function deleteQaMemory(id: string): void {
  if (!id) return;
  const list = getStoredQaMemories();
  const updated = list.filter((item) => item.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(QA_MEMORY_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('jarvis_qa_memory_updated', { detail: updated }));
    } catch (e) {
      console.warn('Failed to delete QA memory item', e);
    }
  }
}

/**
 * Unlimited Memory Mode State
 */
export function isUnlimitedMemoryActive(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(UNLIMITED_MEMORY_FLAG_KEY);
    return val === null || val === 'true'; // Enabled by default
  } catch {
    return true;
  }
}

export function setUnlimitedMemoryActive(active: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(UNLIMITED_MEMORY_FLAG_KEY, active ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('jarvis_unlimited_memory_changed', { detail: { active } }));
  } catch {}
}

/**
 * Retrieves all stored user targets and task goals
 */
export function getStoredTargets(): UserTargetItem[] {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_TARGETS;
  try {
    const raw = localStorage.getItem(TARGETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // initialize defaults
    localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_TARGETS));
    return INITIAL_DEFAULT_TARGETS;
  } catch {
    return INITIAL_DEFAULT_TARGETS;
  }
}

export function persistTargets(targets: UserTargetItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(targets));
    window.dispatchEvent(new CustomEvent('jarvis_targets_updated', { detail: targets }));
    window.dispatchEvent(new CustomEvent('jarvis:targets-updated', { detail: targets }));
  } catch (err) {
    console.warn('[SmartMemory] Failed to persist targets:', err);
  }
}

export function saveTarget(
  title: string,
  options?: {
    dueDate?: string;
    notes?: string;
    category?: 'work' | 'personal' | 'fitness' | 'learning' | 'daily' | 'other';
    progressPercent?: number;
  }
): UserTargetItem {
  const cleanTitle = title.trim();
  const targets = getStoredTargets();
  const now = new Date().toISOString();
  const newTarget: UserTargetItem = {
    id: `target-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: cleanTitle,
    status: 'pending',
    createdAt: now,
    dueDate: options?.dueDate,
    notes: options?.notes,
    category: options?.category || 'work',
    progressPercent: options?.progressPercent || 0,
  };

  const updated = [newTarget, ...targets];
  persistTargets(updated);
  return newTarget;
}

export function completeTarget(identifier?: string): UserTargetItem | null {
  const targets = getStoredTargets();
  if (targets.length === 0) return null;

  let targetIndex = -1;
  if (identifier && identifier.trim()) {
    const clean = identifier.toLowerCase().trim();
    targetIndex = targets.findIndex(
      (t) => t.id === identifier || t.title.toLowerCase().includes(clean)
    );
  }

  // If no match found or identifier was generic, complete the first pending target
  if (targetIndex === -1) {
    targetIndex = targets.findIndex((t) => t.status === 'pending' || t.status === 'in_progress');
  }

  if (targetIndex === -1) {
    // If all are already completed, return the latest completed
    return targets[0] || null;
  }

  const updatedTarget: UserTargetItem = {
    ...targets[targetIndex],
    status: 'completed',
    completedAt: new Date().toISOString(),
    progressPercent: 100,
  };

  targets[targetIndex] = updatedTarget;
  persistTargets(targets);
  return updatedTarget;
}

export function updateTargetStatus(
  id: string,
  status: TargetStatus,
  progressPercent?: number
): UserTargetItem | null {
  const targets = getStoredTargets();
  const idx = targets.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const updated: UserTargetItem = {
    ...targets[idx],
    status,
    completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    progressPercent: progressPercent !== undefined ? progressPercent : (status === 'completed' ? 100 : targets[idx].progressPercent),
  };

  targets[idx] = updated;
  persistTargets(targets);
  return updated;
}

export function deleteTarget(idOrTitle: string): boolean {
  const targets = getStoredTargets();
  const clean = idOrTitle.toLowerCase().trim();
  const filtered = targets.filter(
    (t) => t.id !== idOrTitle && t.title.toLowerCase() !== clean
  );
  if (filtered.length !== targets.length) {
    persistTargets(filtered);
    return true;
  }
  return false;
}

export function clearAllTargets(): void {
  persistTargets([]);
}

export function queryTargetStatusSummary(): {
  total: number;
  pendingCount: number;
  completedCount: number;
  inProgressCount: number;
  pendingList: UserTargetItem[];
  completedList: UserTargetItem[];
  summaryHindi: string;
  summaryEnglish: string;
} {
  const targets = getStoredTargets();
  const pendingList = targets.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const completedList = targets.filter((t) => t.status === 'completed');

  let summaryHindi = '';
  let summaryEnglish = '';

  if (targets.length === 0) {
    summaryHindi = 'रोविन पाल सर, अभी आपके पास कोई टारगेट सेव नहीं है। आप नया टारगेट बता सकते हैं!';
    summaryEnglish = 'Rovin Sir, you have no targets recorded yet. You can give me a new target anytime!';
  } else if (pendingList.length === 0) {
    summaryHindi = `बधाई हो रोविन सर! आपके सभी ${completedList.length} टारगेट सफलतापूर्वक पूरे (Completed) हो चुके हैं! कोई भी काम अधूरा नहीं है।`;
    summaryEnglish = `Congratulations Rovin Sir! All ${completedList.length} targets have been completed! No pending work remains.`;
  } else {
    const pendingNames = pendingList.map((t, i) => `${i + 1}) ${t.title}`).join('; ');
    const completedInfo = completedList.length > 0 ? ` और ${completedList.length} काम पूरे हो चुके हैं।` : '';
    summaryHindi = `जी रोविन सर! वर्तमान में आपके ${pendingList.length} काम/टारगेट बाकी (Pending) हैं: ${pendingNames}।${completedInfo}`;
    summaryEnglish = `Sir, you currently have ${pendingList.length} pending target(s): ${pendingNames}. ${completedList.length} target(s) completed.`;
  }

  return {
    total: targets.length,
    pendingCount: pendingList.length,
    completedCount: completedList.length,
    inProgressCount: targets.filter((t) => t.status === 'in_progress').length,
    pendingList,
    completedList,
    summaryHindi,
    summaryEnglish,
  };
}

export interface MemoryIntentResult {
  action: 'save' | 'recall' | 'update' | 'delete' | 'clear' | 'show_all';
  key?: string;
  value?: string;
  category?: SmartMemoryCategory;
  rawKey?: string;
  confirmationReplyHindi?: string;
  confirmationReplyEnglish?: string;
  isSensitiveWarning?: boolean;
}

/**
 * Intelligent natural language parser for memory commands
 * Matches:
 *  - "Remember this: my name is Prince"
 *  - "My name is Rovin, remember this"
 *  - "Save this in your memory: car number DL 01 AB"
 *  - "Store this information: I work as a doctor"
 *  - "What is my name?" / "Mera naam kya hai?"
 *  - "Do you remember what I told you?"
 *  - "My new name is Rovin Pal, update it"
 *  - "Forget my name" / "Mera naam bhool jao"
 *  - "Clear memory" / "Forget all memories"
 */
export function extractMemoryIntent(rawPrompt: string): MemoryIntentResult | null {
  if (!rawPrompt || !rawPrompt.trim()) return null;
  const prompt = rawPrompt.trim();
  const lower = prompt.toLowerCase();

  // 00-A. UNLIMITED MEMORY ENGINE ACTIVATION ("memory add karo jo bhi main bolun", "unlimited memory add karo")
  if (
    (lower.includes('unlimited memory') ||
      lower.includes('all unlimited') ||
      (lower.includes('memory') && (lower.includes('jo bhi') || lower.includes('main bolun') || lower.includes('mai bolu')))) &&
    (lower.includes('add') || lower.includes('yaad') || lower.includes('yad') || lower.includes('on') || lower.includes('karo') || lower.includes('kare'))
  ) {
    setUnlimitedMemoryActive(true);
    saveMemory(
      'unlimited_memory_engine',
      'All user instructions, voice statements, targets, and work completion statuses tracked permanently',
      'custom_instruction'
    );
    return {
      action: 'save',
      key: 'unlimited_memory_engine',
      value: 'All user voice inputs, instructions, targets, and completion status tracked permanently',
      rawKey: 'Unlimited Memory Core',
      category: 'custom_instruction',
      confirmationReplyHindi:
        'जी रोविन पाल सर! ऑल अनलिमिटेड मेमोरी इंजन (Unlimited Memory & Target Tracker) पूरी तरह सक्रिय कर दिया गया है! अब आप जो भी बोलेंगे — कोई भी बात या कोई भी टारगेट — मैं सब कुछ हमेशा याद रखूंगी और जब भी आप पूछेंगे कि "काम पूरा हुआ या नहीं", मैं तुरंत पूरा स्टेटस बता दूंगी!',
      confirmationReplyEnglish:
        'Unlimited Memory and Target Tracker is now fully active, Rovin Sir! I will permanently remember everything you say, track all your targets, and report whether work is completed or pending.',
    };
  }

  // 00-B. TARGET STATUS INQUIRY / CHECK WORK COMPLETION ("kam pura hua nahin hua", "target pura hua ya nahi", "kya kaam pura hua")
  if (
    lower.includes('pura hua ya nahi') ||
    lower.includes('pura hua ki nahi') ||
    lower.includes('pura hua nahin hua') ||
    lower.includes('pura hua nahi hua') ||
    lower.includes('kam pura hua') ||
    lower.includes('kaam pura hua') ||
    lower.includes('target pura hua') ||
    lower.includes('kya target pura hua') ||
    lower.includes('kya kaam pura hua') ||
    lower.includes('target status') ||
    lower.includes('mera target kya tha') ||
    lower.includes('aaj ka target kya') ||
    lower.includes('pending kaam') ||
    lower.includes('target list') ||
    lower.includes('mere targets')
  ) {
    const summary = queryTargetStatusSummary();
    return {
      action: 'recall',
      key: 'target_status',
      rawKey: 'Target Work Completion Status',
      confirmationReplyHindi: summary.summaryHindi,
      confirmationReplyEnglish: summary.summaryEnglish,
    };
  }

  // 00-C. MARK TARGET AS COMPLETED ("target pura ho gaya", "kaam pura ho gaya", "target complete kar do")
  if (
    lower.includes('target pura ho gaya') ||
    lower.includes('target complete ho gaya') ||
    lower.includes('kaam pura ho gaya') ||
    lower.includes('kaam complete ho gaya') ||
    lower.includes('target ho gaya') ||
    lower.includes('kaam ho gaya') ||
    lower.includes('target complete kar do') ||
    lower.includes('target complete') ||
    lower.includes('task complete')
  ) {
    const completed = completeTarget();
    const title = completed ? completed.title : 'Target';
    return {
      action: 'update',
      key: 'target_status',
      value: 'completed',
      rawKey: title,
      confirmationReplyHindi: `जी रोविन पाल सर! आपका टारगेट "${title}" सफलतापूर्वक पूरा (Completed) मार्क कर दिया गया है! काम पूरा हो चुका है।`,
      confirmationReplyEnglish: `Excellent Rovin Sir! Your target "${title}" has been marked as Completed!`,
    };
  }

  // 00-D. ADD NEW TARGET ("target add karo...", "mera target hai...", "aaj ka target...")
  if (
    (lower.includes('target add') ||
      lower.includes('target set') ||
      lower.includes('mera target hai') ||
      lower.includes('aaj ka target hai') ||
      lower.includes('ye target yaad') ||
      lower.includes('ye kaam yaad')) &&
    !lower.includes('pura hua')
  ) {
    let title = prompt
      .replace(
        /^(?:jarvis|hey jarvis|aoede)?\s*(?:please\s+)?(?:target\s+add\s+karo|target\s+set\s+karo|mera\s+target\s+hai|aaj\s+ka\s+target\s+hai|target\s+hai|ye\s+target\s+yaad\s+rakhna|ye\s+kaam\s+yaad\s+rakhna\s+ki\s+pura\s+karna\s+hai|target)\s*[:,-]?\s*/i,
        ''
      )
      .trim();
    if (!title) title = 'General Work Target';
    const newTarget = saveTarget(title);
    return {
      action: 'save',
      key: 'user_target',
      value: newTarget.title,
      rawKey: newTarget.title,
      confirmationReplyHindi: `जी रोविन पाल सर! आपका नया टारगेट "${newTarget.title}" सेव कर दिया गया है। वर्तमान स्टेटस 'काम बाकी है (Pending)' रखा गया है।`,
      confirmationReplyEnglish: `Target "${newTarget.title}" saved. Status is set to Pending.`,
    };
  }

  // 0. EXCEL SHORTCUTS & SMART WORK MEMORY SAVE REQUEST
  // e.g. "Rovin Pal memory ma save karo Excel ke all shortcut ki Excel mein work kaise Excel mein work karna kam Karen"
  if (
    lower.includes('excel') &&
    (lower.includes('shortcut') || lower.includes('work') || lower.includes('kaam') || lower.includes('tips') || lower.includes('key')) &&
    (lower.includes('save') || lower.includes('add') || lower.includes('yaad') || lower.includes('store') || lower.includes('dalo') || lower.includes('likho') || lower.includes('karo'))
  ) {
    saveMemory(
      'excel_all_shortcuts',
      'MS Excel All Essential Shortcuts: [Navigation]: Ctrl+Home (A1), Ctrl+End (Last cell), Ctrl+Arrow (Jump edge), Ctrl+PageDown/Up (Next/Prev Sheet). [Formatting]: Ctrl+1 (Format Cells), Ctrl+Shift+$ (Currency), Ctrl+Shift+% (Percent), Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+U (Underline). [Formulas]: Alt+= (AutoSum instant total), F4 (Cycle Absolute $A$1 / Repeat action), Ctrl+` (Show Formulas), Shift+F3 (Insert Function). [Rows & Columns]: Ctrl+Space (Select Column), Shift+Space (Select Row), Ctrl++ (Insert Row/Col), Ctrl+- (Delete Row/Col), Alt+H+O+I (Auto-fit Width), Alt+H+O+A (Auto-fit Height). [Smart Work]: Ctrl+E (Flash Fill), Ctrl+T (Create Table), Ctrl+Shift+L (Filter), Ctrl+D (Fill Down), Ctrl+R (Fill Right), Ctrl+Alt+V (Paste Special), F12 (Save As).',
      'custom_instruction',
      'Excel all shortcuts'
    );
    saveMemory(
      'excel_work_smart_tips',
      'Excel mein fast work aur kaam kam karne ke 7 best smart tips: 1) Flash Fill (Ctrl+E) - Text split/combine kare bina formula ke. 2) AutoSum (Alt+=) - 1 second me rows & columns ka total. 3) Tables (Ctrl+T) - Auto-expanding formulas & style. 4) XLOOKUP - Modern 2-way search formula without errors. 5) Pivot Table (Alt+N+V) - Lakhon rows ka summary 2 clicks me. 6) Data Validation (Alt+A+V+V) - Dropdown list lagakar typing mistakes rokein. 7) Excel Macro (Alt+F11) - Repetitive daily work automate karein.',
      'custom_instruction',
      'Excel work smart tips'
    );
    saveMemory('name', 'Rovin Pal', 'identity');
    saveMemory('preferred_title', 'Rovin Sir', 'identity');

    return {
      action: 'save',
      key: 'excel_all_shortcuts',
      value: 'MS Excel All Shortcuts & Fast Workflow Strategy',
      rawKey: 'excel_shortcuts',
      category: 'custom_instruction',
      confirmationReplyHindi:
        'जी रोविन पाल सर! एक्सेल के सभी आवश्यक शॉर्टकट कीज (AutoSum Alt+=, Flash Fill Ctrl+E, Table Ctrl+T, Filter Ctrl+Shift+L, Format Ctrl+1) और एक्सेल में काम को आसान व सुपरफ़ास्ट करने के सभी स्मार्ट तरीके आपकी परमानेंट मेमोरी में सेव कर दिए गए हैं!',
      confirmationReplyEnglish:
        'Right away Rovin Pal Sir! All Excel shortcut keys and smart workflow automation strategies have been permanently saved into your Memory Core.',
    };
  }

  // 0b. EXCEL SHORTCUTS & SMART WORK RECALL REQUEST
  if (
    lower.includes('excel') &&
    (lower.includes('shortcut') || lower.includes('work') || lower.includes('kaam') || lower.includes('formula') || lower.includes('tip')) &&
    (lower.includes('batao') || lower.includes('kya hai') || lower.includes('tell') || lower.includes('dikhao') || lower.includes('kaise') || lower.includes('karo'))
  ) {
    return {
      action: 'recall',
      key: lower.includes('kaam') || lower.includes('work') ? 'excel_work_smart_tips' : 'excel_all_shortcuts',
      rawKey: 'Excel Knowledge Vector',
    };
  }

  // 1. CLEAR ALL MEMORIES ("clear memory", "forget everything", "saari memory clear karo")
  if (
    lower.includes('clear memory') ||
    lower.includes('clear all memory') ||
    lower.includes('delete all memory') ||
    lower.includes('forget everything') ||
    lower.includes('forget all') ||
    lower.includes('saari memory clear') ||
    lower.includes('puri memory clear') ||
    lower.includes('sab bhool jao') ||
    lower.includes('sab kuch bhool jao') ||
    lower.includes('memory delete kar do') ||
    lower.includes('मेमोरी क्लियर') ||
    lower === 'clear memory'
  ) {
    return {
      action: 'clear',
      confirmationReplyHindi:
        'जी! आपकी सभी स्टोर की गई यादें (Smart Memory) सुरक्षित रूप से क्लियर कर दी गई हैं।',
      confirmationReplyEnglish:
        'All stored memories have been cleared from memory storage.',
    };
  }

  // 2. RECALL ALL / SHOW WHAT I TOLD YOU ("do you remember what i told you?", "what do you remember about me?", "memory dikhao")
  if (
    lower.includes('do you remember what i told you') ||
    lower.includes('remember what i told you') ||
    lower.includes('what did i tell you') ||
    lower.includes('what do you remember about me') ||
    lower.includes('what do you remember') ||
    lower.includes('do you remember me') ||
    lower.includes('kya tumhe yaad hai') ||
    lower.includes('kya aapko yaad hai') ||
    lower.includes('tumhe kya yaad hai') ||
    lower.includes('meri memory batao') ||
    lower.includes('show memory') ||
    lower.includes('show all memory') ||
    lower.includes('view memory') ||
    lower.includes('memory dikhao') ||
    lower.includes('kya kya yaad hai') ||
    lower.includes('what is in your memory') ||
    lower.includes('saved memory') ||
    lower.includes('मेमोरी दिखाओ')
  ) {
    return {
      action: 'show_all',
    };
  }

  // 2b. RECALL PREVIOUS QUESTIONS & ANSWERS ("maine pehle kya pucha tha", "kis question par baat kare te", "mana phala kia question par bat kare te", "google questions memory")
  if (
    lower.includes('pehle kya pucha') ||
    lower.includes('pehla question') ||
    lower.includes('phala kia question') ||
    lower.includes('pehle kya question') ||
    lower.includes('kia question') ||
    lower.includes('kya question') ||
    lower.includes('bat kare te') ||
    lower.includes('baat kare te') ||
    lower.includes('baat ki thi') ||
    lower.includes('bat ki thi') ||
    lower.includes('question par bat') ||
    lower.includes('question par baat') ||
    lower.includes('sawal par baat') ||
    lower.includes('pichla question') ||
    lower.includes('pichle question') ||
    lower.includes('pichli baat') ||
    lower.includes('what did i ask') ||
    lower.includes('what was my previous question') ||
    lower.includes('previous question') ||
    lower.includes('past question') ||
    lower.includes('purane question') ||
    lower.includes('question memory') ||
    lower.includes('sawal pucha') ||
    lower.includes('sawal aur jawab') ||
    lower.includes('jasa google') ||
    lower.includes('jaise google') ||
    lower.includes('google ko ke question') ||
    lower.includes('google ko question') ||
    lower.includes('question and answer') ||
    lower.includes('question and answers') ||
    lower.includes('yad rak ska') ||
    lower.includes('yaad rakh sake')
  ) {
    const qaList = getStoredQaMemories();
    if (qaList.length > 0) {
      const latest = qaList[0];
      const secondLatest = qaList[1];
      let summaryHindi = `जी रोविन सर! पिछली बार आपने मुझसे यह सवाल पूछा था: "${latest.question}" और मैंने उत्तर दिया था: "${latest.answer.slice(0, 110)}..."।`;
      let summaryEng = `Sir, previously you asked: "${latest.question}" and my response was: "${latest.answer.slice(0, 110)}...".`;
      if (secondLatest) {
        summaryHindi += ` उससे पहले हमने "${secondLatest.question}" पर बात की थी।`;
        summaryEng += ` Prior to that, we discussed "${secondLatest.question}".`;
      }
      return {
        action: 'recall',
        key: 'previous_qa',
        rawKey: 'Previous Conversation Q&A',
        confirmationReplyHindi: summaryHindi,
        confirmationReplyEnglish: summaryEng,
      };
    } else {
      return {
        action: 'recall',
        key: 'previous_qa',
        rawKey: 'Previous Conversation Q&A',
        confirmationReplyHindi:
          'जी रोविन सर! जैसे गूगल पर तुरंत उत्तर मिलते हैं, वैसे ही अब आप जो भी सवाल पूछेंगे, मैं उन सभी प्रश्नों और उत्तरों को मेमोरी में सहेज कर रखूंगी ताकि आप जब चाहें पिछली बातचीत याद दिला सकें।',
        confirmationReplyEnglish:
          'Sir, just like Google search, I now retain all your questions and answers in persistent memory so you can recall any previous topic at any time.',
      };
    }
  }

  // 3. FORGET SPECIFIC MEMORY ("forget my name", "mera naam bhool jao", "delete memory car_number")
  const forgetMatch =
    lower.match(/^(?:forget|delete|remove|bhool\s*jao|hatao)\s+(?:my\s+|mera\s+|meri\s+|mere\s+)?([a-z0-9_\u0900-\u097F\s]+)/i) ||
    lower.match(/(?:my\s+|mera\s+|meri\s+|mere\s+)?([a-z0-9_\u0900-\u097F\s]+)\s+(?:ko\s+)?(?:forget|delete|remove|bhool\s*jao|bhula\s*do)/i);

  if (
    forgetMatch &&
    (lower.includes('forget') ||
      lower.includes('delete') ||
      lower.includes('bhool') ||
      lower.includes('bhula') ||
      lower.includes('remove'))
  ) {
    let keyCandidate = forgetMatch[1].trim();
    // remove trailing filler words
    keyCandidate = keyCandidate.replace(/\s+(please|karo|kar|do|diya)$/i, '').trim();
    if (keyCandidate && !['everything', 'all', 'sab', 'sab kuch', 'memory', 'core'].includes(keyCandidate)) {
      const normKey = normalizeMemoryKey(keyCandidate);
      return {
        action: 'delete',
        key: normKey,
        rawKey: keyCandidate,
        confirmationReplyHindi: `जी! मैंने आपकी मेमोरी में से "${normKey}" की जानकारी डिलीट कर दी है।`,
        confirmationReplyEnglish: `Got it, I have forgotten your ${normKey} from memory.`,
      };
    }
  }

  // 4. MEMORY RECALL QUESTION ("What is my name?", "Mera naam kya hai?", "What is my car number?", "What is my favorite color?")
  const recallPatterns = [
    /^(?:what\s+is|what's|tell\s+me)\s+(?:my\s+)?([a-z0-9_\s]+)\??$/i,
    /^(?:do\s+you\s+remember|remember)\s+(?:my\s+)?([a-z0-9_\s]+)\??$/i,
    /^(?:mera|meri|mere)\s+([a-z0-9_\u0900-\u097F\s]+)\s+(?:kya|kab|kahan)\s+hai\??$/i,
    /^([a-z0-9_\u0900-\u097F\s]+)\s+kya\s+hai\??$/i,
  ];

  for (const pat of recallPatterns) {
    const m = lower.match(pat);
    if (m && m[1]) {
      let keyQuery = m[1].trim();
      keyQuery = keyQuery.replace(/\s+(hai|kya|batao|please)$/i, '').trim();
      const normKey = normalizeMemoryKey(keyQuery);
      if (
        normKey &&
        normKey !== 'weather' &&
        normKey !== 'time' &&
        normKey !== 'date' &&
        normKey !== 'news'
      ) {
        return {
          action: 'recall',
          key: normKey,
          rawKey: keyQuery,
        };
      }
    }
  }

  // 5. MEMORY UPDATE ("My new name is Rovin Pal, update it", "Update my name to Prince")
  const updatePattern =
    /(?:my\s+new\s+|mera\s+naya\s+|update\s+my\s+|change\s+my\s+)([a-z0-9_\s]+)\s+(?:is|to|hai)\s+(.+?)(?:,\s*update\s*it|\s+update\s*karo|$)/i;
  const updateMatch = prompt.match(updatePattern);
  if (updateMatch && (lower.includes('update') || lower.includes('naya') || lower.includes('new') || lower.includes('change'))) {
    const rawKey = updateMatch[1].trim();
    let rawVal = updateMatch[2].trim();
    rawVal = rawVal.replace(/\s+(update\s*it|update\s*karo|please)$/i, '').trim();
    const normKey = normalizeMemoryKey(rawKey);

    return {
      action: 'update',
      key: normKey,
      value: rawVal,
      rawKey,
      confirmationReplyHindi: `जी! मैंने आपकी मेमोरी में "${normKey}" को अपडेट करके "${rawVal}" सेट कर दिया है।`,
      confirmationReplyEnglish: `Updated! I’ll remember that your ${normKey} is ${rawVal}.`,
    };
  }

  // 6. MEMORY STORAGE ("My name is Rovin, remember this", "Save this in your memory: ...", "Store this information: ...")
  const isExplicitRemember =
    lower.includes('remember this') ||
    lower.includes('remember that') ||
    lower.includes('save this in your memory') ||
    lower.includes('save in your memory') ||
    lower.includes('store this information') ||
    lower.includes('store this in memory') ||
    lower.includes('save this memory') ||
    lower.includes('store this in your memory') ||
    lower.includes('store this') ||
    lower.includes('save this') ||
    lower.includes('remember') ||
    lower.includes('yaad rakhna') ||
    lower.includes('yaad rakho') ||
    lower.includes('याद रखना') ||
    lower.includes('याद रखो') ||
    lower.includes('memory me save karo') ||
    lower.includes('मेमोरी में सेव करो') ||
    lower.includes('save to memory');

  if (isExplicitRemember) {
    // Check security / sensitive data
    if (isSensitiveData(prompt)) {
      return {
        action: 'save',
        key: 'security_blocked',
        value: '',
        isSensitiveWarning: true,
        confirmationReplyHindi:
          'सुरक्षा अलर्ट: आपकी गोपनीयता के लिए बैंक पासवर्ड, पिन, या कार्ड नंबर जैसी संवेदनशील जानकारी को सेव करना मना है।',
        confirmationReplyEnglish:
          'Security Notice: For your privacy and safety, storing confidential credentials like passwords, PINs, or bank details in memory is restricted.',
      };
    }

    // Strip trigger prefixes & suffixes
    let content = prompt
      .replace(
        /^(?:jarvis|hey jarvis|aoede|mayra)?\s*(?:please\s+)?(?:remember\s+this|remember\s+that|remember|save\s+this\s+in\s+your\s+memory|save\s+this|store\s+this\s+information|store\s+this|yaad\s+rakhna|yaad\s+rakho|याद\s+रखना|याद\s+रखो|memory\s+me\s+save\s+karo|मेमोरी\s+में\s+सेव\s+करो)\s*(?:[:,-]|ki|that)?\s*/i,
        ''
      )
      .replace(
        /\s*[,.-]?\s*(?:remember\s+this|remember\s+that|save\s+this\s+in\s+your\s+memory|store\s+this\s+information|yaad\s+rakhna|yaad\s+rakho|memory\s+me\s+save\s+karo)$/i,
        ''
      )
      .trim();

    if (!content) return null;

    // Pattern A: "My X is Y" / "Mera X Y hai"
    const isPattern = content.match(
      /^(?:my|mera|meri|mere)\s+([a-z0-9_\u0900-\u097F\s]+?)\s+(?:is|hai|hain|=|:)\s+(.+)$/i
    );
    if (isPattern) {
      const rawKey = isPattern[1].trim();
      const rawVal = isPattern[2].trim().replace(/\s+(hai|hain|tha|thi|kripya)$/i, '');
      const normKey = normalizeMemoryKey(rawKey);
      return {
        action: 'save',
        key: normKey,
        value: rawVal,
        rawKey,
        category: inferMemoryCategory(normKey, rawVal),
        confirmationReplyHindi: `जी! मैंने याद रख लिया है कि आपका ${normKey} "${rawVal}" है।`,
        confirmationReplyEnglish: `Got it, I’ll remember that your ${normKey} is ${rawVal}.`,
      };
    }

    // Pattern B: "I am X" / "Main X hu" (stores name)
    const iAmPattern = content.match(/^(?:i\s+am|i'm|main|mai)\s+(.+?)(?:\s+hu|\s+hoon)?$/i);
    if (iAmPattern) {
      const val = iAmPattern[1].trim();
      return {
        action: 'save',
        key: 'name',
        value: val,
        rawKey: 'name',
        category: 'identity',
        confirmationReplyHindi: `जी! मैंने याद रख लिया है कि आपका नाम ${val} है।`,
        confirmationReplyEnglish: `Got it, I’ll remember that your name is ${val}.`,
      };
    }

    // Pattern C: "I work as X" / "My profession is X"
    const professionPattern = content.match(/^(?:i\s+work\s+as|i\s+am\s+a|main\s+ek)\s+(.+)$/i);
    if (professionPattern) {
      const val = professionPattern[1].trim();
      return {
        action: 'save',
        key: 'profession',
        value: val,
        rawKey: 'profession',
        category: 'personal',
        confirmationReplyHindi: `जी! मैंने याद रख लिया है कि आपका प्रोफेशन ${val} है।`,
        confirmationReplyEnglish: `Got it, I’ll remember that your profession is ${val}.`,
      };
    }

    // Pattern D: "I live in X"
    const locationPattern = content.match(/^(?:i\s+live\s+in|main\s+(.+?)\s+me\s+rehta\s+hu)$/i);
    if (locationPattern) {
      const val = locationPattern[1].trim();
      return {
        action: 'save',
        key: 'city',
        value: val,
        rawKey: 'city',
        category: 'personal',
        confirmationReplyHindi: `जी! मैंने याद रख लिया है कि आप ${val} में रहते हैं।`,
        confirmationReplyEnglish: `Got it, I’ll remember that you live in ${val}.`,
      };
    }

    // Pattern E: Generic Key-Value separated by colon or equals
    const genericMatch = content.match(/^([a-z0-9_\u0900-\u097F\s]{2,25})[:=]\s*(.+)$/i);
    if (genericMatch) {
      const rawKey = genericMatch[1].trim();
      const rawVal = genericMatch[2].trim();
      const normKey = normalizeMemoryKey(rawKey);
      return {
        action: 'save',
        key: normKey,
        value: rawVal,
        rawKey,
        category: inferMemoryCategory(normKey, rawVal),
        confirmationReplyHindi: `जी! मैंने याद रख लिया है: ${normKey} = "${rawVal}"।`,
        confirmationReplyEnglish: `Got it, I’ll remember that your ${normKey} is ${rawVal}.`,
      };
    }

    // Fallback: General custom instruction or fact
    return {
      action: 'save',
      key: 'custom_instruction',
      value: content,
      rawKey: 'instruction',
      category: 'custom_instruction',
      confirmationReplyHindi: `जी! मैंने यह जानकारी अपनी मेमोरी में सेव कर ली है: "${content}"।`,
      confirmationReplyEnglish: `Got it, I’ll remember: "${content}".`,
    };
  }

  return null;
}
