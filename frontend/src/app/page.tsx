'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { HeroGlobe } from '@/components/HeroGlobe';
import { MetricCards } from '@/components/MetricCards';
import { SentimentTrendChart } from '@/components/SentimentTrendChart';
import { MentionsOverTimeChart } from '@/components/MentionsOverTimeChart';
import { TopTopics } from '@/components/TopTopics';
import { TopEntitiesTable } from '@/components/TopEntitiesTable';
import { AnomalyAlerts } from '@/components/AnomalyAlerts';
import { ShareOfVoiceChart } from '@/components/ShareOfVoiceChart';
import { FooterStatusBar } from '@/components/FooterStatusBar';
import { fetchSummary } from '@/services/api';
import { realtimeService } from '@/services/websocket';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [mentions, setMentions] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [shareOfVoice, setShareOfVoice] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any>(null);
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchSummary().then(setMetrics).catch(() => {});

    // Subscribe to 1Hz throttled WebSocket / SSE streaming (Directive 3)
    const unsubscribe = realtimeService.subscribe((data) => {
      if (data?.summary) setMetrics(data.summary);
      if (data?.trend) setTrend(data.trend);
      if (data?.mentions) setMentions(data.mentions);
      if (data?.topics) setTopics(data.topics);
      if (data?.entities) setEntities(data.entities);
      if (data?.alerts) setAlerts(data.alerts);
      if (data?.shareOfVoice) setShareOfVoice(data.shareOfVoice);
      if (data?.pipeline) setPipeline(data.pipeline);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex h-screen bg-[#08090C] text-slate-100 overflow-hidden font-sans">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Orbital Night Earth Hero Background */}
        <HeroGlobe />

        {/* Executive Header with Hero Query and Replay Toggle (Directive 4) */}
        <Header onReplayToggle={setIsReplaying} />

        {/* Scrollable Dashboard Grid */}
        <main className="flex-1 overflow-y-auto px-8 py-5 flex flex-col gap-5 custom-scrollbar relative z-10">
          {/* Row 1: Top KPI Cards (4 Cards) */}
          <MetricCards metrics={metrics} />

          {/* Row 2: Analytical Trends (Sentiment 7d, Mentions 24h, Top Topics 7d) (3 Cards) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SentimentTrendChart data={trend} />
            <MentionsOverTimeChart data={mentions} />
            <TopTopics topics={topics} />
          </div>

          {/* Row 3: Entities & Alerts (Top Entities 7d, Anomaly Alerts 24h, Share of Voice 7d) (3 Cards) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TopEntitiesTable entities={entities} />
            <AnomalyAlerts alerts={alerts} />
            <ShareOfVoiceChart data={shareOfVoice} />
          </div>
        </main>

        {/* Bottom Status Bar */}
        <FooterStatusBar 
          sourceName={isReplaying ? '⏪ Historical Replay (10x)' : 'Bluesky Jetstream'}
          streamLag={isReplaying ? '0.2s' : `${((pipeline?.watermark_skew_ms ?? 120) / 1000).toFixed(1)}s`}
        />
      </div>
    </div>
  );
}
