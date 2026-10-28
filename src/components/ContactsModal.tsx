import React, { useState } from 'react';
import { UserPlus, Trash2, Phone, User, Users, Check } from 'lucide-react';
import { Contact } from '../types';

interface ContactsModalProps {
  contacts: Contact[];
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
  onDeleteContact: (id: string) => void;
  onDirectCall: (phone: string, name: string) => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  contacts,
  isOpen,
  onClose,
  onAddContact,
  onDeleteContact,
  onDirectCall,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('Friend');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const colors = ['#0891b2', '#0284c7', '#2563eb', '#7c3aed', '#059669', '#d97706'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    onAddContact({
      name: name.trim(),
      phone: phone.trim(),
      relation: relation.trim() || undefined,
      avatarColor: randomColor,
    });

    setName('');
    setPhone('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-gray-950 border border-cyan-500/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(6,182,212,0.3)] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold text-cyan-100">
              JARVIS PHONEBOOK CONTACTS
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-cyan-400/60 hover:text-cyan-200 text-lg font-mono"
          >
            ✕
          </button>
        </div>

        {/* Add Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-3 mb-4 p-3 rounded-xl bg-gray-900/60 border border-cyan-500/20">
          <h4 className="text-xs font-mono text-cyan-300 font-bold flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>ADD NEW CONTACT</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (e.g. John)"
              className="px-3 py-1.5 rounded-lg bg-gray-950 border border-cyan-500/30 text-cyan-100 text-xs font-sans focus:outline-none focus:border-cyan-400"
            />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="px-3 py-1.5 rounded-lg bg-gray-950 border border-cyan-500/30 text-cyan-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
            />
            <input
              type="text"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="Relation / Tag"
              className="px-3 py-1.5 rounded-lg bg-gray-950 border border-cyan-500/30 text-cyan-100 text-xs font-sans focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)]"
          >
            SAVE CONTACT TO JARVIS
          </button>
        </form>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="p-2.5 rounded-xl bg-gray-900/80 border border-cyan-500/20 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                  style={{ backgroundColor: c.avatarColor || '#0891b2' }}
                >
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-cyan-100">{c.name}</h5>
                  <p className="text-[11px] font-mono text-cyan-400/70">{c.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onDirectCall(c.phone, c.name)}
                  title="Call via phone dialer"
                  className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/40"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteContact(c.id)}
                  title="Delete contact"
                  className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
