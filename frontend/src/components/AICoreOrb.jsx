import { useMemo } from 'react';
import { Sparkles, Mic, Brain, Volume2, Shield } from 'lucide-react';

const STATUS_MAP = {
  IDLE: {
    label: 'STANDBY',
    subtext: 'AWAITING USER DIRECTIVE',
    glowColor: 'rgba(0, 240, 255, 0.4)',
    ringColor: 'rgba(0, 240, 255, 0.25)',
    textColor: 'text-cyan-400',
    icon: Sparkles
  },
  LISTENING: {
    label: 'LISTENING',
    subtext: 'AUDIO STREAM ACTIVE',
    glowColor: 'rgba(0, 255, 136, 0.6)',
    ringColor: 'rgba(0, 255, 136, 0.4)',
    textColor: 'text-emerald-400',
    icon: Mic
  },
  THINKING: {
    label: 'PROCESSING',
    subtext: 'NEURAL TOOL EXECUTION',
    glowColor: 'rgba(255, 179, 0, 0.6)',
    ringColor: 'rgba(255, 179, 0, 0.4)',
    textColor: 'text-amber-400',
    icon: Brain
  },
  SPEAKING: {
    label: 'TRANSMITTING',
    subtext: 'AUDIO SYNTHESIS ACTIVE',
    glowColor: 'rgba(10, 132, 255, 0.6)',
    ringColor: 'rgba(10, 132, 255, 0.4)',
    textColor: 'text-sky-400',
    icon: Volume2
  }
};

export default function AICoreOrb({
  status = 'IDLE',
  isConnected = false,
  isMicActive = false,
  interimTranscript = '',
  audioLevel = 0,
  toggleMic
}) {
  const currentStatus = isMicActive ? 'LISTENING' : (STATUS_MAP[status] ? status : 'IDLE');
  const cfg = STATUS_MAP[currentStatus] || STATUS_MAP.IDLE;
  const StatusIcon = cfg.icon;

  // Waveform frequency heights
  const barsCount = 28;
  const waveBars = useMemo(() => {
    return Array.from({ length: barsCount }).map((_, i) => ({
      height: 15 + Math.sin(i * 0.4) * 20 + (i % 2 === 0 ? 15 : 0),
      delay: (i * 0.04).toFixed(2),
      duration: (0.7 + (i % 5) * 0.15).toFixed(2)
    }));
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none px-4">
      {/* Background radial depth glow */}
      <div
        className="absolute w-[380px] h-[380px] rounded-full blur-[90px] pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${cfg.glowColor} 0%, transparent 70%)`
        }}
      />

      {/* Holographic Arc Reactor Multi-Ring Visualizer */}
      <div
        onClick={toggleMic}
        className="relative w-[300px] h-[300px] flex items-center justify-center cursor-pointer group transition-transform duration-300 hover:scale-[1.02]"
        title="Click to toggle Voice Input"
      >
        {/* Outer Ring 1: Technical Tick Marks */}
        <svg className="absolute inset-0 w-full h-full animate-spin-cw pointer-events-none" viewBox="0 0 300 300">
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            stroke="rgba(0, 240, 255, 0.15)"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const r = 140;
            const x1 = 150 + (r - 4) * Math.cos(angle);
            const y1 = 150 + (r - 4) * Math.sin(angle);
            const x2 = 150 + (r + 4) * Math.cos(angle);
            const y2 = 150 + (r + 4) * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={cfg.ringColor}
                strokeWidth={i % 6 === 0 ? '2' : '0.75'}
              />
            );
          })}
        </svg>

        {/* Outer Ring 2: Counter-rotating segmented ring */}
        <svg className="absolute inset-0 w-full h-full animate-spin-ccw pointer-events-none" viewBox="0 0 300 300">
          <circle
            cx="150"
            cy="150"
            r="120"
            fill="none"
            stroke="rgba(0, 240, 255, 0.2)"
            strokeWidth="1.5"
            strokeDasharray="40 25 15 25"
          />
        </svg>

        {/* Inner Ring 3: Smooth Pulsing Geometric Circle */}
        <div
          className="absolute w-[200px] h-[200px] rounded-full border border-cyan-500/30 animate-pulse-ring-smooth pointer-events-none"
          style={{ borderColor: cfg.ringColor }}
        />

        {/* Glowing Luminous Quantum Core */}
        <div
          className="w-[130px] h-[130px] rounded-full relative flex items-center justify-center animate-breathe-core transition-all duration-500 shadow-2xl"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${cfg.glowColor}, rgba(10, 132, 255, 0.25) 50%, rgba(5, 7, 14, 0.9) 100%)`,
            boxShadow: `0 0 50px ${cfg.glowColor}, inset 0 0 30px ${cfg.glowColor}`
          }}
        >
          {/* Inner Core Icon */}
          <StatusIcon
            size={36}
            className={`${cfg.textColor} drop-shadow-[0_0_12px_rgba(0,240,255,0.8)] transition-colors duration-300`}
          />
        </div>
      </div>

      {/* Center Status Text (STANDBY / PROCESSING / LISTENING) */}
      <div className="mt-6 text-center space-y-1">
        <div className="font-mono text-xs tracking-[0.35em] text-slate-400 font-medium uppercase">
          CORE STATUS
        </div>
        <div
          className={`font-mono text-2xl font-extrabold tracking-[0.3em] ${cfg.textColor} drop-shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-colors duration-300`}
        >
          {cfg.label}
        </div>
        <div className="font-mono text-[11px] text-slate-500 tracking-widest">
          {interimTranscript ? `"${interimTranscript}"` : cfg.subtext}
        </div>
      </div>

      {/* Reactive Audio Waveform Visualizer directly below Orb */}
      <div className="mt-5 flex items-center justify-center gap-1.5 h-9 px-6 py-1 rounded-full bg-slate-900/40 border border-cyan-500/15 backdrop-blur-md">
        {waveBars.map((bar, i) => {
          const dynamicHeight = isMicActive
            ? Math.max(6, Math.min(32, (bar.height * (audioLevel || 40)) / 40))
            : currentStatus !== 'IDLE'
            ? bar.height
            : 4;

          return (
            <div
              key={i}
              className="w-[2.5px] rounded-full transition-all duration-150"
              style={{
                height: `${dynamicHeight}px`,
                background:
                  currentStatus === 'LISTENING'
                    ? 'linear-gradient(to top, rgba(0,255,136,0.3), #00FF88)'
                    : currentStatus === 'THINKING'
                    ? 'linear-gradient(to top, rgba(255,179,0,0.3), #FFB300)'
                    : currentStatus === 'SPEAKING'
                    ? 'linear-gradient(to top, rgba(10,132,255,0.3), #0A84FF)'
                    : 'linear-gradient(to top, rgba(0,240,255,0.2), rgba(0,240,255,0.6))',
                boxShadow: currentStatus !== 'IDLE' ? '0 0 6px rgba(0,240,255,0.4)' : 'none'
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
