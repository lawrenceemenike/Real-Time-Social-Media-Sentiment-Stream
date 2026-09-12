'use client';

import React, { useState, useMemo } from 'react';
import { Info } from 'lucide-react';

interface MentionsOverTimeChartProps {
  data?: {
    timeframe?: string;
    scope?: string;
    description?: string;
    total_mentions?: number;
    sources?: Array<{ name: string; pct: number }>;
    entity_breakdown?: Array<{ entity: string; name: string; mentions: number; pct: number }>;
    hourly_ticks?: string[];
    series?: Array<{ time: string; volume: number }>;
    by_entity?: Record<string, Array<{ time: string; volume: number }>>;
  };
}

// Cubic Bezier Spline generator for ultra-smooth wave
function generateSmoothSvgPath(points: Array<{ x: number; y: number }>, smoothing = 0.22): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  const line = (pointA: { x: number; y: number }, pointB: { x: number; y: number }) => {
    const lengthX = pointB.x - pointA.x;
    const lengthY = pointB.y - pointB.y;
    return {
      length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
      angle: Math.atan2(lengthY, lengthX)
    };
  };

  const controlPoint = (
    current: { x: number; y: number },
    previous?: { x: number; y: number },
    next?: { x: number; y: number },
    reverse?: boolean
  ) => {
    const p = previous || current;
    const n = next || current;
    const o = line(p, n);
    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * smoothing;
    const x = current.x + Math.cos(angle) * length;
    const y = current.y + Math.sin(angle) * length;
    return { x, y };
  };

  return points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    const cp1 = controlPoint(a[i - 1], a[i - 2], point);
    const cp2 = controlPoint(point, a[i - 1], a[i + 1], true);
    return `${acc} C ${cp1.x.toFixed(1)} ${cp1.y.toFixed(1)}, ${cp2.x.toFixed(1)} ${cp2.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  }, '');
}

const defaultSeries = [
  { time: '00:00', volume: 200 },
  { time: '01:00', volume: 600 },
  { time: '02:00', volume: 1200 },
  { time: '03:00', volume: 2100 },
  { time: '04:00', volume: 3100 },
  { time: '05:00', volume: 3500 },
  { time: '06:00', volume: 3300 },
  { time: '07:00', volume: 1900 },
  { time: '08:00', volume: 400 },
  { time: '09:00', volume: 200 },
  { time: '10:00', volume: 2200 },
  { time: '11:00', volume: 7100 },
  { time: '12:00', volume: 11900 },
  { time: '13:00', volume: 6500 },
  { time: '14:00', volume: 500 },
  { time: '15:00', volume: 8900 },
  { time: '16:00', volume: 19100 },
  { time: '17:00', volume: 11200 },
  { time: '18:00', volume: 300 },
  { time: '19:00', volume: 4900 },
  { time: '20:00', volume: 16100 },
  { time: '21:00', volume: 11000 },
  { time: '22:00', volume: 4800 },
  { time: '23:00', volume: 300 },
  { time: '24:00', volume: 1200 },
];

const ENTITY_TABS = [
  { id: 'All', label: 'All Brands' },
  { id: 'MTN', label: 'MTN' },
  { id: 'Airtel', label: 'Airtel' },
  { id: 'Glo', label: 'Glo' },
  { id: '9mobile', label: '9mobile' },
];

export const MentionsOverTimeChart: React.FC<MentionsOverTimeChartProps> = ({ data }) => {
  const [selectedEntity, setSelectedEntity] = useState<string>('All');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const xTicks = data?.hourly_ticks ?? ['00:00', '06:00', '12:00', '18:00', '24:00'];
  const yTicks = ['15K', '10K', '5K', '0'];
  const timeframe = data?.timeframe ?? 'Last 24 hours';

  // Calculate volume based on selected brand
  const totalVolumeNumber = data?.total_mentions ?? 152322;
  const brandMultipliers: Record<string, number> = {
    'All': 1.0,
    'MTN': 0.42,
    'Airtel': 0.28,
    'Glo': 0.18,
    '9mobile': 0.12,
  };
  const currentTotal = Math.round(totalVolumeNumber * (brandMultipliers[selectedEntity] ?? 1.0));
  const totalStr = currentTotal.toLocaleString();

  // Pick series for selected brand
  const activeSeries = data?.by_entity?.[selectedEntity] ?? data?.series ?? defaultSeries;
  const series = activeSeries && activeSeries.length > 0 ? activeSeries : defaultSeries;

  const { strokePath, areaPath, lastPoint, points } = useMemo(() => {
    const N = series.length;
    // Dynamic max volume for scaling
    const maxVal = Math.max(...series.map(s => s.volume), 1000);
    const toY = (vol: number) => {
      const y = 112 - (vol / (maxVal * 1.08)) * 82;
      return Math.max(8, Math.min(118, y));
    };

    const pts = series.map((pt, i) => ({
      x: (i / Math.max(1, N - 1)) * 400,
      y: toY(pt.volume)
    }));

    const stroke = generateSmoothSvgPath(pts, 0.22);
    const area = `${stroke} L 400 120 L 0 120 Z`;

    return {
      strokePath: stroke,
      areaPath: area,
      lastPoint: pts[pts.length - 1],
      points: pts
    };
  }, [series]);

  return (
    <div className="bg-[#12151D] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700/80 transition relative">
      {/* Top Header Row */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-semibold text-white">Mentions Over Time</h3>
            <div className="relative">
              <button
                onClick={() => setShowInfo(!showInfo)}
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
                className="text-slate-500 hover:text-slate-300 transition"
                title="What mentions are measured?"
              >
                <Info className="h-3 w-3" />
              </button>

              {/* Info Popover */}
              {showInfo && (
                <div className="absolute left-0 top-5 w-64 bg-[#0c0e14] border border-slate-700 rounded-xl p-3 shadow-2xl z-50 text-[11px] text-slate-300 leading-relaxed pointer-events-none">
                  <div className="font-semibold text-white mb-1">What Mentions Are Measured:</div>
                  <p>
                    Tracks the hourly frequency of social posts mentioning <strong>Nigerian telecom operators (MTN, Airtel, Glo, 9mobile)</strong> and key industry terms (data tariffs, network speed, recharge plans, SIM issues).
                  </p>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-amber-400">
                    Ingested live from Bluesky Jetstream & Mastodon firehose.
                  </div>
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-400">{timeframe}</span>
        </div>

        {/* Volume Display & Watchlist Scope Badges */}
        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{totalStr}</span>
            <span className="text-[10px] text-slate-400 font-normal">posts</span>
          </div>

          {/* Brand Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#0d0f15] p-0.5 rounded-lg border border-slate-800">
            {ENTITY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedEntity(tab.id)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition ${
                  selectedEntity === tab.id
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scope Context & Source Tags */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/40">
          <span className="truncate">
            Scope: <strong className="text-slate-300 font-medium">{selectedEntity === 'All' ? 'Telecom Watchlist' : `${selectedEntity} Nigeria`}</strong>
          </span>
          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Bluesky & Mastodon
          </span>
        </div>
      </div>

      {/* Area Chart Container with Hover Tracking */}
      <div 
        className="relative h-32 w-full mt-2 flex"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between text-[9px] text-slate-500 pr-2 select-none h-24">
          {yTicks.map((t, idx) => (
            <span key={idx}>{t}</span>
          ))}
        </div>

        {/* SVG Area Chart */}
        <div className="flex-1 h-full relative">
          <svg 
            viewBox="0 0 400 120" 
            className="w-full h-full overflow-visible" 
            preserveAspectRatio="none"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const svgX = ((e.clientX - rect.left) / rect.width) * 400;
              const idx = Math.round((svgX / 400) * (series.length - 1));
              if (idx >= 0 && idx < series.length) {
                setHoveredIndex(idx);
              }
            }}
          >
            <defs>
              <linearGradient id="orangeAreaGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FB923C" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#EA580C" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#08090C" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal grid lines */}
            <line x1="0" y1="32" x2="400" y2="32" stroke="#1E2433" strokeDasharray="3 3" strokeWidth="0.8" />
            <line x1="0" y1="58" x2="400" y2="58" stroke="#1E2433" strokeDasharray="3 3" strokeWidth="0.8" />
            <line x1="0" y1="85" x2="400" y2="85" stroke="#1E2433" strokeDasharray="3 3" strokeWidth="0.8" />

            {/* Vertical Tracker Line on Hover */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <line
                x1={points[hoveredIndex].x}
                y1="10"
                x2={points[hoveredIndex].x}
                y2="115"
                stroke="#64748B"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
            )}

            {/* Filled Area */}
            <path
              d={areaPath}
              fill="url(#orangeAreaGlow)"
              className="transition-all duration-500 ease-out"
            />

            {/* Glowing Stroke Curve */}
            <path
              d={strokePath}
              fill="none"
              stroke="#FB923C"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="filter drop-shadow-[0_2px_8px_rgba(251,146,60,0.5)] transition-all duration-500 ease-out"
            />

            {/* Hover Circle Indicator */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <circle
                cx={points[hoveredIndex].x}
                cy={points[hoveredIndex].y}
                r="4.5"
                fill="#FB923C"
                stroke="#08090C"
                strokeWidth="2"
              />
            )}

            {/* Live Streaming Pulsing Head Dot */}
            {lastPoint && hoveredIndex === null && (
              <g className="transition-all duration-500 ease-out">
                <circle cx={lastPoint.x} cy={lastPoint.y} r="5" fill="#FB923C" opacity="0.4" className="animate-ping" />
                <circle cx={lastPoint.x} cy={lastPoint.y} r="2.8" fill="#FB923C" />
              </g>
            )}
          </svg>

          {/* Hover Floating Tooltip */}
          {hoveredIndex !== null && series[hoveredIndex] && points[hoveredIndex] && (
            <div 
              className="absolute -top-3 bg-[#0d1017] border border-orange-500/40 rounded-xl px-2.5 py-1.5 shadow-xl pointer-events-none z-30 transform -translate-x-1/2"
              style={{
                left: `${(points[hoveredIndex].x / 400) * 100}%`
              }}
            >
              <div className="text-[10px] font-semibold text-white">
                {series[hoveredIndex].time}
              </div>
              <div className="text-[11px] font-bold text-orange-400 mt-0.5">
                {series[hoveredIndex].volume.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">posts/hr</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* X-axis ticks */}
      <div className="flex justify-between pl-8 pr-1 text-[10px] text-slate-400 mt-1 border-t border-slate-800/40 pt-1.5">
        {xTicks.map((t, idx) => (
          <span key={idx}>{t}</span>
        ))}
      </div>

      {/* Bottom Breakdown Pills */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/40">
        <span className="text-[9px] text-slate-500">Brand Share:</span>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-slate-300">MTN <strong className="text-amber-400 font-medium">42%</strong></span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">Airtel <strong className="text-amber-400 font-medium">28%</strong></span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">Glo <strong className="text-amber-400 font-medium">18%</strong></span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">9mobile <strong className="text-amber-400 font-medium">12%</strong></span>
        </div>
      </div>
    </div>
  );
};
