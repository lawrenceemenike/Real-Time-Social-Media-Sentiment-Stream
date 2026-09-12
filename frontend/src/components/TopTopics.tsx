'use client';

import React from 'react';

interface TopTopicsProps {
  topics?: Array<{
    rank: number;
    name: string;
    count: string;
    widthPct: number;
  }>;
}

export const TopTopics: React.FC<TopTopicsProps> = ({ topics: propTopics }) => {
  const defaultTopics = [
    { rank: 1, name: 'Data Price', count: '24.8K', widthPct: 95 },
    { rank: 2, name: 'Network Issue', count: '18.6K', widthPct: 75 },
    { rank: 3, name: 'Customer Service', count: '14.2K', widthPct: 58 },
    { rank: 4, name: 'Airtel vs MTN', count: '10.3K', widthPct: 42 },
    { rank: 5, name: 'Recharge Plans', count: '8.7K', widthPct: 35 },
  ];
  const topics = (propTopics && propTopics.length > 0) ? propTopics : defaultTopics;

  return (
    <div className="bg-[#12151D] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700/80 transition">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white">Top Topics</h3>
        <span className="text-[10px] text-slate-400">Last 7 days</span>
      </div>

      <div className="flex flex-col gap-3.5 my-auto pt-2">
        {topics.map((t) => (
          <div key={t.rank} className="flex items-center gap-3 text-xs">
            {/* Rank number */}
            <span className="text-[11px] font-medium text-slate-400 w-3 text-right">
              {t.rank}
            </span>

            {/* Topic label */}
            <span className="text-slate-200 font-medium w-28 truncate">
              {t.name}
            </span>

            {/* Horizontal progress bar */}
            <div className="flex-1 bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${t.widthPct}%` }}
                className="h-full bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              />
            </div>

            {/* Count label */}
            <span className="text-[11px] font-semibold text-slate-300 w-10 text-right">
              {t.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
