import { useState, useEffect } from 'react';
import { Shield, Radio, UserCheck, Sparkles } from 'lucide-react';

export default function TopNav({ isConnected = false }) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).toUpperCase()
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full border-b border-cyan-500/10 bg-slate-950/60 backdrop-blur-xl px-6 py-3 select-none">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between">
        {/* Left: JARVIS Brand & Pulsing Status Pills */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <Sparkles size={18} className="text-cyan-400 animate-pulse" />
              <div className="absolute inset-0 bg-cyan-400/20 blur-sm rounded-full" />
            </div>
            <span className="font-mono font-extrabold text-sm tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500">
              J.A.R.V.I.S.
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Status Pills */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            {/* ONLINE Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
                isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-400'
                }`}
              />
              <span className="font-semibold tracking-wider">
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            {/* ENCRYPTED Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
              <Shield size={11} className="text-cyan-400" />
              <span className="tracking-wider">ENCRYPTED</span>
            </div>
          </div>
        </div>

        {/* Right: Digital Clock, Date & Auth Status */}
        <div className="flex items-center gap-5 font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
            <UserCheck size={12} className="text-cyan-400/80" />
            <span>AUTH: <strong className="text-slate-200">OMEGA-7</strong></span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          <div className="text-right">
            <div className="text-[10px] text-slate-500 tracking-wider">
              {dateStr}
            </div>
            <div className="text-sm font-semibold tracking-widest text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
              {timeStr}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
