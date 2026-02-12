import React, { useState } from 'react';
import { MeetingState, ActionItem, Risk, Decision } from '../types';
import { ListTodo, ShieldAlert, FileText, CheckCircle2, Copy, Share2 } from 'lucide-react';

interface IntelligencePanelProps {
  data: MeetingState;
  isLoading: boolean;
}

const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ data, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'risks'>('summary');

  const copyToClipboard = () => {
    let text = `## Meeting Summary\n${data.summary}\n\n## Action Items\n${data.actions.map(a => `- [ ] ${a.task} (${a.owner})`).join('\n')}\n\n## Risks\n${data.risks.map(r => `- ${r.severity.toUpperCase()}: ${r.text}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    alert("Meeting notes copied to clipboard!");
  };

  const shareToTelegram = () => {
      // Mock logic for MVP
      const text = encodeURIComponent(`*Meeting Summary*\n${data.summary}\n\n*Actions*\n${data.actions.map(a => `• ${a.task}`).join('\n')}`);
      window.open(`https://t.me/share/url?url=local&text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            activeTab === 'summary' ? 'border-brand-500 text-brand-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={16} /> Summary
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            activeTab === 'actions' ? 'border-brand-500 text-brand-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ListTodo size={16} /> Actions
          {data.actions.length > 0 && (
            <span className="bg-brand-100 text-brand-700 text-xs px-1.5 rounded-full">{data.actions.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('risks')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            activeTab === 'risks' ? 'border-brand-500 text-brand-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldAlert size={16} /> Risks
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 relative">
        {isLoading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-100 overflow-hidden">
                <div className="w-1/3 h-full bg-brand-500 animate-[loading_1.5s_ease-in-out_infinite]"></div>
            </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Summary</h3>
              <div className="prose prose-sm text-slate-700">
                {data.summary ? data.summary : <p className="text-slate-400 italic">Listening to generate summary...</p>}
              </div>
            </section>
            
            {data.decisions.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Decisions</h3>
                <ul className="space-y-2">
                  {data.decisions.map((d, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700 p-2 bg-emerald-50 rounded border border-emerald-100">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Action Items</h3>
             {data.actions.length === 0 && <p className="text-slate-400 italic text-sm">No action items detected yet.</p>}
             {data.actions.map((action, i) => (
               <div key={i} className="flex flex-col p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                 <div className="flex items-start gap-3">
                   <div className="mt-0.5 w-4 h-4 border-2 border-slate-300 rounded hover:border-brand-500 cursor-pointer transition-colors" />
                   <div className="flex-1">
                     <p className="text-sm text-slate-800 font-medium leading-tight">{action.task}</p>
                     <p className="text-xs text-slate-500 mt-1">Owner: <span className="text-brand-600 font-medium">{action.owner || 'Unassigned'}</span></p>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Risks & Issues</h3>
             {data.risks.length === 0 && <p className="text-slate-400 italic text-sm">No risks detected yet.</p>}
             {data.risks.map((risk, i) => (
               <div key={i} className={`p-3 border rounded-lg ${
                 risk.severity === 'high' ? 'bg-red-50 border-red-100' : 
                 risk.severity === 'medium' ? 'bg-orange-50 border-orange-100' : 'bg-yellow-50 border-yellow-100'
               }`}>
                 <div className="flex gap-2">
                   <ShieldAlert size={16} className={`${
                     risk.severity === 'high' ? 'text-red-600' : 'text-orange-600'
                   } shrink-0 mt-0.5`} />
                   <div>
                     <p className="text-sm text-slate-800">{risk.text}</p>
                     <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-2 inline-block ${
                       risk.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'
                     }`}>
                       {risk.severity} Risk
                     </span>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
        <button onClick={copyToClipboard} className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <Copy size={16} /> Copy
        </button>
        <button onClick={shareToTelegram} className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-sky-500 border border-transparent rounded-md text-sm font-medium text-white hover:bg-sky-600 transition-colors shadow-sm">
          <Share2 size={16} /> Telegram
        </button>
      </div>
    </div>
  );
};

export default IntelligencePanel;