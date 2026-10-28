import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, X, ShieldAlert, Phone, User } from 'lucide-react';
import { Contact } from '../types';
import { triggerHaptic } from '../utils/deviceHardware';

interface DeleteContactConfirmModalProps {
  isOpen: boolean;
  contact: Contact | null;
  onConfirm: (contact: Contact) => void;
  onCancel: () => void;
}

export const DeleteContactConfirmModal: React.FC<DeleteContactConfirmModalProps> = ({
  isOpen,
  contact,
  onConfirm,
  onCancel,
}) => {
  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !contact) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-fade-in">
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onCancel} />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md p-6 bg-slate-900/95 border border-red-500/40 rounded-3xl shadow-[0_0_40px_rgba(239,68,68,0.25)] text-slate-100 flex flex-col items-center text-center overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-contact-title"
        >
          {/* Top ambient red gradient */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic([15]);
              onCancel();
            }}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-all"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Warning Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(239,68,68,0.35)]">
            <ShieldAlert className="w-8 h-8 text-red-400 animate-pulse" />
          </div>

          <h3 id="delete-contact-title" className="text-xl font-bold text-slate-50 tracking-tight mb-1">
            Delete Contact?
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mb-5">
            Are you sure you want to delete this contact? This prevents accidental data loss from your JARVIS directory.
          </p>

          {/* Contact summary card preview */}
          <div className="w-full p-4 mb-6 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3 text-left">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0"
              style={{ backgroundColor: contact.avatarColor || '#ef4444' }}
            >
              {contact.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-slate-100 text-sm truncate">{contact.name}</h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <Phone className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="font-mono truncate">{contact.phone}</span>
              </div>
              {contact.relation && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-medium text-amber-300">
                  {contact.relation}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                triggerHaptic([20]);
                onCancel();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-sm transition-all border border-slate-700 active:scale-95 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic([40, 80]);
                onConfirm(contact);
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Contact</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
