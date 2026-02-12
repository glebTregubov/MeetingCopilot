
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, BarChart3, Settings, Play, Square, Activity } from 'lucide-react';

import Transcript from './components/Transcript';
import IntelligencePanel from './components/IntelligencePanel';
import ChatAssistant from './components/ChatAssistant';
import { LIVE_MODEL, LIVE_SYSTEM_INSTRUCTION } from './constants';
import { TranscriptEntry, MeetingState } from './types';
import { float32To16BitPCMBase64 } from './services/audioUtils';
import { analyzeTranscript } from './services/gemini';

// Initialize GenAI
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [meetingState, setMeetingState] = useState<MeetingState>({
    summary: '',
    actions: [],
    decisions: [],
    risks: []
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for Audio management
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null); // To store the Live API session

  // 1. Handle Mic and Live API Connection
  const startMeeting = async () => {
    setError(null);
    try {
      // Audio Setup
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true
      }});
      
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      
      // We use ScriptProcessor for simplicity in this demo (AudioWorklet is better for prod)
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      // Gemini Live Connection
      const sessionPromise = genAI.live.connect({
        model: LIVE_MODEL,
        config: {
          systemInstruction: LIVE_SYSTEM_INSTRUCTION,
          responseModalities: [Modality.AUDIO], // We mostly want it to listen, but it needs an output mode
          inputAudioTranscription: {}, // Enable user transcription
        },
        callbacks: {
          onopen: () => {
            console.log("Live Session Connected");
            setIsConnected(true);
            setIsRecording(true);
          },
          onmessage: (message: LiveServerMessage) => {
            handleServerMessage(message);
          },
          onclose: () => {
            console.log("Session Closed");
            setIsConnected(false);
            setIsRecording(false);
          },
          onerror: (err) => {
            console.error("Session Error", err);
            setError("Connection lost. Please restart.");
            stopMeeting();
          }
        }
      });

      // wait for session to actually resolve before sending data
      const session = await sessionPromise;
      sessionRef.current = session;

      // Audio Data Stream
      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const b64Data = float32To16BitPCMBase64(inputData);
        
        // Send to Gemini
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: b64Data
          }
        });
      };

    } catch (err) {
      console.error(err);
      setError("Failed to access microphone or connect to AI.");
    }
  };

  const stopMeeting = () => {
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    // There isn't a strict 'disconnect' method exposed on the session wrapper in the docs provided, 
    // but stopping the audio stream effectively ends the interaction.
    // In a real app, we'd look for a close() method on the session object if available.
    // Assuming sessionRef.current might need manual cleanup if the SDK supports it.
    setIsRecording(false);
    setIsConnected(false);
  };

  // 2. Handle Incoming Messages (Transcription)
  const handleServerMessage = (message: LiveServerMessage) => {
    // Check for user transcription
    const inputTranscript = message.serverContent?.inputTranscription;
    if (inputTranscript) {
        const text = inputTranscript.text;
        if (text) {
             setTranscript(prev => {
                // If the last entry is "You" and not final, update it. 
                // However, the Live API sends chunks. We'll verify structure.
                // Simple approach: append for now.
                // A robust approach involves tracking event IDs.
                
                // For this demo, we just append chunks as new entries if they are significant
                return [...prev, {
                    id: Date.now().toString(),
                    speaker: 'Attendee', // In a real app, speaker diarization would be needed
                    text: text,
                    timestamp: Date.now(),
                    isFinal: true
                }];
            });
        }
    }

    // Check for model output transcription (if the model speaks)
    const outputTranscript = message.serverContent?.outputTranscription;
    if (outputTranscript) {
        const text = outputTranscript.text;
         if (text) {
             setTranscript(prev => [...prev, {
                id: Date.now().toString(),
                speaker: 'Agent',
                text: text,
                timestamp: Date.now(),
                isFinal: true
            }]);
        }
    }
  };

  // 3. Periodic Intelligence Update (The "Brain")
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRecording && transcript.length > 0) {
      interval = setInterval(async () => {
        setIsAnalyzing(true);
        const fullText = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
        
        // Don't analyze if too short
        if (fullText.length < 50) {
            setIsAnalyzing(false);
            return;
        }

        const analysis = await analyzeTranscript(fullText);
        if (analysis) {
            setMeetingState(prev => ({
                ...prev,
                summary: analysis.summary || prev.summary,
                actions: analysis.actions && analysis.actions.length > 0 ? analysis.actions : prev.actions,
                decisions: analysis.decisions && analysis.decisions.length > 0 ? analysis.decisions : prev.decisions,
                risks: analysis.risks && analysis.risks.length > 0 ? analysis.risks : prev.risks,
            }));
        }
        setIsAnalyzing(false);
      }, 30000); // Every 30 seconds
    }

    return () => clearInterval(interval);
  }, [isRecording, transcript]);


  return (
    <div className="flex flex-col h-screen w-full bg-slate-50">
      
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                <BarChart3 size={20} />
            </div>
            <div>
                <h1 className="font-semibold text-slate-800 leading-tight">Marketing Weekly</h1>
                <p className="text-xs text-slate-500">Meeting Copilot</p>
            </div>
        </div>

        <div className="flex items-center gap-4">
             {error && <span className="text-red-500 text-sm font-medium bg-red-50 px-3 py-1 rounded-full">{error}</span>}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
                <Activity size={14} className={isConnected ? "animate-pulse" : ""} />
                {isConnected ? 'LIVE' : 'READY'}
            </div>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <button className="text-slate-400 hover:text-slate-600">
                <Settings size={20} />
            </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left: Transcript & Controls */}
        <div className="flex-1 flex flex-col relative max-w-3xl">
            {/* Toolbar */}
            <div className="p-4 flex justify-center border-b border-slate-200 bg-white/50 backdrop-blur-sm z-10 sticky top-0">
                {!isRecording ? (
                     <button 
                     onClick={startMeeting}
                     className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                 >
                     <Play size={18} fill="currentColor" /> Start Meeting
                 </button>
                ) : (
                    <button 
                    onClick={stopMeeting}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-6 py-2.5 rounded-full font-medium transition-all"
                >
                    <Square size={18} fill="currentColor" /> Stop Recording
                </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 scrollbar-hide">
                <Transcript entries={transcript} />
            </div>

            {/* Audio Visualizer Mockup (Bottom Bar) */}
            {isRecording && (
                <div className="h-12 bg-white border-t border-slate-200 flex items-center justify-center gap-1 px-4">
                     <Mic size={16} className="text-brand-500 animate-pulse" />
                     <div className="flex items-center gap-1 h-4">
                        {[...Array(20)].map((_, i) => (
                            <div 
                                key={i} 
                                className="w-1 bg-brand-400 rounded-full animate-[music-bar_1s_ease-in-out_infinite]"
                                style={{ 
                                    height: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.05}s` 
                                }}
                            ></div>
                        ))}
                     </div>
                </div>
            )}
        </div>

        {/* Right: Intelligence Panel */}
        <div className="w-[400px] lg:w-[450px] shrink-0 h-full shadow-xl z-20">
             <IntelligencePanel data={meetingState} isLoading={isAnalyzing} />
        </div>

      </main>

      {/* Chat Overlay */}
      <ChatAssistant transcriptText={transcript.map(t => `${t.speaker}: ${t.text}`).join('\n')} />

    </div>
  );
};

export default App;
