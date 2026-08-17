import { useState, useEffect, useRef } from 'react';
import { Terminal, Send, ChevronRight } from 'lucide-react';

const INITIAL_LOGS = [
  { type: 'system', text: '— SESSION INITIALIZED —', time: '00:00:00' },
  { type: 'system', text: 'Awaiting backend WebSocket connection...', time: '00:00:00' },
];

export default function CommandTerminal({ messages = [], sendTranscript, isConnected = false }) {
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
          Command Terminal
        </h3>
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-jarvis-green' : 'bg-red-500'}`}
            style={{ boxShadow: isConnected ? '0 0 6px #00ff88' : '0 0 6px #ff3355' }}
          />
          <span className={`text-[0.6rem] font-mono ${isConnected ? 'text-jarvis-green/70' : 'text-red-400/70'}`}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
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
              <div className="log-system py-1">
                <span className="text-white/20">{log.time}</span> {log.text}
              </div>
            ) : (
              <>
                <div
                  className={`text-[0.6rem] mb-0.5 font-mono tracking-wider ${
                    log.type === 'user' ? 'text-jarvis-amber/50' : 'text-jarvis-cyan/50'
                  }`}
                >
                  <span className="text-white/20 mr-2">{log.time}</span>
                  {log.type === 'user' ? '[USER]' : '[JARVIS]'}
                </div>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-[0.8rem] leading-relaxed ${
                    log.type === 'user'
                      ? 'bg-jarvis-amber/10 border border-jarvis-amber/20 text-jarvis-amber/90 rounded-tr-none'
                      : 'bg-jarvis-cyan/5 border border-jarvis-cyan/15 text-jarvis-cyan/90 rounded-tl-none'
                  }`}
                >
                  {log.text}
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
              placeholder={isConnected ? 'Enter command...' : 'Connecting to backend...'}
              disabled={!isConnected}
              className="hud-input pl-8 disabled:opacity-40"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
            className="glow-btn flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            Execute
          </button>
        </div>
      </div>
    </div>
  );
}
