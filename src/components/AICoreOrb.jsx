import { useState, useEffect } from 'react';
import { Zap, Activity } from 'lucide-react';

const STATUS_MESSAGES = [
  'SYSTEM ACTIVE — AWAITING COMMAND',
  'NEURAL NETWORK ONLINE',
  'ALL SUBSYSTEMS NOMINAL',
  'QUANTUM CORE SYNCHRONIZED',
];

export default function AICoreOrb() {
  const [statusIdx, setStatusIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Simulate toggling listening state
  useEffect(() => {
    const listenToggle = setInterval(() => {
      setIsListening((prev) => !prev);
    }, 8000);
    return () => clearInterval(listenToggle);
  }, []);

  const waveformBars = 24;

  return (
    <div
      className="flex flex-col items-center justify-center gap-6 py-6"
      style={{ animation: 'fade-in-up 1s ease-out forwards' }}
    >
      {/* Status Indicator */}
      <div className="flex items-center gap-2 text-xs font-mono tracking-[0.2em] uppercase">
        <div
          className={`w-2 h-2 rounded-full ${
            isListening ? 'bg-jarvis-green' : 'bg-jarvis-cyan'
          }`}
          style={{
            boxShadow: isListening
              ? '0 0 10px #00ff88, 0 0 20px rgba(0,255,136,0.3)'
              : '0 0 10px #00f0ff, 0 0 20px rgba(0,240,255,0.3)',
            animation: 'breathe 2s ease-in-out infinite',
          }}
        />
        <span className={isListening ? 'text-jarvis-green' : 'text-jarvis-cyan/60'}>
          {isListening ? 'LISTENING' : 'STANDBY'}
        </span>
      </div>

      {/* The Orb */}
      <div className="orb-container">
        {/* Outer dashed ring */}
        <div className="orb-ring orb-ring-1" />

        {/* Middle ring with ticks */}
        <svg
          className="absolute inset-0 w-full h-full animate-rotate-reverse"
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
          {/* Tick marks */}
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
                y2={y2}
                stroke="rgba(0,240,255,0.15)"
                strokeWidth={i % 9 === 0 ? '2' : '0.5'}
              />
            );
          })}
        </svg>

        {/* Inner ring */}
        <div className="orb-ring orb-ring-2" />

        {/* Dotted ring */}
        <div className="orb-ring orb-ring-3" />

        {/* Hexagonal accent SVG */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 280 280"
          style={{ animation: 'rotate 30s linear infinite' }}
        >
          <polygon
            points="140,30 230,80 230,200 140,250 50,200 50,80"
            fill="none"
            stroke="rgba(0,240,255,0.06)"
            strokeWidth="0.5"
          />
        </svg>

        {/* Core orb */}
        <div className="orb-core" />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Zap
            className="text-jarvis-cyan"
            size={32}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(0,240,255,0.6))',
              animation: 'breathe 4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              animation: `rotate ${18 + i * 4}s linear infinite`,
              animationDelay: `${i * 2}s`,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full bg-jarvis-cyan absolute"
              style={{
                top: '0%',
                left: '50%',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 8px #00f0ff',
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
              animationDuration: `${0.8 + Math.random() * 0.8}s`,
              height: `${10 + Math.random() * 30}px`,
              opacity: isListening ? 1 : 0.3,
              transition: 'opacity 0.5s ease',
            }}
          />
        ))}
      </div>

      {/* Status text */}
      <div className="text-center space-y-2">
        <h2
          className="font-mono text-sm tracking-[0.3em] text-jarvis-cyan animate-text-flicker"
          style={{
            textShadow: '0 0 10px rgba(0,240,255,0.5), 0 0 20px rgba(0,240,255,0.2)',
          }}
        >
          {STATUS_MESSAGES[statusIdx]}
        </h2>
        <div className="flex items-center justify-center gap-4 text-xs text-white/30 font-mono">
          <span className="flex items-center gap-1">
            <Activity size={10} className="text-jarvis-green" />
            UPLINK STABLE
          </span>
          <span>•</span>
          <span>v4.7.1-OMEGA</span>
          <span>•</span>
          <span className="text-jarvis-green">ENCRYPTED</span>
        </div>
      </div>

      {/* J.A.R.V.I.S title */}
      <div className="mt-2">
        <h1
          className="text-3xl font-bold tracking-[0.5em] text-transparent bg-clip-text"
          style={{
            backgroundImage:
              'linear-gradient(135deg, #00f0ff 0%, #0066ff 50%, #00f0ff 100%)',
            textShadow: 'none',
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
