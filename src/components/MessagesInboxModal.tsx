import React, { useState } from 'react';
import {
  MessageSquare,
  MessageCircle,
  Volume2,
  CheckCheck,
  Send,
  X,
  Sparkles,
  Search,
  Plus,
  Clock,
  User,
  ExternalLink,
  Bell,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { IncomingMessage, Contact } from '../types';
import { launchWhatsApp, launchSms, triggerHaptic } from '../utils/deviceHardware';
import { speakJarvis } from '../utils/audioSynth';

interface MessagesInboxModalProps {
  messages: IncomingMessage[];
  contacts: Contact[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSendMessage: (recipientPhone: string, text: string, channel: 'sms' | 'whatsapp') => void;
  speechLang: 'hi-IN' | 'en-IN' | 'en-US';
  onSimulateIncomingMessage?: () => void;
}

export const MessagesInboxModal: React.FC<MessagesInboxModalProps> = ({
  messages,
  contacts,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onSendMessage,
  speechLang,
  onSimulateIncomingMessage,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'sms' | 'whatsapp'>('all');
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedContactPhone, setSelectedContactPhone] = useState(contacts[0]?.phone || '');
  const [composeText, setComposeText] = useState('');
  const [composeChannel, setComposeChannel] = useState<'sms' | 'whatsapp'>('sms');

  // AI Summarization States
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [summaryNotice, setSummaryNotice] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      m.senderName.toLowerCase().includes(search.toLowerCase()) ||
      m.text.toLowerCase().includes(search.toLowerCase()) ||
      m.senderPhone.includes(search);

    if (!matchesSearch) return false;
    if (filter === 'unread') return !m.read;
    if (filter === 'sms') return m.channel === 'sms';
    if (filter === 'whatsapp') return m.channel === 'whatsapp';
    return true;
  });

  const unreadCount = messages.filter((m) => !m.read).length;

  const handleReadMessageAloud = (msg: IncomingMessage) => {
    triggerHaptic([30, 40]);
    onMarkAsRead(msg.id);
    const speech = `${msg.senderName} ka message: "${msg.text}". Ye message ${msg.timestamp} par aaya tha.`;
    speakJarvis(speech, { lang: speechLang, muted: false });
  };

  const handleReadAllUnreadAloud = () => {
    triggerHaptic([40, 60]);
    const unread = messages.filter((m) => !m.read);
    if (unread.length === 0) {
      speakJarvis('Aapke paas koi naya ya unread message nahi hai. Sabhi messages pehle hi read ho chuke hain.', {
        lang: speechLang,
        muted: false,
      });
      return;
    }

    onMarkAllAsRead();
    const parts = unread.map(
      (m, idx) => `Message ${idx + 1} from ${m.senderName}: "${m.text}".`
    );
    const fullSpeech = `Ram Ram ji! Aapke paas ${unread.length} naye messages hain. ${parts.join(' ')}`;
    speakJarvis(fullSpeech, { lang: speechLang, muted: false });
  };

  const handleSummarizeUnread = async () => {
    triggerHaptic([40, 60]);
    const unread = messages.filter((m) => !m.read);

    if (unread.length === 0) {
      setSummaryNotice('Aapke paas koi unread message nahi hai. Sabhi messages read hain!');
      setSummaryResult(null);
      setSummaryError(null);
      speakJarvis('Aapke paas koi unread message nahi hai. Sabhi messages pehle se read hain.', {
        lang: speechLang,
        muted: false,
      });
      return;
    }

    setIsSummarizing(true);
    setSummaryError(null);
    setSummaryNotice(null);

    try {
      const response = await fetch('/api/messages/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: unread,
          language: speechLang.startsWith('hi') ? 'hindi' : 'english',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.summary) {
        setSummaryResult(data.summary);
        triggerHaptic([40, 70]);
      } else {
        throw new Error('Summary generation failed');
      }
    } catch (err: any) {
      console.error('[MessagesInboxModal] Summarize failed:', err);
      setSummaryError('Failed to generate summary with Gemini. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handlePlaySummaryVoice = () => {
    if (!summaryResult) return;
    triggerHaptic([30]);
    speakJarvis(summaryResult, { lang: speechLang, muted: false });
  };

  const handleCopySummary = async () => {
    if (!summaryResult) return;
    try {
      await navigator.clipboard.writeText(summaryResult);
      setCopied(true);
      triggerHaptic([30]);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy failed:', e);
    }
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeText.trim() || !selectedContactPhone) return;

    triggerHaptic([40]);
    onSendMessage(selectedContactPhone, composeText.trim(), composeChannel);
    if (composeChannel === 'whatsapp') {
      launchWhatsApp(selectedContactPhone, composeText.trim());
    } else {
      launchSms(selectedContactPhone, composeText.trim());
    }
    setComposeText('');
    setShowCompose(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Incoming Messages Inbox</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold">
                    {unreadCount} New
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Jarvis Voice Message Reader & SMS/WhatsApp</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read All & Action Bar */}
        <div className="py-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* LLM Summarize Button */}
            <button
              type="button"
              onClick={handleSummarizeUnread}
              disabled={isSummarizing}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600/40 via-purple-600/30 to-cyan-600/40 border border-violet-400/50 hover:border-violet-300 text-violet-200 hover:text-white text-xs font-bold flex items-center gap-2 hover:bg-violet-500/40 active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-50"
              title="Summarize all unread messages with Gemini LLM"
            >
              {isSummarizing ? (
                <>
                  <Loader2 className="w-4 h-4 text-violet-300 animate-spin" />
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-violet-300 animate-pulse" />
                  <span>Summarize</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-violet-500/50 text-[10px] text-violet-100 font-mono">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReadAllUnreadAloud}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600/30 to-teal-600/30 border border-cyan-400/50 text-cyan-200 text-xs font-bold flex items-center gap-2 hover:bg-cyan-500/30 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>🔊 Read All Aloud</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onSimulateIncomingMessage && (
              <button
                type="button"
                onClick={onSimulateIncomingMessage}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                title="Simulate receiving a new incoming message with subtle notification sound effect"
              >
                <Bell className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">Simulate Message</span>
                <span className="sm:hidden">Simulate</span>
              </button>
            )}

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowCompose(!showCompose)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 hover:bg-cyan-400 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Compose</span>
            </button>
          </div>
        </div>

        {/* AI Summary Notice (e.g. no unread messages) */}
        {summaryNotice && (
          <div className="mb-3 p-3 rounded-2xl bg-slate-800/80 border border-cyan-500/30 text-cyan-200 text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{summaryNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSummaryNotice(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* AI Summary Error */}
        {summaryError && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{summaryError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSummaryError(null)}
              className="p-1 text-rose-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* AI Summary Card */}
        {summaryResult && (
          <div className="mb-3 p-4 rounded-2xl bg-gradient-to-br from-violet-950/80 via-slate-900 to-indigo-950/80 border border-violet-400/50 shadow-xl relative animate-fade-in">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-violet-500/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-400/50 flex items-center justify-center text-violet-300">
                  <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-violet-200 flex items-center gap-2">
                    <span>Unread Messages Summary</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-violet-500/30 text-violet-300 border border-violet-400/40">
                      Gemini LLM
                    </span>
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSummaryResult(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss summary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-line bg-slate-950/60 p-3 rounded-xl border border-white/5 font-sans">
              {summaryResult}
            </p>

            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-violet-500/20">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlaySummaryVoice}
                  className="px-2.5 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/40 text-violet-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <Volume2 className="w-3.5 h-3.5 text-violet-300" />
                  <span>Read Aloud</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSummarizeUnread}
                  disabled={isSummarizing}
                  className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Re-generate summary"
                >
                  <RefreshCw className={`w-3 h-3 ${isSummarizing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onMarkAllAsRead();
                    triggerHaptic([30]);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Compose Sub-form */}
        {showCompose && (
          <form onSubmit={handleSendSubmit} className="mb-3 p-4 rounded-2xl bg-slate-800/80 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300">New Message</span>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setComposeChannel('sms')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    composeChannel === 'sms' ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  SMS
                </button>
                <button
                  type="button"
                  onClick={() => setComposeChannel('whatsapp')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    composeChannel === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  WhatsApp
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Select Recipient</label>
              <select
                value={selectedContactPhone}
                onChange={(e) => setSelectedContactPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.phone}>
                    {c.name} {c.relation ? `(${c.relation})` : ''} - {c.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Message Content</label>
              <textarea
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                placeholder="Type message or reply..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!composeText.trim()}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 hover:bg-cyan-400 disabled:opacity-40"
              >
                <Send className="w-3 h-3" />
                <span>Send via {composeChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-3">
          {(['all', 'unread', 'sms', 'whatsapp'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                filter === f
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f} {f === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
          ))}
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Koi messages nahi mile.
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  !msg.read
                    ? 'bg-slate-800/90 border-cyan-500/50 shadow-md'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: msg.avatarColor || '#0ea5e9' }}
                    >
                      {msg.senderName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {msg.senderName}
                        {msg.relation && (
                          <span className="text-[10px] text-cyan-400 font-normal">
                            ({msg.relation})
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {msg.senderPhone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        msg.channel === 'whatsapp'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      {msg.channel === 'whatsapp' ? (
                        <MessageCircle className="w-3 h-3" />
                      ) : (
                        <MessageSquare className="w-3 h-3" />
                      )}
                      <span className="uppercase">{msg.channel}</span>
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                  &quot;{msg.text}&quot;
                </p>

                {/* Actions: Read Aloud & Quick Reply */}
                <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleReadMessageAloud(msg)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3 text-cyan-400" />
                    <span>Read Aloud</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic([30]);
                        launchWhatsApp(msg.senderPhone);
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1"
                    >
                      <span>Reply WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic([30]);
                        launchSms(msg.senderPhone);
                      }}
                      className="px-2 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30 text-[11px] font-medium flex items-center gap-1"
                    >
                      <span>Reply SMS</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
