"use client";

import { motion } from "framer-motion";

export interface PodiumStudent {
  studentId: number;
  name: string;
  rollNumber: number;
  profilePicture?: string;
  totalObtained?: number;
  maxPossibleTotal?: number;
  gpa?: number;
  rank?: number | null;
  level?: number;
  points?: number;
  trend?: { type: "up" | "down"; amount: number };
  [key: string]: any;
}

interface Leaderboard3DPodiumProps {
  top3: any[];
  onSelectStudent?: (student: any) => void;
}

/* ───── Crown SVGs ───── */
function GoldCrown() {
  return (
    <svg width="84" height="64" viewBox="0 0 100 80" fill="none" className="drop-shadow-[0_10px_15px_rgba(245,158,11,0.5)] animate-bounce-slow">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF59D" />
          <stop offset="30%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="gemPink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#9F1239" />
        </linearGradient>
        <filter id="glowGold">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {/* Base Crown Shape */}
      <path d="M12 65 L20 28 L40 46 L50 18 L60 46 L80 28 L88 65 Z" fill="url(#goldGrad)" stroke="#78350F" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Crown Base Rim */}
      <path d="M10 65 Q50 72 90 65 L90 73 Q50 80 10 73 Z" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
      {/* Spheres on peaks */}
      <circle cx="20" cy="28" r="4.5" fill="#FFF59D" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="50" cy="18" r="6" fill="#FFF59D" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="80" cy="28" r="4.5" fill="#FFF59D" stroke="#B45309" strokeWidth="1.5" />
      {/* Center Gem (Pink Diamond) */}
      <polygon points="50,34 58,46 50,58 42,46" fill="url(#gemPink)" stroke="#FFF" strokeWidth="1.5" filter="url(#glowGold)" />
      {/* Side Small Gems */}
      <circle cx="30" cy="54" r="3" fill="#10B981" />
      <circle cx="70" cy="54" r="3" fill="#10B981" />
    </svg>
  );
}

function SilverCrown() {
  return (
    <svg width="70" height="54" viewBox="0 0 100 80" fill="none" className="drop-shadow-[0_8px_12px_rgba(148,163,184,0.4)]">
      <defs>
        <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#CBD5E1" />
          <stop offset="80%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="gemEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <path d="M14 65 L22 32 L40 48 L50 22 L60 48 L78 32 L86 65 Z" fill="url(#silverGrad)" stroke="#334155" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M12 65 Q50 71 88 65 L88 72 Q50 78 12 72 Z" fill="#475569" stroke="#334155" strokeWidth="1.5" />
      <circle cx="22" cy="32" r="4" fill="#FFF" stroke="#475569" strokeWidth="1.5" />
      <circle cx="50" cy="22" r="5" fill="#FFF" stroke="#475569" strokeWidth="1.5" />
      <circle cx="78" cy="32" r="4" fill="#FFF" stroke="#475569" strokeWidth="1.5" />
      <polygon points="50,36 57,47 50,57 43,47" fill="url(#gemEmerald)" stroke="#FFF" strokeWidth="1.2" />
    </svg>
  );
}

function BronzeCrown() {
  return (
    <svg width="64" height="48" viewBox="0 0 100 80" fill="none" className="drop-shadow-[0_8px_12px_rgba(234,88,12,0.4)]">
      <defs>
        <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFEDD5" />
          <stop offset="35%" stopColor="#FB923C" />
          <stop offset="75%" stopColor="#C2410C" />
          <stop offset="100%" stopColor="#7C2D12" />
        </linearGradient>
        <linearGradient id="gemAmber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <path d="M14 65 L22 34 L40 50 L50 24 L60 50 L78 34 L86 65 Z" fill="url(#bronzeGrad)" stroke="#431407" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M12 65 Q50 71 88 65 L88 72 Q50 78 12 72 Z" fill="#7C2D12" stroke="#431407" strokeWidth="1.5" />
      <circle cx="22" cy="34" r="3.5" fill="#FFEDD5" stroke="#431407" strokeWidth="1.5" />
      <circle cx="50" cy="24" r="4.5" fill="#FFEDD5" stroke="#431407" strokeWidth="1.5" />
      <circle cx="78" cy="34" r="3.5" fill="#FFEDD5" stroke="#431407" strokeWidth="1.5" />
      <polygon points="50,38 56,48 50,57 44,48" fill="url(#gemAmber)" stroke="#FFF" strokeWidth="1.2" />
    </svg>
  );
}

export default function Leaderboard3DPodium({ top3, onSelectStudent }: Leaderboard3DPodiumProps) {
  // Order for 3D Podium: 2nd Place (Left), 1st Place (Center), 3rd Place (Right)
  const first = top3.find((s) => s.rank === 1) || top3[0];
  const second = top3.find((s) => s.rank === 2) || top3[1];
  const third = top3.find((s) => s.rank === 3) || top3[2];

  const podiumSlots = [
    { student: second, rankLabel: "2nd", crown: <SilverCrown />, heightClass: "h-36 sm:h-44 md:h-52", color: "from-slate-100 to-slate-200", borderColor: "border-slate-300/80", ringColor: "ring-slate-400" },
    { student: first, rankLabel: "1st", crown: <GoldCrown />, heightClass: "h-48 sm:h-56 md:h-64", color: "from-amber-50 to-amber-100", borderColor: "border-amber-300/80", ringColor: "ring-amber-400" },
    { student: third, rankLabel: "3rd", crown: <BronzeCrown />, heightClass: "h-28 sm:h-36 md:h-44", color: "from-orange-50 to-orange-100", borderColor: "border-orange-300/80", ringColor: "ring-orange-400" },
  ];

  return (
    <div className="relative w-full rounded-3xl md:rounded-[2.5rem] liquid-glass-strong p-6 sm:p-8 md:p-12 overflow-hidden shadow-2xl border border-white/60">
      {/* Ambient Radial Rays / Spotlight Backdrop — Light Mode */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Central Cone Beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b from-amber-200/30 via-indigo-200/10 to-transparent blur-3xl rounded-full" />
        {/* Radial Light Rays */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-10"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%), repeating-conic-gradient(from 0deg, rgba(0,0,0,0.03) 0deg 15deg, transparent 15deg 30deg)"
          }}
        />
      </div>

      {/* Top Header */}
      <div className="relative z-10 text-center mb-8 sm:mb-12">
        <span className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-widest text-amber-600 bg-amber-100/80 border border-amber-300/40 uppercase mb-2">
          ✨ Champions Arena
        </span>
        <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">Top Performers</h2>
      </div>

      {/* Podium Grid */}
      <div className="relative z-10 flex flex-row items-end justify-center gap-2 sm:gap-4 md:gap-8 max-w-3xl mx-auto pt-6">
        {podiumSlots.map(({ student, rankLabel, crown, heightClass, color, borderColor, ringColor }, idx) => {
          if (!student) return <div key={idx} className="flex-1" />;

          const totalMarks = student.totalObtained ?? 0;
          const maxMarks = student.maxPossibleTotal ?? 0;
          const gpaVal = student.gpa ?? 0;

          return (
            <motion.div
              key={student.studentId}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15, type: "spring", stiffness: 180, damping: 20 }}
              className="flex flex-col items-center flex-1 max-w-[130px] sm:max-w-[170px] md:max-w-[200px] cursor-pointer group"
              onClick={() => onSelectStudent?.(student)}
            >
              {/* Crown Floating Above */}
              <motion.div 
                animate={{ y: [0, -6, 0] }} 
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: idx * 0.4 }}
                className="mb-1 flex justify-center shrink-0 z-20"
              >
                {crown}
              </motion.div>

              {/* Avatar Box — No pink level badge, no number overlay */}
              <div className="relative mb-2 shrink-0">
                <div className={`w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white ring-4 ${ringColor} shadow-[0_0_25px_rgba(0,0,0,0.08)] flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105`}>
                  {student.profilePicture ? (
                    <img src={student.profilePicture} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl sm:text-3xl font-black text-slate-700">{student.name.charAt(0)}</span>
                  )}
                </div>
              </div>

              {/* Username / Name */}
              <div className="text-center mt-2 mb-1 w-full px-1">
                <p className="text-xs sm:text-base font-extrabold text-slate-800 truncate group-hover:text-amber-600 transition-colors">
                  {student.name}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">Roll {student.rollNumber}</p>
              </div>

              {/* Total Marks & GPA Pill Badges */}
              <div className="mb-3 flex flex-col items-center gap-1">
                <div className="inline-flex items-center gap-1.5 bg-white/80 border border-slate-200/80 rounded-full px-2.5 py-1 shadow-sm">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-600">
                    Total:
                  </span>
                  <span className="text-[10px] sm:text-xs font-black text-slate-800">
                    {totalMarks}{maxMarks > 0 ? `/${maxMarks}` : ''}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200/60 rounded-full px-2.5 py-1 shadow-sm">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-600">
                    GPA:
                  </span>
                  <span className="text-[10px] sm:text-xs font-black text-emerald-700">
                    {gpaVal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 3D Pedestal Block — Light Mode */}
              <div className={`w-full ${heightClass} bg-gradient-to-b ${color} ${borderColor} border-t-2 border-x-2 rounded-t-2xl sm:rounded-t-3xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] relative flex flex-col items-center justify-center overflow-hidden transition-all duration-300 group-hover:brightness-105`}>
                {/* 3D Embossed Front Text */}
                <span className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-300/60 select-none tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                  {rankLabel}
                </span>

                {/* Top Inner Light Highlight */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
