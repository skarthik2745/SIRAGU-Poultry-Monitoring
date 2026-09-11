import React, { useState, useEffect, useRef } from 'react';
import { PoultryState } from '../../services/iotDataService';
import {
  askGeminiPoultryAI,
  generateLiveRecommendations,
  ChatMessage,
  RecommendationCard
} from '../../services/geminiService';
import {
  Bot,
  Send,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Thermometer,
  Wind,
  Flame,
  ShieldAlert,
  RotateCw,
  RefreshCw,
  User,
  Zap,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Compass,
  MessageSquareQuote,
  Activity
} from 'lucide-react';

interface AiChatAdvisorViewProps {
  state: PoultryState;
}

export const AiChatAdvisorView: React.FC<AiChatAdvisorViewProps> = ({ state }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `👋 Hello! I am **PoultryGuard AI Assistant**, powered by **Google Gemini**.

I continuously monitor your live ESP32 & farm telemetry (Temperature, Humidity, Ammonia Gas, Flame, IR Intrusion, and Feeders). 

How can I help you today? You can ask me any doubt about:
• 🌡️ *Temperature & Heat Stress remedies*
• 💨 *Ammonia gas management & litter care*
• 🍗 *Feeding schedules & weight optimization*
• 🛡️ *Biosecurity protocols & disease prevention*
• 🚨 *Immediate guidance when sensor thresholds are exceeded*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'advisor' | 'recommendations'>('advisor');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const recommendations = generateLiveRecommendations(state);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const responseText = await askGeminiPoultryAI(query, state, messages);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an issue communicating with the AI service. Please try asking again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'What should I do if temperature exceeds 32°C?',
    'How do I lower high ammonia levels in Zone 1?',
    'Give me a complete daily management checklist for broilers',
    'Explain how to optimize feed conversion ratio (FCR)',
    'What biosecurity steps prevent disease outbreaks?',
  ];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="p-5 rounded-2xl glass-panel border border-cyan-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>POWERED BY GOOGLE GEMINI AI</span>
            </span>
            <span className="text-xs text-slate-400">Live Telemetry-Aware Agronomist</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
            AI Chatbot, Recommendations & Smart Advice
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Ask any poultry management doubt or get real-time prescriptive actions based on your sensor readings. If temperature, ammonia, or safety thresholds exceed limits, immediate remediation guidance is provided.
          </p>
        </div>

        {/* Sub-Tab Navigation Toggle */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs shadow-lg">
          <button
            onClick={() => setActiveSubTab('advisor')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'advisor'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Chatbot</span>
          </button>

          <button
            onClick={() => setActiveSubTab('recommendations')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'recommendations'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Live Recommendations</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-200 text-[10px] font-black border border-slate-700">
              {recommendations.length}
            </span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. AI CHATBOT TAB                                          */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'advisor' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Main Chat Interface (Left 3 Columns) */}
          <div className="lg:col-span-3 flex flex-col h-[650px] rounded-2xl glass-panel border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
            {/* Chat Messages Log */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 pr-3">
              {messages.map((msg) => {
                const isAssistant = msg.sender === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      isAssistant ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {isAssistant && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-2xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isAssistant
                          ? 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-md'
                          : 'bg-cyan-500 text-slate-950 font-medium shadow-md'
                      }`}
                    >
                      <div className="whitespace-pre-line prose prose-invert prose-sm max-w-none">
                        {msg.text}
                      </div>
                      <div
                        className={`text-[10px] mt-2 text-right ${
                          isAssistant ? 'text-slate-500' : 'text-slate-800 font-mono'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>

                    {!isAssistant && (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-300 shadow-md shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0 animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Gemini AI is analyzing live farm telemetry & formulating expert guidance...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Sample Prompts Carousel */}
            <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/60 overflow-x-auto flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase font-mono shrink-0">Quick Queries:</span>
              {samplePrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap border border-slate-700 transition-colors shrink-0 disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3.5 border-t border-slate-800 bg-slate-900 flex items-center gap-3"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask any question regarding poultry health, feed, temperature, ammonia, or safety..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />

              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Live Telemetry & AI Diagnostic Widget (Right 1 Column) */}
          <div className="space-y-4">
            {/* Live Context Card */}
            <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30 bg-slate-900/90 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Live Injected Telemetry
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {/* Temp & Hum */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>DHT11</span>
                  </div>
                  <span className="font-bold text-white">
                    {state.dht11.temperature}°C / {state.dht11.humidity}%
                  </span>
                </div>

                {/* Gas MQ-2 */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Wind className="w-3.5 h-3.5 text-emerald-400" />
                    <span>MQ-2 NH3</span>
                  </div>
                  <span className="font-bold text-white">{state.mq2.gasPpm} ppm</span>
                </div>

                {/* Flame */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Flame</span>
                  </div>
                  <span
                    className={`font-bold ${
                      state.flame.detected ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                    }`}
                  >
                    {state.flame.detected ? 'DETECTED' : 'SAFE'}
                  </span>
                </div>

                {/* IR Intrusion */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>IR Security</span>
                  </div>
                  <span
                    className={`font-bold ${
                      state.ir.intrusionDetected ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                    }`}
                  >
                    {state.ir.intrusionDetected ? 'BREACH' : 'SECURE'}
                  </span>
                </div>

                {/* Feeder */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Feeder</span>
                  </div>
                  <span className="font-bold text-white">{state.feeder.status} ({state.feeder.servoAngle}°)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>AI synchronized with real-time hardware telemetry.</span>
              </div>
            </div>

            {/* Quick Action Guidance */}
            <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-slate-900/60 space-y-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" />
                <span>Immediate Advice</span>
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Click on the <strong>Live Recommendations</strong> tab above to view automatic algorithmic suggestions tailored specifically to your threshold states.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. PRESCRIPTIVE LIVE RECOMMENDATIONS TAB                   */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Automated Prescriptive Farm Recommendations
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Evaluated against standard ISA / Ross 308 Broiler specifications
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => {
              const isCrit = rec.priority === 'CRITICAL';
              const isWarn = rec.priority === 'WARNING';

              return (
                <div
                  key={rec.id}
                  className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition-all shadow-xl ${
                    isCrit
                      ? 'bg-rose-950/30 border-rose-500'
                      : isWarn
                      ? 'bg-amber-950/20 border-amber-500/80'
                      : 'bg-slate-900/90 border-emerald-500/40'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-slate-950 border border-slate-800 text-cyan-300">
                        {rec.category}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          isCrit
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
                            : isWarn
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        }`}
                      >
                        {rec.priority}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white">{rec.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{rec.description}</p>
                  </div>

                  {/* Remediation Action */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800">
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
                        🎯 Prescribed Farm Action:
                      </span>
                      <p className="text-xs font-semibold text-slate-200">{rec.action}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                      <span>Trigger: {rec.sensorTrigger}</span>
                      <button
                        onClick={() => {
                          setActiveSubTab('advisor');
                          handleSendMessage(`Can you elaborate in detail on how to resolve: "${rec.title}"?`);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                      >
                        Ask AI Assistant →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
