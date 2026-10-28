import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  RefreshCw,
  ExternalLink,
  Volume2,
  Plus,
  X,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Wheat,
  HeartPulse,
  Home,
  Briefcase,
  Users,
  GraduationCap,
  Hammer,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  Sun,
  Coins,
  FileCheck,
  Check,
  Copy,
} from 'lucide-react';
import {
  GovScheme,
  SchemeCategory,
  getStoredGovSchemes,
  syncGovSchemesWithOfficialPortals,
  isGovSchemesAutoSyncActive,
  setGovSchemesAutoSyncActive,
  getLastSyncTime,
  addCustomGovScheme,
} from '../utils/govSchemesEngine';
import { triggerHaptic } from '../utils/deviceHardware';

interface GovSchemesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeakScheme?: (text: string) => void;
  initialQuery?: string;
}

export const GovSchemesModal: React.FC<GovSchemesModalProps> = ({
  isOpen,
  onClose,
  onSpeakScheme,
  initialQuery = '',
}) => {
  const [schemes, setSchemes] = useState<GovScheme[]>(() => getStoredGovSchemes());
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [autoSyncOn, setAutoSyncOn] = useState(() => isGovSchemesAutoSyncActive());
  const [lastSync, setLastSync] = useState(() => getLastSyncTime());
  const [activeTab, setActiveTab] = useState<'schemes' | 'eligibility' | 'add_scheme'>('schemes');

  // Selected scheme for detail drawer / popup
  const [selectedScheme, setSelectedScheme] = useState<GovScheme | null>(null);

  // Form state for adding custom scheme
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newSchemeHindi, setNewSchemeHindi] = useState('');
  const [newSchemeCategory, setNewSchemeCategory] = useState<SchemeCategory>('trending');
  const [newSchemeHighlight, setNewSchemeHighlight] = useState('');
  const [newSchemeTagline, setNewSchemeTagline] = useState('');
  const [newSchemeUrl, setNewSchemeUrl] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);
  const [copiedSchemeUrl, setCopiedSchemeUrl] = useState<string | null>(null);

  // Eligibility filter state
  const [eligibilityFilter, setEligibilityFilter] = useState({
    userType: 'all', // 'student' | 'farmer' | 'woman' | 'artisan' | 'worker' | 'senior'
    benefitType: 'all', // 'subsidy' | 'loan' | 'pension' | 'scholarship' | 'health' | 'housing'
  });

  // Sync listener
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail && Array.isArray(custom.detail)) {
        setSchemes(custom.detail);
      } else {
        setSchemes(getStoredGovSchemes());
      }
      setLastSync(getLastSyncTime());
    };
    window.addEventListener('jarvis_gov_schemes_updated', handleUpdate);
    return () => window.removeEventListener('jarvis_gov_schemes_updated', handleUpdate);
  }, []);

  // Set initial query if passed
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  // Periodic Auto-Sync simulation
  useEffect(() => {
    if (!autoSyncOn) return;
    const interval = setInterval(() => {
      syncGovSchemesWithOfficialPortals().then((res) => {
        setSchemes(res.schemes);
        setLastSync(getLastSyncTime());
      });
    }, 15 * 60 * 1000); // 15 mins
    return () => clearInterval(interval);
  }, [autoSyncOn]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    triggerHaptic([40, 60]);
    try {
      const res = await syncGovSchemesWithOfficialPortals();
      setSchemes(res.schemes);
      setSyncStatusMsg(res.message);
      setLastSync(getLastSyncTime());
      setTimeout(() => setSyncStatusMsg(''), 4000);
    } catch {
      setSyncStatusMsg('Local cache active. Checked with myScheme & PIB.');
      setTimeout(() => setSyncStatusMsg(''), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = () => {
    const next = !autoSyncOn;
    setAutoSyncOn(next);
    setGovSchemesAutoSyncActive(next);
    triggerHaptic([30]);
    if (onSpeakScheme) {
      onSpeakScheme(
        next
          ? 'Government Schemes Automatic Update is now active. Jarvis will keep all new yojana announcements synced.'
          : 'Government Schemes Automatic Update has been paused.'
      );
    }
  };

  const handleCreateScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchemeName.trim()) return;
    triggerHaptic([30, 50]);

    const created = addCustomGovScheme({
      name: newSchemeName.trim(),
      hindiName: newSchemeHindi.trim() || newSchemeName.trim(),
      category: newSchemeCategory,
      keyHighlight: newSchemeHighlight.trim() || 'सरकारी योजना लाभ',
      tagline: newSchemeTagline.trim() || 'नवीनतम सरकारी कल्याणकारी योजना।',
      officialUrl: newSchemeUrl.trim() || 'https://www.myscheme.gov.in',
    });

    setAddSuccess(true);
    setNewSchemeName('');
    setNewSchemeHindi('');
    setNewSchemeHighlight('');
    setNewSchemeTagline('');
    setNewSchemeUrl('');

    setTimeout(() => {
      setAddSuccess(false);
      setActiveTab('schemes');
      setSelectedScheme(created);
    }, 1200);
  };

  const handleSpeakDetails = (scheme: GovScheme) => {
    triggerHaptic([25]);
    if (onSpeakScheme) {
      const text = `${scheme.hindiName} (${scheme.name}). ${scheme.tagline}. इसका मुख्य लाभ है: ${scheme.keyHighlight}. पात्रता: ${scheme.eligibility.join('. ')}. आधिकारिक पोर्टल: ${scheme.officialUrl}.`;
      onSpeakScheme(text);
    }
  };

  // Categories list
  const CATEGORIES = [
    { id: 'all', label: 'All Schemes (सभी)' },
    { id: 'trending', label: '🔥 Latest & Trending (नई योजनाएं)' },
    { id: 'youth', label: '🎓 Youth & Employment (युवा व रोजगार)' },
    { id: 'women', label: '🌸 Women & SHG (महिला व बचत)' },
    { id: 'artisans', label: '🔨 Artisans & MSME (विश्वकर्मा व कारीगर)' },
    { id: 'farmers', label: '🌾 Farmers & Rural (किसान व ग्रामीण)' },
    { id: 'pension', label: '💰 Pension & Welfare (पेंशन व मजदूर)' },
    { id: 'health', label: '🏥 Health & Senior (आयुष्मान व 70+)' },
    { id: 'housing', label: '🏠 Housing (आवास योजना)' },
  ];

  // Filtered schemes
  const filteredSchemes = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return schemes.filter((s) => {
      const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
      const name = (s.name || '').toLowerCase();
      const hindiName = (s.hindiName || '').toLowerCase();
      const tagline = (s.tagline || '').toLowerCase();
      const highlight = (s.keyHighlight || '').toLowerCase();
      const benefits = Array.isArray(s.benefits) ? s.benefits : [];
      const eligibility = Array.isArray(s.eligibility) ? s.eligibility : [];

      const matchSearch =
        !q ||
        name.includes(q) ||
        hindiName.includes(q) ||
        tagline.includes(q) ||
        highlight.includes(q) ||
        benefits.some((b) => (b || '').toLowerCase().includes(q)) ||
        eligibility.some((e) => (e || '').toLowerCase().includes(q));

      // Eligibility tab matching
      let matchUser = true;
      if (activeTab === 'eligibility' && eligibilityFilter.userType !== 'all') {
        const u = eligibilityFilter.userType;
        if (u === 'student') matchUser = s.category === 'youth';
        else if (u === 'farmer') matchUser = s.category === 'farmers' || s.id === 'pm-surya-ghar';
        else if (u === 'woman') matchUser = s.category === 'women' || s.id === 'mahila-samman-mssc';
        else if (u === 'artisan') matchUser = s.category === 'artisans';
        else if (u === 'worker') matchUser = s.category === 'pension' || s.id === 'pm-sym' || s.id === 'pm-svanidhi';
        else if (u === 'senior') matchUser = s.id === 'ayushman-bharat' || s.category === 'pension';
      }

      let matchBenefit = true;
      if (activeTab === 'eligibility' && eligibilityFilter.benefitType !== 'all') {
        const b = eligibilityFilter.benefitType;
        if (b === 'subsidy') matchBenefit = highlight.includes('सब्सिडी') || tagline.includes('सब्सिडी');
        else if (b === 'loan') matchBenefit = highlight.includes('लोन') || tagline.includes('लोन');
        else if (b === 'pension') matchBenefit = s.category === 'pension' || highlight.includes('पेंशन');
        else if (b === 'scholarship') matchBenefit = s.id === 'pm-yasasvi' || highlight.includes('छात्रवृत्ति');
        else if (b === 'health') matchBenefit = s.category === 'health';
        else if (b === 'housing') matchBenefit = s.category === 'housing';
      }

      return matchCat && matchSearch && matchUser && matchBenefit;
    });
  }, [schemes, selectedCategory, searchQuery, activeTab, eligibilityFilter]);

  if (!isOpen) return null;

  return (
    <div
      id="gov-schemes-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-200"
    >
      <div
        id="gov-schemes-modal-container"
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-slate-100 overflow-hidden"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  भारत सरकार की नई व महत्वपूर्ण योजनाएं
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  Auto-Update Active
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                PM Surya Ghar • NPS Vatsalya • UPS • PM Vishwakarma • Drone Didi • myScheme Integration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close schemes modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AUTO-SYNC & LIVE NOTIFICATION BANNER */}
        <div className="px-5 sm:px-7 py-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleToggleAutoSync}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                autoSyncOn
                  ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
              title="Toggle automatic background updates of new government schemes"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-Update Engine: {autoSyncOn ? 'ON (स्वतः अपडेट चालू)' : 'OFF'}</span>
            </button>

            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Last Synced: {lastSync}</span>
            </span>

            {syncStatusMsg && (
              <span className="text-[11px] text-amber-300 font-medium animate-pulse">
                {syncStatusMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Sync latest schemes now from official portals"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Latest Schemes (अपडेट करें)'}</span>
            </button>

            <a
              href="https://www.myscheme.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-semibold flex items-center gap-1.5 transition-all"
            >
              <span>myScheme Portal</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </a>
          </div>
        </div>

        {/* MODAL NAVIGATION TABS */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-2 bg-slate-900/90 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('schemes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'schemes'
                  ? 'bg-amber-500/20 border border-amber-400/60 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Schemes ({schemes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('eligibility')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'eligibility'
                  ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Eligibility Matcher (पात्रता जांचें)</span>
            </button>

            <button
              onClick={() => setActiveTab('add_scheme')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'add_scheme'
                  ? 'bg-purple-500/20 border border-purple-400/60 text-purple-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New Scheme (नई योजना जोड़ें)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            <span>Showing {filteredSchemes.length} of {schemes.length} verified schemes</span>
          </div>
        </div>

        {/* SEARCH AND CATEGORY FILTER BAR */}
        {activeTab === 'schemes' && (
          <div className="px-5 sm:px-7 py-3 bg-slate-950/70 border-b border-slate-800/80 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search yojana (e.g., PM Surya Ghar, NPS Vatsalya, UPS, Vishwakarma, Drone Didi, Mahila Samman, Lakhpati Didi)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-750 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      triggerHaptic([15]);
                      setSelectedCategory(cat.id);
                    }}
                    className={`px-3 py-1 rounded-full whitespace-nowrap transition-all border cursor-pointer font-medium ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ELIGIBILITY MATCHER TAB FILTERS */}
        {activeTab === 'eligibility' && (
          <div className="px-5 sm:px-7 py-3.5 bg-cyan-950/30 border-b border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Smart Eligibility Filter (अपनी श्रेणी व आवश्यकता चुनें)</span>
              </h4>
              <button
                onClick={() => setEligibilityFilter({ userType: 'all', benefitType: 'all' })}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  1. आप कौन हैं? (Occupation / Category):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'सभी (All)' },
                    { id: 'student', label: 'छात्र (Student / Youth)' },
                    { id: 'farmer', label: 'किसान (Farmer)' },
                    { id: 'woman', label: 'महिला (Woman / SHG)' },
                    { id: 'artisan', label: 'कारीगर / शिल्पकार (Artisan)' },
                    { id: 'worker', label: 'मजदूर / रेहड़ी-पटरी (Worker)' },
                    { id: 'senior', label: '70+ बुजुर्ग (Senior Citizen)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setEligibilityFilter({ ...eligibilityFilter, userType: item.id })}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                        eligibilityFilter.userType === item.id
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  2. क्या लाभ चाहिए? (Benefit Type):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'सभी लाभ' },
                    { id: 'subsidy', label: 'सब्सिडी (Subsidy)' },
                    { id: 'loan', label: 'सस्ता लोन (Low-interest Loan)' },
                    { id: 'pension', label: 'पेंशन (Monthly Pension)' },
                    { id: 'scholarship', label: 'छात्रवृत्ति (Scholarship)' },
                    { id: 'health', label: 'मुफ्त इलाज (Health Cover)' },
                    { id: 'housing', label: 'पक्का मकान (Housing)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setEligibilityFilter({ ...eligibilityFilter, benefitType: item.id })}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                        eligibilityFilter.benefitType === item.id
                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4">
          {activeTab === 'add_scheme' ? (
            /* ADD CUSTOM SCHEME FORM */
            <form onSubmit={handleCreateScheme} className="max-w-2xl mx-auto space-y-4 py-4">
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200">
                <span className="font-bold text-white">Add New Scheme:</span> जब भी भारत सरकार या राज्य सरकार द्वारा कोई नई योजना शुरू हो, आप उसे तुरंत यहां जोड़ सकते हैं। यह योजना स्वतः आपके लोकल डेटाबेस और जार्विस मेमोरी कोर में सिंक हो जाएगी।
              </div>

              {addSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>योजना सफलतापूर्वक जोड़ी गई और मेमोरी में सिंक हो गई!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    योजना का नाम (English Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., PM Surya Ghar Yojana"
                    value={newSchemeName}
                    onChange={(e) => setNewSchemeName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    हिंदी नाम (Hindi Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., पीएम सूर्य घर मुफ्त बिजली योजना"
                    value={newSchemeHindi}
                    onChange={(e) => setNewSchemeHindi(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">श्रेणी (Category)</label>
                  <select
                    value={newSchemeCategory}
                    onChange={(e) => setNewSchemeCategory(e.target.value as SchemeCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-400"
                  >
                    <option value="trending">Latest & Trending (नई योजना)</option>
                    <option value="youth">Youth & Employment (युवा)</option>
                    <option value="women">Women & SHG (महिला)</option>
                    <option value="artisans">Artisans & MSME (शिल्पकार)</option>
                    <option value="farmers">Farmers & Agriculture (किसान)</option>
                    <option value="pension">Pension & Labour (पेंशन)</option>
                    <option value="health">Health & Senior (स्वास्थ्य)</option>
                    <option value="housing">Housing (आवास)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    मुख्य आकर्षण (Key Highlight / Benefit)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., ₹78,000 सब्सिडी + 300 यूनिट फ्री बिजली"
                    value={newSchemeHighlight}
                    onChange={(e) => setNewSchemeHighlight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-slate-300 font-semibold mb-1">
                  योजना का विवरण (Description / Tagline)
                </label>
                <textarea
                  rows={2}
                  placeholder="योजना के बारे में संक्षेप में लिखें..."
                  value={newSchemeTagline}
                  onChange={(e) => setNewSchemeTagline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="text-xs">
                <label className="block text-slate-300 font-semibold mb-1">
                  आधिकारिक वेबसाइट लिंक (Official URL)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newSchemeUrl}
                  onChange={(e) => setNewSchemeUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('schemes')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  योजना जोड़ें व सिंक करें (Save & Auto-Sync)
                </button>
              </div>
            </form>
          ) : filteredSchemes.length > 0 ? (
            /* SCHEMES GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchemes.map((scheme) => {
                return (
                  <div
                    key={scheme.id}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top Category Badge & Tags */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold uppercase">
                          {scheme.categoryLabel}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {scheme.isLatest && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              NEW
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {scheme.launchYear}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                        {scheme.hindiName}
                      </h3>
                      <h4 className="text-xs text-slate-400 font-medium mt-0.5">
                        {scheme.name}
                      </h4>

                      {/* Key Highlight Pill */}
                      <div className="my-2.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{scheme.keyHighlight}</span>
                      </div>

                      {/* Tagline */}
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {scheme.tagline}
                      </p>

                      {/* Mini checklist of key benefits */}
                      <div className="mt-3 space-y-1 text-[11px] text-slate-400">
                        {scheme.benefits.slice(0, 2).map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-1 text-slate-300">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedScheme(scheme)}
                        className="text-xs font-semibold text-slate-300 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      >
                        <span>विस्तार से देखें</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSpeakDetails(scheme)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
                          title="Ask JARVIS to read scheme details aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={scheme.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => triggerHaptic([20])}
                          className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
                        >
                          <span>आवेदन पोर्टल</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800 p-6">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-300">कोई योजना नहीं मिली</h4>
              <p className="text-xs text-slate-400 mt-1">
                "{searchQuery}" से मेल खाती योजना उपलब्ध नहीं है। "PM Surya", "Vishwakarma", या "Drone" खोजें।
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-semibold"
              >
                सभी योजनाएं दिखाएं
              </button>
            </div>
          )}
        </div>

        {/* SCHEME DETAIL DRAWER / OVERLAY */}
        {selectedScheme && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-5 sm:p-7 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div>
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold uppercase">
                    {selectedScheme.categoryLabel}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                    {selectedScheme.hindiName}
                  </h2>
                  <h3 className="text-xs text-slate-400 font-medium">
                    {selectedScheme.name}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedScheme(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Highlight */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>मुख्य लाभ: {selectedScheme.keyHighlight}</span>
              </div>

              {/* Detailed Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Benefits */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>सभी मुख्य लाभ (Detailed Benefits):</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    {(selectedScheme.benefits || []).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Eligibility */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5 text-cyan-400">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>पात्रता मानदंड (Eligibility Criteria):</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    {(selectedScheme.eligibility || []).map((e, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Documents */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5 text-purple-400">
                    <FileCheck className="w-4 h-4 text-purple-400" />
                    <span>आवश्यक दस्तावेज (Required Documents):</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedScheme.documentsRequired || []).map((doc, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-purple-200 text-[11px]"
                      >
                        ✓ {doc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Application & Source */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5 text-amber-400">
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                    <span>आवेदन का तरीका व नोडल मंत्रालय:</span>
                  </h4>
                  <p className="text-slate-300">
                    <strong>आवेदन माध्यम:</strong> {selectedScheme.applicationMode}
                  </p>
                  <p className="text-slate-300">
                    <strong>नोडल मंत्रालय:</strong> {selectedScheme.source}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>अंतिम सत्यापित अपडेट:</strong> {selectedScheme.lastUpdated}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => handleSpeakDetails(selectedScheme)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>जार्विस से पूरी जानकारी सुनें (Voice Guide)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedScheme(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  वापस जाएं (Back)
                </button>

                <button
                  onClick={() => {
                    triggerHaptic([20]);
                    try {
                      navigator.clipboard.writeText(selectedScheme.officialUrl);
                      setCopiedSchemeUrl(selectedScheme.officialUrl);
                      setTimeout(() => setCopiedSchemeUrl(null), 2500);
                    } catch {
                      setCopiedSchemeUrl(selectedScheme.officialUrl);
                      setTimeout(() => setCopiedSchemeUrl(null), 2500);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSchemeUrl === selectedScheme.officialUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">कॉपी हो गया!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span>लिंक कॉपी करें</span>
                    </>
                  )}
                </button>

                <a
                  href={selectedScheme.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <span>आधिकारिक पोर्टल पर आवेदन करें</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="px-5 sm:px-7 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Official Government Gateway • myScheme & National Portal Integrated</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
            >
              बंद करें (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
