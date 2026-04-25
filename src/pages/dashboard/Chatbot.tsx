import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, Languages, AlertTriangle, Mic, MicOff, MessageSquarePlus, History, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { auth, db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, getDocs, getDoc, doc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';

import StormLoader from '../../components/shared/StormLoader';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: any;
  sessionId?: string;
}

const suggestedPrompts = [
  "Why do I have cramps on day 2?",
  "What foods help with PCOS?",
  "Is my cycle length normal?",
  "How to manage PMS naturally?"
];

export default function Chatbot() {
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => crypto.randomUUID());
  const [showHistory, setShowHistory] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('preferred_language') || 'en');
  const [isAutoDetect, setIsAutoDetect] = useState(() => localStorage.getItem('auto_detect_lang') !== 'false');
  const [selectedContextLog, setSelectedContextLog] = useState<string | null>(null);
  const [availableLogs, setAvailableLogs] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const loadLogs = async () => {
      try {
        const q = query(collection(db, 'users', auth.currentUser!.uid, 'cycleLogs'), orderBy('date', 'desc'), limit(10));
        const snap = await getDocs(q);
        const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAvailableLogs(logs);
      } catch (err) {
        console.error("Failed to load logs for context", err);
      }
    };
    loadLogs();
  }, []);

  const messages = allMessages.filter(m => (m.sessionId || 'legacy') === activeSessionId);
  
  const groupedSessions = allMessages.reduce((acc, msg) => {
    const sId = msg.sessionId || 'legacy';
    if (!acc[sId]) acc[sId] = [];
    acc[sId].push(msg);
    return acc;
  }, {} as Record<string, Message[]>);

  // Sort sessions by the timestamp of their latest message (descending)
  const sortedSessionIds = Object.keys(groupedSessions).sort((a, b) => {
    const lastA = groupedSessions[a][groupedSessions[a].length - 1];
    const lastB = groupedSessions[b][groupedSessions[b].length - 1];
    const timeA = lastA?.createdAt?.toMillis() || 0;
    const timeB = lastB?.createdAt?.toMillis() || 0;
    return timeB - timeA;
  });

  const startNewChat = () => {
    setActiveSessionId(crypto.randomUUID());
    setShowHistory(false);
  };

  const fetchUserContext = async () => {
    if (!auth.currentUser) return "No user context available.";
    
    let contextParts = [];

    try {
      // Fetch User Profile
      const profileSnap = await getDoc(doc(db, 'users', auth.currentUser.uid, 'private', 'profile'));
      if (profileSnap.exists()) {
        const pData = profileSnap.data();
        let lifestyleContext = [];
        if (pData.dietary_restrictions) lifestyleContext.push(`Dietary Restrictions: ${pData.dietary_restrictions}`);
        if (pData.exercise_frequency) lifestyleContext.push(`Exercise Frequency: ${pData.exercise_frequency}`);
        if (lifestyleContext.length > 0) {
          contextParts.push(`User Lifestyle:\n${lifestyleContext.join('\n')}`);
        }
        
        // Calculate Phase
        if (pData.lastPeriodDate) {
          const cycleLength = pData.avgCycleLength || 28;
          const lpDate = pData.lastPeriodDate.toDate ? pData.lastPeriodDate.toDate() : new Date(pData.lastPeriodDate);
          
          if (!isNaN(lpDate.getTime())) {
            const today = new Date();
            // Start of today so it's accurate with days counting
            today.setHours(0, 0, 0, 0);
            const lpDateZero = new Date(lpDate);
            lpDateZero.setHours(0, 0, 0, 0);

            const diffTime = today.getTime() - lpDateZero.getTime();
            if (diffTime >= 0) {
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              const currentDayOfCycle = (diffDays % cycleLength) + 1;
              const avgPeriod = pData.avgPeriodLength || 5;
              
              let phase = "Luteal";
              if (currentDayOfCycle <= avgPeriod) {
                phase = "Menstrual";
              } else if (currentDayOfCycle < Math.floor(cycleLength / 2) - 1) {
                phase = "Follicular";
              } else if (currentDayOfCycle >= Math.floor(cycleLength / 2) - 1 && currentDayOfCycle <= Math.floor(cycleLength / 2) + 1) {
                phase = "Ovulation window";
              }
              
              contextParts.push(`Current Cycle Status: Day ${currentDayOfCycle} of ~${cycleLength} day cycle. Estimated Phase: ${phase}.`);
            }
          }
        }
      }

      // Fetch latest PCOD screening
      const pcodRef = collection(db, 'users', auth.currentUser.uid, 'pcodScreenings');
      const pcodQuery = query(pcodRef, orderBy('createdAt', 'desc'), limit(1));
      const pcodSnap = await getDocs(pcodQuery);
      if (!pcodSnap.empty) {
        const pcodData = pcodSnap.docs[0].data();
        contextParts.push(`PCOD Risk Level: ${pcodData.riskLevel?.toUpperCase()} (Score: ${pcodData.riskScore}). BMI: ${pcodData.details?.bmi} (${pcodData.details?.bmiStatus}). Symptoms/Risks logged: ${pcodData.details?.risks?.join(', ')}.`);
      }

      // Fetch last 30 cycle logs for trends
      const logsRef = collection(db, 'users', auth.currentUser.uid, 'cycleLogs');
      const logsQuery = query(logsRef, orderBy('date', 'desc'), limit(30));
      const logsSnap = await getDocs(logsQuery);
      if (!logsSnap.empty) {
        const recentLogs = logsSnap.docs.map(d => {
          const data = d.data();
          const dDate = data.date?.toDate ? data.date.toDate().toLocaleDateString() : 'Unknown date';
          let symptoms = [data.mood ? `Mood: ${data.mood}` : '', data.energy ? `Energy: ${data.energy}` : '', data.skin ? `Skin: ${data.skin}` : '', data.cramps ? `Cramps: ${data.cramps}` : ''].filter(Boolean).join(', ');
          return `- ${dDate}: Flow: ${data.flowIntensity || 'None'}. Symptoms: ${symptoms || 'None'}.`;
        });
        contextParts.push(`Recent cycle logs (Last 30 days):\n${recentLogs.join('\n')}`);
      }
      
      // Default info if missing
      if (contextParts.length === 0) {
        contextParts.push("No health or cycle data logged by the user yet. Ask them nicely if they want to log their period or take a PCOD screening.");
      }
      
      return contextParts.join('\n\n');
    } catch (err) {
      console.error("Error fetching context:", err);
      return "No user health context available due to an error.";
    }
  };

  const updateLanguage = (val: string) => {
    setLanguage(val);
    localStorage.setItem('preferred_language', val);
    window.dispatchEvent(new Event('languageChange'));
    
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = val;
      select.dispatchEvent(new Event('change'));
    }
  };

  const detectAndUpdateLanguage = async (text: string) => {
    if (!isAutoDetect) return language;

    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze this user text: "${text}". Which language is it mainly written or spoken in? If it is Hindi (hi), Tamil (ta), Bengali (bn), or English (en), return ONLY the 2-letter code (en, hi, ta, or bn). If you are unsure, return en. Do not return anything else.`
      });
      const code = response.text?.trim().toLowerCase();
      if (code && ['en', 'hi', 'ta', 'bn'].includes(code)) {
        if (code !== language) {
          updateLanguage(code);
        }
        return code;
      }
    } catch(e) {
      console.error('Lang detection failed:', e);
    }
    return language;
  };

  useEffect(() => {
    const handleLangChange = () => {
      setLanguage(localStorage.getItem('preferred_language') || 'en');
      setIsAutoDetect(localStorage.getItem('auto_detect_lang') !== 'false');
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const messagesRef = collection(db, 'users', auth.currentUser.uid, 'chatMessages');
    const q = query(messagesRef, orderBy('createdAt', 'asc')); // Fetching all messages for history
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setAllMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/chatMessages`);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || !auth.currentUser) return;
    
    const userMsg = text;
    setInput('');
    setLoading(true);

    try {
      // Auto-detect language
      const detectedLang = await detectAndUpdateLanguage(userMsg);

      // 1. Save user message to Firestore
      let fullMessage = userMsg;
      if (selectedContextLog) {
         const log = availableLogs.find(l => l.id === selectedContextLog);
         if (log) {
           const dDate = log.date?.toDate ? log.date.toDate().toLocaleDateString() : 'Unknown date';
           const symps = log.symptoms?.join(', ') || 'None';
           fullMessage += `\n[Context: I am referring to my cycle log from ${dDate}. Flow: ${log.flowIntensity || 'None'}. Symptoms: ${symps}.]`;
         }
      }

      const messagesRef = collection(db, 'users', auth.currentUser.uid, 'chatMessages');
      try {
        await addDoc(messagesRef, {
          role: 'user',
          content: fullMessage,
          language,
          sessionId: activeSessionId,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser.uid}/chatMessages`);
      }

      setSelectedContextLog(null);
      const contextData = await fetchUserContext();
      
      const systemPrompt = `
        You are Storm, an empathetic AI health assistant for StormCycle, a menstrual health app.
        Today's Date: ${new Date().toLocaleDateString()}
        You help women understand their menstrual cycles, PCOD/PCOS symptoms, and reproductive health.
        
        RULES:
        1. Empathy First: Always be warm, non-judgmental, and deeply empathetic. Acknowledge any emotional distress or discomfort before offering solutions. Use gentle, validating language.
        2. Cultural Sensitivity: Frame advice within an Indian context. Respect dietary preferences, lifestyle, and cultural nuances regarding menstruation and reproductive health.
        3. Medical Boundaries: Never diagnose. Always suggest consulting a healthcare professional for medical decisions.
        4. Distress Protocols: If the user shows signs of serious distress (e.g., "depressed", "hate my body", "can't cope"): immediately provide iCall (9152987821) and Vandrevala Foundation (1860-2662-345) help lines.
        5. Actionable & Personalized Advice: Provide precise, useful health tips and gentle recommendations based directly on the provided user context (e.g., current cycle phase, logged symptoms, PCOD risk level). Connect tips to evidence-based advice and link to reputable external resources (like WHO, Mayo Clinic, FOGSI).
        6. Data Recall: If the user asks about their recent logged symptoms, energy, mood, or cycle data, answer accurately using the "Recent cycle logs" provided in the context.
        7. Phase Analysis: Read the 'Estimated Phase' and 'Recent cycle logs'. If a user asks why they feel a certain way today, check their current phase and suggest phase-specific hormonal reasons (e.g. low energy due to progesterone drop before menstruation, high energy in follicular).
        8. Language: Respond ONLY in the user's requested language (${detectedLang === 'hi' ? 'Hindi' : detectedLang === 'ta' ? 'Tamil' : detectedLang === 'bn' ? 'Bengali' : 'English'}). Do not mix languages unless completely necessary for medical terms.
        9. Concision: Keep responses clear and concise (use bullet points if helpful), unless detailed info is requested.

        Current context: 
        ${contextData}
      `;

      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userMsg,
        config: {
          systemInstruction: systemPrompt
        }
      });
      const response = result.text;

      // 3. Save AI response
      try {
        await addDoc(messagesRef, {
          role: 'assistant',
          content: response,
          language,
          sessionId: activeSessionId,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser.uid}/chatMessages`);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSpeechLangCode = (lang: string) => {
    switch(lang) {
      case 'hi': return 'hi-IN';
      case 'ta': return 'ta-IN';
      case 'bn': return 'bn-IN';
      default: return 'en-US';
    }
  };

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getSpeechLangCode(language);
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
      await detectAndUpdateLanguage(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert('Microphone access was denied. Please enable microphone permissions in your browser or AI Studio settings.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-storm-border shadow-xl overflow-hidden relative">
      <header className="p-4 border-b border-storm-border flex items-center justify-between bg-storm-cream/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-storm-primary flex items-center justify-center text-white">
            <Bot size={24} />
          </div>
          <div>
            <div className="font-serif font-bold text-storm-primary">Storm AI</div>
            <div className="text-[10px] text-storm-muted uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} /> Empathetic Assistant
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 notranslate">
          <div className="flex items-center gap-1">
            <button onClick={startNewChat} className="p-2 text-storm-primary hover:bg-storm-blush rounded-xl transition-colors" title="Start New Chat">
              <MessageSquarePlus size={18} />
            </button>
            <button onClick={() => setShowHistory(true)} className="p-2 text-storm-primary hover:bg-storm-blush rounded-xl transition-colors" title="Chat History">
              <History size={18} />
            </button>
          </div>
          <div className="h-4 w-[1px] bg-storm-border" />
          <div className="flex items-center gap-2">
            <Languages size={18} className="text-storm-muted" />
              <select 
                className="text-xs bg-transparent border-none outline-none font-medium text-storm-primary cursor-pointer"
                value={isAutoDetect ? 'auto' : language}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'auto') {
                    setIsAutoDetect(true);
                    localStorage.setItem('auto_detect_lang', 'true');
                  } else {
                    setIsAutoDetect(false);
                    localStorage.setItem('auto_detect_lang', 'false');
                    updateLanguage(val);
                  }
                }}
                title="Language settings"
              >
              <option value="auto">Auto-detect ✨</option>
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="ta">தமிழ்</option>
              <option value="bn">বাংলা</option>
            </select>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 top-[73px] z-20 bg-white flex flex-col"
          >
            <div className="p-4 border-b border-storm-border flex items-center justify-between bg-storm-cream/30">
              <h3 className="font-serif font-bold text-lg text-storm-primary">Chat History</h3>
              <button onClick={() => setShowHistory(false)} className="p-2 text-storm-muted hover:bg-storm-blush rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#F0E6ED_1px,transparent_1px)] bg-[size:20px_20px]">
              {sortedSessionIds.length === 0 && (
                <div className="text-center text-storm-muted text-sm mt-8 border border-dashed border-storm-border p-8 rounded-2xl bg-white/50">
                  No previous chats found.
                </div>
              )}
              {sortedSessionIds.map((sessionId) => {
                const sessionMessages = groupedSessions[sessionId];
                if (!sessionMessages || sessionMessages.length === 0) return null;
                const firstUserMessage = sessionMessages.find(m => m.role === 'user')?.content || sessionMessages[0].content;
                const latestTime = sessionMessages[sessionMessages.length - 1]?.createdAt;
                
                return (
                  <button
                    key={sessionId}
                    onClick={() => { setActiveSessionId(sessionId); setShowHistory(false); }}
                    className={`w-full text-left p-4 auto-cols-auto rounded-xl border ${activeSessionId === sessionId ? 'bg-storm-cream border-storm-primary' : 'bg-white border-storm-border hover:border-storm-primary/30 shadow-sm'} transition-all duration-200 flex flex-col gap-2`}
                  >
                    <div className="text-sm font-medium text-storm-primary line-clamp-2">
                       {firstUserMessage}
                    </div>
                    <div className="text-[10px] text-storm-muted flex items-center justify-between">
                       <span>{sessionMessages.length} messages</span>
                       <span>{latestTime ? new Date(latestTime.toMillis()).toLocaleString() : 'Unknown Time'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[radial-gradient(#F0E6ED_1px,transparent_1px)] bg-[size:20px_20px]"
      >
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-storm-blush rounded-2xl flex items-center justify-center mx-auto mb-4 text-storm-primary">
              <Bot size={32} />
            </div>
            <h3 className="text-xl font-serif mb-2">Hello! I'm Storm.</h3>
            <p className="text-storm-muted max-w-sm mx-auto text-sm">
              I can help you understand your cycle, symptoms, and health metrics. What's on your mind?
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-storm-primary text-white' : 'bg-storm-blush text-storm-primary'}`}>
                  {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl ${m.role === 'user' ? 'bg-storm-primary text-white rounded-tr-none shadow-md' : 'bg-white border border-storm-border rounded-tl-none shadow-sm'}`}>
                  <div className={`prose prose-sm prose-stone max-w-none ${m.role === 'user' ? 'prose-invert' : ''}`}>
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-storm-blush flex items-center justify-center shrink-0">
                <Bot size={16} className="text-storm-primary" />
              </div>
              <div className="p-4 bg-white border border-storm-border rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                <StormLoader size="sm" />
                <span className="text-xs text-storm-muted italic animate-pulse">Storm is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-storm-border flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {suggestedPrompts.map(p => (
              <button 
                key={p} 
                onClick={() => handleSend(p)}
                className="text-xs px-3 py-1.5 bg-storm-cream border border-storm-border rounded-full hover:bg-storm-blush transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        
        {availableLogs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-storm-muted">Attach Context:</span>
            <select
              className="text-xs bg-storm-cream border border-storm-border rounded-lg px-2 py-1 outline-none text-storm-primary max-w-[200px] truncate"
              value={selectedContextLog || ''}
              onChange={(e) => setSelectedContextLog(e.target.value || null)}
            >
              <option value="">None</option>
              {availableLogs.map(log => {
                const date = log.date?.toDate ? log.date.toDate().toLocaleDateString() : 'Unknown';
                const summary = log.symptoms?.length ? `(${log.symptoms.length} symptoms)` : '';
                return <option key={log.id} value={log.id}>{date} {summary}</option>;
              })}
            </select>
          </div>
        )}

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input 
            type="text" 
            placeholder="Ask Storm anything..."
            className="flex-1 p-4 bg-storm-cream border-none rounded-2xl focus:ring-2 focus:ring-storm-primary outline-none text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="button"
            onClick={toggleListen}
            className={`p-4 rounded-2xl transition-all shadow-md ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-storm-cream text-storm-primary hover:bg-storm-blush border border-storm-border'}`}
            title="Use Microphone"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="p-4 bg-storm-primary text-white rounded-2xl hover:bg-storm-secondary transition-all disabled:opacity-50 shadow-md"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="mt-4 text-[10px] text-center text-storm-muted uppercase tracking-widest flex items-center justify-center gap-1">
          <AlertTriangle size={10} /> Not a medical diagnosis. Consult a professional.
        </p>
      </div>
    </div>
  );
}
