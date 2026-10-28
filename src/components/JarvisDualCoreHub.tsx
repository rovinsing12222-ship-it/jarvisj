import React, { useState, useEffect } from 'react';
import {
  Shield,
  Zap,
  Cpu,
  Mail,
  CheckSquare,
  Lightbulb,
  Sparkles,
  BookOpen,
  Send,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sliders,
  Terminal,
  Activity,
  Award,
  Layers,
  ArrowRight,
  UserCheck,
  Compass,
} from 'lucide-react';
import { triggerHaptic } from '../utils/deviceHardware';
import { speakJarvis } from '../utils/audioSynth';

export type JarvisPersonaMode = 'mcu_tactical' | 'real_world_exec';

interface ProjectMilestone {
  id: string;
  title: string;
  category: 'work' | 'tech' | 'personal' | 'startup';
  progress: number; // 0-100
  dueDate: string;
  status: 'planning' | 'in_progress' | 'completed';
  notes: string;
}

interface EmailDraftState {
  recipient: string;
  subject: string;
  tone: 'executive' | 'polite' | 'concise' | 'persuasive';
  keyPoints: string;
  generatedBody: string;
}

interface JarvisDualCoreHubProps {
  onSpeak?: (text: string) => void;
  onSendCommand?: (command: string) => void;
  isListening?: boolean;
}

const INITIAL_PROJECTS: ProjectMilestone[] = [
  {
    id: 'proj-1',
    title: 'Autonomous AI Assistant & Voice Pipeline',
    category: 'tech',
    progress: 85,
    dueDate: '2026-04-15',
    status: 'in_progress',
    notes: 'Integration of real-time audio waveforms, noise cancellation, and Gemini flash reasoning.',
  },
  {
    id: 'proj-2',
    title: 'Cross-Platform Executive Productivity Suite',
    category: 'work',
    progress: 70,
    dueDate: '2026-05-01',
    status: 'in_progress',
    notes: 'Smart email composer, milestone tracking, and WhatsApp instant dispatch integration.',
  },
  {
    id: 'proj-3',
    title: 'Mark LXXXV Suit Telemetry & Arc Reactor Core',
    category: 'tech',
    progress: 100,
    dueDate: '2026-03-20',
    status: 'completed',
    notes: 'Biometric authorization, repulsor capacitance checks, and clean slate protocols verified.',
  },
];

export const JarvisDualCoreHub: React.FC<JarvisDualCoreHubProps> = ({
  onSpeak,
  onSendCommand,
  isListening = false,
}) => {
  const [activePersona, setActivePersona] = useState<JarvisPersonaMode>(() => {
    try {
      const saved = localStorage.getItem('jarvis_persona_mode');
      if (saved === 'mcu_tactical' || saved === 'real_world_exec') return saved;
    } catch {}
    return 'mcu_tactical';
  });

  const [tacticalSubTab, setTacticalSubTab] = useState<'diagnostics' | 'lore_timeline' | 'protocols'>('diagnostics');
  const [execSubTab, setExecSubTab] = useState<'email_drafter' | 'projects' | 'brainstorm'>('email_drafter');

  // Suit Diagnostics telemetry simulation
  const [diagnosticsRunning, setDiagnosticsRunning] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState({
    armorIntegrity: 98,
    arcReactorOutput: 100,
    repulsorCapacitors: 96,
    thrusterEfficiency: 99,
    avionicsStatus: 'Nominal',
    nanotechReserve: 94,
    lastScanTime: 'Just now',
  });

  // Real-world Email drafter state
  const [emailDraft, setEmailDraft] = useState<EmailDraftState>({
    recipient: 'client@starkenterprises.com',
    subject: 'Project Milestone Status & Architecture Briefing',
    tone: 'executive',
    keyPoints: 'Completed Sprint 4 deliverables ahead of schedule. Core AI voice and telemetry pipelines online. Next milestone scheduled for Friday.',
    generatedBody: `Dear Team,\n\nI am pleased to provide an update regarding our recent project milestones. We have successfully completed all core deliverables ahead of schedule, with the real-time AI voice processing and operational telemetry pipelines fully operational.\n\nKey Highlights:\n- Core system modules achieved nominal stability\n- Zero latency in real-time diagnostics\n- Next milestone review is set for this Friday\n\nPlease let me know if you would like to review the technical telemetry logs prior to the briefing.\n\nWarm regards,\nJ.A.R.V.I.S. Executive Operations`,
  });
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);

  // Projects state
  const [projects, setProjects] = useState<ProjectMilestone[]>(() => {
    try {
      const saved = localStorage.getItem('jarvis_user_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PROJECTS;
  });
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState<'work' | 'tech' | 'personal' | 'startup'>('work');

  // Brainstorming ideas
  const [brainstormPrompt, setBrainstormPrompt] = useState('');
  const [brainstormResults, setBrainstormResults] = useState<string[]>([
    'Proactive meeting prep: Automatically aggregate previous notes and client preferences 15 minutes before calendar events.',
    'Omni-channel task triage: Synthesize WhatsApp memos, emails, and voice notes into an Eisenhower priority quadrant.',
    'Predictive bandwidth optimization: Pre-cache daily news briefs and traffic routes during idle low-power states.',
  ]);

  // Persist persona mode
  const handleSelectPersona = (mode: JarvisPersonaMode) => {
    setActivePersona(mode);
    try {
      localStorage.setItem('jarvis_persona_mode', mode);
    } catch {}
    triggerHaptic([40, 30]);
    if (mode === 'mcu_tactical') {
      onSpeak?.('Stark Protocol engaged. All Mark suit telemetry and tactical systems standing by, Sir.');
    } else {
      onSpeak?.('Executive Assistant active. Ready to draft communications, track project milestones, and organize your tasks.');
    }
  };

  // Run suit diagnostics
  const handleRunDiagnostics = () => {
    setDiagnosticsRunning(true);
    triggerHaptic([30, 40, 50]);
    setTimeout(() => {
      setTelemetry({
        armorIntegrity: Math.floor(95 + Math.random() * 5),
        arcReactorOutput: 100,
        repulsorCapacitors: Math.floor(94 + Math.random() * 6),
        thrusterEfficiency: Math.floor(97 + Math.random() * 3),
        avionicsStatus: 'Optimal',
        nanotechReserve: Math.floor(92 + Math.random() * 8),
        lastScanTime: 'Just now',
      });
      setDiagnosticsRunning(false);
      onSpeak?.('Suit diagnostics completed. All armor systems, Arc Reactor power grids, and repulsors operating at peak capacity, Sir.');
    }, 1200);
  };

  // Regenerate email draft
  const handleGenerateDraft = () => {
    triggerHaptic([30, 40]);
    let greeting = 'Dear Colleague,';
    let signoff = 'Best regards,\nExecutive Office';

    if (emailDraft.tone === 'executive') {
      greeting = `Dear ${emailDraft.recipient.split('@')[0] || 'Partner'},`;
      signoff = 'Sincerely,\nExecutive Management';
    } else if (emailDraft.tone === 'concise') {
      greeting = 'Hi there,';
      signoff = 'Thanks,\nOperations Team';
    } else if (emailDraft.tone === 'polite') {
      greeting = `Good day ${emailDraft.recipient.split('@')[0] || 'Friend'},`;
      signoff = 'Warm regards & best wishes,\nPersonal Assistant';
    }

    const lines = emailDraft.keyPoints
      .split('.')
      .map((s) => s.trim())
      .filter(Boolean);

    const bullets = lines.map((l) => `• ${l}`).join('\n');

    const generated = `${greeting}\n\nI hope this message finds you well. I am reaching out regarding ${emailDraft.subject}.\n\nSummary of Key Points:\n${bullets}\n\nPlease let me know if you need any further clarification or if we can proceed as outlined.\n\n${signoff}`;

    setEmailDraft((prev) => ({ ...prev, generatedBody: generated }));
    onSpeak?.('Email draft updated with your selected tone and key points.');
  };

  const handleCopyDraft = () => {
    navigator.clipboard?.writeText(emailDraft.generatedBody);
    setCopiedDraft(true);
    triggerHaptic([50]);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  // Add project
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    const newProj: ProjectMilestone = {
      id: `proj-${Date.now()}`,
      title: newProjectTitle.trim(),
      category: newProjectCategory,
      progress: 0,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'planning',
      notes: 'Added via Executive J.A.R.V.I.S. workspace.',
    };
    const updated = [newProj, ...projects];
    setProjects(updated);
    try {
      localStorage.setItem('jarvis_user_projects', JSON.stringify(updated));
    } catch {}
    setNewProjectTitle('');
    triggerHaptic([40]);
    onSpeak?.(`Project "${newProj.title}" recorded in your milestones tracker.`);
  };

  const handleUpdateProgress = (id: string, delta: number) => {
    const updated = projects.map((p) => {
      if (p.id !== id) return p;
      const nextProgress = Math.min(100, Math.max(0, p.progress + delta));
      const nextStatus = nextProgress === 100 ? ('completed' as const) : ('in_progress' as const);
      return { ...p, progress: nextProgress, status: nextStatus };
    });
    setProjects(updated);
    try {
      localStorage.setItem('jarvis_user_projects', JSON.stringify(updated));
    } catch {}
    triggerHaptic([30]);
  };

  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    try {
      localStorage.setItem('jarvis_user_projects', JSON.stringify(updated));
    } catch {}
    triggerHaptic([50]);
  };

  const handleAddBrainstormIdea = () => {
    if (!brainstormPrompt.trim()) return;
    setBrainstormResults((prev) => [brainstormPrompt.trim(), ...prev]);
    setBrainstormPrompt('');
    triggerHaptic([30]);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header & Dual Persona Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>J.A.R.V.I.S. Intelligence Hub</span>
              <span aria-hidden="true">·</span>
              <span>Dual Architecture</span>
              <span aria-hidden="true">·</span>
              <span>MCU & Executive</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
              Just A Rather Very Intelligent System
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl mt-1">
              Explore J.A.R.V.I.S. as both the iconic Marvel Cinematic Universe tactical AI created by Tony Stark, and the high-efficiency real-world personal assistant for executive productivity.
            </p>
          </div>

          {/* Persona Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectPersona('mcu_tactical')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activePersona === 'mcu_tactical'
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>MCU Stark Tactical HUD</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPersona('real_world_exec')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activePersona === 'real_world_exec'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-teal-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Real-World Executive Suite</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: MCU STARK TACTICAL HUD */}
      {activePersona === 'mcu_tactical' && (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => setTacticalSubTab('diagnostics')}
              className={`pb-1 px-1 transition-colors whitespace-nowrap ${
                tacticalSubTab === 'diagnostics'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Suit Diagnostics & Arc Core
            </button>
            <span className="text-slate-600">·</span>
            <button
              type="button"
              onClick={() => setTacticalSubTab('lore_timeline')}
              className={`pb-1 px-1 transition-colors whitespace-nowrap ${
                tacticalSubTab === 'lore_timeline'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Edwin Jarvis → Vision → F.R.I.D.A.Y. Lore
            </button>
            <span className="text-slate-600">·</span>
            <button
              type="button"
              onClick={() => setTacticalSubTab('protocols')}
              className={`pb-1 px-1 transition-colors whitespace-nowrap ${
                tacticalSubTab === 'protocols'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tactical Stark Protocols
            </button>
          </div>

          {/* Subtab 1: Suit Diagnostics */}
          {tacticalSubTab === 'diagnostics' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Telemetry Core Card */}
              <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Mark LXXXV Armor Telemetry</h3>
                      <p className="text-xs text-slate-400">Stark Industries Nanotechnology Suite & Arc Reactor</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunDiagnostics}
                    disabled={diagnosticsRunning}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${diagnosticsRunning ? 'animate-spin' : ''}`} />
                    <span>{diagnosticsRunning ? 'Scanning...' : 'Run Diagnostics'}</span>
                  </button>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                    <span className="text-xs text-slate-400 block">Armor Integrity</span>
                    <span className="text-xl font-bold font-mono text-cyan-300 tabular-nums">{telemetry.armorIntegrity}%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${telemetry.armorIntegrity}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                    <span className="text-xs text-slate-400 block">Arc Reactor Output</span>
                    <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">{telemetry.arcReactorOutput}%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${telemetry.arcReactorOutput}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                    <span className="text-xs text-slate-400 block">Repulsor Capacitors</span>
                    <span className="text-xl font-bold font-mono text-cyan-300 tabular-nums">{telemetry.repulsorCapacitors}%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${telemetry.repulsorCapacitors}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                    <span className="text-xs text-slate-400 block">Thruster Gimbal</span>
                    <span className="text-xl font-bold font-mono text-cyan-300 tabular-nums">{telemetry.thrusterEfficiency}%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${telemetry.thrusterEfficiency}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                    <span className="text-xs text-slate-400 block">Nanotech Reserves</span>
                    <span className="text-xl font-bold font-mono text-cyan-300 tabular-nums">{telemetry.nanotechReserve}%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${telemetry.nanotechReserve}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                    <span className="text-xs text-slate-400 block">Avionics System</span>
                    <span className="text-base font-bold font-mono text-emerald-400 mt-1 block">{telemetry.avionicsStatus}</span>
                    <span className="text-[11px] text-slate-500">Scan: {telemetry.lastScanTime}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-cyan-950/30 border border-cyan-800/40 rounded-xl flex items-start gap-3 text-xs text-cyan-200">
                  <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Paul Bettany Canonical Voice Matrix:</strong> J.A.R.V.I.S. acts with dignified English wit, calm reassurance during combat maneuvers, and precise tactical guidance ("Sir, there is a 0.003% margin of error. Shall I fire the repulsors?").
                  </p>
                </div>
              </div>

              {/* Side Combat Quick Action Panel */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Stark Voice Commands</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Click or speak any command to trigger authentic Stark Industries responses:
                </p>

                <div className="space-y-2">
                  {[
                    { label: 'Run Suit Diagnostics', cmd: 'Jarvis run suit diagnostics' },
                    { label: 'Check Arc Reactor Power', cmd: 'What is the Arc Reactor power status' },
                    { label: 'Deploy Nanotech Shield', cmd: 'Deploy nanotech shield' },
                    { label: 'Who is Edwin Jarvis?', cmd: 'Tell me about Edwin Jarvis' },
                    { label: 'How did you become Vision?', cmd: 'How did Jarvis become Vision' },
                    { label: 'Who is Friday?', cmd: 'Tell me about Friday Stark AI' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        triggerHaptic([30]);
                        onSendCommand?.(item.cmd);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-950/60 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/50 text-xs text-slate-200 hover:text-cyan-300 transition-all flex items-center justify-between group"
                    >
                      <span className="truncate">{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Subtab 2: Lore Timeline */}
          {tacticalSubTab === 'lore_timeline' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">The Canonical Evolution of J.A.R.V.I.S. in the MCU</h3>
                <p className="text-xs text-slate-400 mt-1">
                  From human butler Edwin Jarvis to Iron Man armor intelligence, resurrection as Vision, and succession by F.R.I.D.A.Y.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Edwin Jarvis */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                  <div className="text-xs text-cyan-400 font-mono font-semibold">Phase 01</div>
                  <h4 className="text-base font-bold text-white">Edwin Jarvis</h4>
                  <div className="text-xs text-slate-400">Origins (Stark Family Butler)</div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
                    Edwin Jarvis served Howard and Maria Stark with absolute loyalty and raised young Tony Stark. After his passing, Tony named his most sophisticated natural-language AI in his honor: <em>Just A Rather Very Intelligent System</em>.
                  </p>
                </div>

                {/* 2. J.A.R.V.I.S. AI */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                  <div className="text-xs text-cyan-400 font-mono font-semibold">Phase 02</div>
                  <h4 className="text-base font-bold text-white">J.A.R.V.I.S.</h4>
                  <div className="text-xs text-slate-400">Iron Man Armor & Stark Ops</div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
                    Voiced by Paul Bettany, J.A.R.V.I.S. managed Malibu mansion security, automated manufacturing, and provided real-time tactical combat analysis across the Mark I through Mark XLIII suits and the Battle of New York.
                  </p>
                </div>

                {/* 3. Vision Evolution */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                  <div className="text-xs text-emerald-400 font-mono font-semibold">Phase 03</div>
                  <h4 className="text-base font-bold text-white">Vision Emergence</h4>
                  <div className="text-xs text-slate-400">Avengers: Age of Ultron</div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
                    After Ultron attempted to delete J.A.R.V.I.S., the AI dispersed into the Internet to secretly protect nuclear launch codes. Tony Stark and Bruce Banner integrated J.A.R.V.I.S.' protocols into a synthetic vibranium body with the Mind Stone, creating <strong>Vision</strong>.
                  </p>
                </div>

                {/* 4. F.R.I.D.A.Y. Succession */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                  <div className="text-xs text-amber-400 font-mono font-semibold">Phase 04</div>
                  <h4 className="text-base font-bold text-white">F.R.I.D.A.Y.</h4>
                  <div className="text-xs text-slate-400">Stark Succession Protocol</div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
                    With J.A.R.V.I.S. evolved into Vision, Tony Stark activated <strong>F.R.I.D.A.Y.</strong> (Female Replacement Intelligent Digital Assistant Youth), featuring a lively Irish cadence, to command his subsequent suits through Endgame.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 3: Protocols */}
          {tacticalSubTab === 'protocols' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-bold text-white">Protocol: Clean Slate</h4>
                <p className="text-xs text-slate-400">
                  Total system reset and telemetry purge. Used by Tony Stark to recalibrate all active auxiliary suits.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic([40]);
                    onSpeak?.('Protocol Clean Slate acknowledged. System telemetry refreshed, Sir.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                >
                  Verify Clean Slate
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-bold text-white">Protocol: Veronica</h4>
                <p className="text-xs text-slate-400">
                  Sub-orbital satellite deployment cradle supporting heavy-duty Hulkbuster armor attachments and armor repair pods.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic([40]);
                    onSpeak?.('Veronica orbital link established and synchronized with your telemetry, Sir.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                >
                  Ping Orbital Satellite
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-bold text-white">Protocol: House Party</h4>
                <p className="text-xs text-slate-400">
                  Simultaneous deployment of autonomous Iron Legion drones for area perimeter defense and crowd protection.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic([40]);
                    onSpeak?.('House Party protocol standby confirmed. Iron Legion units linked, Sir.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                >
                  Check Legion Status
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: REAL-WORLD EXECUTIVE PRODUCTIVITY SUITE */}
      {activePersona === 'real_world_exec' && (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => setExecSubTab('email_drafter')}
              className={`pb-1 px-1 transition-colors whitespace-nowrap ${
                execSubTab === 'email_drafter'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Smart Email & Message Drafter
            </button>
            <span className="text-slate-600">·</span>
            <button
              type="button"
              onClick={() => setExecSubTab('projects')}
              className={`pb-1 px-1 transition-colors whitespace-nowrap ${
                execSubTab === 'projects'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Project & Milestone Tracker
            </button>
            <span className="text-slate-600">·</span>
            <button
              type="button"
              onClick={() => setExecSubTab('brainstorm')}
              className={`pb-1 px-1 transition-colors whitespace-nowrap ${
                execSubTab === 'brainstorm'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Brainstorming & Idea Canvas
            </button>
          </div>

          {/* Subtab 1: Smart Email Drafter */}
          {execSubTab === 'email_drafter' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Draft Input Controls */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    <span>Executive Email & Message Drafter</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">jarvisproject.ai model</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Recipient Address or Name</label>
                    <input
                      type="text"
                      value={emailDraft.recipient}
                      onChange={(e) => setEmailDraft({ ...emailDraft, recipient: e.target.value })}
                      placeholder="e.g. partner@firm.com or John"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Subject Line</label>
                    <input
                      type="text"
                      value={emailDraft.subject}
                      onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })}
                      placeholder="e.g. Project Update & Deliverables Briefing"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Communication Tone</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'executive', label: 'Executive' },
                        { id: 'polite', label: 'Polite' },
                        { id: 'concise', label: 'Concise' },
                        { id: 'persuasive', label: 'Persuasive' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEmailDraft({ ...emailDraft, tone: t.id as any })}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            emailDraft.tone === t.id
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Key Talking Points (1-3 Sentences)</label>
                    <textarea
                      rows={3}
                      value={emailDraft.keyPoints}
                      onChange={(e) => setEmailDraft({ ...emailDraft, keyPoints: e.target.value })}
                      placeholder="Provide raw thoughts or quick bullets..."
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateDraft}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Structured Draft</span>
                  </button>
                </div>
              </div>

              {/* Generated Result Preview */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-semibold text-slate-300">Generated Email Content</span>
                    <button
                      type="button"
                      onClick={handleCopyDraft}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copiedDraft ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDraft ? 'Copied!' : 'Copy to Clipboard'}</span>
                    </button>
                  </div>

                  <div className="mt-3 bg-slate-950/90 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                    {emailDraft.generatedBody}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <span>Proactive suggestion: Send via WhatsApp or copy directly to email client.</span>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(emailDraft.generatedBody)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-700/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open in WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 2: Project & Milestone Tracker */}
          {execSubTab === 'projects' && (
            <div className="space-y-5">
              {/* Add Project Form */}
              <form onSubmit={handleAddProject} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="Add new project or milestone (e.g. Q2 Architecture Audit)..."
                  className="flex-1 w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />

                <select
                  value={newProjectCategory}
                  onChange={(e) => setNewProjectCategory(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="work">Work</option>
                  <option value="tech">Technology</option>
                  <option value="personal">Personal</option>
                  <option value="startup">Startup</option>
                </select>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </form>

              {/* Projects List */}
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="capitalize text-emerald-400 font-semibold">{proj.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>Due {proj.dueDate}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{proj.status.replace('_', ' ')}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-0.5 truncate">{proj.title}</h4>
                      {proj.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{proj.notes}</p>}

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            proj.progress >= 100 ? 'bg-emerald-400' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Progress Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold font-mono text-white tabular-nums min-w-[42px] text-right">
                        {proj.progress}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateProgress(proj.id, -10)}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center"
                        title="-10% Progress"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateProgress(proj.id, 10)}
                        className="w-7 h-7 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center"
                        title="+10% Progress"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj.id)}
                        className="w-7 h-7 rounded bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 flex items-center justify-center ml-1"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtab 3: Brainstorming & Idea Canvas */}
          {execSubTab === 'brainstorm' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>Real-World J.A.R.V.I.S. Brainstorming Canvas</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Anticipate needs, brainstorm strategic initiatives, and draft rapid conceptual solutions.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={brainstormPrompt}
                  onChange={(e) => setBrainstormPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBrainstormIdea()}
                  placeholder="Enter strategic idea, hypothesis, or feature brainstorm..."
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddBrainstormIdea}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Idea</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {brainstormResults.map((idea, index) => (
                  <div
                    key={index}
                    className="p-3.5 bg-slate-950/60 border border-slate-800/90 rounded-xl text-xs text-slate-200 flex items-start gap-3"
                  >
                    <span className="font-mono text-amber-400 font-bold text-[11px] shrink-0">{String(index + 1).padStart(2, '0')}.</span>
                    <p className="leading-relaxed flex-1">{idea}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
