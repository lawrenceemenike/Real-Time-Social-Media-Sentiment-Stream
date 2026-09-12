'use client';

import React, { useMemo } from 'react';

interface ShareOfVoiceChartProps {
  data?: {
    timeframe?: string;
    center_stat?: string;
    center_label?: string;
    slices?: Array<{
      name: string;
      share: string;
      share_num: number;
      color: string;
      bgClass: string;
    }>;
  };
}

export const ShareOfVoiceChart: React.FC<ShareOfVoiceChartProps> = ({ data }) => {
  const defaultSlices = [
    { name: 'MTN Nigeria', share: '42%', share_num: 42, color: '#EAB308', bgClass: 'bg-[#EAB308]' },
    { name: 'Airtel Nigeria', share: '26%', share_num: 26, color: '#EF4444', bgClass: 'bg-[#EF4444]' },
    { name: 'Glo Nigeria', share: '15%', share_num: 15, color: '#10B981', bgClass: 'bg-[#10B981]' },
    { name: '9mobile', share: '8%', share_num: 8, color: '#06B6D4', bgClass: 'bg-[#06B6D4]' },
    { name: 'Others', share: '9%', share_num: 9, color: '#64748B', bgClass: 'bg-[#64748B]' },
  ];

  const slices = data?.slices && data.slices.length > 0 ? data.slices : defaultSlices;
  const timeframe = data?.timeframe ?? 'Last 7 days';
  const centerStat = data?.center_stat ?? '68%';
  const centerLabel = data?.center_label ?? 'Top 2 Share';

  // In SVG circle with radius r = 15.9155, circumference C = 2 * PI * 15.9155 = 100
  // Each segment's dasharray is `${val} ${100 - val}` and offset is cumulative sum
  const arcs = useMemo(() => {
    let currentOffset = 0;
    return slices.map((s) => {
      const val = s.share_num ?? parseInt(s.share) ?? 10;
      const arc = {
        ...s,
        val,
        dasharray: `${val} ${Math.max(0, 100 - val)}`,
        dashoffset: -currentOffset
      };
      currentOffset += val;
      return arc;
    });
  }, [slices]);

  return (
    <div className="bg-[#12151D] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700/80 transition">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white">Share of Voice</h3>
        <span className="text-[10px] text-slate-400">{timeframe}</span>
      </div>

      <div className="flex items-center justify-between gap-4 my-auto pt-2">
        {/* Multi-Segment Donut Chart */}
        <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 42 42" className="w-28 h-28 -rotate-90">
            {/* Background track */}
            <circle
              cx="21"
              cy="21"
              r="15.9155"
              fill="none"
              stroke="#1E2433"
              strokeWidth="5"
            />
            {arcs.map((arc, i) => (
              <circle
                key={i}
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                stroke={arc.color}
                strokeWidth="5"
                strokeDasharray={arc.dasharray}
                strokeDashoffset={arc.dashoffset}
                className="transition-all duration-700 ease-out"
              />
            ))}
          </svg>

          {/* Donut Center Info - Dynamically Bound */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
            <span className="text-sm font-black text-white leading-tight transition-all duration-500">
              {centerStat}
            </span>
            <span className="text-[8px] text-slate-400 font-medium leading-tight">
              {centerLabel}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 flex-1 pl-2">
          {slices.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-sm ${s.bgClass} shrink-0 transition-all`} />
                <span className="text-slate-300 text-[11px] truncate max-w-[100px]">{s.name}</span>
              </div>
              <span className="text-slate-200 font-bold text-[11px] transition-all duration-500">{s.share}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
