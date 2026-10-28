import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageSquare,
  Mail,
  User as UserIcon,
  Trash2,
  Edit2,
  X,
  Check,
  Smartphone,
  Briefcase,
  Home,
  Heart,
  Shield,
  Stethoscope,
  ExternalLink,
  RefreshCw,
  LogOut,
  AlertCircle,
  CheckCircle2,
  DownloadCloud,
  Sparkles,
  Zap,
  Hash,
} from 'lucide-react';
import { Contact } from '../types';
import { launchPhoneCall, launchWhatsApp, launchSms, triggerHaptic } from '../utils/deviceHardware';
import { DeleteContactConfirmModal } from './DeleteContactConfirmModal';
import {
  initAuth,
  googleSignIn,
  logout as googleLogout,
  fetchGoogleContacts,
} from '../services/googleContactsService';
import {
  fuzzyFilterAndRankContacts,
  ScoredContact,
} from '../utils/fuzzySearch';
import type { User } from 'firebase/auth';

/**
 * Real-time character highlighting for matched fuzzy search results
 */
const HighlightText: React.FC<{
  text: string;
  indices?: number[];
  className?: string;
  highlightClass?: string;
}> = ({
  text,
  indices = [],
  className = '',
  highlightClass = 'text-amber-300 font-extrabold bg-amber-500/25 px-0.5 rounded-xs shadow-xs',
}) => {
  if (!indices || indices.length === 0) {
    return <span className={className}>{text}</span>;
  }
  const indexSet = new Set(indices);
  return (
    <span className={className}>
      {Array.from(text).map((char, i) =>
        indexSet.has(i) ? (
          <span key={i} className={highlightClass}>
            {char}
          </span>
        ) : (
          <span key={i}>{char}</span>
        )
      )}
    </span>
  );
};

interface ContactManagerProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
  onUpdateContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  onReplaceContacts?: (newContacts: Contact[]) => void;
  selectedContactForDetails?: Contact | null;
  onCloseDetails?: () => void;
  onExecuteJarvisCommand?: (cmd: string) => void;
  onInitiateCall?: (contact: Contact, phone: string) => void;
}

export const ContactManager: React.FC<ContactManagerProps> = ({
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onReplaceContacts,
  selectedContactForDetails,
  onCloseDetails,
  onExecuteJarvisCommand,
  onInitiateCall,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [activeDetailContact, setActiveDetailContact] = useState<Contact | null>(
    selectedContactForDetails || null
  );

  // Contact Delete Confirmation Dialog State
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Google Contacts Sync States
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(() => {
    try {
      return localStorage.getItem('jarvis_google_contacts_last_sync');
    } catch {
      return null;
    }
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    phoneType: 'mobile' as 'mobile' | 'work' | 'home',
    secondaryPhone: '',
    secondaryPhoneType: 'work' as 'mobile' | 'work' | 'home',
    relation: '',
    email: '',
    notes: '',
    avatarColor: '#0891b2',
  });

  // Listen to Google Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Sync external selected contact for details if provided
  useEffect(() => {
    if (selectedContactForDetails) {
      setActiveDetailContact(selectedContactForDetails);
    }
  }, [selectedContactForDetails]);

  // Handle Google Contacts Connect & Import
  const handleConnectAndImportGoogle = async (replaceMode: boolean = true) => {
    triggerHaptic([30]);
    setIsSyncing(true);
    setSyncStatusMsg({ type: 'info', text: 'Connecting to Google Contacts API...' });

    try {
      let token = googleAccessToken;
      let user = googleUser;

      if (!token || !user) {
        const authResult = await googleSignIn();
        if (!authResult) {
          throw new Error('Google Sign-in was cancelled.');
        }
        token = authResult.accessToken;
        user = authResult.user;
        setGoogleUser(user);
        setGoogleAccessToken(token);
      }

      setSyncStatusMsg({ type: 'info', text: 'Fetching your contacts from Google...' });
      const fetchedContacts = await fetchGoogleContacts(token);

      if (fetchedContacts.length === 0) {
        setSyncStatusMsg({
          type: 'info',
          text: 'Google Contacts connected, but no contacts with phone numbers were found.',
        });
        return;
      }

      if (replaceMode && onReplaceContacts) {
        // Replace manual list
        onReplaceContacts(fetchedContacts);
      } else if (onReplaceContacts) {
        // Merge with existing contacts, avoiding duplicate phones
        const existingPhones = new Set(contacts.map((c) => c.phone.replace(/\D/g, '')));
        const newOnes = fetchedContacts.filter((fc) => !existingPhones.has(fc.phone.replace(/\D/g, '')));
        onReplaceContacts([...newOnes, ...contacts]);
      }

      const syncTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncDate(syncTimestamp);
      try {
        localStorage.setItem('jarvis_google_contacts_last_sync', syncTimestamp);
      } catch {}

      setSyncStatusMsg({
        type: 'success',
        text: `Successfully imported ${fetchedContacts.length} contacts from Google Contacts (Manual list replaced).`,
      });
      triggerHaptic([40, 60]);
      onExecuteJarvisCommand?.(`Google Contacts synchronized: ${fetchedContacts.length} contacts loaded.`);
    } catch (err: any) {
      console.error('Google Contacts sync failure:', err);
      setSyncStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to sync Google Contacts. Please try again.',
      });
      triggerHaptic([100, 100]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    triggerHaptic([20]);
    await googleLogout();
    setGoogleUser(null);
    setGoogleAccessToken(null);
    setSyncStatusMsg({ type: 'info', text: 'Google Account disconnected.' });
  };

  // Open confirmation modal for contact deletion
  const handlePromptDelete = (contact: Contact) => {
    triggerHaptic([30]);
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = (contact: Contact) => {
    triggerHaptic([40, 60]);
    onDeleteContact(contact.id);
    setShowDeleteModal(false);
    setContactToDelete(null);
    if (activeDetailContact?.id === contact.id) {
      setActiveDetailContact(null);
      onCloseDetails?.();
    }
  };

  // Real-time Fuzzy Search & Ranking with subsequence, typos, and T9 support
  const scoredContacts: ScoredContact[] = useMemo(() => {
    return fuzzyFilterAndRankContacts(contacts, searchQuery, activeFilter);
  }, [contacts, searchQuery, activeFilter]);

  const handleCall = (number: string, name: string, type: string) => {
    triggerHaptic([50, 50, 100]);
    launchPhoneCall(number, name);
    const found = contacts.find((c) => c.phone === number || c.secondaryPhone === number) || {
      id: `c-${Date.now()}`,
      name,
      phone: number,
      avatarColor: '#0ea5e9',
    };
    onInitiateCall?.(found, number);
    onExecuteJarvisCommand?.(`Called ${name} (${type}): ${number}`);
  };

  const handleWhatsApp = (number: string, name: string) => {
    triggerHaptic([40, 40]);
    launchWhatsApp(number, `Hi ${name}, reaching out via JARVIS.`);
    onExecuteJarvisCommand?.(`Opened WhatsApp chat for ${name}`);
  };

  const handleSms = (number: string, name: string) => {
    triggerHaptic([40, 40]);
    launchSms(number, `Hello ${name}`);
    onExecuteJarvisCommand?.(`Opened SMS composer for ${name}`);
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      phone: '',
      phoneType: 'mobile',
      secondaryPhone: '',
      secondaryPhoneType: 'work',
      relation: '',
      email: '',
      notes: '',
      avatarColor: '#0891b2',
    });
    setEditingContact(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setFormData({
      name: contact.name,
      phone: contact.phone,
      phoneType: contact.phoneType || 'mobile',
      secondaryPhone: contact.secondaryPhone || '',
      secondaryPhoneType: contact.secondaryPhoneType || 'work',
      relation: contact.relation || '',
      email: contact.email || '',
      notes: contact.notes || '',
      avatarColor: contact.avatarColor || '#0891b2',
    });
    setEditingContact(contact);
    setShowAddModal(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    if (editingContact) {
      const updated: Contact = {
        ...editingContact,
        ...formData,
      };
      onUpdateContact(updated);
      if (activeDetailContact?.id === updated.id) {
        setActiveDetailContact(updated);
      }
    } else {
      onAddContact(formData);
    }

    setShowAddModal(false);
  };

  return (
    <div className="w-full bg-gray-900/70 border border-cyan-500/20 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono tracking-wider text-cyan-100 uppercase">
              JARVIS CONTACTS & SPEED DIALER
            </h3>
          </div>
          <p className="text-[11px] text-cyan-400/60 font-mono mt-0.5">
            Voice-dialable contact directory with Google Contacts API sync & safety confirmation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-add-new-contact"
            type="button"
            onClick={handleOpenAdd}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.4)] active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW CONTACT</span>
          </button>
        </div>
      </div>

      {/* Google Contacts API Synchronization Panel */}
      <div className="w-full mb-4 p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-inner">
        <div className="flex items-center gap-3">
          {/* Google G Icon */}
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow shrink-0">
            <svg viewBox="0 0 48 48" className="w-full h-full">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100">Google Contacts API</span>
              {googleUser ? (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Connected: {googleUser.email || googleUser.displayName}</span>
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-slate-400 font-mono">
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              {lastSyncDate
                ? `Last synced at ${lastSyncDate} • Automatically replaces manual contact list`
                : 'Import your Google Contacts directly with official People API synchronization.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
          <button
            type="button"
            disabled={isSyncing}
            onClick={() => handleConnectAndImportGoogle(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Import & synchronize contacts from Google Contacts, replacing the manual list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync & Replace List'}</span>
          </button>

          {googleUser && (
            <button
              type="button"
              onClick={handleDisconnectGoogle}
              className="p-2 rounded-xl bg-slate-900 border border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
              title="Disconnect Google account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div
          className={`w-full p-2.5 mb-4 rounded-xl text-xs font-mono flex items-center justify-between gap-2 animate-fade-in ${
            syncStatusMsg.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
              : syncStatusMsg.type === 'error'
              ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
              : 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncStatusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : syncStatusMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0 text-cyan-400 animate-spin" />
            )}
            <span>{syncStatusMsg.text}</span>
          </div>

          <button
            type="button"
            onClick={() => setSyncStatusMsg(null)}
            className="text-slate-400 hover:text-slate-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Fuzzy Filter Bar */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/60" />
          <input
            id="contact-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Fuzzy search name, initials, relation, or phone digits (e.g., 'dsharma', '9876', '323')..."
            className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-100 placeholder-cyan-500/40 text-xs font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 shadow-inner"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
                  {/^\d+$/.test(searchQuery.replace(/[\s+()-]/g, '')) ? (
                    <>
                      <Hash className="w-3 h-3 text-amber-400" />
                      <span>T9 / Digits</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>Fuzzy</span>
                    </>
                  )}
                  <span>({scoredContacts.length})</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic([15]);
                    setSearchQuery('');
                  }}
                  className="px-1.5 py-0.5 text-cyan-400/60 hover:text-cyan-200 bg-gray-900 rounded border border-cyan-500/20 text-xs font-mono cursor-pointer"
                  title="Clear search"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Real-time Search Assist & Feedback */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between px-1 text-[11px] font-mono text-cyan-400/70">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>
                Found <strong>{scoredContacts.length}</strong> matching contacts ranked by relevance
              </span>
            </span>
            <span className="text-[10px] text-cyan-500/50 hidden sm:inline">
              Real-time subsequence & typo matching
            </span>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
          {[
            { id: 'all', label: `All (${contacts.length})` },
            { id: 'family', label: 'Family (Dad/Mom)' },
            { id: 'doctor', label: 'Medical / Doctors' },
            { id: 'work', label: 'Work & Office' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200'
                  : 'bg-gray-950/60 border border-cyan-500/10 text-cyan-400/60 hover:text-cyan-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {scoredContacts.length === 0 ? (
          <div className="col-span-full py-8 text-center bg-gray-950/40 rounded-xl border border-cyan-500/10">
            <Users className="w-8 h-8 text-cyan-500/30 mx-auto mb-2" />
            <p className="text-xs font-mono text-cyan-400/60">No contacts match "{searchQuery}".</p>
            <p className="text-[11px] text-cyan-400/40 font-mono mt-1">
              Try typing initials like "DS", phone digits like "987", or reset search.
            </p>
          </div>
        ) : (
          scoredContacts.map((scoredItem) => {
            const c = scoredItem.contact;
            return (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-gray-950/80 border border-cyan-500/20 hover:border-cyan-400/60 transition-all flex flex-col justify-between group shadow-sm relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md flex-shrink-0"
                      style={{ backgroundColor: c.avatarColor || '#0891b2' }}
                    >
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-cyan-100 group-hover:text-cyan-300 transition-colors">
                        <HighlightText text={c.name} indices={scoredItem.nameIndices} />
                      </h4>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        {c.relation && (
                          <span className="inline-block text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                            {c.relation}
                          </span>
                        )}
                        {searchQuery && scoredItem.matchedField === 't9' && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                            <Hash className="w-2.5 h-2.5" />
                            <span>T9 Dialpad</span>
                          </span>
                        )}
                        {searchQuery && scoredItem.matchedField === 'relation' && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/20">
                            Matched Role
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-view-details-${c.id}`}
                      onClick={() => setActiveDetailContact(c)}
                      className="text-[11px] font-mono text-cyan-400/70 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-400 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    >
                      DETAILS
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePromptDelete(c)}
                      className="p-1 rounded text-red-400/60 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
                      title={`Delete ${c.name} with confirmation`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Numbers Section */}
                <div className="mt-3 space-y-1.5 border-t border-cyan-500/10 pt-2.5">
                  {/* Primary Number */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-cyan-300 truncate">
                      {c.phoneType === 'work' ? (
                        <Briefcase className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      ) : c.phoneType === 'home' ? (
                        <Home className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      )}
                      <span className="truncate">
                        <HighlightText
                          text={c.phone}
                          indices={scoredItem.matchedField === 'phone' ? scoredItem.phoneIndices : []}
                        />
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        id={`btn-call-primary-${c.id}`}
                        onClick={() => handleCall(c.phone, c.name, c.phoneType || 'mobile')}
                        className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                        title="Call via Phone"
                      >
                        <Phone className="w-3 h-3" />
                      </button>
                      <button
                        id={`btn-whatsapp-primary-${c.id}`}
                        onClick={() => handleWhatsApp(c.phone, c.name)}
                        className="p-1.5 rounded-lg bg-green-950/80 hover:bg-green-900 border border-green-500/40 text-green-400 hover:text-green-300 transition-colors cursor-pointer"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                      <button
                        id={`btn-sms-primary-${c.id}`}
                        onClick={() => handleSms(c.phone, c.name)}
                        className="p-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                        title="Send SMS"
                      >
                        <Mail className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Secondary Number (Optional) */}
                  {c.secondaryPhone && (
                    <div className="flex items-center justify-between text-xs font-mono bg-cyan-950/30 p-1.5 rounded-lg border border-cyan-500/10">
                      <div className="flex items-center gap-1.5 text-cyan-400/80 truncate">
                        {c.secondaryPhoneType === 'work' ? (
                          <Briefcase className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        ) : c.secondaryPhoneType === 'home' ? (
                          <Home className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        ) : (
                          <Smartphone className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        )}
                        <span className="truncate">
                          <HighlightText
                            text={c.secondaryPhone}
                            indices={
                              scoredItem.matchedField === 'secondaryPhone' ? scoredItem.phoneIndices : []
                            }
                          />
                        </span>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() =>
                            handleCall(c.secondaryPhone!, c.name, c.secondaryPhoneType || 'alt')
                          }
                          className="p-1 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 transition-colors cursor-pointer"
                          title="Call Secondary Number"
                        >
                          <Phone className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() => handleWhatsApp(c.secondaryPhone!, c.name)}
                          className="p-1 rounded bg-green-950/60 hover:bg-green-900 text-green-400 transition-colors cursor-pointer"
                          title="WhatsApp Secondary"
                        >
                          <MessageSquare className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Dialog Component Before Deleting Contact */}
      <DeleteContactConfirmModal
        isOpen={showDeleteModal}
        contact={contactToDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setContactToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Contact Details Full Dossier Modal */}
      {activeDetailContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-gray-900 border border-cyan-500/40 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative text-cyan-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                  JARVIS DOSSIER RECORD
                </span>
              </div>
              <button
                onClick={() => {
                  setActiveDetailContact(null);
                  onCloseDetails?.();
                }}
                className="text-cyan-400/60 hover:text-cyan-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Hero */}
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-lg flex-shrink-0"
                style={{ backgroundColor: activeDetailContact.avatarColor || '#0891b2' }}
              >
                {activeDetailContact.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-cyan-100">{activeDetailContact.name}</h3>
                {activeDetailContact.relation && (
                  <span className="inline-block mt-0.5 text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                    {activeDetailContact.relation}
                  </span>
                )}
                {activeDetailContact.email && (
                  <p className="text-xs font-mono text-cyan-400/70 truncate mt-1">
                    {activeDetailContact.email}
                  </p>
                )}
              </div>
            </div>

            {/* Detailed Number Rows */}
            <div className="space-y-2 border-t border-cyan-500/20 pt-3">
              <span className="text-[10px] font-mono uppercase text-cyan-400/50 block">
                COMMUNICATION CHANNELS
              </span>

              {/* Primary Line */}
              <div className="p-2.5 rounded-xl bg-gray-950 border border-cyan-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400/50 uppercase block">
                    PRIMARY LINE ({activeDetailContact.phoneType || 'MOBILE'})
                  </span>
                  <span className="text-xs font-mono text-cyan-200 font-bold">
                    {activeDetailContact.phone}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      handleCall(
                        activeDetailContact.phone,
                        activeDetailContact.name,
                        activeDetailContact.phoneType || 'mobile'
                      )
                    }
                    className="p-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      handleWhatsApp(activeDetailContact.phone, activeDetailContact.name)
                    }
                    className="p-2 rounded-lg bg-green-950 hover:bg-green-900 border border-green-500/40 text-green-400"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Secondary Line */}
              {activeDetailContact.secondaryPhone && (
                <div className="p-2.5 rounded-xl bg-gray-950 border border-cyan-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400/50 uppercase block">
                      SECONDARY LINE ({activeDetailContact.secondaryPhoneType || 'WORK'})
                    </span>
                    <span className="text-xs font-mono text-cyan-200 font-bold">
                      {activeDetailContact.secondaryPhone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        handleCall(
                          activeDetailContact.secondaryPhone!,
                          activeDetailContact.name,
                          activeDetailContact.secondaryPhoneType || 'alt'
                        )
                      }
                      className="p-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        handleWhatsApp(
                          activeDetailContact.secondaryPhone!,
                          activeDetailContact.name
                        )
                      }
                      className="p-2 rounded-lg bg-green-950 hover:bg-green-900 border border-green-500/40 text-green-400"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Notes */}
              {activeDetailContact.notes && (
                <div className="p-2.5 rounded-xl bg-gray-950 border border-cyan-500/10">
                  <span className="text-[10px] font-mono text-cyan-400/50 uppercase block mb-1">
                    DOSSIER NOTES
                  </span>
                  <p className="text-xs text-cyan-200/80 font-sans leading-relaxed">
                    {activeDetailContact.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Action footer */}
            <div className="flex items-center justify-between pt-3 border-t border-cyan-500/20">
              <button
                type="button"
                onClick={() => handlePromptDelete(activeDetailContact)}
                className="text-xs font-mono text-red-400 hover:text-red-300 flex items-center gap-1.5 p-1 rounded hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>DELETE</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(activeDetailContact);
                    setActiveDetailContact(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1 hover:bg-cyan-950/60 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>EDIT</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDetailContact(null);
                    onCloseDetails?.();
                  }}
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono cursor-pointer"
                >
                  DONE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-gray-900 border border-cyan-500/40 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative text-cyan-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                {editingContact ? 'EDIT CONTACT RECORD' : 'CREATE NEW JARVIS CONTACT'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-cyan-400/60 hover:text-cyan-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-cyan-400/60 mb-1">FULL NAME *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Papa, Dr. Sharma, Rohit"
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-cyan-400/60 mb-1">PRIMARY PHONE NUMBER *</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-100 focus:outline-none focus:border-cyan-400"
                  />
                  <select
                    value={formData.phoneType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phoneType: e.target.value as 'mobile' | 'work' | 'home',
                      })
                    }
                    className="px-2 py-2 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-300"
                  >
                    <option value="mobile">Mobile</option>
                    <option value="work">Work</option>
                    <option value="home">Home</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-cyan-400/60 mb-1">SECONDARY PHONE (OPTIONAL)</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={formData.secondaryPhone}
                    onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                    placeholder="e.g. Office or Alt number"
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-100 focus:outline-none focus:border-cyan-400"
                  />
                  <select
                    value={formData.secondaryPhoneType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        secondaryPhoneType: e.target.value as 'mobile' | 'work' | 'home',
                      })
                    }
                    className="px-2 py-2 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-300"
                  >
                    <option value="work">Work</option>
                    <option value="home">Home</option>
                    <option value="mobile">Mobile</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-cyan-400/60 mb-1">RELATIONSHIP / ROLE</label>
                <input
                  type="text"
                  value={formData.relation}
                  onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                  placeholder="e.g. Dad, Mom, Cardiologist, Boss, Colleague"
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-cyan-400/60 mb-1">EMAIL (OPTIONAL)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. person@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-cyan-400/60 mb-1">NOTES</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Key instructions or medical context..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-100 focus:outline-none focus:border-cyan-400 resize-none font-sans text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/60 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingContact ? 'UPDATE' : 'SAVE'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
