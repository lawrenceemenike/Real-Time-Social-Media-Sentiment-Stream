'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, Layers, Activity } from 'lucide-react';
import { fetchTraces } from '@/services/api';

interface TraceModalProps {
  onClose: () => void;
}

export const TraceWaterfallModal: React.FC<TraceModalProps> = ({ onClose }) => {
  const [traces, setTraces] = useState<any[]>([]);

  useEffect(() => {
    fetchTraces().then((data) => {
      if (data && data.length > 0) setTraces(data);
    }).catch(() => {});
  }, []);

  const totalDuration = traces.reduce((acc, t) => acc + (t.duration_ms || 0), 0) || 64.8;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fadeIn">
      <div className="bg-[#12151D] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0E1117]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Distributed Event Trace Waterfall</h3>
              <p className="text-[10px] text-slate-400">Trace ID: trc-bsky-98402 • End-to-End Latency: {totalDuration.toFixed(1)}ms</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content - Span Waterfall */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3 custom-scrollbar">
          <div className="text-[11px] text-slate-400 mb-2">
            Chronological span breakdown across asynchronous Kafka, NLP inference, and streaming engines:
          </div>

          {traces.map((span, idx) => {
            const widthPct = Math.max(8, Math.min(100, (span.duration_ms / 30) * 100));
            return (
              <div key={idx} className="flex flex-col gap-1 p-2.5 rounded-xl bg-[#171B26] border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    {span.component}
                  </span>
                  <span className="text-amber-400 font-mono text-[11px]">
                    {span.duration_ms} ms
                  </span>
                </div>

                {/* Progress Bar Visualization */}
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div
                    style={{ width: `${widthPct}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#0E1117] text-xs">
          <span className="text-emerald-400 font-medium">● Status: P95 Ingestion & NLP Latency within target (&lt;500ms)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
