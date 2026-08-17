import React from 'react';
import { Calendar } from 'lucide-react';

const CalendarWidget = () => {
  const events = [
    { time: '14:30', title: 'Team Standup - Project Nexus' },
    { time: '16:00', title: 'Review AI Training Pipeline' },
    { time: '19:00', title: 'System Maintenance Window' },
  ];

  return (
    <>
      <style>
        {`
          @keyframes fadeInRight {
            from { opacity: 0; transform: translateX(10px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}
      </style>
      <div 
        className="bg-black/30 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 text-white/90 relative"
        style={{ animation: 'fadeInRight 0.8s ease-out forwards', animationDelay: '0.1s', opacity: 0 }}
      >
        <div className="absolute top-0 right-0 w-1/2 h-1 bg-gradient-to-l from-cyan-500/40 to-transparent"></div>

        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h2 className="text-cyan-400 font-semibold tracking-[0.2em] text-sm">UPCOMING DIRECTIVES</h2>
        </div>

        <div className="space-y-4">
          {events.map((event, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-4 pl-4 border-l-2 border-cyan-500/40 hover:border-cyan-300 hover:bg-cyan-500/10 transition-all duration-300 py-3 rounded-r-lg cursor-default group"
            >
              <div className="font-mono text-cyan-400 text-sm group-hover:text-cyan-300 transition-colors group-hover:drop-shadow-[0_0_5px_rgba(0,240,255,0.8)] w-14">
                {event.time}
              </div>
              <div className="text-sm text-gray-300 group-hover:text-white transition-colors">
                {event.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CalendarWidget;
