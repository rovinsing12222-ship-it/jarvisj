import React, { useState } from 'react';
import { Phone, MessageSquare, ExternalLink, UserPlus, Youtube, Camera, MapPin, Music, Sliders, Smartphone, Check, Send, AlertCircle } from 'lucide-react';
import { Contact } from '../types';
import { launchPhoneCall, launchWhatsApp, launchSms, launchAndroidApp } from '../utils/deviceHardware';

interface PhoneControlPanelProps {
  contacts: Contact[];
  onOpenAddContact: () => void;
  onExecuteJarvisCommand: (cmd: string) => void;
}

export const PhoneControlPanel: React.FC<PhoneControlPanelProps> = ({
  contacts,
  onOpenAddContact,
  onExecuteJarvisCommand,
}) => {
  const [activeTab, setActiveTab] = useState<'calls' | 'messages' | 'apps'>('calls');
  const [customPhone, setCustomPhone] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(contacts[0] || null);
  const [messageBody, setMessageBody] = useState('');
  const [msgPlatform, setMsgPlatform] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [customAppQuery, setCustomAppQuery] = useState('');

  const appsList = [
    { name: 'YouTube', icon: Youtube, color: 'text-red-400 border-red-500/30 bg-red-950/30', key: 'youtube', hint: 'Play videos & music' },
    { name: 'Camera', icon: Camera, color: 'text-sky-400 border-sky-500/30 bg-sky-950/30', key: 'camera', hint: 'Capture photo / video' },
    { name: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30', key: 'whatsapp', hint: 'Chat & voice calls' },
    { name: 'Spotify', icon: Music, color: 'text-green-400 border-green-500/30 bg-green-950/30', key: 'spotify', hint: 'Stream songs & podcasts' },
    { name: 'Google Maps', icon: MapPin, color: 'text-amber-400 border-amber-500/30 bg-amber-950/30', key: 'maps', hint: 'GPS & navigation' },
    { name: 'Device Settings', icon: Sliders, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/30', key: 'settings', hint: 'Android system settings' },
    { name: 'Calculator', icon: Smartphone, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30', key: 'calculator', hint: 'Quick calculations' },
    { name: 'Chrome Browser', icon: ExternalLink, color: 'text-blue-400 border-blue-500/30 bg-blue-950/30', key: 'chrome', hint: 'Browse internet' },
  ];

  const handleCallNumber = (phone: string, name?: string) => {
    launchPhoneCall(phone);
    onExecuteJarvisCommand(`Called ${name || phone} directly via Android dialer`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = selectedContact ? selectedContact.phone : customPhone;
    if (!messageBody.trim()) return;

    if (msgPlatform === 'whatsapp') {
      launchWhatsApp(phone, messageBody);
      onExecuteJarvisCommand(`Sent WhatsApp message to ${selectedContact?.name || phone}: "${messageBody}"`);
    } else {
      launchSms(phone, messageBody);
      onExecuteJarvisCommand(`Sent SMS to ${selectedContact?.name || phone}: "${messageBody}"`);
    }
    setMessageBody('');
  };

  const handleLaunchApp = (appKey: string, appName: string) => {
    launchAndroidApp(appKey, customAppQuery);
    onExecuteJarvisCommand(`Opened ${appName} on Android device`);
  };

  return (
    <div className="w-full bg-gray-900/60 border border-cyan-500/20 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      {/* Sub-Tab Navigation Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            id="tab-phone-calls"
            onClick={() => setActiveTab('calls')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              activeTab === 'calls'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-950/30'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>CALL DIALER</span>
          </button>

          <button
            id="tab-phone-messages"
            onClick={() => setActiveTab('messages')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              activeTab === 'messages'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-950/30'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WHATSAPP & SMS</span>
          </button>

          <button
            id="tab-phone-apps"
            onClick={() => setActiveTab('apps')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              activeTab === 'apps'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-950/30'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>APP LAUNCHER</span>
          </button>
        </div>

        <button
          id="btn-add-contact-panel"
          onClick={onOpenAddContact}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-200 flex items-center gap-1 px-2.5 py-1 rounded-md border border-cyan-500/30 hover:border-cyan-400 transition-colors"
        >
          <UserPlus className="w-3 h-3" />
          <span className="hidden sm:inline">CONTACTS</span>
        </button>
      </div>

      {/* CALLS TAB */}
      {activeTab === 'calls' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400/80">SAVED PHONE CONTACTS (VOICE-READY):</span>
            <span className="text-[11px] font-mono text-cyan-400/50">{contacts.length} numbers registered</span>
          </div>

          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-gray-950/70 border border-cyan-500/20 hover:border-cyan-400/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-inner"
                    style={{ backgroundColor: c.avatarColor || '#0891b2' }}
                  >
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-100">{c.name}</h4>
                    <p className="text-xs font-mono text-cyan-400/70">{c.phone}</p>
                    {c.relation && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        {c.relation}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  id={`btn-call-${c.id}`}
                  onClick={() => handleCallNumber(c.phone, c.name)}
                  aria-label={`Call ${c.name}`}
                  className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500 text-emerald-300 hover:bg-emerald-500/30 transition-transform active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Manual Quick Dial */}
          <div className="pt-2 border-t border-cyan-500/10 flex items-center gap-2">
            <input
              id="manual-phone-number-input"
              type="tel"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              placeholder="Enter phone number (+91 9876543210)..."
              className="flex-1 px-3 py-2 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
            />
            <button
              id="btn-dial-custom-number"
              onClick={() => customPhone && handleCallNumber(customPhone)}
              disabled={!customPhone}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-mono flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.4)]"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>DIRECT CALL</span>
            </button>
          </div>
        </div>
      )}

      {/* MESSAGES TAB */}
      {activeTab === 'messages' && (
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMsgPlatform('whatsapp')}
              className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-center gap-1.5 border ${
                msgPlatform === 'whatsapp'
                  ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-gray-950/60 border-cyan-500/20 text-cyan-400/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>WHATSAPP MESSENGER</span>
            </button>
            <button
              type="button"
              onClick={() => setMsgPlatform('sms')}
              className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-center gap-1.5 border ${
                msgPlatform === 'sms'
                  ? 'bg-sky-950/60 border-sky-400 text-sky-300 shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                  : 'bg-gray-950/60 border-cyan-500/20 text-cyan-400/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>DEFAULT ANDROID SMS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-mono text-cyan-400/70 mb-1">SELECT RECIPIENT:</label>
              <select
                id="msg-recipient-select"
                value={selectedContact?.id || ''}
                onChange={(e) => {
                  const c = contacts.find((item) => item.id === e.target.value);
                  setSelectedContact(c || null);
                }}
                className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) {c.relation ? `[${c.relation}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-cyan-400/70 mb-1">OR CUSTOM PHONE NUMBER:</label>
              <input
                id="msg-custom-phone-input"
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="+91..."
                className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-cyan-400/70 mb-1">MESSAGE CONTENT:</label>
            <textarea
              id="msg-content-textarea"
              rows={3}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder='Jaise: "Mai 10 minute me pahuch raha hu", "Jarvis automated notification", etc.'
              className="w-full p-3 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-100 text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Quick preset templates */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              'Mai 15 minute me ghar aa raha hu.',
              'Emergency: Please call me back ASAP.',
              'Meeting me hu, baad me baat karta hu.',
              'I have reached safely.',
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMessageBody(preset)}
                className="flex-shrink-0 px-2 py-1 rounded bg-cyan-950/60 border border-cyan-500/20 text-[11px] text-cyan-300 hover:bg-cyan-900/60 whitespace-nowrap"
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            id="btn-send-message-dispatch"
            type="submit"
            disabled={!messageBody.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            <span>DISPATCH {msgPlatform.toUpperCase()} VIA ANDROID INTENT</span>
          </button>
        </form>
      )}

      {/* APPS TAB */}
      {activeTab === 'apps' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              id="app-search-query-input"
              type="text"
              value={customAppQuery}
              onChange={(e) => setCustomAppQuery(e.target.value)}
              placeholder="Search term or target (e.g. 'Arijit Singh songs', 'Directions to India Gate')..."
              className="flex-1 px-3 py-2 rounded-xl bg-gray-950 border border-cyan-500/30 text-cyan-100 text-xs font-sans focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {appsList.map((app) => {
              const IconComp = app.icon;
              return (
                <button
                  key={app.key}
                  id={`btn-app-${app.key}`}
                  onClick={() => handleLaunchApp(app.key, app.name)}
                  className={`p-3 rounded-xl border flex flex-col items-start text-left transition-all hover:scale-[1.03] active:scale-95 group ${app.color}`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <IconComp className="w-5 h-5" />
                    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs font-bold text-cyan-100 font-sans">{app.name}</span>
                  <span className="text-[10px] text-cyan-400/60 line-clamp-1">{app.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
