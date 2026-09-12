'use client';

import React, { useState, useMemo } from 'react';
import { Info } from 'lucide-react';

interface SentimentTrendChartProps {
  data?: {
    timeframe?: string;
    scope?: string;
    metric_description?: string;
    days?: string[];
    dates?: string[];
    positive?: number[];
    neutral?: number[];
    negative?: number[];
    current_shares?: {
      positive?: number;
      neutral?: number;
      negative?: number;
    };
    entity_trends?: Record<string, {
      name: string;
      scope: string;
      description: string;
      positive: number[];
      neutral: number[];
      negative: number[];
      current_shares: {
        positive: number;
        neutral: number;
        negative: number;
      };
    }>;
  };
}

// Generate dynamic 7 days ending today as fallback
function getDynamicFallbackDays() {
  const days = [];
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return { days, dates };
}

// Cubic Bezier Spline generator for ultra-smooth wave curves
function generateSmoothSvgPath(points: Array<{ x: number; y: number }>, smoothing = 0.2): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  const line = (pointA: { x: number; y: number }, pointB: { x: number; y: number }) => {
    const lengthX = pointB.x - pointA.x;
    const lengthY = pointB.y - pointA.y;
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

export const SentimentTrendChart: React.FC<SentimentTrendChartProps> = ({ data }) => {
  const [selectedEntity, setSelectedEntity] = useState<string>('All');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const fallback = useMemo(() => getDynamicFallbackDays(), []);
  const days = data?.days ?? fallback.days;
  const dates = data?.dates ?? fallback.dates;
  const timeframe = data?.timeframe ?? 'Last 7 days';

  // Get trend series for active entity
  const activeTrend = data?.entity_trends?.[selectedEntity];
  const posValues = activeTrend?.positive ?? data?.positive ?? [48.2, 50.1, 47.4, 48.0, 46.9, 50.8, 43.0];
  const neuValues = activeTrend?.neutral ?? data?.neutral ?? [36.1, 34.8, 36.8, 35.8, 37.1, 36.0, 39.0];
  const negValues = activeTrend?.negative ?? data?.negative ?? [15.7, 15.1, 15.8, 16.2, 16.0, 13.2, 18.0];

  const posShare = activeTrend?.current_shares?.positive ?? data?.current_shares?.positive ?? Math.round(posValues[posValues.length - 1]);
  const neuShare = activeTrend?.current_shares?.neutral ?? data?.current_shares?.neutral ?? Math.round(neuValues[neuValues.length - 1]);
  const negShare = activeTrend?.current_shares?.negative ?? data?.current_shares?.negative ?? Math.round(negValues[negValues.length - 1]);

  const scopeLabel = activeTrend?.scope ?? data?.scope ?? 'Market-Wide (MTN, Airtel, Glo, 9mobile)';

  const { posPath, neuPath, negPath, labels, pointsList } = useMemo(() => {
    // Map percentage to Y in SVG (range ~8% to 65%, y range 110 down to 20)
    const toY = (val: number) => {
      const clamped = Math.max(5, Math.min(65, val));
      return 110 - ((clamped - 5) / 60) * 88;
    };

    const posNominal = toY(posShare);
    const neuNominal = toY(neuShare);
    const negNominal = toY(negShare);

    const sorted = [
      { id: 'pos', share: posShare, color: '#10B981', y: posNominal },
      { id: 'neu', share: neuShare, color: '#F59E0B', y: neuNominal },
      { id: 'neg', share: negShare, color: '#EF4444', y: negNominal },
    ].sort((a, b) => a.y - b.y);

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].y - sorted[i - 1].y < 16) {
        sorted[i].y = sorted[i - 1].y + 16;
      }
    }
    if (sorted[sorted.length - 1].y > 114) {
      const shift = sorted[sorted.length - 1].y - 114;
      sorted.forEach(l => l.y -= shift);
    }
    if (sorted[0].y < 18) {
      const shift = 18 - sorted[0].y;
      sorted.forEach(l => l.y += shift);
    }

    const labelMap = Object.fromEntries(sorted.map(s => [s.id, s]));

    const startX = 15;
    const endX = 335;
    const stepX = (endX - startX) / Math.max(1, days.length - 1);

    const makeLinePoints = (values: number[], endY: number) => {
      const pts = values.slice(0, 7).map((v, i) => ({
        x: startX + i * stepX,
        y: toY(v)
      }));
      pts.push({ x: 360, y: endY });
      return pts;
    };

    const posPts = makeLinePoints(posValues, labelMap['pos'].y);
    const neuPts = makeLinePoints(neuValues, labelMap['neu'].y);
    const negPts = makeLinePoints(negValues, labelMap['neg'].y);

    return {
      posPath: generateSmoothSvgPath(posPts, 0.22),
      neuPath: generateSmoothSvgPath(neuPts, 0.22),
      negPath: generateSmoothSvgPath(negPts, 0.22),
      labels: sorted,
      pointsList: { posPts, neuPts, negPts, stepX, startX }
    };
  }, [days, posValues, neuValues, negValues, posShare, neuShare, negShare]);

  const ENTITY_TABS = [
    { id: 'All', label: 'All Telecoms' },
    { id: 'MTN', label: 'MTN' },
    { id: 'Airtel', label: 'Airtel' },
    { id: 'Glo', label: 'Glo' },
    { id: '9mobile', label: '9mobile' },
  ];

  return (
    <div className="bg-[#12151D] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700/80 transition relative">
      {/* Header with Title & Context Info */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-semibold text-white">Sentiment Trend</h3>
            <div className="relative">
              <button
                onClick={() => setShowInfo(!showInfo)}
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
                className="text-slate-500 hover:text-slate-300 transition"
                title="What sentiment does this measure?"
              >
                <Info className="h-3 w-3" />
              </button>

              {/* Info Popover Tooltip */}
              {showInfo && (
                <div className="absolute left-0 top-5 w-64 bg-[#0c0e14] border border-slate-700 rounded-xl p-3 shadow-2xl z-50 text-[11px] text-slate-300 leading-relaxed pointer-events-none">
                  <div className="font-semibold text-white mb-1">What This Measures:</div>
                  <p>
                    Tracks the daily <strong>percentage share</strong> of Positive, Neutral, and Negative social media posts mentioning Nigerian telecommunications providers in the active watchlist over the last 7 days.
                  </p>
                  <p className="text-amber-400 mt-1.5 font-medium">
                    The latest point reflects live streaming telemetry for today.
                  </p>
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-400">{timeframe}</span>
        </div>

        {/* Scope Context & Brand Selector Tabs */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/40">
          <div className="text-[10px] text-slate-400 truncate max-w-[170px]" title={scopeLabel}>
            Scope: <span className="text-slate-200 font-medium">{selectedEntity === 'All' ? 'Market-Wide' : selectedEntity}</span>
          </div>

          <div className="flex items-center gap-1 bg-[#0d0f15] p-0.5 rounded-lg border border-slate-800">
            {ENTITY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedEntity(tab.id)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition ${
                  selectedEntity === tab.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Wave Lines & Interactive Hover Area */}
      <div 
        className="relative h-36 w-full mt-2 flex items-center"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <svg 
          viewBox="0 0 400 130" 
          className="w-full h-full overflow-visible"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const svgX = ((e.clientX - rect.left) / rect.width) * 400;
            if (svgX >= pointsList.startX - 15 && svgX <= 350) {
              const idx = Math.round((svgX - pointsList.startX) / pointsList.stepX);
              if (idx >= 0 && idx < days.length) {
                setHoveredIndex(idx);
              }
            }
          }}
        >
          {/* Subtle grid lines */}
          <line x1="0" y1="30" x2="360" y2="30" stroke="#1E2433" strokeDasharray="3 3" strokeWidth="0.8" />
          <line x1="0" y1="65" x2="360" y2="65" stroke="#1E2433" strokeDasharray="3 3" strokeWidth="0.8" />
          <line x1="0" y1="100" x2="360" y2="100" stroke="#1E2433" strokeDasharray="3 3" strokeWidth="0.8" />

          {/* Vertical tracker bar on hover */}
          {hoveredIndex !== null && (
            <line
              x1={pointsList.startX + hoveredIndex * pointsList.stepX}
              y1="10"
              x2={pointsList.startX + hoveredIndex * pointsList.stepX}
              y2="120"
              stroke="#475569"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          )}

          {/* Positive Wave (Green) */}
          <path
            d={posPath}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />

          {/* Neutral Wave (Yellow) */}
          <path
            d={neuPath}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />

          {/* Negative Wave (Red) */}
          <path
            d={negPath}
            fill="none"
            stroke="#EF4444"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />

          {/* Hover highlight dots */}
          {hoveredIndex !== null && (
            <g>
              <circle
                cx={pointsList.posPts[hoveredIndex].x}
                cy={pointsList.posPts[hoveredIndex].y}
                r="4"
                fill="#10B981"
                stroke="#08090C"
                strokeWidth="1.5"
              />
              <circle
                cx={pointsList.neuPts[hoveredIndex].x}
                cy={pointsList.neuPts[hoveredIndex].y}
                r="4"
                fill="#F59E0B"
                stroke="#08090C"
                strokeWidth="1.5"
              />
              <circle
                cx={pointsList.negPts[hoveredIndex].x}
                cy={pointsList.negPts[hoveredIndex].y}
                r="4"
                fill="#EF4444"
                stroke="#08090C"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* End-of-line pulse indicators & right percentage labels */}
          {labels.map(l => (
            <g key={l.id} className="transition-all duration-500 ease-out">
              <circle cx="360" cy={l.y} r="2.5" fill={l.color} />
              <text
                x="372"
                y={l.y + 4}
                fill={l.color}
                fontSize="11"
                fontWeight="bold"
                textAnchor="start"
              >
                {l.share}%
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredIndex !== null && (
          <div 
            className="absolute -top-3 bg-[#0d1017] border border-slate-700/80 rounded-xl px-2.5 py-1.5 shadow-xl pointer-events-none z-30 transform -translate-x-1/2"
            style={{
              left: `${((pointsList.startX + hoveredIndex * pointsList.stepX) / 400) * 100}%`
            }}
          >
            <div className="text-[10px] font-semibold text-white flex items-center gap-1">
              <span>{days[hoveredIndex]}</span>
              <span className="text-slate-400 font-normal">({dates[hoveredIndex]})</span>
              {hoveredIndex === days.length - 1 && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded">Today</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[10px]">
              <span className="text-emerald-400 font-medium">+{posValues[hoveredIndex]}%</span>
              <span className="text-amber-400 font-medium">{neuValues[hoveredIndex]}%</span>
              <span className="text-rose-400 font-medium">-{negValues[hoveredIndex]}%</span>
            </div>
          </div>
        )}
      </div>

      {/* X-axis days ending with Today */}
      <div className="flex justify-between px-2 text-[10px] text-slate-400 mt-1 border-t border-slate-800/40 pt-2">
        {days.map((day, idx) => {
          const isToday = idx === days.length - 1;
          return (
            <div key={idx} className="flex flex-col items-center">
              <span className={isToday ? 'text-amber-400 font-bold flex items-center gap-0.5' : ''}>
                {day}
                {isToday && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block ml-0.5" title="Today" />}
              </span>
              <span className="text-[9px] text-slate-500">{dates[idx]}</span>
            </div>
          );
        })}
        <span className="w-8"></span> {/* Spacing for right percentage labels */}
      </div>

      {/* Bottom Legend */}
      <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Positive Share</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-slate-300">Neutral Share</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-slate-300">Negative Share</span>
          </div>
        </div>
        <span className="text-[9px] text-slate-500">Live 1Hz Telemetry</span>
      </div>
    </div>
  );
};
