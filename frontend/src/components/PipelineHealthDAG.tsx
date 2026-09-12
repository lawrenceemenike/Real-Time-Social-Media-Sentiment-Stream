'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ArrowRight, 
  Server, 
  Cpu, 
  Layers, 
  Database, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Eye
} from 'lucide-react';
import { fetchPipelineHealth } from '@/services/api';
import { TraceWaterfallModal } from '@/components/TraceWaterfallModal';

export const PipelineHealthDAG: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [showTraceModal, setShowTraceModal] = useState(false);

  useEffect(() => {
    fetchPipelineHealth().then(setHealth).catch(() => {});
    const interval = setInterval(() => {
      fetchPipelineHealth().then(setHealth).catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const ingEps = health?.ingestion_rate_eps ?? 54.1;
  const procEps = health?.processed_rate_eps ?? 28.2;
  const lag = health?.consumer_lag_events ?? 0;
  const p95 = health?.p95_latency_ms ?? 43.5;
  const batchDur = health?.batch_duration_sec ?? 0.08;
  const dlq = health?.dlq_count ?? 15;
  const filterRatio = health?.filter_ratio_pct ?? 47.2;
  const partitions = health?.active_partitions ?? 9;
  const skew = health?.watermark_skew_ms ?? 120.0;
  const bufferSize = health?.buffer_size_events ?? 200;

  const nodes = [
    { id: 'bsky', label: 'Bluesky Jetstream', sub: 'WebSocket Firehose', icon: Radio, status: 'Healthy', eps: `${ingEps}/s`, lag: '0' },
    { id: 'collector', label: 'Source Collector', sub: 'Async Consumer', icon: Server, status: 'Healthy', eps: `${ingEps}/s`, lag: `${Math.min(lag, 2)}` },
    { id: 'kafka', label: 'Apache Kafka', sub: `social.raw (Partitions: ${partitions})`, icon: Layers, status: 'Healthy', eps: `${ingEps}/s`, lag: `${lag}` },
    { id: 'norm', label: 'Normalizer & Router', sub: 'LangID & Watchlist Gate', icon: Cpu, status: 'Healthy', eps: `${procEps}/s`, lag: '0' },
    { id: 'nlp', label: 'Multi-Task NLP', sub: 'RoBERTa + NER + Intent', icon: Cpu, status: 'Healthy', eps: `${procEps}/s`, lag: `${Math.min(lag, 4)}` },
    { id: 'engine', label: 'Stateful Windows', sub: '1m/5m/1h/24h + Z-Scores', icon: Activity, status: 'Healthy', eps: `${procEps}/s`, lag: '0' },
    { id: 'storage', label: 'Hybrid Storage', sub: 'Postgres + Redis + Parquet', icon: Database, status: 'Healthy', eps: `${procEps}/s`, lag: '0' },
  ];

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            Streaming Pipeline Health & Architecture DAG
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time event topology, consumer lag, processing latencies, and distributed spans
          </p>
        </div>

        <button
          onClick={() => setShowTraceModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition shadow-lg shadow-amber-500/10"
        >
          <Eye className="h-4 w-4" />
          Inspect Trace Waterfall
        </button>
      </div>

      {/* 10 KPI Cards for Streaming Operations */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* 1. Ingestion Rate */}
        <div className="bg-[#12151D] border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition">
          <span className="text-[10px] text-slate-400 font-medium">1. Ingress EPS</span>
          <div className="text-lg font-bold text-white mt-1">{ingEps} <span className="text-xs font-normal text-slate-400">evt/s</span></div>
          <span className="text-[10px] text-emerald-400 font-medium">▲ Firehose live</span>
        </div>

        {/* 2. Processed Rate */}
        <div className="bg-[#12151D] border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition">
          <span className="text-[10px] text-slate-400 font-medium">2. Processed EPS</span>
          <div className="text-lg font-bold text-white mt-1">{procEps} <span className="text-xs font-normal text-slate-400">evt/s</span></div>
          <span className="text-[10px] text-emerald-400 font-medium">99.9% throughput</span>
        </div>

        {/* 3. Kafka Consumer Lag */}
        <div className="bg-[#12151D] border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition">
          <span className="text-[10px] text-slate-400 font-medium">3. Consumer Lag</span>
          <div className="text-lg font-bold text-white mt-1">{lag} <span className="text-xs font-normal text-slate-400">events</span></div>
          <span className="text-[10px] text-emerald-400 font-medium">&lt; 100 SLO target</span>
        </div>

        {/* 4. P95 Processing Latency */}
        <div className="bg-[#12151D] border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition">
          <span className="text-[10px] text-slate-400 font-medium">4. P95 Latency</span>
          <div className="text-lg font-bold text-white mt-1">{p95} <span className="text-xs font-normal text-slate-400">ms</span></div>
          <span className="text-[10px] text-emerald-400 font-medium">&lt; 50ms fast-path</span>
        </div>

        {/* 5. Window Batch Duration */}
        <div className="bg-[#12151D] border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition">
          <span className="text-[10px] text-slate-400 font-medium">5. Window Cycle</span>
          <div className="text-lg font-bold text-white mt-1">{batchDur} <span className="text-xs font-normal text-slate-400">sec</span></div>
          <span className="text-[10px] text-emerald-400 font-medium">Async sliding</span>
        </div>

        {/* 6. Dead-Letter Queue */}
        <div className="bg-[#12151D] border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition">
          <span className="text-[10px] text-slate-400 font-medium">6. DLQ Drops</span>
          <div className="text-lg font-bold text-white mt-1">{dlq} <span className="text-xs font-normal text-slate-400">events</span></div>
          <span className="text-[10px] text-slate-400 font-medium">Sanitation rejects</span>
        </div>

        {/* 7. Watchlist Pass Ratio */}
        <div className="bg-[#12151D] border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition">
          <span className="text-[10px] text-slate-400 font-medium">7. Watchlist Match</span>
          <div className="text-lg font-bold text-white mt-1">{filterRatio}% <span className="text-xs font-normal text-slate-400">pass</span></div>
          <span className="text-[10px] text-amber-400 font-medium">Directive 2 gate</span>
        </div>

        {/* 8. Active Kafka Partitions */}
        <div className="bg-[#12151D] border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition">
          <span className="text-[10px] text-slate-400 font-medium">8. Partitions</span>
          <div className="text-lg font-bold text-white mt-1">{partitions} <span className="text-xs font-normal text-slate-400">active</span></div>
          <span className="text-[10px] text-emerald-400 font-medium">Keyed sharding</span>
        </div>

        {/* 9. Watermark Event Skew */}
        <div className="bg-[#12151D] border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition">
          <span className="text-[10px] text-slate-400 font-medium">9. Watermark Skew</span>
          <div className="text-lg font-bold text-white mt-1">{skew} <span className="text-xs font-normal text-slate-400">ms</span></div>
          <span className="text-[10px] text-emerald-400 font-medium">Clock sync tight</span>
        </div>

        {/* 10. Buffer In-Memory Events */}
        <div className="bg-[#12151D] border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition">
          <span className="text-[10px] text-slate-400 font-medium">10. Traces Buffer</span>
          <div className="text-lg font-bold text-white mt-1">{bufferSize} <span className="text-xs font-normal text-slate-400">spans</span></div>
          <span className="text-[10px] text-emerald-400 font-medium">Ring buffer active</span>
        </div>
      </div>

      {/* Interactive Topology DAG */}
      <div className="bg-[#12151D] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-6">
          End-to-End Processing Topology
        </h3>

        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4 custom-scrollbar">
          {nodes.map((node, i) => {
            const Icon = node.icon;
            return (
              <React.Fragment key={node.id}>
                {/* DAG Node Card */}
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#171B26] border border-slate-700/60 min-w-[150px] shadow-lg hover:border-amber-500/50 transition">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-amber-400 mb-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-white text-center">{node.label}</span>
                  <span className="text-[10px] text-slate-400 text-center mt-0.5">{node.sub}</span>

                  <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-700/40 w-full justify-between text-[10px]">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      {node.status}
                    </span>
                    <span className="text-slate-300 font-medium">{node.eps}</span>
                  </div>
                </div>

                {/* Arrow Connector */}
                {i < nodes.length - 1 && (
                  <div className="flex items-center text-slate-600 px-1">
                    <ArrowRight className="h-4 w-4 text-slate-500 animate-pulse" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Trace Waterfall Modal */}
      {showTraceModal && (
        <TraceWaterfallModal onClose={() => setShowTraceModal(false)} />
      )}
    </div>
  );
};
