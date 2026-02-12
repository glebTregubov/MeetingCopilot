import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Bot, X } from 'lucide-react';
import { chatWithAgent } from '../services/gemini';

interface ChatAssistantProps {
  transcriptText: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ transcriptText }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hi! I\'m listening. Ask me anything about the meeting so far.', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const answer = await chatWithAgent(transcriptText, userMsg.text);
    
    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: answer || "Sorry, I couldn't process that.",
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  return (
    <>
        {/* Toggle Button */}
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all transform hover:scale-105 ${
                isOpen ? 'bg-slate-700 rotate-90' : 'bg-brand-600'
            } text-white`}
        >
            {isOpen ? <X size={24} /> : <Bot size={24} />}
        </button>

        {/* Chat Window */}
        {isOpen && (
            <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-40 flex flex-col overflow-hidden max-h-[500px]">
                <div className="bg-slate-800 text-white p-4 flex items-center gap-2">
                    <Bot size={18} className="text-brand-400" />
                    <h3 className="font-medium text-sm">Meeting Assistant</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 h-[350px]">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                                msg.role === 'user' 
                                ? 'bg-brand-600 text-white rounded-br-none' 
                                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                             <div className="bg-white border border-slate-200 p-3 rounded-lg rounded-bl-none shadow-sm flex gap-1">
                                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                             </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about the meeting..."
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="p-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        )}
    </>
  );
};

export default ChatAssistant;