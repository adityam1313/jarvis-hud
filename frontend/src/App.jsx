import { useState, useEffect } from 'react';
import TopNav from './components/TopNav';
import CommandTerminal from './components/CommandTerminal';
import AICoreOrb from './components/AICoreOrb';
import SystemDiagnostics from './components/SystemDiagnostics';
import useJarvisSocket from './hooks/useJarvisSocket';

export default function App() {
  const [loaded, setLoaded] = useState(false);

  const {
    isConnected,
    telemetry,
    assistantStatus,
    messages,
    isMicActive,
    interimTranscript,
    audioLevel,
    toggleMic,
    sendTranscript
  } = useJarvisSocket();

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen w-screen bg-[#05070E] relative flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Subtle Ambient Background Depth Glow */}
      <div className="hud-ambient-glow" />
      <div className="hud-grid-lines" />

      {/* Top Navigation Bar */}
      <TopNav isConnected={isConnected} />

      {/* 3-Column Minimalist HUD Layout */}
      <main
        className={`relative z-10 max-w-[1920px] w-full mx-auto px-6 py-4 flex-1 overflow-hidden transition-opacity duration-700 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
          {/* ═══ LEFT COLUMN (30% Width): Live Command Terminal ═══ */}
          <section className="lg:col-span-4 h-full flex flex-col min-h-0">
            <CommandTerminal
              messages={messages}
              sendTranscript={sendTranscript}
              isConnected={isConnected}
              isMicActive={isMicActive}
              toggleMic={toggleMic}
            />
          </section>

          {/* ═══ CENTER STAGE (45% Width): Unobstructed AI Core ═══ */}
          <section className="lg:col-span-5 h-full flex flex-col items-center justify-center relative min-h-0">
            <AICoreOrb
              status={assistantStatus}
              isConnected={isConnected}
              isMicActive={isMicActive}
              interimTranscript={interimTranscript}
              audioLevel={audioLevel}
              toggleMic={toggleMic}
            />
          </section>

          {/* ═══ RIGHT COLUMN (25% Width): Clean Hardware Telemetry ═══ */}
          <section className="lg:col-span-3 h-full flex flex-col min-h-0">
            <SystemDiagnostics
              telemetry={telemetry}
              isConnected={isConnected}
            />
          </section>
        </div>
      </main>

      {/* Minimal Footer Status Line */}
      <footer className="relative z-10 border-t border-cyan-500/10 px-6 py-2 bg-slate-950/40">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>JARVIS HUD v4.7.1-OMEGA | QUANTUM NEURAL INTERFACE</span>
          <span>HOST: DESKTOP-ADITYA | 144Hz DISPLAY V-SYNC SYNCED</span>
          <span>STARK INDUSTRIES • CLASSIFIED</span>
        </div>
      </footer>
    </div>
  );
}
