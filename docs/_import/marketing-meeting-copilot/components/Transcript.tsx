import React, { useEffect, useRef } from 'react';
import { TranscriptEntry } from '../types';
import { User, Users } from 'lucide-react';

interface TranscriptProps {
  entries: TranscriptEntry[];
}

const Transcript: React.FC<TranscriptProps> = ({ entries }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Users className="w-12 h-12 mb-4 opacity-20" />
        <p>Waiting for speech...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-4 pb-20">
      {entries.map((entry) => (
        <div 
          key={entry.id} 
          className={`flex gap-3 ${entry.speaker === 'You' ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            entry.speaker === 'You' ? 'bg-brand-100 text-brand-600' : 'bg-slate-200 text-slate-600'
          }`}>
            <User size={14} />
          </div>
          
          <div className={`flex flex-col max-w-[80%] ${entry.speaker === 'You' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-700">{entry.speaker}</span>
              <span className="text-xs text-slate-400">
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className={`p-3 rounded-lg text-sm leading-relaxed ${
              entry.speaker === 'You' 
                ? 'bg-brand-50 text-brand-900 border border-brand-100' 
                : 'bg-white text-slate-800 border border-slate-100 shadow-sm'
            } ${!entry.isFinal ? 'opacity-70 animate-pulse' : ''}`}>
              {entry.text}
            </div>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default Transcript;