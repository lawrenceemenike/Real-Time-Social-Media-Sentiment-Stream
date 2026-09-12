'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PipelineHealthDAG } from '@/components/PipelineHealthDAG';
import { FooterStatusBar } from '@/components/FooterStatusBar';

export default function PipelinePage() {
  return (
    <div className="flex h-screen bg-[#08090C] text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <PipelineHealthDAG />
        </main>
        <FooterStatusBar />
      </div>
    </div>
  );
}
