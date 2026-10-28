import React from 'react';
import { Terminal, Shield, Check, Clock, Zap } from 'lucide-react';
import { CommandMessage } from '../types';

interface JarvisActivityFeedProps {
  messages: CommandMessage[];
}

export const JarvisActivityFeed: React.FC<JarvisActivityFeedProps> = ({ messages }) => {
  return (
    <div className="w-full bg-gray-900/50 border border-cyan-500/20 rounded-2xl p-4 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-mono font-bold text-cyan-200 uppercase tracking-wider">
            JARVIS TELEMETRY & COMMAND LOGS
          </h4>
        </div>
        <span className="text-[10px] font-mono text-cyan-400/60">LIVE TERMINAL</span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 font-mono text-xs">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          const isSystem = m.sender === 'system';

          return (
            <div
              key={m.id}
              className={`p-2.5 rounded-xl border transition-all ${
                isUser
                  ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
                  : isSystem
                  ? 'bg-purple-950/30 border-purple-500/30 text-purple-200'
                  : 'bg-gray-950/80 border-cyan-500/10 text-cyan-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-cyan-400/60 mb-1">
                <span className="font-bold uppercase tracking-wider">
                  {isUser ? 'USER VOICE INPUT' : isSystem ? 'SYSTEM ACTION' : 'J.A.R.V.I.S.'}
                </span>
                <span>{m.timestamp}</span>
              </div>
              <p className="text-xs font-sans text-cyan-100">{m.text}</p>

              {m.action && (
                <div className="mt-1.5 pt-1.5 border-t border-cyan-500/10 flex items-center gap-1.5 text-[10px] text-cyan-400">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span className="uppercase font-mono font-bold">{m.action.name}</span>
                  {m.action.details && <span>— {m.action.details}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
