import { useState, useEffect, useRef } from 'react';
import { Terminal, Send, ChevronRight } from 'lucide-react';

const INITIAL_LOGS = [
  { type: 'system', text: '— SESSION INITIALIZED —', time: '11:00:01' },
  { type: 'system', text: 'Secure channel established. Encryption: AES-256-GCM', time: '11:00:01' },
  { type: 'jarvis', text: 'Good morning, Aditya. All systems are online and operational. How may I assist you today?', time: '11:00:02' },
  { type: 'user', text: 'What\'s the weather like today?', time: '11:05:12' },
  { type: 'jarvis', text: 'Currently 28°C in Mumbai with partly cloudy skies. Humidity at 72%. No precipitation expected until evening. Confidence: 98.7%', time: '11:05:13' },
  { type: 'user', text: 'Schedule a reminder for the team standup', time: '11:10:45' },
  { type: 'jarvis', text: 'Reminder set for 14:30 — "Team Standup - Project Nexus". I\'ve also synced it with your calendar module. Confidence: 99.2%', time: '11:10:46' },
  { type: 'user', text: 'Play some focus music', time: '11:15:30' },
  { type: 'jarvis', text: 'Loading "Synthetic Dawn" by Neural Harmonics into the Audio Subsystem. Ambient focus mode engaged. Confidence: 97.5%', time: '11:15:31' },
  { type: 'system', text: '— AUDIO SUBSYSTEM ACTIVE —', time: '11:15:31' },
  { type: 'user', text: 'Run diagnostics on all subsystems', time: '11:20:00' },
  { type: 'jarvis', text: 'Running full diagnostic sweep... CPU: 34% | Memory: 62% | Network Latency: 12ms | All modules nominal. No anomalies detected.', time: '11:20:02' },
];

const JARVIS_RESPONSES = [
  'Understood. Processing your request now. Confidence: 97.3%',
  'I\'ve completed the analysis. All parameters are within expected range.',
  'Affirmative. I\'ve updated the relevant subsystems accordingly.',
  'That request has been queued for immediate execution.',
  'Scanning databases... I\'ve found 3 relevant results for your query.',
  'The task has been completed successfully. Would you like a detailed report?',
  'I\'ve cross-referenced that against our knowledge base. Here\'s what I found.',
  'Running simulation now. Estimated completion: 4.2 seconds.',
  'Noted. I\'ve added that to your priority queue.',
  'All subsystems confirm the update has been applied globally.',
];

function getTimestamp() {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

export default function CommandTerminal() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [input, setInput] = useState('');
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userLog = { type: 'user', text: input.trim(), time: getTimestamp() };
    setLogs((prev) => [...prev, userLog]);
    setInput('');

    // Simulate JARVIS response after a brief delay
    setTimeout(() => {
      const responseText =
        JARVIS_RESPONSES[Math.floor(Math.random() * JARVIS_RESPONSES.length)];
      const jarvisLog = {
        type: 'jarvis',
        text: responseText,
        time: getTimestamp(),
      };
      setLogs((prev) => [...prev, jarvisLog]);
    }, 800 + Math.random() * 600);
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
          <div className="w-1.5 h-1.5 rounded-full bg-jarvis-green" style={{ boxShadow: '0 0 6px #00ff88' }} />
          <span className="text-[0.6rem] font-mono text-jarvis-green/70">LIVE</span>
        </div>
      </div>

      {/* Log area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 terminal-log min-h-0">
        {logs.map((log, i) => (
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
              placeholder="Enter command..."
              className="hud-input pl-8"
            />
          </div>
          <button onClick={handleSend} className="glow-btn flex items-center gap-2">
            <Send size={14} />
            Execute
          </button>
        </div>
      </div>
    </div>
  );
}
