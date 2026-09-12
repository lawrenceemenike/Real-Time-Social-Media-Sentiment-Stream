'use client';

import React from 'react';

interface TopEntitiesTableProps {
  entities?: Array<{
    name: string;
    logoBg: string;
    logoText: string;
    mentions: string;
    sentiment: string;
    isPositive: boolean;
    sparkColor: string;
    sparkPath: string;
    history?: number[];
  }>;
}

export const TopEntitiesTable: React.FC<TopEntitiesTableProps> = ({ entities: propEntities }) => {
  const defaultEntities = [
    {
      name: 'MTN Nigeria',
      logoBg: 'bg-[#EAB308]',
      logoText: 'mtn',
      mentions: '45,235',
      sentiment: '-16%',
      isPositive: false,
      sparkColor: '#EF4444',
      sparkPath: 'M 2.0 10.4 C 5.3 10.4, 5.3 10.8, 8.7 10.8 C 12.0 10.8, 12.0 11.2, 15.3 11.2 C 18.7 11.2, 18.7 10.7, 22.0 10.7 C 25.3 10.7, 25.3 11.4, 28.7 11.4 C 32.0 11.4, 32.0 10.8, 35.3 10.8 C 38.7 10.8, 38.7 11.0, 42.0 11.0'
    },
    {
      name: 'Airtel Nigeria',
      logoBg: 'bg-[#EF4444]',
      logoText: 'airtel',
      mentions: '28,104',
      sentiment: '+32%',
      isPositive: true,
      sparkColor: '#10B981',
      sparkPath: 'M 2.0 5.1 C 5.3 5.1, 5.3 4.6, 8.7 4.6 C 12.0 4.6, 12.0 5.5, 15.3 5.5 C 18.7 5.5, 18.7 4.4, 22.0 4.4 C 25.3 4.4, 25.3 4.2, 28.7 4.2 C 32.0 4.2, 32.0 4.5, 35.3 4.5 C 38.7 4.5, 38.7 4.1, 42.0 4.1'
    },
    {
      name: 'Glo Nigeria',
      logoBg: 'bg-[#10B981]',
      logoText: 'glo',
      mentions: '16,544',
      sentiment: '-4%',
      isPositive: false,
      sparkColor: '#EF4444',
      sparkPath: 'M 2.0 8.8 C 5.3 8.8, 5.3 9.3, 8.7 9.3 C 12.0 9.3, 12.0 8.9, 15.3 8.9 C 18.7 8.9, 18.7 9.6, 22.0 9.6 C 25.3 9.6, 25.3 9.2, 28.7 9.2 C 32.0 9.2, 32.0 9.1, 35.3 9.1 C 38.7 9.1, 38.7 9.1, 42.0 9.1'
    },
    {
      name: '9mobile',
      logoBg: 'bg-[#06B6D4]',
      logoText: '9',
      mentions: '8,912',
      sentiment: '+30%',
      isPositive: true,
      sparkColor: '#10B981',
      sparkPath: 'M 2.0 6.4 C 5.3 6.4, 5.3 6.0, 8.7 6.0 C 12.0 6.0, 12.0 5.5, 15.3 5.5 C 18.7 5.5, 18.7 5.2, 22.0 5.2 C 25.3 5.2, 25.3 4.9, 28.7 4.9 C 32.0 4.9, 32.0 4.7, 35.3 4.7 C 38.7 4.7, 38.7 4.4, 42.0 4.4'
    },
    {
      name: 'Naira',
      logoBg: 'bg-slate-700',
      logoText: '₦',
      mentions: '7,643',
      sentiment: '+29%',
      isPositive: true,
      sparkColor: '#10B981',
      sparkPath: 'M 2.0 6.0 C 5.3 6.0, 5.3 5.8, 8.7 5.8 C 12.0 5.8, 12.0 5.5, 15.3 5.5 C 18.7 5.5, 18.7 5.1, 22.0 5.1 C 25.3 5.1, 25.3 5.2, 28.7 5.2 C 32.0 5.2, 32.0 4.8, 35.3 4.8 C 38.7 4.8, 38.7 4.5, 42.0 4.5'
    },
  ];

  const entities = (propEntities && propEntities.length > 0) ? propEntities : defaultEntities;

  return (
    <div className="bg-[#12151D] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700/80 transition">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white">Top Entities</h3>
        <span className="text-[10px] text-slate-400">Last 7 days</span>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 text-[10px] text-slate-400 border-b border-slate-800/60 pb-2 mt-3 font-medium">
        <span className="col-span-5">Entity</span>
        <span className="col-span-3 text-right">Mentions</span>
        <span className="col-span-2 text-right">Sentiment</span>
        <span className="col-span-2 text-right">Trend</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col divide-y divide-slate-800/30">
        {entities.map((ent, idx) => (
          <div key={idx} className="grid grid-cols-12 items-center py-2.5 text-xs hover:bg-slate-800/20 px-1 rounded-lg transition-all duration-300">
            {/* Entity Name & Avatar */}
            <div className="col-span-5 flex items-center gap-2">
              <div className={`h-5 w-5 rounded-full ${ent.logoBg} flex items-center justify-center text-[8px] font-bold text-black uppercase tracking-tighter shrink-0`}>
                {ent.logoText}
              </div>
              <span className="text-slate-200 font-medium truncate text-xs">
                {ent.name}
              </span>
            </div>

            {/* Mentions */}
            <span className="col-span-3 text-right font-medium text-slate-300 text-xs transition-all duration-500">
              {ent.mentions}
            </span>

            {/* Sentiment */}
            <span className={`col-span-2 text-right font-semibold text-xs transition-all duration-500 ${
              ent.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {ent.sentiment}
            </span>

            {/* Mini Dynamic Sparkline */}
            <div className="col-span-2 flex justify-end items-center pr-1">
              <svg width="45" height="18" viewBox="0 0 45 18" className="overflow-visible">
                <path
                  d={ent.sparkPath}
                  fill="none"
                  stroke={ent.sparkColor}
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
                {/* Active pulse dot on the latest sparkline reading */}
                <circle cx="42" cy={ent.isPositive ? "4.5" : "11.0"} r="2" fill={ent.sparkColor} />
                <circle cx="42" cy={ent.isPositive ? "4.5" : "11.0"} r="4" fill={ent.sparkColor} opacity="0.3" className="animate-ping" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
