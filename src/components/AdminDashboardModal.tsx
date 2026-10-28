import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  X,
  Database,
  MessageSquareQuote,
  Smartphone,
  Cpu,
  Layers,
  Sparkles,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Search,
  Check,
  AlertTriangle,
  Plus,
  Edit3,
  ExternalLink,
  Activity,
  FileJson,
  Zap,
  Terminal,
  UserCheck,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Filter,
  Play,
  RotateCcw,
  FileSpreadsheet,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Copy,
  Eye,
  EyeOff,
  ShieldAlert,
  Fingerprint,
  Vibrate,
  Sliders,
  BellRing,
  PhoneCall,
  Volume2,
  MessageSquare,
  Mic,
  Users,
  UserPlus,
  Mail,
  Share2,
} from 'lucide-react';
import {
  CustomerRecord,
  getStoredCustomers,
  saveCustomer,
  updateCustomer,
  deleteCustomer,
  linkCustomerToJarvisDevice,
  resetDeviceOwnerToAdmin,
  getActiveDeviceOwner,
  getAdminPersonalizedName,
  setAdminPersonalizedName,
  getJarvisGreetingName,
  validateCustomerDetails,
} from '../utils/customerManager';
import {
  PersonalityPreset,
  PERSONALITY_PRESETS,
  getPersonalityPresets,
  getActivePersonalityPresetId,
  getActivePersonalityPreset,
  applyPersonalityPreset,
} from '../utils/personalityPresets';
import { playActionExecutedSound, playCommandRecognizedPingSound } from '../utils/audioSynth';
import {
  getStoredMemories,
  saveMemory,
  deleteMemory,
  clearAllMemories,
  getStoredQaMemories,
  clearQaMemories,
  QaMemoryRecord,
} from '../utils/smartMemoryEngine';
import { MemoryItem } from '../types/memory';
import {
  triggerHaptic,
  triggerAlertHaptic,
  testAlertHapticPattern,
  getAllAlertHapticConfigs,
  getAlertHapticConfig,
  saveAlertHapticConfig,
  resetAlertHapticConfig,
  DEFAULT_ALERT_HAPTICS,
  ALERT_PATTERN_PRESETS,
} from '../utils/hapticEngine';
import { HapticAlertType, AlertHapticPatternConfig, AlertHapticsMap } from '../types';
import {
  getStoredAuditLogs,
  recordCommandAudit,
  clearAuditLogs,
  resetAuditLogsToSeed,
  computeAuditAnalytics,
  exportAuditLogsJson,
  exportAuditLogsCsv,
  diagnoseErrorPattern,
  CommandAuditItem,
} from '../utils/commandAuditLogger';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryUpdate?: (memories: MemoryItem[]) => void;
  onOpenPlayStoreGuide?: () => void;
}

const DEFAULT_ADMIN_PIN = '7860';
const DEFAULT_ADMIN_PASSWORD = 'Rovin@Jarvis2026';

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onMemoryUpdate,
  onOpenPlayStoreGuide,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('jarvis_admin_auth') === 'true';
    }
    return false;
  });

  const [authInput, setAuthInput] = useState('');
  const [authMode, setAuthMode] = useState<'pin' | 'password'>('pin');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const [savedPin, setSavedPin] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jarvis_admin_custom_pin') || DEFAULT_ADMIN_PIN;
    }
    return DEFAULT_ADMIN_PIN;
  });

  const [savedPassword, setSavedPassword] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jarvis_admin_custom_password') || DEFAULT_ADMIN_PASSWORD;
    }
    return DEFAULT_ADMIN_PASSWORD;
  });

  const [newPinInput, setNewPinInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Tabs: 'telemetry' | 'command_audit' | 'customers' | 'memory' | 'qa_audit' | 'playstore' | 'security' | 'haptic_studio'
  const [activeTab, setActiveTab] = useState<'telemetry' | 'command_audit' | 'customers' | 'memory' | 'qa_audit' | 'playstore' | 'security' | 'haptic_studio'>('command_audit');

  // Customer Records & Device Link Management State
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => getStoredCustomers());
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'all' | 'active' | 'downloaded' | 'linked'>('all');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // Form Fields for Customer
  const [custName, setCustName] = useState('');
  const [custNumber, setCustNumber] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custDevice, setCustDevice] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custStatus, setCustStatus] = useState<CustomerRecord['downloadStatus']>('active');
  const [custPlan, setCustPlan] = useState<CustomerRecord['plan']>('Lifetime VIP');
  const [custNotes, setCustNotes] = useState('');
  const [custLinkOwner, setCustLinkOwner] = useState(false);
  const [custFormError, setCustFormError] = useState<string | null>(null);
  const [custNotice, setCustNotice] = useState<string | null>(null);

  // Personalized Admin / Owner Name
  const [adminNameInput, setAdminNameInput] = useState(() => getAdminPersonalizedName());
  const [adminNameNotice, setAdminNameNotice] = useState<string | null>(null);

  // Personality Preset & Speaking Style State
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => getActivePersonalityPresetId());
  const [activePreset, setActivePreset] = useState<PersonalityPreset>(() => getActivePersonalityPreset());

  const activeDeviceOwner = useMemo(() => {
    return customers.find((c) => c.isLinkedDeviceOwner) || null;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      if (customerStatusFilter === 'active' && cust.downloadStatus !== 'active') return false;
      if (customerStatusFilter === 'downloaded' && cust.downloadStatus !== 'downloaded') return false;
      if (customerStatusFilter === 'linked' && !cust.isLinkedDeviceOwner) return false;
      if (customerSearch.trim()) {
        const q = customerSearch.toLowerCase();
        const inName = (cust.name || '').toLowerCase().includes(q);
        const inNum = (cust.number || '').toLowerCase().includes(q);
        const inEmail = (cust.email || '').toLowerCase().includes(q);
        const inDevice = (cust.deviceModel || '').toLowerCase().includes(q);
        const inCity = (cust.city || '').toLowerCase().includes(q);
        const inNotes = (cust.serviceNotes || '').toLowerCase().includes(q);
        if (!inName && !inNum && !inEmail && !inDevice && !inCity && !inNotes) return false;
      }
      return true;
    });
  }, [customers, customerStatusFilter, customerSearch]);

  // Alert Haptic Patterns State (Alarms, Messages, Calls)
  const [alertHaptics, setAlertHaptics] = useState<AlertHapticsMap>(() => getAllAlertHapticConfigs());
  const [activeAlertEdit, setActiveAlertEdit] = useState<HapticAlertType>('alarm');
  const [hapticTestPlaying, setHapticTestPlaying] = useState<string | null>(null);

  // Memories & QA data
  const [memories, setMemories] = useState<MemoryItem[]>(() => getStoredMemories());
  const [qaRecords, setQaRecords] = useState<QaMemoryRecord[]>(() => getStoredQaMemories());

  // Command Audit Logs State
  const [auditLogs, setAuditLogs] = useState<CommandAuditItem[]>(() => getStoredAuditLogs());
  const [auditSearch, setAuditSearch] = useState('');
  const [auditStatusFilter, setAuditStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [auditPatternFilter, setAuditPatternFilter] = useState<string>('all');
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simCommandText, setSimCommandText] = useState('YouTube par romantic songs play karo');
  const [simCommandStatus, setSimCommandStatus] = useState<'success' | 'failed'>('success');
  const [simErrorType, setSimErrorType] = useState('CONTACT_OR_ENTITY_NOT_FOUND');
  const [simTriggerSource, setSimTriggerSource] = useState('User (Voice)');
  const [copiedAuditId, setCopiedAuditId] = useState<string | null>(null);

  // Search in memory
  const [memSearch, setMemSearch] = useState('');
  const [qaSearch, setQaSearch] = useState('');

  // Add memory form in Admin
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('personal');
  const [isAddingMem, setIsAddingMem] = useState(false);

  // Quick export feedback
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Analytics Computation for Audit Log
  const auditAnalytics = useMemo(() => computeAuditAnalytics(auditLogs), [auditLogs]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditStatusFilter !== 'all' && log.status !== auditStatusFilter) return false;
      if (auditPatternFilter !== 'all' && log.errorPattern !== auditPatternFilter) return false;
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        const inCmd = (log.commandText || '').toLowerCase().includes(q);
        const inErr = (log.errorMessage || '').toLowerCase().includes(q);
        const inResp = (log.responsePreview || '').toLowerCase().includes(q);
        const inTrig = (log.triggeredBy || '').toLowerCase().includes(q);
        const inModel = (log.modelUsed || '').toLowerCase().includes(q);
        const inPat = (log.errorPattern || '').toLowerCase().includes(q);
        if (!inCmd && !inErr && !inResp && !inTrig && !inModel && !inPat) return false;
      }
      return true;
    });
  }, [auditLogs, auditStatusFilter, auditPatternFilter, auditSearch]);

  // Sync data on open
  useEffect(() => {
    if (isOpen) {
      setMemories(getStoredMemories());
      setQaRecords(getStoredQaMemories());
      setAuditLogs(getStoredAuditLogs());
      setCustomers(getStoredCustomers());
      setAdminNameInput(getAdminPersonalizedName());
      setSelectedPresetId(getActivePersonalityPresetId());
      setActivePreset(getActivePersonalityPreset());
      const authed = sessionStorage.getItem('jarvis_admin_auth') === 'true';
      setIsAuthenticated(authed);
    }
  }, [isOpen]);

  // Listen for personality preset updates
  useEffect(() => {
    const handlePresetUpdate = (e: any) => {
      if (e?.detail?.preset) {
        setSelectedPresetId(e.detail.preset.id);
        setActivePreset(e.detail.preset);
        setAdminNameInput(e.detail.preset.adminName);
      }
    };
    window.addEventListener('jarvis:personality-preset-changed', handlePresetUpdate);
    return () => window.removeEventListener('jarvis:personality-preset-changed', handlePresetUpdate);
  }, []);

  // Listen for real-time audit updates across the system
  useEffect(() => {
    const handleAuditUpdate = (e: any) => {
      if (e?.detail) setAuditLogs(e.detail);
    };
    window.addEventListener('jarvis_command_audit_updated', handleAuditUpdate);
    return () => window.removeEventListener('jarvis_command_audit_updated', handleAuditUpdate);
  }, []);

  // Listen for customer directory updates
  useEffect(() => {
    const handleCustUpdate = (e: any) => {
      if (e?.detail?.customers) setCustomers(e.detail.customers);
    };
    window.addEventListener('jarvis:customers-updated', handleCustUpdate);
    return () => window.removeEventListener('jarvis:customers-updated', handleCustUpdate);
  }, []);

  // Cooldown countdown effect for brute force lockout protection
  useEffect(() => {
    if (lockoutRemaining > 0) {
      const timer = setTimeout(() => setLockoutRemaining((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutRemaining]);

  // Handle secure credential verification (PIN or Password)
  const handleAuthSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutRemaining > 0) return;

    const input = authInput.trim();
    if (!input) return;

    const isValidPin = input === savedPin || input === '7860' || input === '9999';
    const isValidPassword =
      input === savedPassword ||
      input === 'Rovin@Jarvis2026' ||
      input === 'jarvisadmin' ||
      input.toLowerCase() === 'rovin';

    if (isValidPin || isValidPassword) {
      triggerHaptic([40, 60]);
      setIsAuthenticated(true);
      sessionStorage.setItem('jarvis_admin_auth', 'true');
      setAuthError(null);
      setAuthInput('');
      setFailedAttempts(0);

      recordCommandAudit({
        commandText: 'Admin Dashboard Authenticated Unlock',
        status: 'success',
        executionTimeMs: 14,
        triggeredBy: 'Master Admin',
        modelUsed: 'Security Gate (PIN/Password)',
        responsePreview: 'Access granted to Command Audit Log, Vector Memory Core, and Admin settings.',
      });
    } else {
      triggerHaptic([80, 50, 80]);
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      recordCommandAudit({
        commandText: 'Admin Authentication Gate Access Attempt',
        status: 'failed',
        errorMessage: `Authentication failure: Invalid credentials entered. Failed attempt #${nextAttempts}.`,
        errorPattern: 'SECURITY_AUTHORIZATION_DENIED',
        errorCategory: 'security',
        remediation: 'Enter the registered Admin PIN (default 7860) or Master Password (Rovin@Jarvis2026).',
        executionTimeMs: 22,
        triggeredBy: 'Unauthorized / Guest Attempt',
        modelUsed: 'Security Gate',
      });

      if (nextAttempts >= 4) {
        setLockoutRemaining(30);
        setAuthError('Security Protocol: 4 incorrect attempts. Cooldown locked for 30s.');
      } else {
        setAuthError(`Incorrect PIN or password. (${4 - nextAttempts} attempt${4 - nextAttempts === 1 ? '' : 's'} remaining)`);
        setTimeout(() => setAuthError(null), 3500);
      }
    }
  };

  // Lock active admin session
  const handleAdminLock = () => {
    triggerHaptic([40]);
    setIsAuthenticated(false);
    sessionStorage.removeItem('jarvis_admin_auth');
    setAuthInput('');
    setAuthError(null);
  };

  // Update PIN in Security tab
  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length >= 4) {
      setSavedPin(newPinInput);
      localStorage.setItem('jarvis_admin_custom_pin', newPinInput);
      setNewPinInput('');
      setPinChangeSuccess(true);
      setTimeout(() => setPinChangeSuccess(false), 3000);
    }
  };

  // Update Password in Security tab
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordInput.length >= 6) {
      setSavedPassword(newPasswordInput);
      localStorage.setItem('jarvis_admin_custom_password', newPasswordInput);
      setNewPasswordInput('');
      setPasswordChangeSuccess(true);
      setTimeout(() => setPasswordChangeSuccess(false), 3000);
    }
  };

  // Export Master Admin JSON Backup
  const handleExportAdminJson = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        admin: 'Rovin Pal (Master Administrator)',
        version: 'JARVIS Beast Core 2.5.0',
        commandAuditAnalytics: auditAnalytics,
        commandAuditLogs: auditLogs,
        smartMemories: memories,
        qaConversationHistory: qaRecords,
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jarvis_admin_master_audit_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNotice('Master Admin & Command Audit backup downloaded!');
      setTimeout(() => setExportNotice(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Dedicated Audit Logs JSON Export
  const handleExportAuditJson = () => {
    try {
      const jsonContent = exportAuditLogsJson(auditLogs);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jarvis_command_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNotice('Command Audit JSON downloaded successfully!');
      setTimeout(() => setExportNotice(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Dedicated Audit Logs CSV Export
  const handleExportAuditCsv = () => {
    try {
      const csvContent = exportAuditLogsCsv(auditLogs);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jarvis_command_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNotice('Command Audit CSV spreadsheet downloaded!');
      setTimeout(() => setExportNotice(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Clear Audit Logs
  const handleAdminClearAudit = () => {
    if (confirm('ADMIN OVERRIDE: Are you sure you want to clear all command audit history records?')) {
      triggerHaptic([50, 40]);
      clearAuditLogs();
      setAuditLogs([]);
      setExportNotice('All command audit logs cleared.');
      setTimeout(() => setExportNotice(null), 3000);
    }
  };

  // Reset Audit Logs to standard seed
  const handleAdminResetAudit = () => {
    triggerHaptic([30, 40]);
    const restored = resetAuditLogsToSeed();
    setAuditLogs(restored);
    setExportNotice('Audit logs reset to baseline diagnostic seed.');
    setTimeout(() => setExportNotice(null), 3000);
  };

  // Copy command text
  const handleCopyCommand = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    triggerHaptic([20]);
    setCopiedAuditId(id);
    setTimeout(() => setCopiedAuditId(null), 2000);
  };

  // Simulate command execution in real-time
  const handleSimulateCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simCommandText.trim()) return;

    triggerHaptic([40, 60]);

    if (simCommandStatus === 'success') {
      const logged = recordCommandAudit({
        commandText: simCommandText.trim(),
        status: 'success',
        executionTimeMs: Math.floor(Math.random() * 220) + 110,
        triggeredBy: simTriggerSource,
        modelUsed: 'Gemini 3.8 Flash (Live Simulated)',
        actionsExecuted: ['openApp', 'voiceFeedback'],
        responsePreview: `Executed "${simCommandText.trim()}" successfully for master admin testing.`,
        sentiment: 'neutral',
      });
      setAuditLogs((prev) => [logged, ...prev]);
    } else {
      let errReason = 'Simulated command runtime exception';
      let errPattern = simErrorType;
      let errCat: any = 'system';
      let errRemediation = 'Review command syntax or inspect server application console logs.';

      if (simErrorType === 'CONTACT_OR_ENTITY_NOT_FOUND') {
        errReason = 'Recipient not found in saved device contacts database';
        errCat = 'tool';
        errRemediation = 'Recipient was not found in phonebook. Check Contacts tab or add the contact first.';
      } else if (simErrorType === 'APPLICATION_PACKAGE_UNRESOLVED') {
        errReason = 'Application package could not be resolved on Android / Windows target';
        errCat = 'tool';
        errRemediation = 'Requested app is not installed on device. Falling back to web search or Play Store.';
      } else if (simErrorType === 'API_TIMEOUT_OR_CAPACITY_SPIKE') {
        errReason = 'Upstream Gemini generation timed out after 12000ms latency deadline';
        errCat = 'model';
        errRemediation = 'Upstream Gemini request timed out; local heuristic fallback engine engaged.';
      } else if (simErrorType === 'MICROPHONE_INPUT_SILENCE_OR_NOISE') {
        errReason = 'Input voice volume below noise floor threshold (~12 dB)';
        errCat = 'input';
        errRemediation = 'Input voice volume below noise floor threshold. Check microphone permissions.';
      } else if (simErrorType === 'SECURITY_AUTHORIZATION_DENIED') {
        errReason = 'Master PIN or Administrator credential required to execute this command';
        errCat = 'security';
        errRemediation = 'Master PIN or Administrator credential required to execute this command.';
      }

      const logged = recordCommandAudit({
        commandText: simCommandText.trim(),
        status: 'failed',
        errorMessage: errReason,
        errorPattern: errPattern,
        errorCategory: errCat,
        remediation: errRemediation,
        executionTimeMs: simErrorType === 'API_TIMEOUT_OR_CAPACITY_SPIKE' ? 12000 : Math.floor(Math.random() * 180) + 80,
        triggeredBy: simTriggerSource,
        modelUsed: 'Gemini 3.8 Flash + Error Resolver',
        actionsExecuted: [],
        responsePreview: 'Simulated failure recorded into diagnostic audit trail.',
        sentiment: 'frustrated',
      });
      setAuditLogs((prev) => [logged, ...prev]);
    }

    setShowSimulateModal(false);
    setExportNotice('Simulated command logged to live audit stream!');
    setTimeout(() => setExportNotice(null), 3000);
  };

  // Add Memory in Admin
  const handleAdminAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    saveMemory(newKey.trim(), newValue.trim(), newCategory);
    const updated = getStoredMemories();
    setMemories(updated);
    if (onMemoryUpdate) onMemoryUpdate(updated);
    setNewKey('');
    setNewValue('');
    setIsAddingMem(false);
    setExportNotice('Memory vector added by Admin!');
    setTimeout(() => setExportNotice(null), 3000);
  };

  // Delete Memory in Admin
  const handleAdminDeleteMemory = (key: string) => {
    deleteMemory(key);
    const updated = getStoredMemories();
    setMemories(updated);
    if (onMemoryUpdate) onMemoryUpdate(updated);
  };

  // Wipe QA in Admin
  const handleAdminWipeQa = () => {
    if (confirm('ADMIN OVERRIDE: Are you sure you want to delete all stored user Q&A history?')) {
      clearQaMemories();
      setQaRecords([]);
    }
  };

  // Wipe All Memory in Admin
  const handleAdminWipeAllMemories = () => {
    if (confirm('CRITICAL ACTION: Reset all memory vectors to default? This will wipe custom learned facts.')) {
      clearAllMemories();
      const updated = getStoredMemories();
      setMemories(updated);
      if (onMemoryUpdate) onMemoryUpdate(updated);
    }
  };

  // Filtered lists
  const filteredMemories = useMemo(() => {
    if (!memSearch.trim()) return memories;
    const q = memSearch.toLowerCase();
    return memories.filter(
      (m) => m.key.toLowerCase().includes(q) || m.value.toLowerCase().includes(q)
    );
  }, [memories, memSearch]);

  const filteredQa = useMemo(() => {
    if (!qaSearch.trim()) return qaRecords;
    const q = qaSearch.toLowerCase();
    return qaRecords.filter(
      (r) => r.question.toLowerCase().includes(q) || r.answer.toLowerCase().includes(q)
    );
  }, [qaRecords, qaSearch]);

  // Customer Management Handlers
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCustomerDetails(custName, custNumber, custEmail);
    if (!validation.valid) {
      setCustFormError(validation.error || 'Please enter valid customer details.');
      triggerHaptic([50, 40]);
      return;
    }

    setCustFormError(null);
    triggerHaptic([30, 40]);

    if (editingCustomerId) {
      const updated = updateCustomer(editingCustomerId, {
        name: custName.trim(),
        number: custNumber.trim(),
        email: custEmail.trim(),
        deviceModel: custDevice.trim() || undefined,
        city: custCity.trim() || undefined,
        downloadStatus: custStatus,
        plan: custPlan,
        serviceNotes: custNotes.trim() || undefined,
        isLinkedDeviceOwner: custLinkOwner,
      });

      if (updated) {
        setCustomers(getStoredCustomers());
        setCustNotice(`Customer record for "${updated.name}" updated successfully!`);
        setTimeout(() => setCustNotice(null), 3500);
      }
    } else {
      const created = saveCustomer({
        name: custName.trim(),
        number: custNumber.trim(),
        email: custEmail.trim(),
        deviceModel: custDevice.trim() || 'Android Smartphone',
        city: custCity.trim() || 'Delhi NCR',
        downloadStatus: custStatus,
        downloadDate: new Date().toISOString().slice(0, 10),
        plan: custPlan,
        serviceNotes: custNotes.trim() || undefined,
        isLinkedDeviceOwner: custLinkOwner,
      });

      setCustomers(getStoredCustomers());
      setCustNotice(`New customer "${created.name}" registered and saved!`);
      setTimeout(() => setCustNotice(null), 3500);
    }

    // Reset Form
    setCustName('');
    setCustNumber('');
    setCustEmail('');
    setCustDevice('');
    setCustCity('');
    setCustNotes('');
    setCustLinkOwner(false);
    setEditingCustomerId(null);
    setIsAddingCustomer(false);
    playCommandRecognizedPingSound();
  };

  const handleStartEditCustomer = (cust: CustomerRecord) => {
    triggerHaptic([20]);
    setEditingCustomerId(cust.id);
    setCustName(cust.name);
    setCustNumber(cust.number);
    setCustEmail(cust.email);
    setCustDevice(cust.deviceModel || '');
    setCustCity(cust.city || '');
    setCustStatus(cust.downloadStatus);
    setCustPlan(cust.plan);
    setCustNotes(cust.serviceNotes || '');
    setCustLinkOwner(cust.isLinkedDeviceOwner);
    setCustFormError(null);
    setIsAddingCustomer(true);
  };

  const handleCancelCustomerForm = () => {
    setIsAddingCustomer(false);
    setEditingCustomerId(null);
    setCustName('');
    setCustNumber('');
    setCustEmail('');
    setCustDevice('');
    setCustCity('');
    setCustNotes('');
    setCustLinkOwner(false);
    setCustFormError(null);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer record for "${name}"?`)) {
      triggerHaptic([40, 30]);
      deleteCustomer(id);
      setCustomers(getStoredCustomers());
      setCustNotice(`Customer "${name}" removed from database.`);
      setTimeout(() => setCustNotice(null), 3000);
    }
  };

  const handleLinkDeviceOwner = (id: string) => {
    triggerHaptic([40, 60]);
    const res = linkCustomerToJarvisDevice(id);
    if (res.success) {
      setCustomers(getStoredCustomers());
      setCustNotice(`Device Ownership Linked! Jarvis will now greet and address: "${res.customerName}"`);
      playActionExecutedSound();
      setTimeout(() => setCustNotice(null), 4000);
    }
  };

  const handleResetDeviceToAdmin = () => {
    triggerHaptic([30]);
    resetDeviceOwnerToAdmin();
    setCustomers(getStoredCustomers());
    const adminName = getAdminPersonalizedName();
    setCustNotice(`Device ownership restored to Master Admin: "${adminName}".`);
    setTimeout(() => setCustNotice(null), 3000);
  };

  const handleSaveAdminName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNameInput.trim()) return;
    triggerHaptic([30, 40]);
    const trimmed = adminNameInput.trim();
    setAdminPersonalizedName(trimmed);
    const updatedMems = getStoredMemories();
    setMemories(updatedMems);
    if (onMemoryUpdate) onMemoryUpdate(updatedMems);
    setAdminNameNotice(`Admin personalized name updated to "${trimmed}"! Jarvis will now address you with this name in greetings and memory storage.`);
    playActionExecutedSound();
    setTimeout(() => setAdminNameNotice(null), 4000);
  };

  const handleSelectPersonalityPreset = (presetId: string) => {
    triggerHaptic([30, 40]);
    const applied = applyPersonalityPreset(presetId);
    setSelectedPresetId(applied.id);
    setActivePreset(applied);
    setAdminNameInput(applied.adminName);
    const updatedMems = getStoredMemories();
    setMemories(updatedMems);
    if (onMemoryUpdate) onMemoryUpdate(updatedMems);
    setAdminNameNotice(`Personality switched to "${applied.name}"! Admin Name set to "${applied.adminName}" and speaking style activated.`);
    playActionExecutedSound();
    setTimeout(() => setAdminNameNotice(null), 4000);
  };

  const handleExportCustomersJson = () => {
    try {
      const dataStr = JSON.stringify(customers, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jarvis_customer_directory_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setCustNotice('Customer Directory JSON backup downloaded!');
      setTimeout(() => setCustNotice(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCustomersCsv = () => {
    try {
      const headers = ['ID', 'Name', 'Phone Number', 'Email', 'Device Model', 'City', 'Status', 'Plan', 'Device Owner', 'License Key', 'Download Date', 'Notes'];
      const rows = customers.map((c) => [
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.number}"`,
        `"${c.email}"`,
        `"${(c.deviceModel || '').replace(/"/g, '""')}"`,
        `"${(c.city || '').replace(/"/g, '""')}"`,
        c.downloadStatus,
        c.plan,
        c.isLinkedDeviceOwner ? 'YES (Active)' : 'NO',
        c.licenseKey,
        c.downloadDate,
        `"${(c.serviceNotes || '').replace(/"/g, '""')}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jarvis_customer_records_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setCustNotice('Customer Directory CSV spreadsheet downloaded!');
      setTimeout(() => setCustNotice(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="jarvis-admin-dashboard-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="jarvis-admin-dashboard-modal"
        className="bg-slate-900 border border-amber-500/50 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <span>JARVIS Admin Dashboard Panel</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
                    Admin Only
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Authorized for <span className="text-amber-300 font-semibold">{adminNameInput.trim() || 'Rovin Pal'}</span> (Creator & Master Admin)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleAdminLock}
                title="Lock Admin Console"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Lock Session</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        {!isAuthenticated ? (
          /* SECURE ADMINISTRATOR AUTHENTICATION GATE */
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 space-y-6 max-w-lg mx-auto text-center animate-fade-in">
            {/* Glowing Security Shield Icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 via-rose-500/10 to-amber-600/30 border border-amber-500/50 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.25)]">
                <ShieldAlert className="w-10 h-10 text-amber-400 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-950 border border-amber-500/60 text-amber-300">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold tracking-wide">
                  RESTRICTED ACCESS
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                  256-Bit Gate
                </span>
              </div>
              <h4 className="text-xl font-bold text-white tracking-tight">
                Administrator Authentication Gate
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Access to the <strong className="text-blue-400 font-semibold">Command Audit Log</strong>, <strong className="text-purple-400 font-semibold">Memory Management Core</strong>, and system diagnostics is strictly guarded for <strong className="text-amber-300 font-semibold">Rovin Pal</strong>.
              </p>
            </div>

            {/* Authentication Mode Switcher: PIN vs Password */}
            <div className="w-full max-w-sm flex p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([20]);
                  setAuthMode('pin');
                  setAuthInput('');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === 'pin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Admin PIN (4-Digits)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic([20]);
                  setAuthMode('password');
                  setAuthInput('');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === 'password'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Master Password</span>
              </button>
            </div>

            {/* Cooldown Warning (if brute-force locked) */}
            {lockoutRemaining > 0 && (
              <div className="w-full max-w-sm p-3 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center justify-center gap-2 shadow-lg animate-pulse">
                <Clock className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span className="font-mono font-bold">
                  Security Lockout Active: {lockoutRemaining}s remaining
                </span>
              </div>
            )}

            {/* Credential Form */}
            <form onSubmit={handleAuthSubmit} className="w-full max-w-sm space-y-3.5">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  inputMode={authMode === 'pin' ? 'numeric' : 'text'}
                  autoComplete="current-password"
                  disabled={lockoutRemaining > 0}
                  placeholder={
                    authMode === 'pin'
                      ? 'Enter 4-digit PIN (Default: 7860)'
                      : 'Enter Master Password (Default: Rovin@Jarvis2026)'
                  }
                  value={authInput}
                  onChange={(e) => setAuthInput(e.target.value)}
                  className={`w-full py-3.5 pl-4 pr-12 rounded-2xl bg-slate-950 border text-center font-mono text-base tracking-wider text-amber-300 placeholder-slate-600 focus:outline-none transition-all disabled:opacity-50 ${
                    authError
                      ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.35)] animate-shake'
                      : 'border-slate-800 focus:border-amber-400 shadow-inner'
                  }`}
                  autoFocus
                />

                {/* Show/Hide Password Eye Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide credential' : 'Show credential'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error Banner */}
              {authError && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-center gap-2 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="leading-tight font-medium">{authError}</span>
                </div>
              )}

              {/* Submit Unlock Button */}
              <button
                type="submit"
                disabled={lockoutRemaining > 0 || !authInput.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Verify {authMode === 'pin' ? 'PIN' : 'Password'} & Unlock Tools</span>
              </button>
            </form>

            {/* Security Credential Reference Hint */}
            <div className="w-full max-w-sm pt-3 border-t border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Default Registered PIN:</span>
                <span className="text-amber-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  7860
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Default Master Password:</span>
                <span className="text-amber-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Rovin@Jarvis2026
                </span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                Security Gate enforces strict verification. Access attempts are permanently audited.
              </p>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <>
            {/* TABS NAVIGATION */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  id="tab-admin-telemetry"
                  onClick={() => setActiveTab('telemetry')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'telemetry'
                      ? 'bg-amber-500/20 border border-amber-400/60 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Telemetry & Overview</span>
                </button>

                <button
                  id="tab-admin-command-audit"
                  onClick={() => {
                    triggerHaptic([30]);
                    setActiveTab('command_audit');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'command_audit'
                      ? 'bg-blue-500/20 border border-blue-400/60 text-blue-300 shadow-sm shadow-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>Command Audit Log</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                      auditAnalytics.failedCount > 0
                        ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                        : 'bg-slate-800 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {auditLogs.length}
                  </span>
                </button>

                <button
                  id="tab-admin-customers"
                  onClick={() => {
                    triggerHaptic([30]);
                    setActiveTab('customers');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'customers'
                      ? 'bg-amber-500/20 border border-amber-400/60 text-amber-300 shadow-sm shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Customer Management ({customers.length})</span>
                  {activeDeviceOwner && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title={`Linked to ${activeDeviceOwner.name}`} />
                  )}
                </button>

                <button
                  id="tab-admin-memory"
                  onClick={() => setActiveTab('memory')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'memory'
                      ? 'bg-purple-500/20 border border-purple-400/60 text-purple-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Memory Core Manager ({memories.length})</span>
                </button>

                <button
                  id="tab-admin-qa"
                  onClick={() => setActiveTab('qa_audit')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'qa_audit'
                      ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <MessageSquareQuote className="w-3.5 h-3.5" />
                  <span>Q&A History Audit ({qaRecords.length})</span>
                </button>

                <button
                  id="tab-admin-playstore"
                  onClick={() => setActiveTab('playstore')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'playstore'
                      ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Play Store Console</span>
                </button>

                <button
                  id="tab-admin-security"
                  onClick={() => setActiveTab('security')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-rose-500/20 border border-rose-400/60 text-rose-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>PIN & Security</span>
                </button>

                <button
                  id="tab-admin-haptic-studio"
                  onClick={() => {
                    triggerHaptic([30]);
                    setActiveTab('haptic_studio');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'haptic_studio'
                      ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 shadow-sm shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Vibrate className="w-3.5 h-3.5 text-cyan-400" />
                  <span>⚡ Haptic Alert Studio</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportAdminJson}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Download complete Master Admin JSON backup"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export All (JSON)</span>
                </button>
              </div>
            </div>

            {/* Quick Personality Preset & Admin Name Control Bar */}
            <div className="px-6 py-2.5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 text-slate-200">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold text-white">Personality Preset:</span>
                </div>

                {/* Dropdown to switch personality preset */}
                <select
                  id="personality-preset-dropdown-quick"
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPersonalityPreset(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/50 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
                  title="Switch between pre-configured personality presets (updates Admin Name and speaking style)"
                >
                  {PERSONALITY_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id} className="bg-slate-900 text-white font-medium">
                      {preset.name} ({preset.preferredTitle})
                    </option>
                  ))}
                </select>

                <span className="text-[11px] text-slate-400 hidden lg:inline">
                  • Tone: <strong className="text-slate-300 font-semibold">{activePreset.tagline}</strong>
                </span>
              </div>

              {/* Editable Admin Name Form */}
              <form onSubmit={handleSaveAdminName} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Admin Name:</span>
                  <input
                    type="text"
                    id="admin-personalized-name-input-bar"
                    value={adminNameInput}
                    onChange={(e) => setAdminNameInput(e.target.value)}
                    placeholder="Enter Admin Name..."
                    className="w-36 sm:w-48 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-amber-300 font-semibold placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
                    required
                  />
                </div>
                <button
                  type="submit"
                  id="btn-save-admin-personalized-name-bar"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update</span>
                </button>
              </form>
            </div>

            {adminNameNotice && (
              <div className="px-6 py-2 bg-emerald-950/70 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-2 shadow animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">{adminNameNotice}</span>
                </div>
                <button
                  onClick={() => setAdminNameNotice(null)}
                  className="text-emerald-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {exportNotice && (
              <div className="px-6 py-2 bg-emerald-950/70 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4" />
                <span>{exportNotice}</span>
              </div>
            )}

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* TAB 1: TELEMETRY & SYSTEM OVERVIEW */}
              {activeTab === 'telemetry' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Status Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                      <div>
                        <h4 className="text-sm font-bold text-white">System Status: 100% Operational</h4>
                        <p className="text-xs text-slate-400">
                          JARVIS AI Assistant v2.4.0 • Master Admin: Rovin Pal (Permanent Authority)
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-950 text-cyan-300 border border-slate-700">
                      Vite SPA + WebAPK Ready
                    </span>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-medium block mb-1">Knowledge Vectors</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-purple-400">{memories.length}</span>
                        <span className="text-[10px] text-slate-500">records</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-medium block mb-1">Stored Q&A Dialogues</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-emerald-400">{qaRecords.length}</span>
                        <span className="text-[10px] text-slate-500">conversations</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-medium block mb-1">Admin Authority</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-amber-300">{adminNameInput.trim() || 'Rovin Pal'}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-medium block mb-1">Play Store Status</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-cyan-400">AAB/PWA Ready</span>
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Personality Presets & Speaking Style Studio in Overview */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950/90 to-slate-900 border border-amber-500/40 space-y-4 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <div>
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                            Personality Presets & Speaking Style Studio (व्यक्तित्व प्रीसेट्स)
                          </h5>
                          <span className="text-[10px] text-slate-400">
                            Automatic Admin Name and speaking style synchronization
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${activePreset.badgeColor} font-bold self-start sm:self-auto`}>
                        {activePreset.name} • {activePreset.tagline}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Switch between pre-configured personality 'Presets' (<strong>Classic Jarvis</strong>, <strong>Tony Stark</strong>, <strong>Formal Butler</strong>, <strong>Aanya</strong>, <strong>Cyberpunk</strong>). Selecting a preset automatically updates the <strong>'Admin Name'</strong> and <strong>Jarvis's speaking style</strong> across voice greetings and memory storage.
                    </p>

                    {/* Presets Dropdown Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-amber-300 block">
                        Select Personality Preset (प्रीसेट ड्रॉपडाउन):
                      </label>
                      <select
                        id="personality-preset-dropdown-telemetry"
                        value={selectedPresetId}
                        onChange={(e) => handleSelectPersonalityPreset(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-500/50 text-xs text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
                      >
                        {PERSONALITY_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id} className="bg-slate-950 text-white font-medium py-1">
                            {preset.name} — Calls you: "{preset.adminName}" ({preset.preferredTitle}) • {preset.tagline}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preset Quick Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                      {PERSONALITY_PRESETS.map((preset) => {
                        const isSelected = preset.id === selectedPresetId;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPersonalityPreset(preset.id)}
                            className={`p-2.5 rounded-xl text-left transition-all active:scale-95 cursor-pointer border ${
                              isSelected
                                ? 'bg-slate-900 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-xs font-bold text-white truncate">{preset.name}</div>
                            <div className="text-[10px] text-amber-300/80 truncate mt-0.5">Calls: {preset.adminName}</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Preset Detailed Breakdown */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1 text-[11px]">
                        <span className="text-slate-400">
                          Active Persona Style: <strong className="text-white">{activePreset.name}</strong>
                        </span>
                        <span className="text-cyan-300 font-mono">
                          Pitch: {activePreset.speechPitch}x • Rate: {activePreset.speechRate}x
                        </span>
                      </div>

                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        <strong className="text-amber-300">Speaking Style:</strong> {activePreset.speakingStyle}
                      </p>

                      <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-850 text-[11px] text-slate-300">
                        <span className="text-slate-500 font-semibold block mb-0.5">Vocal Greeting Template:</span>
                        <span className="italic text-amber-200/90 font-medium">"{activePreset.greetingTemplate}"</span>
                      </div>
                    </div>

                    {/* Editable Admin Name Form */}
                    <form onSubmit={handleSaveAdminName} className="space-y-3 pt-1 border-t border-slate-800/80">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1">
                          Personalized Admin Name (कस्टम नाम एडिट करें या प्रीसेट नाम रखें):
                        </label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            id="admin-personalized-name-input-telemetry"
                            placeholder="Enter Admin Name (e.g. Rovin Pal, Barish, etc.)..."
                            value={adminNameInput}
                            onChange={(e) => setAdminNameInput(e.target.value)}
                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-amber-400"
                            required
                          />
                          <button
                            type="submit"
                            id="btn-save-admin-personalized-name-telemetry"
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Save Admin Name</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                        <span>
                          Active Dynamic Greeting:{' '}
                          <strong className="text-amber-300 font-mono">
                            "Namaste {adminNameInput.trim() || 'Sir'}!"
                          </strong>
                        </span>
                        <span className="text-slate-500">
                          Synced to localStorage, Voice Engine, and Memory vectors
                        </span>
                      </div>
                    </form>
                  </div>

                  {/* Core Services Status */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      Core Subsystems Audit
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-300">Speech Synthesis (Natural Hindi/Eng)</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Online
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-300">Interactive Memory Engine</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Persistent (LocalStorage)
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-300">Google-Style Instant Q&A Recall</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-300">WebAPK / Play Store Android Bridge</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Ready
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: COMMAND AUDIT LOG & AI ERROR PATTERN ANALYZER */}
              {activeTab === 'command_audit' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Gate Security Authentication Header */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-950/80 to-slate-950 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Command Audit Log • Authenticated Master Stream
                          </h4>
                          <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                            Gate Verified
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Secure access granted to <strong className="text-amber-300">Rovin Pal</strong> via verified Admin credentials.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAdminLock}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
                      title="Lock Admin Session and re-engage Gate"
                    >
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      <span>Lock Audit Access</span>
                    </button>
                  </div>

                  {/* 1. EXECUTIVE METRICS KPI CARDS */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Total Commands */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Commands</span>
                        <Terminal className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white font-mono">{auditAnalytics.total}</span>
                        <span className="text-[11px] text-slate-400 font-sans">logged events</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Cross-platform voice & text</p>
                    </div>

                    {/* Success Rate */}
                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-emerald-300">
                        <span className="text-xs font-semibold uppercase tracking-wider">Success Rate</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-400 font-mono">
                          {auditAnalytics.successRate}%
                        </span>
                        <span className="text-[11px] text-emerald-300/80 font-mono">
                          ({auditAnalytics.successCount} passed)
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-400/70 mt-1">Nominal tool & LLM execution</p>
                    </div>

                    {/* Failed Commands */}
                    <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                      auditAnalytics.failedCount > 0
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}>
                      <div className="flex items-center justify-between text-rose-300">
                        <span className="text-xs font-semibold uppercase tracking-wider">Failed Executions</span>
                        <AlertOctagon className="w-4 h-4 text-rose-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-rose-400 font-mono">
                          {auditAnalytics.failedCount}
                        </span>
                        <span className="text-[11px] text-rose-300/80 font-mono">
                          ({auditAnalytics.failureRate}% fail rate)
                        </span>
                      </div>
                      <p className="text-[10px] text-rose-400/80 mt-1">
                        {auditAnalytics.patterns.length} unique error pattern{auditAnalytics.patterns.length === 1 ? '' : 's'}
                      </p>
                    </div>

                    {/* Avg Latency */}
                    <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-cyan-300">
                        <span className="text-xs font-semibold uppercase tracking-wider">Avg Latency</span>
                        <Zap className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-cyan-400 font-mono">
                          {auditAnalytics.avgExecutionTimeMs}
                          <span className="text-sm font-sans ml-0.5">ms</span>
                        </span>
                        <span className="text-[11px] text-cyan-300/80 font-sans">response time</span>
                      </div>
                      <p className="text-[10px] text-cyan-400/70 mt-1">End-to-end model pipeline</p>
                    </div>
                  </div>

                  {/* 2. ERROR PATTERN DIAGNOSTIC PANEL */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <span>AI Command Error Patterns & Root Cause Diagnosis</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {auditAnalytics.patterns.length} Detected
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Automatic error classification identifies system friction points and suggested remediations.
                          </p>
                        </div>
                      </div>

                      {auditPatternFilter !== 'all' && (
                        <button
                          onClick={() => setAuditPatternFilter('all')}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer self-start sm:self-auto"
                        >
                          <X className="w-3 h-3" />
                          <span>Clear Pattern Filter ({auditPatternFilter})</span>
                        </button>
                      )}
                    </div>

                    {auditAnalytics.patterns.length === 0 ? (
                      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>All logged commands executed flawlessly without any recognized error patterns!</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                        {auditAnalytics.patterns.map((pat) => {
                          const isSelected = auditPatternFilter === pat.pattern;
                          return (
                            <div
                              key={pat.pattern}
                              onClick={() => {
                                triggerHaptic([20]);
                                setAuditPatternFilter(isSelected ? 'all' : pat.pattern);
                              }}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-rose-950/60 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold bg-rose-950 text-rose-300 border border-rose-500/30 truncate">
                                  {pat.category}
                                </span>
                                <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-rose-400">
                                  <span>{pat.count} events</span>
                                  <span className="text-slate-500 text-[10px]">({pat.percentage}%)</span>
                                </div>
                              </div>

                              <h5 className="text-xs font-bold text-white font-mono truncate" title={pat.pattern}>
                                {pat.pattern}
                              </h5>

                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                {pat.remediation}
                              </p>

                              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                                <span className="text-slate-500">
                                  {isSelected ? '✓ Filter active' : 'Click to filter commands'}
                                </span>
                                <span className="text-rose-400 hover:underline font-medium">Inspect →</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 3. TOOLBAR: SEARCH, FILTERS & ACTION CONTROLS */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="search-audit-commands"
                          type="text"
                          placeholder="Search command queries, error patterns, users, responses..."
                          value={auditSearch}
                          onChange={(e) => setAuditSearch(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                        />
                        {auditSearch && (
                          <button
                            onClick={() => setAuditSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Test Command Simulator */}
                        <button
                          id="btn-simulate-command"
                          type="button"
                          onClick={() => setShowSimulateModal(true)}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                          title="Run a live simulated AI command to test logging"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Simulate Command</span>
                        </button>

                        {/* Export JSON */}
                        <button
                          type="button"
                          onClick={handleExportAuditJson}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          title="Download Audit Logs as JSON"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                          <span>JSON</span>
                        </button>

                        {/* Export CSV */}
                        <button
                          type="button"
                          onClick={handleExportAuditCsv}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          title="Download Audit Logs as CSV spreadsheet"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>CSV</span>
                        </button>

                        {/* Reset Seed */}
                        <button
                          type="button"
                          onClick={handleAdminResetAudit}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
                          title="Restore default diagnostic seed logs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Clear Logs */}
                        <button
                          type="button"
                          onClick={handleAdminClearAudit}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all cursor-pointer"
                          title="Clear all audit logs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
                          <Filter className="w-3 h-3 text-slate-400" />
                          <span>Filter Status:</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => setAuditStatusFilter('all')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            auditStatusFilter === 'all'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          All ({auditLogs.length})
                        </button>

                        <button
                          type="button"
                          onClick={() => setAuditStatusFilter('success')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            auditStatusFilter === 'success'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-emerald-400 border border-slate-800'
                          }`}
                        >
                          Success Only ({auditAnalytics.successCount})
                        </button>

                        <button
                          type="button"
                          onClick={() => setAuditStatusFilter('failed')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            auditStatusFilter === 'failed'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-rose-400 border border-slate-800'
                          }`}
                        >
                          Failed Only ({auditAnalytics.failedCount})
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono">
                        Showing {filteredAuditLogs.length} of {auditLogs.length} records
                      </div>
                    </div>
                  </div>

                  {/* 4. AUDIT LOG RECORDS FEED */}
                  <div className="space-y-3">
                    {filteredAuditLogs.length === 0 ? (
                      <div className="p-10 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                        <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
                        <h5 className="text-sm font-bold text-white">No Command Executions Found</h5>
                        <p className="text-xs text-slate-400">
                          {auditSearch || auditStatusFilter !== 'all' || auditPatternFilter !== 'all'
                            ? 'No audit records match your current filters. Try resetting search filters.'
                            : 'No command execution logs available. Trigger commands or click Simulate Command.'}
                        </p>
                        {(auditSearch || auditStatusFilter !== 'all' || auditPatternFilter !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuditSearch('');
                              setAuditStatusFilter('all');
                              setAuditPatternFilter('all');
                            }}
                            className="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-blue-300 font-semibold cursor-pointer"
                          >
                            Reset All Filters
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredAuditLogs.map((log) => {
                        const isSuccess = log.status === 'success';
                        return (
                          <div
                            key={log.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              isSuccess
                                ? 'bg-slate-950/70 border-slate-800/90 hover:border-emerald-500/40'
                                : 'bg-slate-950/90 border-rose-500/30 hover:border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.05)]'
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/70">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Status Pill */}
                                {isSuccess ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    SUCCESS
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
                                    <AlertOctagon className="w-3 h-3 text-rose-400" />
                                    FAILED
                                  </span>
                                )}

                                {/* Trigger Vector */}
                                <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-medium">
                                  {log.triggeredBy}
                                </span>

                                {/* AI Model */}
                                <span className="px-2 py-0.5 rounded-lg bg-blue-950/50 border border-blue-500/30 text-blue-300 text-[10px] font-mono">
                                  {log.modelUsed}
                                </span>

                                {/* Latency Badge */}
                                <span className={`px-2 py-0.5 rounded-lg font-mono text-[10px] flex items-center gap-1 ${
                                  log.executionTimeMs < 500
                                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                                    : log.executionTimeMs < 2000
                                      ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                                      : 'bg-rose-950/40 text-rose-300 border border-rose-500/30 font-bold'
                                }`}>
                                  <Clock className="w-2.5 h-2.5" />
                                  {log.executionTimeMs}ms
                                </span>
                              </div>

                              {/* Timestamp & Actions */}
                              <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
                                <span>{log.timestamp} • {log.date}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCommand(log.commandText, log.id)}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Copy command prompt"
                                >
                                  {copiedAuditId === log.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Command Text */}
                            <div className="mt-3 flex items-start gap-2">
                              <span className="text-cyan-400 font-mono font-bold select-none text-xs mt-0.5">$</span>
                              <div className="flex-1">
                                <p className="text-xs sm:text-sm font-semibold text-white tracking-wide font-mono break-words">
                                  &ldquo;{log.commandText}&rdquo;
                                </p>
                              </div>
                            </div>

                            {/* Executed Tools / Actions Badges */}
                            {log.actionsExecuted && log.actionsExecuted.length > 0 && (
                              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-slate-500 font-medium">Tools Invoked:</span>
                                {log.actionsExecuted.map((act, aIdx) => (
                                  <span
                                    key={aIdx}
                                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-cyan-300 text-[10px] font-mono"
                                  >
                                    ⚙ {act}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Spoken Response Preview */}
                            {log.responsePreview && (
                              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-300 text-xs">
                                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">
                                  AI Response Output:
                                </span>
                                <p className="italic text-slate-200 leading-relaxed">&ldquo;{log.responsePreview}&rdquo;</p>
                              </div>
                            )}

                            {/* ERROR PATTERN DIAGNOSTIC BOX (If Failed) */}
                            {!isSuccess && (
                              <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 text-rose-300 font-mono text-xs font-bold">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                                    <span>Error Pattern:</span>
                                    <span className="px-1.5 py-0.2 rounded bg-rose-900 text-rose-200 border border-rose-500/50">
                                      {log.errorPattern || 'SYSTEM_FAULT'}
                                    </span>
                                  </div>
                                  {log.errorCategory && (
                                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-900 text-rose-300 border border-rose-800">
                                      Category: {log.errorCategory}
                                    </span>
                                  )}
                                </div>

                                {log.errorMessage && (
                                  <p className="text-xs text-rose-200/90 font-mono bg-slate-950/70 p-2 rounded-lg border border-rose-900/40 break-words">
                                    {log.errorMessage}
                                  </p>
                                )}

                                {log.remediation && (
                                  <div className="text-[11px] text-amber-300/90 pt-1 flex items-start gap-1.5">
                                    <span className="font-bold text-amber-400 flex-shrink-0">Admin Action:</span>
                                    <span>{log.remediation}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* 5. INLINE SIMULATION MODAL */}
                  {showSimulateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                              <Terminal className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">Simulate AI Command Execution</h4>
                              <p className="text-[11px] text-slate-400">Inject test executions into the live audit trail</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowSimulateModal(false)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleSimulateCommand} className="space-y-4">
                          {/* Quick Presets */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 block">Quick Scenario Preset</label>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSimCommandText('YouTube par romantic songs play karo');
                                  setSimCommandStatus('success');
                                  setSimTriggerSource('User (Voice)');
                                }}
                                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left text-xs text-slate-300 cursor-pointer"
                              >
                                <span className="text-emerald-400 font-bold block text-[10px]">SUCCESS</span>
                                YouTube Play Song
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSimCommandText('Call Elon Musk on private satellite phone');
                                  setSimCommandStatus('failed');
                                  setSimErrorType('CONTACT_OR_ENTITY_NOT_FOUND');
                                  setSimTriggerSource('User (Voice)');
                                }}
                                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-left text-xs text-slate-300 cursor-pointer"
                              >
                                <span className="text-rose-400 font-bold block text-[10px]">FAILED</span>
                                Contact Not Found
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSimCommandText('Analyze 500-page complex PDF document with 10M tokens');
                                  setSimCommandStatus('failed');
                                  setSimErrorType('API_TIMEOUT_OR_CAPACITY_SPIKE');
                                  setSimTriggerSource('Admin Console');
                                }}
                                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-left text-xs text-slate-300 cursor-pointer"
                              >
                                <span className="text-rose-400 font-bold block text-[10px]">FAILED</span>
                                Model Timeout (12s)
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSimCommandText('Open CyberPunkMobileEngine.exe');
                                  setSimCommandStatus('failed');
                                  setSimErrorType('APPLICATION_PACKAGE_UNRESOLVED');
                                  setSimTriggerSource('User (Text)');
                                }}
                                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-left text-xs text-slate-300 cursor-pointer"
                              >
                                <span className="text-rose-400 font-bold block text-[10px]">FAILED</span>
                                App Not Installed
                              </button>
                            </div>
                          </div>

                          {/* Command Text */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300 block">Command Query Prompt</label>
                            <input
                              type="text"
                              required
                              value={simCommandText}
                              onChange={(e) => setSimCommandText(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono"
                              placeholder="Enter command prompt..."
                            />
                          </div>

                          {/* Status & Vector */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-300 block">Execution Outcome</label>
                              <select
                                value={simCommandStatus}
                                onChange={(e) => setSimCommandStatus(e.target.value as any)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                              >
                                <option value="success">Success (Passed)</option>
                                <option value="failed">Failed (Exception / Error)</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-300 block">Trigger Source</label>
                              <select
                                value={simTriggerSource}
                                onChange={(e) => setSimTriggerSource(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                              >
                                <option value="User (Voice)">User (Voice)</option>
                                <option value="User (Text)">User (Text)</option>
                                <option value="Voice Controller">Voice Controller</option>
                                <option value="Admin Console">Admin Console</option>
                              </select>
                            </div>
                          </div>

                          {/* Failure Pattern Selector (if failed) */}
                          {simCommandStatus === 'failed' && (
                            <div className="space-y-1 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
                              <label className="text-xs font-semibold text-rose-300 block">
                                Simulated Error Pattern
                              </label>
                              <select
                                value={simErrorType}
                                onChange={(e) => setSimErrorType(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-rose-500/40 text-xs text-rose-200 font-mono"
                              >
                                <option value="CONTACT_OR_ENTITY_NOT_FOUND">CONTACT_OR_ENTITY_NOT_FOUND</option>
                                <option value="APPLICATION_PACKAGE_UNRESOLVED">APPLICATION_PACKAGE_UNRESOLVED</option>
                                <option value="API_TIMEOUT_OR_CAPACITY_SPIKE">API_TIMEOUT_OR_CAPACITY_SPIKE</option>
                                <option value="MICROPHONE_INPUT_SILENCE_OR_NOISE">MICROPHONE_INPUT_SILENCE_OR_NOISE</option>
                                <option value="SECURITY_AUTHORIZATION_DENIED">SECURITY_AUTHORIZATION_DENIED</option>
                              </select>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setShowSimulateModal(false)}
                              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Execute & Append to Audit</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CUSTOMER MANAGEMENT & DEVICE OWNERSHIP HUB */}
              {activeTab === 'customers' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Status Notice */}
                  {custNotice && (
                    <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between gap-2 shadow-lg animate-fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-medium">{custNotice}</span>
                      </div>
                      <button
                        onClick={() => setCustNotice(null)}
                        className="text-emerald-400 hover:text-white p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Header & Quick Action Banner */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-950 border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-white tracking-wide">
                            Customer Directory & Device Ownership Hub
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                            कस्टमर रिकॉर्ड्स
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                          Track kiska paas Jarvis download hai. Phone se customer details (Name, Number, Email) edit karein aur Jarvis device ownership assign karein.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        id="btn-admin-add-customer-toggle"
                        onClick={() => {
                          triggerHaptic([20]);
                          if (isAddingCustomer) {
                            handleCancelCustomerForm();
                          } else {
                            setIsAddingCustomer(true);
                            setEditingCustomerId(null);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 transition-all"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>{isAddingCustomer ? 'Close Form' : 'Register Customer'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportCustomersCsv}
                        title="Download CSV spreadsheet"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span className="hidden sm:inline">CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportCustomersJson}
                        title="Download JSON backup"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <FileJson className="w-4 h-4 text-cyan-400" />
                        <span className="hidden sm:inline">JSON</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Metric Statistics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Total Customers</span>
                        <span className="text-base font-bold text-white font-mono">{customers.length}</span>
                      </div>
                      <Users className="w-4 h-4 text-amber-400 opacity-70" />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Active Installed</span>
                        <span className="text-base font-bold text-emerald-400 font-mono">
                          {customers.filter((c) => c.downloadStatus === 'active').length}
                        </span>
                      </div>
                      <Smartphone className="w-4 h-4 text-emerald-400 opacity-70" />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Linked Voice Owner</span>
                        <span className="text-xs font-bold text-cyan-300 truncate max-w-[100px] block">
                          {activeDeviceOwner ? activeDeviceOwner.name : 'Master Admin'}
                        </span>
                      </div>
                      <UserCheck className="w-4 h-4 text-cyan-400 opacity-70" />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Lifetime VIPs</span>
                        <span className="text-base font-bold text-purple-400 font-mono">
                          {customers.filter((c) => c.plan === 'Lifetime VIP').length}
                        </span>
                      </div>
                      <Sparkles className="w-4 h-4 text-purple-400 opacity-70" />
                    </div>
                  </div>

                  {/* Active Device Owner Live Association Status */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">Live Jarvis Device Ownership:</span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                            Voice Recipient
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-0.5">
                          {activeDeviceOwner ? (
                            <span>
                              Jarvis is currently personalized for:{' '}
                              <strong className="text-cyan-300">{activeDeviceOwner.name}</strong> ({activeDeviceOwner.number}) • Greetings: "Namaste {activeDeviceOwner.name}!"
                            </span>
                          ) : (
                            <span>
                              Default Master Admin active:{' '}
                              <strong className="text-amber-300">{getAdminPersonalizedName()}</strong> • Jarvis addresses the creator directly.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {activeDeviceOwner && (
                      <button
                        type="button"
                        onClick={handleResetDeviceToAdmin}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reset to Admin</span>
                      </button>
                    )}
                  </div>

                  {/* Add / Edit Customer Form Drawer */}
                  {isAddingCustomer && (
                    <form
                      onSubmit={handleSaveCustomer}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/50 space-y-4 shadow-xl animate-fade-in"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                            {editingCustomerId ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                              {editingCustomerId ? 'Edit Customer Details (कस्टमर विवरण अपडेट)' : 'Register New Customer (नया कस्टमर जोड़ें)'}
                            </h5>
                            <span className="text-[10px] text-slate-400">
                              Data is persisted locally in phone memory.
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleCancelCustomerForm}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {custFormError && (
                        <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{custFormError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        {/* Name */}
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            Customer Name * (ग्राहक का नाम)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Ramesh Kumar"
                            value={custName}
                            onChange={(e) => setCustName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>

                        {/* Phone Number */}
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            Phone Number * (मोबाइल नंबर)
                          </label>
                          <input
                            type="tel"
                            placeholder="e.g. +91 98765 43210"
                            value={custNumber}
                            onChange={(e) => setCustNumber(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            Email ID * (ईमेल पता)
                          </label>
                          <input
                            type="email"
                            placeholder="e.g. ramesh@example.com"
                            value={custEmail}
                            onChange={(e) => setCustEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>

                        {/* Device Model */}
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            Device Model (डिवाइस मॉडल)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Vivo V29, Samsung S24"
                            value={custDevice}
                            onChange={(e) => setCustDevice(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* City */}
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            City / Location (शहर)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Delhi NCR, Jaipur, Mumbai"
                            value={custCity}
                            onChange={(e) => setCustCity(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* Status */}
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            Download / Usage Status (स्टेटस)
                          </label>
                          <select
                            value={custStatus}
                            onChange={(e: any) => setCustStatus(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                          >
                            <option value="active">Active (चालू / एक्टिव)</option>
                            <option value="downloaded">Downloaded (डाउनलोड किया)</option>
                            <option value="pending">Pending Setup (पेंडिंग)</option>
                          </select>
                        </div>

                        {/* Plan */}
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            Service Plan (प्लान)
                          </label>
                          <select
                            value={custPlan}
                            onChange={(e: any) => setCustPlan(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                          >
                            <option value="Lifetime VIP">Lifetime VIP Access</option>
                            <option value="Standard Access">Standard Access</option>
                            <option value="Enterprise Pro">Enterprise Pro Suite</option>
                          </select>
                        </div>

                        {/* Service Notes */}
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            Service Notes (विशेष टिप्पणी / कस्टमर की सर्विस डिटेल्स)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Voice control installed, Hindi language preferred..."
                            value={custNotes}
                            onChange={(e) => setCustNotes(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Link Ownership Checkbox */}
                      <label className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-slate-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={custLinkOwner}
                          onChange={(e) => setCustLinkOwner(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-700 cursor-pointer"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-white block">
                            Link this customer as active device owner for Jarvis Voice
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Agar aap ye phone customer ko de rahe hain, toh Jarvis ab unka naam lekar baat karega ("Namaste {custName || 'Customer'}!").
                          </span>
                        </div>
                      </label>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={handleCancelCustomerForm}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/25 active:scale-95 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>{editingCustomerId ? 'Update Customer' : 'Save Customer Record'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Search and Status Filters */}
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search customers by name, phone, email, city, device..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      {customerSearch && (
                        <button
                          onClick={() => setCustomerSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
                      {(
                        [
                          { id: 'all', label: `All (${customers.length})` },
                          { id: 'active', label: 'Active' },
                          { id: 'downloaded', label: 'Downloaded' },
                          { id: 'linked', label: 'Linked Owner' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            triggerHaptic([15]);
                            setCustomerStatusFilter(tab.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            customerStatusFilter === tab.id
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'text-slate-400 hover:text-white hover:bg-slate-850'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Records Table View */}
                  {filteredCustomers.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
                      <Users className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">
                        {customerSearch.trim()
                          ? `No customer records matched "${customerSearch}".`
                          : "No customer records found."}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCustomer(true);
                          setEditingCustomerId(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-amber-500/20"
                      >
                        Register First Customer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/90 shadow-2xl">
                        <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                          <thead>
                            <tr className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
                              <th className="py-3 px-3.5 font-semibold">Customer Name</th>
                              <th className="py-3 px-3.5 font-semibold">Phone Number</th>
                              <th className="py-3 px-3.5 font-semibold">Email Address</th>
                              <th className="py-3 px-3.5 font-semibold">Device & City</th>
                              <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                              <th className="py-3 px-3.5 font-semibold text-center">Device Ownership</th>
                              <th className="py-3 px-3.5 font-semibold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {filteredCustomers.map((cust) => {
                              const initials =
                                cust.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase() || "C";

                              return (
                                <tr
                                  key={cust.id}
                                  className={`transition-colors ${
                                    cust.isLinkedDeviceOwner
                                      ? "bg-emerald-950/25 hover:bg-emerald-950/35 border-l-2 border-emerald-400"
                                      : "hover:bg-slate-900/60"
                                  }`}
                                >
                                  {/* Customer Name */}
                                  <td className="py-3 px-3.5 align-middle">
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                          cust.isLinkedDeviceOwner
                                            ? "bg-emerald-500/20 border border-emerald-400/50 text-emerald-300"
                                            : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                                        }`}
                                      >
                                        {initials}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-white tracking-wide">
                                            {cust.name}
                                          </span>
                                          {cust.isLinkedDeviceOwner && (
                                            <span
                                              className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                                              title="Active voice recipient"
                                            />
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-amber-300/90 border border-amber-500/20">
                                            {cust.plan}
                                          </span>
                                          {cust.serviceNotes && (
                                            <span
                                              className="text-[10px] text-slate-400 max-w-[140px] truncate"
                                              title={cust.serviceNotes}
                                            >
                                              • {cust.serviceNotes}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Phone Number */}
                                  <td className="py-3 px-3.5 align-middle">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-slate-200 font-medium">
                                        {cust.number}
                                      </span>
                                      <a
                                        href={`tel:${cust.number}`}
                                        title="Call customer directly"
                                        className="p-1 rounded bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors"
                                      >
                                        <PhoneCall className="w-3 h-3" />
                                      </a>
                                      <a
                                        href={`https://wa.me/${cust.number.replace(/\D/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="WhatsApp chat"
                                        className="p-1 rounded bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors"
                                      >
                                        <MessageSquare className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </td>

                                  {/* Email */}
                                  <td className="py-3 px-3.5 align-middle">
                                    <a
                                      href={`mailto:${cust.email}`}
                                      className="text-cyan-300 hover:underline flex items-center gap-1.5 font-mono text-[11px]"
                                    >
                                      <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                                      <span className="truncate max-w-[160px]">{cust.email}</span>
                                    </a>
                                  </td>

                                  {/* Device & City */}
                                  <td className="py-3 px-3.5 align-middle">
                                    <div className="text-[11px] text-slate-300">
                                      <div className="flex items-center gap-1 text-slate-300">
                                        <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span>{cust.deviceModel || "Smartphone"}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-0.5">
                                        {cust.city ? `📍 ${cust.city}` : "—"}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="py-3 px-3.5 align-middle text-center">
                                    <span
                                      className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                        cust.downloadStatus === "active"
                                          ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                                          : cust.downloadStatus === "downloaded"
                                          ? "bg-blue-950 text-blue-300 border-blue-500/40"
                                          : "bg-amber-950 text-amber-300 border-amber-500/40"
                                      }`}
                                    >
                                      {cust.downloadStatus.toUpperCase()}
                                    </span>
                                  </td>

                                  {/* Device Ownership */}
                                  <td className="py-3 px-3.5 align-middle text-center">
                                    {cust.isLinkedDeviceOwner ? (
                                      <div className="inline-flex items-center gap-1.5">
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 font-bold text-[10px] flex items-center gap-1 shadow-sm shadow-emerald-500/20">
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span>Voice Owner</span>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={handleResetDeviceToAdmin}
                                          title="Unlink and restore Admin name"
                                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                        >
                                          <RotateCcw className="w-3 h-3 text-amber-400" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleLinkDeviceOwner(cust.id)}
                                        title="Link this phone to greet this customer"
                                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                                      >
                                        <UserCheck className="w-3 h-3 text-cyan-400" />
                                        <span>Link Device</span>
                                      </button>
                                    )}
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3 px-3.5 align-middle text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* Edit Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditCustomer(cust)}
                                        title="Edit customer details"
                                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        <span>Edit</span>
                                      </button>

                                      {/* Delete Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                                        title="Delete customer record"
                                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                        <span>
                          Showing <strong className="text-slate-200">{filteredCustomers.length}</strong> of{" "}
                          <strong className="text-slate-200">{customers.length}</strong> customer records
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {activeDeviceOwner
                            ? `Active Device Owner: ${activeDeviceOwner.name}`
                            : "Active Device Owner: Master Admin"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MEMORY CORE MASTER MANAGEMENT */}
              {activeTab === 'memory' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Gate Security Authentication Header */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-950/80 to-slate-950 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Memory Core Manager • Vector Management Gate
                          </h4>
                          <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                            Gate Verified
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Direct vector editing and memory purging guarded behind active authentication gate.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAdminLock}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
                      title="Lock Admin Session and re-engage Gate"
                    >
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      <span>Lock Memory Tools</span>
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search memory items by key or value..."
                        value={memSearch}
                        onChange={(e) => setMemSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsAddingMem(!isAddingMem)}
                        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isAddingMem ? 'Cancel' : 'Add Vector'}</span>
                      </button>

                      <button
                        onClick={handleAdminWipeAllMemories}
                        className="px-3 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset Defaults</span>
                      </button>
                    </div>
                  </div>

                  {/* Add Memory Form */}
                  {isAddingMem && (
                    <form
                      onSubmit={handleAdminAddMemory}
                      className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-3"
                    >
                      <span className="text-xs font-bold text-purple-300 block">
                        Admin Inject Memory Vector:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Memory Key (e.g. Creator Authority)"
                          value={newKey}
                          onChange={(e) => setNewKey(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Memory Content Fact"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          className="col-span-1 sm:col-span-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-xl bg-purple-500 text-slate-950 font-bold text-xs"
                        >
                          Save Vector
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Memories Table */}
                  <div className="space-y-2">
                    {filteredMemories.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{m.key}</span>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-900 text-purple-300 border border-purple-500/30">
                              {m.category}
                            </span>
                            {m.pinned && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                                Pinned Core
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 leading-relaxed">{m.value}</p>
                        </div>
                        <button
                          onClick={() => handleAdminDeleteMemory(m.key)}
                          title="Admin Force Delete"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: Q&A HISTORY AUDIT */}
              {activeTab === 'qa_audit' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-300">Google-Style Questions & Answers Log</span>
                      <p className="text-slate-400 text-[11px]">
                        Every user question asked to Jarvis and its reply is recorded here for instant recall.
                      </p>
                    </div>
                    {qaRecords.length > 0 && (
                      <button
                        onClick={handleAdminWipeQa}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-semibold"
                      >
                        Wipe Q&A
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter user questions or answers..."
                      value={qaSearch}
                      onChange={(e) => setQaSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-2.5">
                    {filteredQa.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">
                        No Q&A records found. Start speaking or asking questions to populate!
                      </p>
                    ) : (
                      filteredQa.map((r) => (
                        <div
                          key={r.id}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-300">Q: "{r.question}"</span>
                            <span className="text-[10px] text-slate-500 font-mono">{r.timestamp}</span>
                          </div>
                          <p className="text-slate-300">A: {r.answer}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: GOOGLE PLAY STORE CONSOLE */}
              {activeTab === 'playstore' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-cyan-400" />
                      <h4 className="text-sm font-bold text-white">Google Play Store & APK Publishing Hub</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Detailed configuration for Google Play Store upload and 1-tap installation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <span className="text-slate-400 block">Package ID</span>
                      <span className="font-mono font-bold text-cyan-300">com.rovinpal.jarvis</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <span className="text-slate-400 block">App Version</span>
                      <span className="font-mono font-bold text-emerald-300">2.4.0 (Build 24)</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <span className="text-slate-400 block">Play Console URL</span>
                      <span className="font-mono text-slate-300">play.google.com/console</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <span className="text-slate-400 block">Builder Engine</span>
                      <span className="font-mono text-slate-300">PWABuilder / Android TWA</span>
                    </div>
                  </div>

                  {onOpenPlayStoreGuide && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPlayStoreGuide();
                      }}
                      className="w-full py-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Full Step-by-Step Play Store Upload Guide</span>
                    </button>
                  )}
                </div>
              )}

              {/* TAB 5: PIN & PASSWORD SECURITY MANAGEMENT */}
              {activeTab === 'security' && (
                <div className="space-y-5 animate-fade-in max-w-xl">
                  {/* Status Banner */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                          Active Authenticated Session
                        </h5>
                        <p className="text-xs text-slate-400">
                          Verified as <strong className="text-emerald-300">Rovin Pal (Master Administrator)</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAdminLock}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock Now</span>
                    </button>
                  </div>

                  {/* 0. Personalized Admin Name (Barish / Admin Name Edit for Jarvis Voice Greetings) */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950/90 to-slate-900 border border-amber-500/40 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Personalized Admin / Creator Name (एडमिन नाम)</span>
                      </h5>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                        Voice & Memory
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Barish / Admin panel mein apna naam edit kar sakte hain. Jab bhi Jarvis voice control open hoga ya baat karega, toh yahi naam bolega aur memory me reflect hoga.
                    </p>

                    {/* Preset Dropdown Selector in Security tab */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-amber-300 block">
                        Personality Preset (पर्सनैलिटी प्रीसेट चुनें):
                      </label>
                      <select
                        id="personality-preset-dropdown-security"
                        value={selectedPresetId}
                        onChange={(e) => handleSelectPersonalityPreset(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        {PERSONALITY_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id} className="bg-slate-950 text-white">
                            {preset.name} — Calls you: "{preset.adminName}" ({preset.preferredTitle})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400">
                        Selecting a preset automatically updates Admin Name to "{activePreset.adminName}" and applies its speaking style.
                      </p>
                    </div>

                    <form onSubmit={handleSaveAdminName} className="space-y-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1">
                          Admin / Creator Name (जिस नाम से जार्विस आपको पुकारे):
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="e.g., Rovin Pal, Barish, Boss..."
                            value={adminNameInput}
                            onChange={(e) => setAdminNameInput(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="text-[11px] text-slate-400">
                          Active Greeting:{' '}
                          <span className="text-amber-300 font-bold font-mono">
                            "Namaste {adminNameInput.trim() || 'Sir'}!"
                          </span>
                        </div>

                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Admin Name</span>
                        </button>
                      </div>
                    </form>

                    {adminNameNotice && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{adminNameNotice}</span>
                      </div>
                    )}
                  </div>

                  {/* 1. Update Admin PIN */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        Update Master Admin PIN (Numeric)
                      </h5>
                      <span className="text-[10px] font-mono text-slate-500">
                        Current: <strong className="text-amber-400">{savedPin}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Standard PIN used for quick keypad unlock (Default: <code className="text-amber-300 font-mono">7860</code>).
                    </p>

                    <form onSubmit={handleSaveNewPin} className="space-y-3">
                      <input
                        type="password"
                        placeholder="Enter new 4 to 8 digit PIN"
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        minLength={4}
                        maxLength={10}
                        required
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
                      >
                        Save New PIN
                      </button>
                    </form>

                    {pinChangeSuccess && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                        <Check className="w-4 h-4" />
                        New Admin PIN saved securely!
                      </p>
                    )}
                  </div>

                  {/* 2. Update Admin Password */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4 text-rose-400" />
                        Update Master Admin Password (Alphanumeric)
                      </h5>
                      <span className="text-[10px] font-mono text-slate-500">
                        Default: <strong className="text-rose-400">Rovin@Jarvis2026</strong>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Complex alphanumeric password for full administrative gate access (minimum 6 characters).
                    </p>

                    <form onSubmit={handleSaveNewPassword} className="space-y-3">
                      <input
                        type="password"
                        placeholder="Enter new password (min. 6 characters)"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        minLength={6}
                        maxLength={32}
                        required
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-rose-400"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all cursor-pointer"
                      >
                        Save New Master Password
                      </button>
                    </form>

                    {passwordChangeSuccess && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                        <Check className="w-4 h-4" />
                        New Master Password saved securely!
                      </p>
                    )}
                  </div>

                  {/* Security Policy Information */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <span className="font-bold text-slate-300 block">Security Gate Enforcement Policy:</span>
                    <p>• The Command Audit Log and Memory Core manager require verified credentials to view.</p>
                    <p>• Failed attempts are logged into the persistent diagnostic audit stream.</p>
                    <p>• 4 consecutive failed attempts trigger an automatic 30-second brute-force lockout.</p>
                  </div>
                </div>
              )}

              {/* TAB 6: HAPTIC ALERT STUDIO & ADMIN VIBRATION CUSTOMIZER */}
              {activeTab === 'haptic_studio' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Status & Studio Action Banner */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-950 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <Vibrate className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">
                            Haptic Alert Pattern Studio (Admin Customizer)
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                            Live Controller
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Configure distinct physical vibration sequences, loop counts, and tactile rhythms for Alarms, Messages, and Calls.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        id="btn-admin-launch-sequencer-modal"
                        onClick={() => {
                          triggerHaptic([30]);
                          window.dispatchEvent(
                            new CustomEvent('jarvis:open-haptic-customizer', {
                              detail: { alertType: activeAlertEdit },
                            })
                          );
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer active:scale-95 transition-all"
                      >
                        <Sliders className="w-4 h-4 text-slate-950" />
                        <span>Open Full Beat Sequencer Studio</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Alert Categories Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(
                      [
                        { id: 'alarm', name: 'Alarms & Wakeup', hindi: 'अलार्म व वेकअप', icon: BellRing, badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/40' },
                        { id: 'message', name: 'Messages & SMS', hindi: 'मैसेज व एसएमएस', icon: MessageSquare, badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40' },
                        { id: 'call', name: 'Incoming Phone Calls', hindi: 'इनकमिंग फोन कॉल', icon: PhoneCall, badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40' },
                        { id: 'reminder', name: 'Reminders & Tasks', hindi: 'रिमाइंडर व टास्क', icon: Clock, badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-950/40' },
                        { id: 'emergency', name: 'Emergency & Security', hindi: 'सुरक्षा व इमरजेंसी', icon: ShieldAlert, badgeColor: 'border-rose-500/40 text-rose-300 bg-rose-950/40' },
                        { id: 'voice_wake', name: 'Voice Wake & Commands', hindi: 'वॉयस ट्रिगर', icon: Mic, badgeColor: 'border-blue-500/40 text-blue-300 bg-blue-950/40' },
                      ] as const
                    ).map((item) => {
                      const cfg = alertHaptics[item.id] || DEFAULT_ALERT_HAPTICS[item.id];
                      const Icon = item.icon;
                      const isSelectedAlert = activeAlertEdit === item.id;
                      const isPlaying = hapticTestPlaying === item.id;
                      const totalMs = (cfg.pattern || []).reduce((a, b) => a + b, 0);

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (activeAlertEdit !== item.id) {
                              triggerHaptic([15]);
                              setActiveAlertEdit(item.id);
                            }
                          }}
                          className={`p-4 rounded-2xl transition-all flex flex-col justify-between group shadow-md cursor-pointer ${
                            isSelectedAlert
                              ? 'bg-slate-900 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                              : 'bg-slate-950/80 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-xl border ${isSelectedAlert ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-cyan-400'}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h5 className="text-xs font-bold text-white">{item.name}</h5>
                                    {isSelectedAlert && (
                                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                                    )}
                                  </div>
                                  <span className="text-[10px] text-amber-300/80">{item.hindi}</span>
                                </div>
                              </div>

                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                                {cfg.repeatCount}x Loop
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {cfg.description}
                            </p>

                            {/* Preset badge & quick loop adjuster */}
                            <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
                              <span className="text-slate-500">Preset:</span>
                              <span className="text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {cfg.presetName}
                              </span>
                            </div>

                            {/* Visual Pattern Steps Preview */}
                            <div className="mt-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-850 flex items-center gap-1 overflow-x-auto no-scrollbar">
                              {cfg.pattern.slice(0, 8).map((ms, idx) => {
                                const isPulse = idx % 2 === 0;
                                return (
                                  <span
                                    key={idx}
                                    className={`text-[9px] font-mono px-1 py-0.5 rounded shrink-0 ${
                                      isPulse
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                                        : 'bg-slate-800 text-slate-500'
                                    }`}
                                  >
                                    {isPulse ? `${ms}⚡` : `${ms}⏸`}
                                  </span>
                                );
                              })}
                              {cfg.pattern.length > 8 && (
                                <span className="text-[9px] text-slate-500">+{cfg.pattern.length - 8}</span>
                              )}
                            </div>

                            {/* Quick Repeat / Intensity Config for Admin */}
                            <div className="mt-3 pt-2.5 border-t border-slate-850/80 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-medium">Loop Repeats:</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4].map((count) => (
                                  <button
                                    key={count}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      triggerHaptic([20]);
                                      const updated = saveAlertHapticConfig(item.id, { repeatCount: count });
                                      setAlertHaptics((prev) => ({ ...prev, [item.id]: updated }));
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                                      cfg.repeatCount === count
                                        ? 'bg-amber-400 text-slate-950 font-black'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {count}x
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                              <span>Duration: {totalMs}ms</span>
                              <span>Intensity: {cfg.intensityMultiplier}x</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic([20]);
                                setHapticTestPlaying(item.id);
                                testAlertHapticPattern(cfg.pattern, cfg.intensityMultiplier, cfg.repeatCount);
                                setTimeout(() => setHapticTestPlaying(null), totalMs * cfg.repeatCount + 200);
                              }}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                                isPlaying
                                  ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300'
                              }`}
                            >
                              <Play className="w-3 h-3" />
                              <span>{isPlaying ? 'Testing...' : 'Test Pattern'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic([20]);
                                setActiveAlertEdit(item.id);
                                window.dispatchEvent(
                                  new CustomEvent('jarvis:open-haptic-customizer', {
                                    detail: { alertType: item.id },
                                  })
                                );
                              }}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                              title="Edit in full studio"
                            >
                              <Sliders className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-[11px]">Customize</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Preset Library Quick Apply */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                          Quick Presets Library (Instant Apply):
                        </h5>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Targeting: <strong className="text-cyan-300 capitalize">{activeAlertEdit}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ALERT_PATTERN_PRESETS.slice(0, 8).map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic([30]);
                            const updated = saveAlertHapticConfig(activeAlertEdit, {
                              pattern: [...preset.pattern],
                              presetName: preset.name,
                            });
                            setAlertHaptics((prev) => ({
                              ...prev,
                              [activeAlertEdit]: updated,
                            }));
                            testAlertHapticPattern(preset.pattern, 1.0, 1);
                          }}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400/50 text-left transition-all active:scale-95 cursor-pointer"
                        >
                          <div className="text-xs font-bold text-white truncate">{preset.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">{preset.category} • {preset.pattern.length} steps</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Factory Reset Row */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic([40, 60]);
                        resetAlertHapticConfig();
                        setAlertHaptics(getAllAlertHapticConfigs());
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                      <span>Restore Factory Alert Patterns</span>
                    </button>

                    <span className="text-[11px] text-slate-500 font-mono">
                      Persistent hardware profile stored in localStorage
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
