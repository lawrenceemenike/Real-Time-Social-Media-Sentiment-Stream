'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock } from 'lucide-react';

interface FooterProps {
  sourceName?: string;
  streamLag?: string;
  isHealthy?: boolean;
}

export const FooterStatusBar: React.FC<FooterProps> = ({
  sourceName = 'Bluesky Jetstream',
  streamLag = '1.2s',
  isHealthy = true,
}) => {
  const [currentTime, setCurrentTime] = useState('10:24:15 AM');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="flex items-center justify-between px-8 py-3 bg-[#0B0D13] border-t border-slate-800/60 text-[11px] text-slate-400 select-none z-20">
      {/* Left Telemetry Indicators */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span>Data Source: <span className="text-slate-200 font-medium">{sourceName}</span></span>
        </div>

        <div className="flex items-center gap-1.5">
          <span>Pipeline Status:</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Healthy
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span>Stream Lag:</span>
          <span className="flex items-center gap-1 text-slate-200">
            <Clock className="h-3 w-3 text-slate-400" />
            {streamLag}
          </span>
        </div>
      </div>

      {/* Right Refresh & Clock Indicators */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <span>Last Updated: <span className="text-slate-200 font-medium">{currentTime}</span></span>
          <button 
            onClick={() => setCurrentTime(new Date().toLocaleTimeString())}
            title="Force refresh"
            className="text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span>Auto-refresh:</span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-1 text-emerald-400 font-medium hover:opacity-80 transition"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${autoRefresh ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            {autoRefresh ? 'On' : 'Off'}
          </button>
        </div>
      </div>
    </footer>
  );
};
