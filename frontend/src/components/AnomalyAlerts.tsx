'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface AnomalyAlertsProps {
  alerts?: Array<{
    id: any;
    title: string;
    severity: string;
    severityColor: string;
    dotColor: string;
    volumeText: string;
    elapsed: string;
  }>;
}

export const AnomalyAlerts: React.FC<AnomalyAlertsProps> = ({ alerts: propAlerts }) => {
  const defaultAlerts = [
    {
      id: 'alt-1',
      title: 'Spike in negative sentiment for MTN',
      severity: 'High',
      severityColor: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
      dotColor: 'bg-rose-500',
      volumeText: 'Volume ▲ 128% above normal',
      elapsed: '12m ago'
    },
    {
      id: 'alt-2',
      title: 'Data price discussions surging',
      severity: 'Medium',
      severityColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      dotColor: 'bg-amber-500',
      volumeText: 'Volume ▲ 94% above normal',
      elapsed: '28m ago'
    },
    {
      id: 'alt-3',
      title: 'Airtel customer service complaints',
      severity: 'Medium',
      severityColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      dotColor: 'bg-amber-500',
      volumeText: 'Volume ▲ 67% above normal',
      elapsed: '41m ago'
    }
  ];

  // Limit to top 3 distinct alerts so the card layout matches the design without squishing
  const rawAlerts = propAlerts && propAlerts.length > 0 ? propAlerts : defaultAlerts;
  const alerts = rawAlerts.slice(0, 3);

  return (
    <div className="bg-[#12151D] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700/80 transition">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white">Anomaly Alerts</h3>
        <span className="text-[10px] text-slate-400">Last 24h</span>
      </div>

      {/* Alerts list */}
      <div className="flex flex-col gap-3.5 my-auto pt-2">
        {alerts.map((a) => (
          <div key={a.id} className="flex flex-col gap-1 text-xs transition-all duration-500">
            {/* Top row: Pulse dot, Title, Severity Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${a.dotColor} animate-pulse shrink-0`} />
                <span className="text-slate-200 font-medium truncate max-w-[200px]" title={a.title}>
                  {a.title}
                </span>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${a.severityColor}`}>
                {a.severity}
              </span>
            </div>

            {/* Bottom row: Volume percentage delta & Time elapsed */}
            <div className="flex items-center justify-between pl-4 text-[11px]">
              <span className="text-emerald-400 font-medium">
                {a.volumeText}
              </span>
              <span className="text-slate-400 text-[10px]">
                {a.elapsed}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer link */}
      <div className="pt-2 border-t border-slate-800/40 mt-1">
        <button className="text-[11px] font-medium text-amber-500 hover:text-amber-400 flex items-center gap-1 transition">
          View all alerts <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
