'use client';

import React from 'react';

export const HeroGlobe: React.FC = () => {
  return (
    <div className="absolute inset-x-0 top-0 h-[480px] pointer-events-none overflow-hidden select-none z-0">
      {/* Radiant dark night Earth orbital image */}
      <img
        src="/earth-globe.jpg"
        alt="Orbital Earth Stream"
        className="w-full h-full object-cover object-top opacity-55 mix-blend-screen scale-105 transition duration-1000"
      />
      {/* Top & Bottom dark fade gradients for seamless integration into obsidian background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#08090C]/80 via-transparent to-[#08090C]" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#08090C]/40 to-[#08090C]" />
    </div>
  );
};
