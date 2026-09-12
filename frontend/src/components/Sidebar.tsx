'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Activity, 
  BarChart3, 
  Bell, 
  Database, 
  Users, 
  Settings 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: Activity, label: 'Pipeline DAG', href: '/pipeline' },
    { icon: BarChart3, label: 'Analytics', href: '/' },
    { icon: Bell, label: 'Alerts', href: '/' },
    { icon: Database, label: 'Storage', href: '/' },
    { icon: Users, label: 'Team', href: '/' },
  ];

  return (
    <aside className="w-16 bg-[#0B0D13] border-r border-slate-800/60 flex flex-col items-center py-5 shrink-0 z-30 justify-between">
      <div className="flex flex-col items-center gap-6 w-full">
        {/* ci Logo Badge */}
        <Link 
          href="/" 
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 shadow-lg shadow-orange-500/20 font-black text-white text-base tracking-tight hover:scale-105 transition"
        >
          ci
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-3 w-full px-2 mt-2">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = pathname === item.href && (item.href === '/pipeline' ? pathname === '/pipeline' : pathname === '/');
            return (
              <Link
                key={idx}
                href={item.href}
                title={item.label}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  isActive
                    ? 'bg-slate-800/90 text-white shadow-inner border border-slate-700/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Settings at bottom */}
      <button 
        title="Settings"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/40 transition"
      >
        <Settings className="h-4 w-4" />
      </button>
    </aside>
  );
};
