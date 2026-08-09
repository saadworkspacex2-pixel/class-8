"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export interface RankListStudent {
  studentId: number;
  name: string;
  rollNumber: number;
  profilePicture?: string;
  totalObtained?: number;
  maxPossibleTotal?: number;
  gpa?: number;
  rank?: number | null;
  level?: number;
  trend?: { type: "up" | "down"; amount: number };
  section?: string;
  overallPass?: boolean;
  [key: string]: any;
}

interface LeaderboardRankListProps {
  students: any[];
  activeStudentId?: number;
  onSelectStudent?: (student: any) => void;
  title?: string;
  searchPlaceholder?: string;
  /** Max number of students to display. 0 or undefined = show all */
  limit?: number;
  /** If set, renders a "Show More" button that links to this href */
  showMoreHref?: string;
}

export default function LeaderboardRankList({
  students,
  activeStudentId,
  onSelectStudent,
  title = "Rankings",
  searchPlaceholder = "Search student...",
  limit,
  showMoreHref,
}: LeaderboardRankListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = searchQuery.trim()
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.rollNumber.toString().includes(searchQuery)
      )
    : students;

  // Apply limit only when there's no active search
  const displayList = limit && limit > 0 && !searchQuery.trim()
    ? filtered.slice(0, limit)
    : filtered;

  const hasMore = limit && limit > 0 && !searchQuery.trim() && filtered.length > limit;

  // Deterministic generator for trends if not provided
  const getTrend = (s: RankListStudent, idx: number) => {
    if (s.trend) return s.trend;
    const r = s.rank ?? (idx + 1);
    const diff = s.rollNumber - r;
    if (diff > 0) return { type: "up" as const, amount: Math.min(diff + (idx % 3), 9) || 1 };
    if (diff < 0) return { type: "down" as const, amount: Math.min(Math.abs(diff) + (idx % 2), 6) || 1 };
    return idx % 2 === 0
      ? { type: "up" as const, amount: (idx % 4) + 1 }
      : { type: "down" as const, amount: (idx % 3) + 1 };
  };

  return (
    <div className="w-full liquid-glass-strong rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl relative">
      {/* Sheen Overlay */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

      {/* Top Header Bar with Search */}
      <div className="px-6 py-4 border-b border-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">{title}</h3>
          <span className="px-3 py-0.5 rounded-full text-xs font-black bg-white/70 text-slate-700 shadow-sm border border-white/60">
            {filtered.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full bg-white/60 border border-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/90 backdrop-blur-md transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Student List */}
      <div className="divide-y divide-slate-100/70 p-2 sm:p-3 space-y-1.5">
        {displayList.map((s, idx) => {
          const rankNum = s.rank || idx + 1;
          const isActive = activeStudentId ? s.studentId === activeStudentId : rankNum === 1;
          const trend = getTrend(s, idx);
          const totalMarks = s.totalObtained ?? 0;
          const gpaVal = s.gpa ?? 0;

          return (
            <motion.div
              key={s.studentId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onSelectStudent?.(s)}
              className={`flex items-center justify-between px-4 py-3.5 rounded-2xl md:rounded-3xl transition-all cursor-pointer group ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500/15 via-blue-500/10 to-purple-500/10 border-t border-l border-white/70 border-r border-b border-white/30 shadow-md backdrop-blur-md"
                  : "hover:bg-white/40 border border-transparent hover:border-white/40"
              }`}
            >
              {/* Left Side: Rank Capsule + Avatar + Info */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {/* Rank Pill (Liquid Glass Capsule) */}
                <div className="w-10 sm:w-12 h-9 sm:h-10 rounded-full bg-white/80 border border-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,1)] flex items-center justify-center shrink-0">
                  <span className="text-xs sm:text-sm font-black text-slate-800">{rankNum}</span>
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                  {s.profilePicture ? (
                    <img src={s.profilePicture} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm sm:text-base">
                      {s.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Name & Roll + (Total | GPA) */}
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {s.name}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                    Roll {s.rollNumber} <span className="text-slate-300 mx-0.5">·</span> <span className="text-slate-500">(Total: {totalMarks} | GPA: {gpaVal.toFixed(2)})</span>
                  </p>
                </div>
              </div>

              {/* Right Side: Trend Indicator */}
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {trend.type === "up" ? (
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold text-xs sm:text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                    <span>{trend.amount} from last month</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-rose-500 font-semibold text-xs sm:text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="7" x2="17" y2="17" />
                      <polyline points="17 7 17 17 7 17" />
                    </svg>
                    <span>{trend.amount} from last month</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">No matching students found</div>
        )}
      </div>

      {/* Show More Button */}
      {hasMore && showMoreHref && (
        <div className="px-6 py-4 border-t border-white/30 flex justify-center bg-white/20 backdrop-blur-sm">
          <Link
            href={showMoreHref}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <span>Show More</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
