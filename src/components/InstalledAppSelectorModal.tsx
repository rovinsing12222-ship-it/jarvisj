import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Plus,
  Check,
  Smartphone,
  ExternalLink,
  Trash2,
  Sparkles,
  Layers,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  InstalledAndroidApp,
  CustomAndroidLauncher,
  getAllInstalledAndroidApps,
  registerCustomAndroidApp,
  addAppToQuickAccess,
  removeAppFromQuickAccess,
  dispatchAndroidAppLaunch,
} from '../utils/installedAndroidApps';
import { triggerHaptic } from '../utils/hapticEngine';

interface InstalledAppSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quickLaunchers: CustomAndroidLauncher[];
  onLaunchersUpdated: (updated: CustomAndroidLauncher[]) => void;
  onSpeak?: (text: string) => void;
}

const CATEGORIES = [
  'All',
  'Social & Chat',
  'Media & Audio',
  'Navigation & Travel',
  'Finance & UPI',
  'Productivity',
  'Shopping & Food',
  'System & Utilities',
  'Government & Citizen',
  '➕ Add Custom APK',
] as const;

const PRESET_ICONS = ['🤖', '📱', '💬', '▶️', '📸', '🎵', '🗺️', '💳', '🟣', '📦', '🍔', '🏛️', '⚡', '🎮', '🛠️', '🔒', '💼', '🚀'];

export const InstalledAppSelectorModal: React.FC<InstalledAppSelectorModalProps> = ({
  isOpen,
  onClose,
  quickLaunchers,
  onLaunchersUpdated,
  onSpeak,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [installedApps, setInstalledApps] = useState<InstalledAndroidApp[]>(() =>
    getAllInstalledAndroidApps()
  );

  // Custom App Form State
  const [customName, setCustomName] = useState('');
  const [customPackage, setCustomPackage] = useState('');
  const [customDeepLink, setCustomDeepLink] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customIcon, setCustomIcon] = useState('🤖');
  const [customCategory, setCustomCategory] = useState<InstalledAndroidApp['category']>('Custom');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Quick lookup set of pinned package names
  const pinnedPackageNames = useMemo(
    () => new Set(quickLaunchers.map((l) => l.packageName)),
    [quickLaunchers]
  );

  // Filtered Apps
  const filteredApps = useMemo(() => {
    return installedApps.filter((app) => {
      // Category filter
      if (selectedCategory !== 'All' && selectedCategory !== '➕ Add Custom APK') {
        if (app.category !== selectedCategory) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = app.name.toLowerCase().includes(q);
        const matchesPkg = app.packageName.toLowerCase().includes(q);
        const matchesDesc = app.description.toLowerCase().includes(q);
        const matchesCat = app.category.toLowerCase().includes(q);
        return matchesName || matchesPkg || matchesDesc || matchesCat;
      }
      return true;
    });
  }, [installedApps, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  // Toggle pin/unpin for an app
  const handleTogglePin = (app: InstalledAndroidApp) => {
    triggerHaptic([30, 20]);
    const existing = quickLaunchers.find((l) => l.packageName === app.packageName);
    if (existing) {
      removeAppFromQuickAccess(existing.id);
      const updated = quickLaunchers.filter((l) => l.id !== existing.id);
      onLaunchersUpdated(updated);
      if (onSpeak) {
        onSpeak(`Removed "${app.name}" from PC Quick Access bar.`);
      }
    } else {
      const newLauncher = addAppToQuickAccess(app);
      const updated = [...quickLaunchers, newLauncher];
      onLaunchersUpdated(updated);
      if (onSpeak) {
        onSpeak(`Pinned "${app.name}" to PC Quick Access bar!`);
      }
    }
  };

  // Test launch directly from modal
  const handleTestLaunch = (app: InstalledAndroidApp) => {
    triggerHaptic([40, 40]);
    const tempLauncher: CustomAndroidLauncher = {
      id: `test-${app.id}`,
      appId: app.id,
      name: app.name,
      packageName: app.packageName,
      icon: app.icon,
      category: app.category,
      deepLinkUrl: app.deepLinkUrl,
      pinnedAt: Date.now(),
    };
    dispatchAndroidAppLaunch(tempLauncher);
    if (onSpeak) {
      onSpeak(`Launching Android application "${app.name}" directly on device.`);
    }
  };

  // Handle Registering a Custom Android APK
  const handleRegisterCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const trimmedName = customName.trim();
    const trimmedPkg = customPackage.trim();

    if (!trimmedName) {
      setFormError('Please enter an Application Display Name.');
      return;
    }
    if (!trimmedPkg || !trimmedPkg.includes('.')) {
      setFormError('Please enter a valid Android Package Name (e.g., com.example.app).');
      return;
    }

    // Check if package already registered
    const exists = installedApps.some(
      (a) => a.packageName.toLowerCase() === trimmedPkg.toLowerCase()
    );
    if (exists) {
      setFormError(`An app with package "${trimmedPkg}" is already registered in the installed list.`);
      return;
    }

    const registered = registerCustomAndroidApp({
      name: trimmedName,
      packageName: trimmedPkg,
      deepLinkUrl: customDeepLink.trim() || undefined,
      description: customDescription.trim() || 'Custom registered Android APK application',
      icon: customIcon,
      category: customCategory,
      version: 'Custom Build',
      size: 'Local APK',
    });

    // Update state
    const updatedCatalog = getAllInstalledAndroidApps();
    setInstalledApps(updatedCatalog);

    // Auto-pin to Quick Access Bar
    const newLauncher = addAppToQuickAccess(registered);
    onLaunchersUpdated([...quickLaunchers, newLauncher]);

    triggerHaptic([40, 30, 60]);
    setFormSuccess(`✓ Successfully registered "${trimmedName}" and pinned to PC Quick Access!`);
    if (onSpeak) {
      onSpeak(`Registered custom Android app "${trimmedName}" and added it to your PC Quick Access bar!`);
    }

    // Reset form
    setCustomName('');
    setCustomPackage('');
    setCustomDeepLink('');
    setCustomDescription('');
  };

  return (
    <div
      id="installed-app-selector-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900/95 border border-cyan-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Smartphone className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Android App Launcher Selector</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                    Quick Access Bar
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Select from installed Android apps to pin custom one-tap launchers to your PC Control bar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300">
              <span className="font-bold text-white">{quickLaunchers.length}</span> Pinned
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
              title="Close Selector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Navigation */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 space-y-3 flex-shrink-0">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              id="search-installed-android-apps"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by app name, package (e.g. com.whatsapp), or category..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    triggerHaptic([15]);
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>{cat}</span>
                  {cat === 'All' && (
                    <span className="text-[10px] font-mono opacity-80">({installedApps.length})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: App List or Custom APK Creator */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedCategory === '➕ Add Custom APK' ? (
            /* Custom APK Creator Form */
            <form onSubmit={handleRegisterCustomApp} className="space-y-4 max-w-2xl mx-auto py-2">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Register Sideloaded / Custom Android APK</span>
                </h4>
                <p className="text-xs text-slate-300">
                  Add any application installed on your Android device (custom APK, corporate tools, drones, banking apps) to the PC Quick Access Bar by specifying its package name.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-cyan-300 mb-1">
                    APPLICATION NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., DJI Fly Drone, SBI YONO, Crop Monitor"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-cyan-300 mb-1">
                    ANDROID PACKAGE NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={customPackage}
                    onChange={(e) => setCustomPackage(e.target.value)}
                    placeholder="e.g., dji.go.v5, com.sbi.lotusintouch"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-cyan-300 mb-1">
                    DEEP LINK / WEB INTENT URL (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={customDeepLink}
                    onChange={(e) => setCustomDeepLink(e.target.value)}
                    placeholder="e.g., https://app.example.com or custom://intent"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-cyan-300 mb-1">CATEGORY</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Custom">Custom / General</option>
                    <option value="Social & Chat">Social & Chat</option>
                    <option value="Media & Audio">Media & Audio</option>
                    <option value="Navigation & Travel">Navigation & Travel</option>
                    <option value="Finance & UPI">Finance & UPI</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Shopping & Food">Shopping & Food</option>
                    <option value="System & Utilities">System & Utilities</option>
                    <option value="Government & Citizen">Government & Citizen</option>
                  </select>
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-mono text-cyan-300 mb-1.5">
                  CHOOSE LAUNCHER ICON
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCustomIcon(emoji)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                        customIcon === emoji
                          ? 'bg-cyan-500/30 border-2 border-cyan-400 scale-110 shadow-md'
                          : 'bg-slate-950 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-cyan-300 mb-1">
                  DESCRIPTION (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Short note about what this app does..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register & Pin to PC Quick Access Bar</span>
                </button>
              </div>
            </form>
          ) : (
            /* Installed Apps Grid */
            <>
              {filteredApps.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-white">No installed Android apps found</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try searching for another keyword or switch to the{' '}
                    <span
                      onClick={() => setSelectedCategory('➕ Add Custom APK')}
                      className="text-cyan-400 cursor-pointer underline font-bold"
                    >
                      Add Custom APK
                    </span>{' '}
                    tab to register a custom package name.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredApps.map((app) => {
                    const isPinned = pinnedPackageNames.has(app.packageName);

                    return (
                      <div
                        key={app.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                          isPinned
                            ? 'bg-cyan-950/40 border-cyan-500/50 shadow-sm'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* App Icon & Details */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                            {app.icon}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                {app.name}
                              </h4>
                              {app.isSystemApp && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                  System
                                </span>
                              )}
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                                {app.category}
                              </span>
                            </div>

                            <p className="text-[11px] font-mono text-cyan-400/80 truncate mt-0.5">
                              {app.packageName}
                            </p>

                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {app.description}
                            </p>

                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                              {app.size && <span>{app.size}</span>}
                              {app.version && <span>• {app.version}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleTogglePin(app)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                              isPinned
                                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 hover:bg-rose-950/50 hover:border-rose-500/60 hover:text-rose-300'
                                : 'bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-200'
                            }`}
                            title={isPinned ? 'Click to unpin from Quick Access' : 'Pin to Quick Access Bar'}
                          >
                            {isPinned ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Pinned</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Pin to Bar</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTestLaunch(app)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Test Launch directly on device"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Test Launch</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono">
              Android Intent Subsystem Active • One-Tap Physical Phone & PC Bridge Dispatch
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('➕ Add Custom APK')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Sideloaded APK</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
