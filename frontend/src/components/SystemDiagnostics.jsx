import { BrainCircuit, Shield, Cpu, Wifi } from 'lucide-react';

const ResourceRing = ({ label, value, percent }) => {
  const circumference = 2 * Math.PI * 24;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-[60px] h-[60px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
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
            style={{ filter: 'drop-shadow(0 0 4px rgba(0,240,255,0.5))' }}
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

export default function SystemDiagnostics({ telemetry = {}, nlu = {}, isConnected = false }) {
  const cpu = telemetry.cpu ?? 0;
  const memory = telemetry.memory ?? 0;
  const latency = telemetry.latency ?? 0;
  const uptime = telemetry.uptime ?? '0d 0h 0m';
  const network = telemetry.network ?? { download: '0 B/s', upload: '0 B/s', status: 'OFFLINE' };
  const intent = nlu.intent ?? 'awaiting_input';
  const slots = nlu.slots ?? {};
  const confidence = (nlu.confidence ?? 0) * 100;

  return (
    <div
      className="bg-black/30 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-5 flex flex-col gap-6 w-full h-full"
      style={{ animation: 'fade-in-up 0.6s ease-out forwards' }}
    >
      {/* NLU Stats */}
      <section>
        <div className="flex items-center gap-2 text-cyan-400 mb-3">
          <BrainCircuit size={18} />
          <h2 className="font-bold tracking-widest text-sm font-mono">NLU ENGINE</h2>
        </div>
        <div className="space-y-2 text-sm pl-6 font-mono">
          <div className="flex justify-between items-center">
            <span className="text-cyan-400/70">Intent:</span>
            <span className="text-cyan-400">{intent}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-cyan-400/70">Slots:</span>
            <span className="text-white/90 text-xs">
              {Object.keys(slots).length > 0
                ? Object.entries(slots).map(([k, v]) => `${k}: '${v}'`).join(', ')
                : '—'}
            </span>
          </div>
          <div className="pt-1">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-cyan-400/70">Confidence:</span>
              <span className="text-cyan-400">{confidence.toFixed(1)}%</span>
            </div>
            <div className="h-1 bg-cyan-900/50 rounded overflow-hidden">
              <div
                className="h-full bg-[#00f0ff] transition-all duration-700"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Security/Biometrics */}
      <section>
        <div className="flex items-center gap-2 text-cyan-400 mb-3">
          <Shield size={18} />
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
          <Cpu size={18} />
          <h2 className="font-bold tracking-widest text-sm font-mono">SYSTEM RESOURCES</h2>
          <span className="ml-auto text-[9px] font-mono text-emerald-400/60">LIVE</span>
        </div>
        <div className="flex justify-around items-center px-2">
          <ResourceRing label="CPU" value={`${Math.round(cpu)}%`} percent={cpu} />
          <ResourceRing label="Memory" value={`${Math.round(memory)}%`} percent={memory} />
          <ResourceRing label="Latency" value={`${Math.round(latency)}ms`} percent={Math.min(latency, 100)} />
        </div>
      </section>

      {/* Network Status */}
      <section className="bg-cyan-950/20 border border-cyan-500/10 rounded-xl p-3 mt-2">
        <div className="flex items-center gap-2 text-cyan-400 mb-3">
          <Wifi size={18} className={isConnected ? 'text-cyan-400 animate-pulse' : 'text-red-400'} />
          <h2 className="font-bold tracking-widest text-xs font-mono">
            {isConnected ? `NETWORK: ${network.status}` : 'NETWORK: DISCONNECTED'}
          </h2>
        </div>
        <div className="flex justify-between text-sm font-mono px-2">
          <div>
            <span className="text-cyan-400/50 block text-[10px] uppercase mb-1">Uptime</span>
            <span className="text-white/90 text-xs">{uptime}</span>
          </div>
          <div>
            <span className="text-cyan-400/50 block text-[10px] uppercase mb-1">Download</span>
            <span className="text-white/90 text-xs">{network.download}</span>
          </div>
          <div className="text-right">
            <span className="text-cyan-400/50 block text-[10px] uppercase mb-1">Upload</span>
            <span className="text-white/90 text-xs">{network.upload}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
