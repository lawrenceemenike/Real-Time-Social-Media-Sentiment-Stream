'use client';

import React from 'react';
import { MessageSquare, Smile, Frown, Users, ArrowUp, ArrowDown } from 'lucide-react';

interface MetricCardsProps {
  metrics?: {
    total_mentions?: number;
    total_mentions_change_pct?: number;
    overall_sentiment_pct?: number;
    overall_sentiment_change_pct?: number;
    negative_mentions?: number;
    negative_mentions_change_pct?: number;
    engagement_formatted?: string;
    engagement_change_pct?: number;
    sentiment_ring?: {
      positive?: number;
      neutral?: number;
      negative?: number;
    };
    minute_bars?: {
      orange?: number[];
      red?: number[];
      gold?: number[];
    };
  };
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  const total = metrics?.total_mentions ? metrics.total_mentions.toLocaleString() : '128,430';
  const totalChange = metrics?.total_mentions_change_pct ?? 18.7;
  const sentiment = metrics?.overall_sentiment_pct ?? 28;
  const sentimentChange = metrics?.overall_sentiment_change_pct ?? 6;
  const negative = metrics?.negative_mentions ? metrics.negative_mentions.toLocaleString() : '31,642';
  const negativeChange = metrics?.negative_mentions_change_pct ?? -9.4;
  const engagement = metrics?.engagement_formatted ?? '2.45M';
  const engagementChange = metrics?.engagement_change_pct ?? 22.1;

  // Mini histogram heights (12 bars)
  const orangeBars = metrics?.minute_bars?.orange ?? [35, 50, 42, 68, 85, 60, 95, 80, 55, 75, 60, 45];
  const redBars = metrics?.minute_bars?.red ?? [40, 65, 55, 75, 90, 70, 85, 60, 70, 50, 45, 35];
  const goldBars = metrics?.minute_bars?.gold ?? [30, 45, 60, 75, 80, 95, 85, 70, 90, 80, 65, 50];

  const ringPos = metrics?.sentiment_ring?.positive ?? 48;
  const ringNeu = metrics?.sentiment_ring?.neutral ?? 29;
  const ringNeg = metrics?.sentiment_ring?.negative ?? 23;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Mentions */}
      <div className="bg-[#12151D] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-lg hover:border-slate-700/80 transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-300">Total Mentions</span>
          </div>
          <span className="text-[10px] text-slate-400">Last 24h</span>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">{total}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium mt-1">
              <ArrowUp className="h-3 w-3" />
              <span>{Math.abs(totalChange)}% vs yesterday</span>
            </div>
          </div>

          {/* Mini Orange Bar Histogram */}
          <div className="flex items-end gap-1 h-10 w-24 pb-1">
            {orangeBars.map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 bg-gradient-to-t from-orange-600 to-amber-500 rounded-xs opacity-90 hover:opacity-100 transition"
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2. Overall Sentiment */}
      <div className="bg-[#12151D] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-lg hover:border-slate-700/80 transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Smile className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-300">Overall Sentiment</span>
          </div>
          <span className="text-[10px] text-slate-400">Last 24h</span>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">+{sentiment}%</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium mt-1">
              <ArrowUp className="h-3 w-3" />
              <span>{sentimentChange}% vs yesterday</span>
            </div>
          </div>

          {/* Multi-Colored Donut Ring SVG */}
          <div className="relative h-12 w-12 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              {/* Background circle */}
              <path
                className="text-slate-800"
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Positive segment (Green) */}
              <path
                className="text-emerald-500"
                strokeDasharray={`${ringPos}, 100`}
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Neutral segment (Yellow) */}
              <path
                className="text-amber-500"
                strokeDasharray={`${ringNeu}, 100`}
                strokeDashoffset={`-${ringPos}`}
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Negative segment (Red) */}
              <path
                className="text-rose-500"
                strokeDasharray={`${ringNeg}, 100`}
                strokeDashoffset={`-${ringPos + ringNeu}`}
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Negative Mentions */}
      <div className="bg-[#12151D] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-lg hover:border-slate-700/80 transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
              <Frown className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-300">Negative Mentions</span>
          </div>
          <span className="text-[10px] text-slate-400">Last 24h</span>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">{negative}</div>
            <div className="flex items-center gap-1 text-[11px] text-rose-400 font-medium mt-1">
              <ArrowDown className="h-3 w-3" />
              <span>{Math.abs(negativeChange)}% vs yesterday</span>
            </div>
          </div>

          {/* Mini Red Bar Histogram */}
          <div className="flex items-end gap-1 h-10 w-24 pb-1">
            {redBars.map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 bg-gradient-to-t from-rose-700 to-rose-500 rounded-xs opacity-90 hover:opacity-100 transition"
              />
            ))}
          </div>
        </div>
      </div>

      {/* 4. Engagement */}
      <div className="bg-[#12151D] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-lg hover:border-slate-700/80 transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-300">Engagement</span>
          </div>
          <span className="text-[10px] text-slate-400">Last 24h</span>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">{engagement}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium mt-1">
              <ArrowUp className="h-3 w-3" />
              <span>{engagementChange}% vs yesterday</span>
            </div>
          </div>

          {/* Mini Gold Bar Histogram */}
          <div className="flex items-end gap-1 h-10 w-24 pb-1">
            {goldBars.map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 bg-gradient-to-t from-amber-600 to-yellow-400 rounded-xs opacity-90 hover:opacity-100 transition"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
