import { useState, useEffect, useRef } from 'react';
import { Terminal, Send, ChevronRight, Mic, MicOff, CheckCircle2, ShieldAlert } from 'lucide-react';

const INITIAL_LOGS = [
  { type: 'system', text: '— SESSION INITIALIZED —', time: '00:00:00' },
  { type: 'system', text: 'Connecting to J.A.R.V.I.S. Core...', time: '00:00:00' },
];

export default function CommandTerminal({
  messages = [],
  sendTranscript,
  isConnected = false,
  isMicActive = false,
  toggleMic
}) {
  const [input, setInput] = useState('');
  const logEndRef = useRef(null);

  const allMessages = [...INITIAL_LOGS, ...messages];

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !sendTranscript) return;
    sendTranscript(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div
      className="glass-panel flex flex-col h-full"
      style={{ animation: 'fade-in-left 0.8s ease-out forwards', animationDelay: '0.2s', opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-cyan-500/10">
        <Terminal size={16} className="text-jarvis-cyan" />
        <h3 className="text-xs font-mono tracking-[0.2em] text-jarvis-cyan uppercase">
          Live Command Terminal
        </h3>
        <div className="ml-auto flex items-center gap-2">
          {toggleMic && (
            <button
              onClick={toggleMic}
              title="Toggle Voice Input"
              className={`p-1 rounded-md transition-all ${
                isMicActive
                  ? 'bg-jarvis-green/20 text-jarvis-green shadow-[0_0_8px_#00ff88]'
                  : 'text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10'
              }`}
            >
              {isMicActive ? <Mic size={14} className="animate-pulse" /> : <MicOff size={14} />}
            </button>
          )}
          <div className="flex items-center gap-1.5 pl-1 border-l border-cyan-500/20">
            <div
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-jarvis-green' : 'bg-red-500'}`}
              style={{ boxShadow: isConnected ? '0 0 6px #00ff88' : '0 0 6px #ff3355' }}
            />
            <span className={`text-[0.6rem] font-mono ${isConnected ? 'text-jarvis-green/70' : 'text-red-400/70'}`}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Log area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 terminal-log min-h-0">
        {allMessages.map((log, i) => (
          <div
            key={i}
            className={`flex flex-col ${
              log.type === 'user'
                ? 'items-end'
                : log.type === 'system'
                ? 'items-center'
                : 'items-start'
            }`}
            style={{
              animation: i >= INITIAL_LOGS.length ? 'fade-in-up 0.3s ease-out forwards' : undefined,
            }}
          >
            {log.type === 'system' ? (
              <div className="log-system py-1 text-center">
                <span className="text-white/20">{log.time}</span> {log.text}
              </div>
            ) : (
              <>
                <div
                  className={`text-[0.6rem] mb-0.5 font-mono tracking-wider ${
                    log.type === 'user' ? 'text-jarvis-amber/70' : 'text-jarvis-cyan/70'
                  }`}
                >
                  <span className="text-white/20 mr-2">{log.time}</span>
                  {log.type === 'user' ? '[USER]' : '[JARVIS]'}
                </div>

                <div
                  className={`max-w-[88%] px-3.5 py-2.5 rounded-lg text-[0.8rem] leading-relaxed shadow-lg ${
                    log.type === 'user'
                      ? 'bg-jarvis-amber/10 border border-jarvis-amber/25 text-jarvis-amber/95 rounded-tr-none'
                      : 'bg-jarvis-cyan/10 border border-jarvis-cyan/25 text-jarvis-cyan/95 rounded-tl-none'
                  }`}
                >
                  <div>{log.text}</div>

                  {/* Action execution badges */}
                  {log.action && log.action.result && (
                    <div className="mt-2 pt-2 border-t border-cyan-500/15 flex items-center gap-1.5 text-[0.65rem] font-mono">
                      {log.action.result.sandboxed ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <ShieldAlert size={11} />
                          [SECURITY: SANDBOXED]
                        </span>
                      ) : log.action.result.success ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          [EXECUTED: {log.action.result.name || log.action.target || 'Success'}]
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-cyan-500/10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ChevronRight
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-jarvis-cyan/40"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? 'Say or type command (e.g. "Open Calculator")...' : 'Connecting to backend...'}
              disabled={!isConnected}
              className="hud-input pl-8 disabled:opacity-40 text-xs"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
            className="glow-btn flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={13} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
