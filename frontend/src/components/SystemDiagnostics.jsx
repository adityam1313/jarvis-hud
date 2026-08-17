import { useMemo } from 'react';
import { Cpu, Activity, Zap, HardDrive, Wifi, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

// Reusable Circular Progress Ring for CPU, GPU, and RAM
const StatProgressRing = ({ label, value, percent, color = '#00F0FF' }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-[68px] h-[68px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="rgba(100, 116, 139, 0.2)"
            strokeWidth="3.5"
            fill="none"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={color}
            strokeWidth="3.5"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{ filter: `drop-shadow(0 0 5px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-slate-100">
          {value}
        </div>
      </div>
      <span className="text-[10px] text-slate-400 mt-1.5 uppercase font-mono tracking-wider font-semibold">
        {label}
      </span>
    </div>
  );
};

export default function SystemDiagnostics({ telemetry = {}, isConnected = false }) {
  const cpuPercent = telemetry.cpu ?? 18;
  const ramPercent = telemetry.memory ?? 45;
  const gpu = telemetry.gpu || {
    name: 'NVIDIA GeForce RTX GPU',
    usage: 28,
    temp: 49,
    clock: '480 MHz',
    vramUsed: 1178,
    vramTotal: 8188,
    vramPercent: 14
  };

  const gpuPercent = gpu.usage ?? 28;
  const network = telemetry.network || {
    download: '0.00 MB/s',
    upload: '0.00 MB/s',
    rxRate: 0,
    txRate: 0,
    history: []
  };

  // Generate SVG path for minimal dual-line graph
  const history = network.history && network.history.length > 0
    ? network.history
    : Array.from({ length: 12 }, (_, i) => ({ rx: Math.sin(i) * 1.5 + 2, tx: Math.cos(i) * 0.8 + 1 }));

  const maxVal = Math.max(
    5,
    ...history.map(h => Math.max(h.rx || 0, h.tx || 0))
  );

  const width = 240;
  const height = 50;

  const downloadPoints = useMemo(() => {
    return history.map((pt, i) => {
      const x = (i / (history.length - 1 || 1)) * width;
      const y = height - ((pt.rx || 0) / maxVal) * (height - 8) - 4;
      return `${x},${y}`;
    }).join(' ');
  }, [history, maxVal]);

  const uploadPoints = useMemo(() => {
    return history.map((pt, i) => {
      const x = (i / (history.length - 1 || 1)) * width;
      const y = height - ((pt.tx || 0) / maxVal) * (height - 8) - 4;
      return `${x},${y}`;
    }).join(' ');
  }, [history, maxVal]);

  return (
    <div className="h-full flex flex-col gap-3.5 select-none font-mono">
      {/* ═══ TOP CARD: 3 Circular Progress Rings (CPU, GPU, RAM) ═══ */}
      <div className="glass-card border border-cyan-500/20 bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/10">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-cyan-400" />
            <span className="text-xs font-semibold tracking-wider text-cyan-400">
              CORE HARDWARE
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>

        <div className="flex justify-between items-center px-1">
          <StatProgressRing
            label="CPU"
            value={`${Math.round(cpuPercent)}%`}
            percent={cpuPercent}
            color="#00F0FF"
          />
          <StatProgressRing
            label="GPU"
            value={`${Math.round(gpuPercent)}%`}
            percent={gpuPercent}
            color="#0A84FF"
          />
          <StatProgressRing
            label="RAM"
            value={`${Math.round(ramPercent)}%`}
            percent={ramPercent}
            color="#00FF88"
          />
        </div>
      </div>

      {/* ═══ MIDDLE CARD: GPU & System Specs ═══ */}
      <div className="glass-card border border-cyan-500/20 bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-cyan-500/10">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-sky-400" />
            <span className="text-xs font-semibold tracking-wider text-sky-400">
              GPU TELEMETRY
            </span>
          </div>
          <span className="text-[10px] text-slate-500">PCI-E x16</span>
        </div>

        {/* GPU Model Name */}
        <div className="text-[11px] font-semibold text-slate-200 truncate">
          {gpu.name}
        </div>

        {/* Clock & Temp Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-[9px] text-slate-500 block uppercase">Core Clock</span>
            <span className="text-cyan-400 font-bold">{gpu.clock}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-[9px] text-slate-500 block uppercase">Temperature</span>
            <span className="text-emerald-400 font-bold">{gpu.temp}°C</span>
          </div>
        </div>

        {/* VRAM Utilization Bar */}
        <div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
            <span>VRAM UTILIZATION</span>
            <span className="text-slate-200">
              {gpu.vramUsed} / {gpu.vramTotal} MB ({gpu.vramPercent}%)
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
              style={{ width: `${Math.min(100, gpu.vramPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM CARD: Minimal Dual-Line Network Graph ═══ */}
      <div className="glass-card flex-1 border border-cyan-500/20 bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/10">
            <div className="flex items-center gap-2">
              <Wifi size={14} className="text-cyan-400" />
              <span className="text-xs font-semibold tracking-wider text-cyan-400">
                NETWORK THROUGHPUT
              </span>
            </div>
            <span className="text-[10px] text-slate-500">REALTIME</span>
          </div>

          {/* Download / Upload Rates */}
          <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <ArrowDownLeft size={13} className="text-cyan-400" />
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Down</span>
                <span className="text-cyan-300 font-bold text-xs">{network.download}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <ArrowUpRight size={13} className="text-sky-400" />
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Up</span>
                <span className="text-sky-300 font-bold text-xs">{network.upload}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Dual-Line SVG Graph */}
        <div className="mt-3 pt-2 border-t border-slate-800/60">
          <svg className="w-full h-12 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
            {/* Grid Line */}
            <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(100, 116, 139, 0.15)" strokeDasharray="3 3" />
            
            {/* Download Polyline (Cyan) */}
            <polyline
              fill="none"
              stroke="#00F0FF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={downloadPoints}
              style={{ filter: 'drop-shadow(0 0 4px rgba(0,240,255,0.6))' }}
            />

            {/* Upload Polyline (Cobalt/Blue) */}
            <polyline
              fill="none"
              stroke="#0A84FF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={uploadPoints}
              style={{ filter: 'drop-shadow(0 0 3px rgba(10,132,255,0.6))' }}
            />
          </svg>

          <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> RX (Down)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> TX (Up)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
