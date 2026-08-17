import { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Mic, MicOff, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

const INITIAL_DIRECTIVES = [
  { type: 'system', text: 'CORE SYSTEM INITIALIZED — ALL DIRECTIVES LOGGED', time: '00:00:00' },
  { type: 'jarvis', text: 'Good day, sir. All neural subsystems are online and standing by for your directives.', time: '00:00:01' }
];

export default function CommandTerminal({
  messages = [],
  sendTranscript,
  isConnected = false,
  isMicActive = false,
  toggleMic
}) {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);

  const allMessages = [...INITIAL_DIRECTIVES, ...messages];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || !sendTranscript) return;
    sendTranscript(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-card h-full flex flex-col border border-cyan-500/20 bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/15 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-cyan-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-cyan-400">
            DIRECTIVE TERMINAL
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-500 tracking-widest">STREAM V4.7</span>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        </div>
      </div>

      {/* Directives Log Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs select-text">
        {allMessages.map((msg, index) => {
          if (msg.type === 'system') {
            return (
              <div key={index} className="text-center py-1">
                <span className="text-[10px] text-slate-500/80 tracking-wider">
                  [{msg.time}] {msg.text}
                </span>
              </div>
            );
          }

          if (msg.type === 'user') {
            return (
              <div key={index} className="flex flex-col items-end space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400/70 font-semibold tracking-wider">
                  <span className="text-slate-500">{msg.time}</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    USER
                  </span>
                </div>
                <div className="max-w-[85%] px-3.5 py-2 rounded-xl rounded-tr-none bg-amber-500/10 border border-amber-500/25 text-amber-200 shadow-[0_0_15px_rgba(255,179,0,0.08)] leading-relaxed">
                  {msg.text}
                </div>
              </div>
            );
          }

          // JARVIS Response
          return (
            <div key={index} className="flex flex-col items-start space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/80 font-semibold tracking-wider">
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  JARVIS
                </span>
                <span className="text-slate-500">{msg.time}</span>
              </div>
              <div className="max-w-[90%] px-3.5 py-2.5 rounded-xl rounded-tl-none bg-cyan-500/10 border border-cyan-500/25 text-cyan-100 shadow-[0_0_20px_rgba(0,240,255,0.08)] leading-relaxed">
                <div className="text-cyan-100/95 font-sans text-xs">
                  {msg.text}
                </div>

                {/* Minimal Execution Badge */}
                {msg.action && msg.action.result && (
                  <div className="mt-2 pt-1.5 border-t border-cyan-500/15 flex items-center gap-1.5 text-[10px]">
                    {msg.action.result.sandboxed ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <ShieldAlert size={11} />
                        [SECURITY: SANDBOXED]
                      </span>
                    ) : msg.action.result.success ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]">
                        <CheckCircle2 size={11} />
                        [EXECUTED: {msg.action.result.name || msg.action.target || 'Success'}]
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Compact Manual Input Bar with Glowing Mic */}
      <div className="p-3 border-t border-cyan-500/15 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? 'Enter system directive...' : 'Connecting to Core...'}
            disabled={!isConnected}
            className="hud-input-field flex-1 px-3.5 py-2 text-xs text-white placeholder-slate-500 disabled:opacity-40"
          />

          {/* Glowing Microphone Button */}
          <button
            onClick={toggleMic}
            disabled={!isConnected}
            title="Toggle Voice Transmission"
            className={`p-2 rounded-xl border transition-all duration-300 ${
              isMicActive
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse'
                : 'bg-slate-900 border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]'
            }`}
          >
            {isMicActive ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!isConnected || !inputText.trim()}
            title="Execute Directive"
            className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/25 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
