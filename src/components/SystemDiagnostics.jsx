import React from 'react';
import { BrainCircuit, Shield, Cpu, Wifi } from 'lucide-react';

const ResourceRing = ({ label, value, percent }) => {
  const circumference = 2 * Math.PI * 24;
  const offset = circumference - (percent / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-[60px] h-[60px]">
        <svg className="w-full h-full -rotate-90 animate-pulse" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="24" stroke="rgba(0,240,255,0.1)" strokeWidth="4" fill="none" />
          <circle 
            cx="30" cy="30" r="24" 
            stroke="#00f0ff" 
            strokeWidth="4" 
            fill="none" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out" 
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white/90">
          {value}
        </div>
      </div>
      <span className="text-[10px] text-cyan-400 mt-2 uppercase font-mono tracking-wider">{label}</span>
    </div>
  );
};

const SystemDiagnostics = () => {
  return (
    <>
      <style>
        {`
          @keyframes fadeInUpDiagnostics {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <div 
        className="bg-black/30 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-5 flex flex-col gap-6 w-full h-full"
        style={{ animation: 'fadeInUpDiagnostics 0.6s ease-out forwards' }}
      >
        {/* NLU Stats */}
        <section>
          <div className="flex items-center gap-2 text-cyan-400 mb-3">
            <BrainCircuit size={18} className="text-cyan-400" />
            <h2 className="font-bold tracking-widest text-sm font-mono">NLU ENGINE</h2>
          </div>
          <div className="space-y-2 text-sm pl-6 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-cyan-400/70">Intent:</span>
              <span className="text-cyan-400">get_weather</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cyan-400/70">Slots:</span>
              <span className="text-white/90 text-xs">location: 'Mumbai', timeframe: 'current'</span>
            </div>
            <div className="pt-1">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-cyan-400/70">Confidence:</span>
                <span className="text-cyan-400">98.7%</span>
              </div>
              <div className="h-1 bg-cyan-900/50 rounded overflow-hidden">
                <div className="h-full bg-[#00f0ff] w-[98.7%]"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Security/Biometrics */}
        <section>
          <div className="flex items-center gap-2 text-cyan-400 mb-3">
            <Shield size={18} className="text-cyan-400" />
            <h2 className="font-bold tracking-widest text-sm font-mono">BIOMETRIC AUTH</h2>
          </div>
          <div className="space-y-2 text-sm pl-6 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-cyan-400/70">Voiceprint Matrix:</span>
              <span className="text-emerald-400 font-bold animate-pulse">VERIFIED</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cyan-400/70">Owner:</span>
              <span className="text-cyan-400">ADITYA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cyan-400/70">Auth Level:</span>
              <span className="text-white/90">OMEGA-7 CLEARANCE</span>
            </div>
          </div>
        </section>

        {/* Resource Monitors */}
        <section>
          <div className="flex items-center gap-2 text-cyan-400 mb-4">
            <Cpu size={18} className="text-cyan-400" />
            <h2 className="font-bold tracking-widest text-sm font-mono">SYSTEM RESOURCES</h2>
          </div>
          <div className="flex justify-around items-center pl-2 pr-2">
            <ResourceRing label="CPU" value="34%" percent={34} />
            <ResourceRing label="Memory" value="62%" percent={62} />
            <ResourceRing label="Latency" value="12ms" percent={12} />
          </div>
        </section>

        {/* Network Status */}
        <section className="bg-cyan-950/20 border border-cyan-500/10 rounded-xl p-3 mt-2">
          <div className="flex items-center gap-2 text-cyan-400 mb-3">
            <Wifi size={18} className="text-cyan-400 animate-pulse" />
            <h2 className="font-bold tracking-widest text-xs font-mono">NETWORK: SECURE TUNNEL ACTIVE</h2>
          </div>
          <div className="flex justify-between text-sm font-mono px-2">
            <div>
              <span className="text-cyan-400/50 block text-[10px] uppercase mb-1">Uptime</span>
              <span className="text-white/90 text-xs">47d 12h 33m</span>
            </div>
            <div className="text-right">
              <span className="text-cyan-400/50 block text-[10px] uppercase mb-1">Throughput</span>
              <span className="text-white/90 text-xs">1.2 Gbps</span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default SystemDiagnostics;
