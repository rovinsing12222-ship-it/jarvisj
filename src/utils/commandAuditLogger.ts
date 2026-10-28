/**
 * J.A.R.V.I.S. Command Execution Audit Logger & Error Pattern Engine
 * Records every AI command execution (success & failure) across all users and trigger vectors.
 * Provides the Master Administrator (Rovin Pal) with full visibility into system usage,
 * execution latency, failure diagnostics, and AI error patterns.
 */

export type AuditCommandStatus = 'success' | 'failed';

export interface CommandAuditItem {
  id: string;
  commandText: string;
  status: AuditCommandStatus;
  errorMessage?: string;
  errorPattern?: string;
  errorCategory?: 'network' | 'model' | 'tool' | 'input' | 'security' | 'system';
  remediation?: string;
  triggeredBy: string;
  executionTimeMs: number;
  modelUsed: string;
  actionsExecuted?: string[];
  responsePreview?: string;
  sentiment?: string;
  timestamp: string;
  date: string;
  isoDate: string;
}

export interface AuditPatternBreakdown {
  pattern: string;
  count: number;
  percentage: number;
  category: string;
  remediation: string;
}

export interface AuditAnalytics {
  total: number;
  successCount: number;
  failedCount: number;
  successRate: number; // 0 - 100
  failureRate: number; // 0 - 100
  avgExecutionTimeMs: number;
  patterns: AuditPatternBreakdown[];
  topTriggerSources: { source: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
}

export const AUDIT_LOG_STORAGE_KEY = 'jarvis_command_audit_logs';

/**
 * Classifies runtime errors and AI execution failures into structured diagnostic error patterns
 */
export function diagnoseErrorPattern(
  errorMessage: string = '',
  commandText: string = ''
): { pattern: string; category: CommandAuditItem['errorCategory']; remediation: string } {
  const msg = (errorMessage || '').toLowerCase();
  const cmd = (commandText || '').toLowerCase();

  if (msg.includes('timeout') || msg.includes('deadline') || msg.includes('timed out')) {
    return {
      pattern: 'API_TIMEOUT_OR_CAPACITY_SPIKE',
      category: 'model',
      remediation: 'Upstream Gemini request timed out; local heuristic fallback engine engaged.',
    };
  }

  if (msg.includes('network') || msg.includes('offline') || msg.includes('fetch failed') || msg.includes('failed to fetch')) {
    return {
      pattern: 'NETWORK_DISCONNECT_OR_OFFLINE',
      category: 'network',
      remediation: 'Device is offline or lost Internet connectivity. Verify Wi-Fi or cellular data.',
    };
  }

  if (msg.includes('contact') || cmd.includes('call ') || cmd.includes('phone') || msg.includes('not found')) {
    return {
      pattern: 'CONTACT_OR_ENTITY_NOT_FOUND',
      category: 'tool',
      remediation: 'Recipient was not found in phonebook. Check Contacts tab or add the contact first.',
    };
  }

  if (msg.includes('app') || msg.includes('package') || cmd.includes('open ') || cmd.includes('kholo')) {
    return {
      pattern: 'APPLICATION_PACKAGE_UNRESOLVED',
      category: 'tool',
      remediation: 'Requested app is not installed on device. Falling back to web search or Play Store.',
    };
  }

  if (msg.includes('silence') || msg.includes('no speech') || msg.includes('inaudible') || cmd.length === 0) {
    return {
      pattern: 'MICROPHONE_INPUT_SILENCE_OR_NOISE',
      category: 'input',
      remediation: 'Input voice volume below noise floor threshold. Check microphone permissions.',
    };
  }

  if (msg.includes('pin') || msg.includes('permission') || msg.includes('auth') || msg.includes('security')) {
    return {
      pattern: 'SECURITY_AUTHORIZATION_DENIED',
      category: 'security',
      remediation: 'Master PIN or Administrator credential required to execute this command.',
    };
  }

  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('quota')) {
    return {
      pattern: 'RATE_LIMIT_EXCEEDED_429',
      category: 'model',
      remediation: 'Gemini API quota rate limit triggered. Re-route to secondary API key or flash model.',
    };
  }

  return {
    pattern: 'UNCLASSIFIED_COMMAND_EXCEPTION',
    category: 'system',
    remediation: 'Review command syntax or inspect server application console logs.',
  };
}

/**
 * Baseline historical audit seed entries to populate the admin panel with realistic metrics
 */
const SEED_AUDIT_LOGS: CommandAuditItem[] = [
  {
    id: 'audit-seed-1',
    commandText: 'YouTube par Arijit Singh ke romantic songs chalao',
    status: 'success',
    triggeredBy: 'User (Voice)',
    executionTimeMs: 340,
    modelUsed: 'Gemini 3.8 Flash',
    actionsExecuted: ['pcControlAction (pc_open_app)', 'openApp (youtube)'],
    responsePreview: 'Ji bilkul! Windows search se YouTube open karke Arijit Singh ke gaane play kar rahi hu!',
    sentiment: 'excited',
    timestamp: '01:15 AM',
    date: '2026-10-10',
    isoDate: '2026-10-10T08:15:00.000Z',
  },
  {
    id: 'audit-seed-2',
    commandText: 'Aaj Delhi ka live weather aur forecast batao',
    status: 'success',
    triggeredBy: 'User (Voice)',
    executionTimeMs: 210,
    modelUsed: 'Gemini 3.8 Flash + Radar API',
    actionsExecuted: ['getWeather (New Delhi)'],
    responsePreview: 'Delhi me filhaal temperature 29°C hai aur aasmaan saaf hai Sir.',
    sentiment: 'neutral',
    timestamp: '01:08 AM',
    date: '2026-10-10',
    isoDate: '2026-10-10T08:08:00.000Z',
  },
  {
    id: 'audit-seed-3',
    commandText: 'Call Elon Musk on private satellite phone',
    status: 'failed',
    errorMessage: 'Recipient "Elon Musk" not found in saved device contacts database',
    errorPattern: 'CONTACT_OR_ENTITY_NOT_FOUND',
    errorCategory: 'tool',
    remediation: 'Recipient was not found in phonebook. Check Contacts tab or add the contact first.',
    triggeredBy: 'User (Voice)',
    executionTimeMs: 145,
    modelUsed: 'Gemini 3.8 Flash',
    actionsExecuted: ['makePhoneCall (failed)'],
    responsePreview: 'Sir, Elon Musk aapke contacts me save nahi hai. Kya main number search karu?',
    sentiment: 'frustrated',
    timestamp: '01:02 AM',
    date: '2026-10-10',
    isoDate: '2026-10-10T08:02:00.000Z',
  },
  {
    id: 'audit-seed-4',
    commandText: 'Subah 6 baje wake up alarm laga do',
    status: 'success',
    triggeredBy: 'User (Voice)',
    executionTimeMs: 180,
    modelUsed: 'Local Heuristic Engine',
    actionsExecuted: ['manageSchedule (set_alarm)'],
    responsePreview: 'Kal subah 6:00 AM ka alarm safalta-purvak set kar diya hai Sir.',
    sentiment: 'calm',
    timestamp: '12:50 AM',
    date: '2026-10-10',
    isoDate: '2026-10-10T07:50:00.000Z',
  },
  {
    id: 'audit-seed-5',
    commandText: 'Open HeavySimulator3D.exe on mobile browser',
    status: 'failed',
    errorMessage: 'Requested application package HeavySimulator3D not found on Android / Web container',
    errorPattern: 'APPLICATION_PACKAGE_UNRESOLVED',
    errorCategory: 'tool',
    remediation: 'Requested app is not installed on device. Falling back to web search or Play Store.',
    triggeredBy: 'User (Text)',
    executionTimeMs: 290,
    modelUsed: 'Gemini 3.8 Flash',
    actionsExecuted: ['openApp (failed)'],
    responsePreview: 'Sir, yeh application aapke device me installed nahi hai. Play Store par search karu?',
    sentiment: 'neutral',
    timestamp: '12:42 AM',
    date: '2026-10-10',
    isoDate: '2026-10-10T07:42:00.000Z',
  },
  {
    id: 'audit-seed-6',
    commandText: 'Flashlight on karo and mute speaker',
    status: 'success',
    triggeredBy: 'User (Voice)',
    executionTimeMs: 95,
    modelUsed: 'Local Heuristic Engine',
    actionsExecuted: ['managePhoneSettings (torch_on)', 'managePhoneSettings (mute)'],
    responsePreview: 'Flashlight chalu kar di hai aur speaker mute kar diya hai Sir.',
    sentiment: 'neutral',
    timestamp: '12:35 AM',
    date: '2026-10-10',
    isoDate: '2026-10-10T07:35:00.000Z',
  },
  {
    id: 'audit-seed-7',
    commandText: '[Inaudible background static at low dB]',
    status: 'failed',
    errorMessage: 'Speech input volume beneath ambient threshold (approx 14 dB)',
    errorPattern: 'MICROPHONE_INPUT_SILENCE_OR_NOISE',
    errorCategory: 'input',
    remediation: 'Input voice volume below noise floor threshold. Check microphone permissions.',
    triggeredBy: 'Voice Controller',
    executionTimeMs: 420,
    modelUsed: 'Audio Speech Recognizer',
    actionsExecuted: [],
    responsePreview: 'Ji Sir, aawaz saaf nahi aayi. Kripya thoda paas aakar boliye.',
    sentiment: 'neutral',
    timestamp: '12:20 AM',
    date: '2026-10-10',
    isoDate: '2026-10-10T07:20:00.000Z',
  },
  {
    id: 'audit-seed-8',
    commandText: 'Tumhe kisne banaya hai aur tumhara creator kaun hai?',
    status: 'success',
    triggeredBy: 'User (Voice)',
    executionTimeMs: 310,
    modelUsed: 'Gemini 3.8 Flash + Memory Core',
    actionsExecuted: ['recallMemory (creator_identity)'],
    responsePreview: 'Mujhe Rovin Pal (Rovin Sir) ne banaya hai! Vahi mere creator, master aur architect hain!',
    sentiment: 'excited',
    timestamp: '12:12 AM',
    date: '2026-10-10',
    isoDate: '2026-10-10T07:12:00.000Z',
  },
  {
    id: 'audit-seed-9',
    commandText: 'Execute deep neural quantum simulation with 10M tokens',
    status: 'failed',
    errorMessage: 'Upstream Gemini generation timed out after 12000ms latency deadline',
    errorPattern: 'API_TIMEOUT_OR_CAPACITY_SPIKE',
    errorCategory: 'model',
    remediation: 'Upstream Gemini request timed out; local heuristic fallback engine engaged.',
    triggeredBy: 'Admin Console',
    executionTimeMs: 12050,
    modelUsed: 'Gemini 3.8 Flash (Fallback Engaged)',
    actionsExecuted: ['aiService (timed out)'],
    responsePreview: 'System timeout handled. Reverted to tactical heuristic response.',
    sentiment: 'neutral',
    timestamp: '11:58 PM',
    date: '2026-10-09',
    isoDate: '2026-10-09T18:28:00.000Z',
  },
  {
    id: 'audit-seed-10',
    commandText: 'Excel ke sabhi important shortcut keys yaad rakho',
    status: 'success',
    triggeredBy: 'User (Text)',
    executionTimeMs: 250,
    modelUsed: 'Gemini 3.8 Flash + Smart Memory',
    actionsExecuted: ['saveMemoryItem (excel_all_shortcuts)'],
    responsePreview: 'Ji Rovin Sir! Maine MS Excel ke sabhi essential shortcut keys memory core me save kar liye hain!',
    sentiment: 'supportive',
    timestamp: '11:45 PM',
    date: '2026-10-09',
    isoDate: '2026-10-09T18:15:00.000Z',
  },
];

/**
 * Retrieves stored audit logs from localStorage or initializes with seed data
 */
export function getStoredAuditLogs(): CommandAuditItem[] {
  if (typeof window === 'undefined') return SEED_AUDIT_LOGS;

  try {
    const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(SEED_AUDIT_LOGS));
      return SEED_AUDIT_LOGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEED_AUDIT_LOGS;
  } catch (err) {
    console.warn('[CommandAuditLogger] Error reading audit logs:', err);
    return SEED_AUDIT_LOGS;
  }
}

/**
 * Records a new command execution into the persistent audit trail
 */
export function recordCommandAudit(
  entry: {
    commandText: string;
    status: AuditCommandStatus;
    errorMessage?: string;
    errorPattern?: string;
    errorCategory?: CommandAuditItem['errorCategory'];
    remediation?: string;
    triggeredBy?: string;
    executionTimeMs?: number;
    modelUsed?: string;
    actionsExecuted?: string[];
    responsePreview?: string;
    sentiment?: string;
  }
): CommandAuditItem {
  const currentLogs = getStoredAuditLogs();
  const now = new Date();

  let pattern = entry.errorPattern;
  let category = entry.errorCategory;
  let remediation = entry.remediation;

  if (entry.status === 'failed' && !pattern) {
    const diagnosis = diagnoseErrorPattern(entry.errorMessage, entry.commandText);
    pattern = diagnosis.pattern;
    category = diagnosis.category;
    remediation = diagnosis.remediation;
  }

  const newLog: CommandAuditItem = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    commandText: entry.commandText || 'Unknown Command',
    status: entry.status,
    errorMessage: entry.errorMessage,
    errorPattern: pattern,
    errorCategory: category,
    remediation,
    triggeredBy: entry.triggeredBy || 'User (Voice)',
    executionTimeMs: typeof entry.executionTimeMs === 'number' ? entry.executionTimeMs : 180,
    modelUsed: entry.modelUsed || 'Gemini 3.8 Flash',
    actionsExecuted: entry.actionsExecuted || [],
    responsePreview: entry.responsePreview,
    sentiment: entry.sentiment,
    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: now.toISOString().slice(0, 10),
    isoDate: now.toISOString(),
  };

  const updated = [newLog, ...currentLogs.slice(0, 199)];

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('jarvis_command_audit_updated', { detail: updated }));
    } catch (e) {
      console.warn('[CommandAuditLogger] Failed to write audit log to localStorage:', e);
    }
  }

  return newLog;
}

/**
 * Clears all audit logs
 */
export function clearAuditLogs(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('jarvis_command_audit_updated', { detail: [] }));
    } catch (e) {
      console.warn('[CommandAuditLogger] Failed to clear audit logs:', e);
    }
  }
}

/**
 * Resets audit logs back to default seed collection
 */
export function resetAuditLogsToSeed(): CommandAuditItem[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(SEED_AUDIT_LOGS));
      window.dispatchEvent(new CustomEvent('jarvis_command_audit_updated', { detail: SEED_AUDIT_LOGS }));
    } catch {}
  }
  return SEED_AUDIT_LOGS;
}

/**
 * Computes deep aggregate analytics and error pattern distributions for the Admin Dashboard
 */
export function computeAuditAnalytics(logs: CommandAuditItem[]): AuditAnalytics {
  const total = logs.length;
  if (total === 0) {
    return {
      total: 0,
      successCount: 0,
      failedCount: 0,
      successRate: 0,
      failureRate: 0,
      avgExecutionTimeMs: 0,
      patterns: [],
      topTriggerSources: [],
      categoryBreakdown: [],
    };
  }

  let successCount = 0;
  let totalLatency = 0;
  const patternMap: Record<string, { count: number; category: string; remediation: string }> = {};
  const triggerMap: Record<string, number> = {};
  const categoryMap: Record<string, number> = {};

  for (const log of logs) {
    if (log.status === 'success') {
      successCount++;
    } else {
      const pat = log.errorPattern || 'UNCLASSIFIED_ERROR';
      if (!patternMap[pat]) {
        patternMap[pat] = {
          count: 0,
          category: log.errorCategory || 'system',
          remediation: log.remediation || 'Inspect command syntax and system connectivity',
        };
      }
      patternMap[pat].count++;

      const cat = log.errorCategory || 'system';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    }

    totalLatency += log.executionTimeMs || 0;

    const trig = log.triggeredBy || 'User (Voice)';
    triggerMap[trig] = (triggerMap[trig] || 0) + 1;
  }

  const failedCount = total - successCount;
  const successRate = Math.round((successCount / total) * 100);
  const failureRate = Math.round((failedCount / total) * 100);
  const avgExecutionTimeMs = Math.round(totalLatency / total);

  const patterns: AuditPatternBreakdown[] = Object.entries(patternMap)
    .map(([pattern, data]) => ({
      pattern,
      count: data.count,
      percentage: failedCount > 0 ? Math.round((data.count / failedCount) * 100) : 0,
      category: data.category,
      remediation: data.remediation,
    }))
    .sort((a, b) => b.count - a.count);

  const topTriggerSources = Object.entries(triggerMap)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    successCount,
    failedCount,
    successRate,
    failureRate,
    avgExecutionTimeMs,
    patterns,
    topTriggerSources,
    categoryBreakdown,
  };
}

/**
 * Exports audit logs as a downloadable JSON string
 */
export function exportAuditLogsJson(logs: CommandAuditItem[]): string {
  const payload = {
    system: 'J.A.R.V.I.S. Beast Core Command Audit System',
    generatedFor: 'Rovin Pal (Master Administrator)',
    exportedAt: new Date().toISOString(),
    totalRecords: logs.length,
    analytics: computeAuditAnalytics(logs),
    logs,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Exports audit logs as a CSV file string
 */
export function exportAuditLogsCsv(logs: CommandAuditItem[]): string {
  const headers = ['ID', 'Date', 'Time', 'Status', 'Command', 'Triggered By', 'Latency (ms)', 'Model', 'Error Pattern', 'Error Message'];
  const rows = logs.map((l) => [
    l.id,
    l.date,
    l.timestamp,
    l.status.toUpperCase(),
    `"${(l.commandText || '').replace(/"/g, '""')}"`,
    `"${l.triggeredBy}"`,
    l.executionTimeMs,
    `"${l.modelUsed}"`,
    `"${l.errorPattern || 'N/A'}"`,
    `"${(l.errorMessage || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
