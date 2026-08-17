import { useState, useEffect, useMemo } from 'react';
import { Zap, Activity, Mic, MicOff, Brain, Volume2, Square } from 'lucide-react';

const STATUS_CONFIG = {
  IDLE: {
    label: 'STANDBY',
    color: 'text-jarvis-cyan/60',
    dotColor: 'bg-jarvis-cyan',
    dotShadow: '0 0 10px #00f0ff, 0 0 20px rgba(0,240,255,0.3)',
    waveOpacity: 0.2,
    message: 'SYSTEM ACTIVE — AWAITING COMMAND',
    icon: Zap,
  },
  LISTENING: {
    label: 'LISTENING',
    color: 'text-jarvis-green',
    dotColor: 'bg-jarvis-green',
    dotShadow: '0 0 10px #00ff88, 0 0 20px rgba(0,255,136,0.5)',
    waveOpacity: 1,
    message: 'VOICE INPUT DETECTED — LISTENING',
    icon: Mic,
  },
  THINKING: {
    label: 'PROCESSING',
    color: 'text-jarvis-amber',
    dotColor: 'bg-jarvis-amber',
    dotShadow: '0 0 10px #ffaa00, 0 0 20px rgba(255,170,0,0.5)',
    waveOpacity: 0.6,
    message: 'NEURAL PROCESSING — ANALYZING COMMAND',
    icon: Brain,
  },
  SPEAKING: {
    label: 'TRANSMITTING',
    color: 'text-blue-400',
    dotColor: 'bg-blue-400',
    dotShadow: '0 0 10px #60a5fa, 0 0 20px rgba(96,165,250,0.5)',
    waveOpacity: 0.9,
    message: 'AUDIO SUBSYSTEM — TRANSMITTING RESPONSE',
    icon: Volume2,
  },
};

const IDLE_MESSAGES = [
  'SYSTEM ACTIVE — AWAITING COMMAND',
  'NEURAL NETWORK ONLINE',
  'ALL SUBSYSTEMS NOMINAL',
  'QUANTUM CORE SYNCHRONIZED',
];

export default function AICoreOrb({
  status = 'IDLE',
  isConnected = false,
  isMicActive = false,
  interimTranscript = '',
  isSpeaking = false,
  toggleMic,
  triggerBargeIn,
  voiceSupported = true
}) {
  const [idleMsgIdx, setIdleMsgIdx] = useState(0);

  useEffect(() => {
    if (status !== 'IDLE') return;
    const interval = setInterval(() => {
      setIdleMsgIdx((prev) => (prev + 1) % IDLE_MESSAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [status]);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.IDLE;
  const StatusIcon = isMicActive ? Mic : config.icon;
  const displayMessage = interimTranscript
    ? `"${interimTranscript}"`
    : status === 'IDLE'
    ? IDLE_MESSAGES[idleMsgIdx]
    : config.message;

  // Waveform bars configuration
  const waveformBars = 24;
  const barDurations = useMemo(
    () => Array.from({ length: waveformBars }, () => 0.8 + Math.random() * 0.8),
    []
  );
  const barHeights = useMemo(
    () => Array.from({ length: waveformBars }, () => 10 + Math.random() * 30),
    []
  );

  return (
    <div
      className="flex flex-col items-center justify-center gap-5 py-4"
      style={{ animation: 'fade-in-up 1s ease-out forwards' }}
    >
      {/* Top Status Indicator */}
      <div className="flex items-center gap-2 text-xs font-mono tracking-[0.2em] uppercase">
        <div
          className={`w-2 h-2 rounded-full ${config.dotColor}`}
          style={{
            boxShadow: config.dotShadow,
            animation: 'breathe 2s ease-in-out infinite',
          }}
        />
        <span className={config.color}>{config.label}</span>
        {!isConnected && (
          <span className="text-red-400/60 ml-2 text-[0.6rem]">• BACKEND OFFLINE</span>
        )}
        {isMicActive && (
          <span className="text-jarvis-green/80 ml-2 text-[0.6rem] animate-pulse">
            • MIC LIVE
          </span>
        )}
      </div>

      {/* The Central Holographic Orb — Clickable for voice toggle */}
      <div
        onClick={toggleMic}
        className="orb-container cursor-pointer group relative select-none"
        title="Click to toggle Voice Listening"
      >
        {/* Outer dashed ring */}
        <div className="orb-ring orb-ring-1 group-hover:border-cyan-400/40 transition-colors" />

        {/* Middle ring with ticks */}
        <svg
          className="absolute inset-0 w-full h-full animate-rotate-reverse pointer-events-none"
          viewBox="0 0 280 280"
        >
          <circle
            cx="140"
            cy="140"
            r="110"
            fill="none"
            stroke="rgba(0,240,255,0.12)"
            strokeWidth="0.5"
            strokeDasharray="4 8"
          />
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            const r = 110;
            const x1 = 140 + (r - 5) * Math.cos(angle);
            const y1 = 140 + (r - 5) * Math.sin(angle);
            const x2 = 140 + (r + 5) * Math.cos(angle);
            const y2 = 140 + (r + 5) * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={x2}
                stroke={isMicActive ? 'rgba(0,255,136,0.3)' : 'rgba(0,240,255,0.15)'}
                strokeWidth={i % 9 === 0 ? '2' : '0.5'}
              />
            );
          })}
        </svg>

        {/* Inner ring */}
        <div className="orb-ring orb-ring-2 group-hover:border-cyan-400/50 transition-colors" />

        {/* Dotted ring */}
        <div className="orb-ring orb-ring-3" />

        {/* Hexagonal accent SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 280 280"
          style={{ animation: 'rotate 30s linear infinite' }}
        >
          <polygon
            points="140,30 230,80 230,200 140,250 50,200 50,80"
            fill="none"
            stroke={isMicActive ? 'rgba(0,255,136,0.15)' : 'rgba(0,240,255,0.06)'}
            strokeWidth="0.5"
          />
        </svg>

        {/* Core orb with dynamic glow */}
        <div
          className="orb-core group-hover:scale-105 transition-transform duration-300"
          style={{
            boxShadow:
              isMicActive || status === 'LISTENING'
                ? '0 0 80px rgba(0,255,136,0.5), 0 0 160px rgba(0,255,136,0.2), inset 0 0 60px rgba(0,255,136,0.2)'
                : status === 'THINKING'
                ? '0 0 80px rgba(255,170,0,0.4), 0 0 160px rgba(255,170,0,0.15), inset 0 0 60px rgba(255,170,0,0.15)'
                : status === 'SPEAKING'
                ? '0 0 80px rgba(96,165,250,0.5), 0 0 160px rgba(96,165,250,0.2), inset 0 0 60px rgba(96,165,250,0.2)'
                : undefined,
          }}
        />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <StatusIcon
            className={
              isMicActive
                ? 'text-jarvis-green'
                : status === 'SPEAKING'
                ? 'text-blue-400'
                : 'text-jarvis-cyan'
            }
            size={34}
            style={{
              filter: isMicActive
                ? 'drop-shadow(0 0 12px rgba(0,255,136,0.8))'
                : 'drop-shadow(0 0 10px rgba(0,240,255,0.6))',
              animation:
                status === 'THINKING'
                  ? 'breathe 1.2s ease-in-out infinite'
                  : 'breathe 4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Orbiting particles */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              animation: `rotate ${18 + i * 4}s linear infinite`,
              animationDelay: `${i * 2}s`,
            }}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full absolute ${
                isMicActive ? 'bg-jarvis-green' : 'bg-jarvis-cyan'
              }`}
              style={{
                top: '0%',
                left: '50%',
                transform: 'translateX(-50%)',
                boxShadow: isMicActive ? '0 0 8px #00ff88' : '0 0 8px #00f0ff',
              }}
            />
          </div>
        ))}
      </div>

      {/* Waveform visualizer */}
      <div className="waveform-container">
        {Array.from({ length: waveformBars }).map((_, i) => (
          <div
            key={i}
            className="waveform-bar"
            style={{
              animationDelay: `${i * 0.05}s`,
              animationDuration: `${barDurations[i]}s`,
              height: `${barHeights[i]}px`,
              opacity: isMicActive || isSpeaking ? 1 : config.waveOpacity,
              background: isMicActive
                ? 'linear-gradient(to top, rgba(0, 255, 136, 0.3), #00ff88)'
                : isSpeaking
                ? 'linear-gradient(to top, rgba(96, 165, 250, 0.3), #60a5fa)'
                : undefined,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Real-time Status or Interim Speech Transcript */}
      <div className="text-center space-y-2 max-w-md px-4">
        <h2
          className={`font-mono text-sm tracking-[0.2em] transition-colors duration-300 ${
            interimTranscript
              ? 'text-jarvis-amber font-semibold drop-shadow-[0_0_8px_rgba(255,170,0,0.6)]'
              : 'text-jarvis-cyan'
          }`}
          style={{
            textShadow: '0 0 10px rgba(0,240,255,0.5), 0 0 20px rgba(0,240,255,0.2)',
          }}
        >
          {displayMessage}
        </h2>
        <div className="flex items-center justify-center gap-4 text-xs text-white/30 font-mono">
          <span className="flex items-center gap-1">
            <Activity size={10} className={isConnected ? 'text-jarvis-green' : 'text-red-400'} />
            {isConnected ? 'UPLINK STABLE' : 'UPLINK OFFLINE'}
          </span>
          <span>•</span>
          <span>v4.7.1-OMEGA</span>
          <span>•</span>
          <span className="text-jarvis-green">SANDBOX ENFORCED</span>
        </div>
      </div>

      {/* Voice Controls: Microphone Toggle & Barge-In Interrupt button */}
      <div className="flex items-center gap-3 mt-1">
        <button
          onClick={toggleMic}
          className={`px-4 py-2 rounded-xl font-mono text-xs tracking-wider flex items-center gap-2 transition-all duration-300 border ${
            isMicActive
              ? 'bg-jarvis-green/20 border-jarvis-green/60 text-jarvis-green shadow-[0_0_20px_rgba(0,255,136,0.3)] animate-pulse'
              : 'bg-black/40 border-cyan-500/30 text-cyan-400 hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]'
          }`}
        >
          {isMicActive ? <MicOff size={14} /> : <Mic size={14} />}
          <span>{isMicActive ? 'STOP LISTENING' : 'VOICE COMMAND'}</span>
        </button>

        {isSpeaking && (
          <button
            onClick={triggerBargeIn}
            className="px-3 py-2 rounded-xl font-mono text-xs tracking-wider flex items-center gap-1.5 bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            title="Barge-In: Halt assistant speech immediately"
          >
            <Square size={12} className="fill-current" />
            <span>INTERRUPT</span>
          </button>
        )}
      </div>

      {/* J.A.R.V.I.S Title */}
      <div className="mt-1">
        <h1
          className="text-3xl font-bold tracking-[0.5em] text-transparent bg-clip-text"
          style={{
            backgroundImage:
              'linear-gradient(135deg, #00f0ff 0%, #0066ff 50%, #00f0ff 100%)',
            filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.3))',
          }}
        >
          J.A.R.V.I.S
        </h1>
        <p className="text-center text-[0.6rem] tracking-[0.4em] text-white/20 font-mono mt-1">
          JUST A RATHER VERY INTELLIGENT SYSTEM
        </p>
      </div>
    </div>
  );
}
