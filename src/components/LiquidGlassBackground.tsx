"use client";

import { useEffect, useState } from "react";

export default function LiquidGlassBackground() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20 bg-[#0b1329]">
      {/* Dynamic Base Gradient */}
      <div 
        className="absolute inset-0 opacity-80 transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.95) 70%)`
        }}
      />

      {/* Floating Animated Fluid Blob 1 - Royal Blue / Teal */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] rounded-full bg-gradient-to-tr from-blue-600/35 via-cyan-500/25 to-teal-400/20 blur-[130px] animate-liquid-blob-1" />

      {/* Floating Animated Fluid Blob 2 - Violet / Magenta / Amber */}
      <div className="absolute bottom-[-15%] right-[-10%] w-[650px] sm:w-[850px] h-[650px] sm:h-[850px] rounded-full bg-gradient-to-bl from-purple-600/30 via-indigo-500/25 to-pink-500/20 blur-[140px] animate-liquid-blob-2" />

      {/* Floating Animated Fluid Blob 3 - Emerald / Gold Highlight */}
      <div className="absolute top-[35%] left-[25%] w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full bg-gradient-to-r from-emerald-500/25 via-amber-500/15 to-teal-500/20 blur-[120px] animate-liquid-blob-3" />

      {/* Subtle Dynamic Cursor Spotlight Glow */}
      <div 
        className="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-r from-indigo-500/15 to-cyan-400/15 blur-[100px] transition-transform duration-700 ease-out -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`
        }}
      />

      {/* Subtle Noise Texture Grain for Realistic Depth */}
      <div 
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
