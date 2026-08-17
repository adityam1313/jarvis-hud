import { useState, useEffect } from 'react';
import { Shield, Signal, Clock, Hexagon, AlertTriangle } from 'lucide-react';
import AICoreOrb from './components/AICoreOrb';
import CommandTerminal from './components/CommandTerminal';
import CalendarWidget from './components/CalendarWidget';
import SystemDiagnostics from './components/SystemDiagnostics';
import useJarvisSocket from './hooks/useJarvisSocket';

function getFormattedTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function getFormattedDate() {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function Header({ isConnected, latency }) {
  const [time, setTime] = useState(getFormattedTime());
  const [date] = useState(getFormattedDate());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getFormattedTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header-bar sticky top-0 z-50 px-6 py-2.5">
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        {/* Left: Logo & status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Hexagon
              size={22}
              className="text-jarvis-cyan"
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.5))' }}
            />
            <span
              className="font-bold text-sm tracking-[0.3em] text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #00f0ff, #0088ff)',
              }}
            >
              JARVIS
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[0.6rem] font-mono text-white/30">
            <div
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-jarvis-green' : 'bg-red-500'}`}
              style={{ boxShadow: isConnected ? '0 0 6px #00ff88' : '0 0 6px #ff3355' }}
            />
            <span className={isConnected ? 'text-jarvis-green/80' : 'text-red-400/80'}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
            <span className="mx-1">|</span>
            <Shield size={10} className="text-jarvis-cyan/50" />
            <span>ENCRYPTED</span>
            <span className="mx-1">|</span>
            <Signal size={10} className="text-jarvis-cyan/50" />
            <span>LATENCY: {Math.round(latency)}ms</span>
          </div>
        </div>

        {/* Center: Alerts */}
        <div className="hidden md:flex items-center gap-2 text-[0.6rem] font-mono">
          <AlertTriangle size={12} className="text-jarvis-amber/60" />
          <span className="text-jarvis-amber/60">0 ACTIVE ALERTS</span>
        </div>

        {/* Right: Date & Time */}
        <div className="flex items-center gap-4 text-right">
          <div className="hidden sm:block text-[0.6rem] font-mono text-white/30 uppercase tracking-wider">
            {date}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-jarvis-cyan/50" />
            <span
              className="font-mono text-sm text-jarvis-cyan tracking-wider"
              style={{
                textShadow: '0 0 8px rgba(0,240,255,0.3)',
              }}
            >
              {time}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);

  const {
    isConnected,
    telemetry,
    nlu,
    assistantStatus,
    messages,
    isMicActive,
    interimTranscript,
    isSpeaking,
    toggleMic,
    triggerBargeIn,
    sendTranscript,
    voiceSupported
  } = useJarvisSocket();

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-jarvis-bg relative flex flex-col justify-between">
      {/* Background effects */}
      <div className="hud-bg" />
      <div className="scanline-overlay" />

      {/* Top Header */}
      <Header isConnected={isConnected} latency={telemetry.latency} />

      {/* Main 3-Column HUD Dashboard */}
      <main
        className={`relative z-10 max-w-[1920px] w-full mx-auto p-4 lg:p-5 flex-1 transition-opacity duration-1000 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 h-full">
          {/* ═══ LEFT COLUMN: Live Command Terminal ═══ */}
          <div className="lg:col-span-4 flex flex-col min-h-[500px]">
            <CommandTerminal
              messages={messages}
              sendTranscript={sendTranscript}
              isConnected={isConnected}
              isMicActive={isMicActive}
              toggleMic={toggleMic}
            />
          </div>

          {/* ═══ CENTER COLUMN: Holographic AI Core Orb ═══ */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="glass-panel p-5 flex flex-col items-center justify-center flex-1">
              <AICoreOrb
                status={assistantStatus}
                isConnected={isConnected}
                isMicActive={isMicActive}
                interimTranscript={interimTranscript}
                isSpeaking={isSpeaking}
                toggleMic={toggleMic}
                triggerBargeIn={triggerBargeIn}
                voiceSupported={voiceSupported}
              />
            </div>
          </div>

          {/* ═══ RIGHT COLUMN: Telemetry & Directives ═══ */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* System Diagnostics */}
            <div
              className="flex-1"
              style={{
                animation: 'fade-in-right 0.8s ease-out forwards',
                animationDelay: '0.2s',
                opacity: 0,
              }}
            >
              <SystemDiagnostics
                telemetry={telemetry}
                nlu={nlu}
                isConnected={isConnected}
              />
            </div>

            {/* Upcoming Directives */}
            <div
              style={{
                animation: 'fade-in-right 0.8s ease-out forwards',
                animationDelay: '0.35s',
                opacity: 0,
              }}
            >
              <CalendarWidget />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom status bar */}
      <footer className="relative z-10 border-t border-cyan-500/5 px-6 py-2">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-[0.55rem] font-mono text-white/20">
          <span>JARVIS CORE v4.7.1 | QUANTUM NEURAL ENGINE</span>
          <span>
            BACKEND: {isConnected ? 'CONNECTED' : 'DISCONNECTED'} | VOICE: {voiceSupported ? 'ACTIVE' : 'READY'} | CLEARANCE: OMEGA-7
          </span>
          <span>© 2026 STARK INDUSTRIES — CLASSIFIED</span>
        </div>
      </footer>
    </div>
  );
}
