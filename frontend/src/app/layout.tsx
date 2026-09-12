import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ComIntel | Real-Time Social Intelligence Streaming Platform',
  description: 'Executive market intelligence, stream analytics, and anomaly detection.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#08090C] text-slate-100 min-h-screen antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
