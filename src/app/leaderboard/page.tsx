"use client";

import { useState, useEffect } from "react";
import { GRADE_COLORS } from "@/lib/constants";
import { motion } from "framer-motion";
import Leaderboard3DPodium from "@/components/Leaderboard3DPodium";
import LeaderboardRankList from "@/components/LeaderboardRankList";
import Link from "next/link";

interface SubjectResult {
  subject: string;
  cq: number;
  mcq: number;
  total: number;
  maxTotal: number;
  grade: string;
  pass: boolean;
}

interface StudentResult {
  studentId: number;
  name: string;
  rollNumber: number;
  profilePicture: string;
  totalObtained: number;
  maxPossibleTotal: number;
  average: number;
  overallGrade: string;
  overallPass: boolean;
  rank: number | null;
  cqRank: number | null;
  mcqRank: number | null;
  totalCq: number;
  totalMcq: number;
  subjects: SubjectResult[];
  subjectRanks: Record<string, number | null>;
  gpa: number;
  hasMarks: boolean;
}

export default function LeaderboardPage() {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [examType, setExamType] = useState("Half Yearly");
  const [detailStudent, setDetailStudent] = useState<StudentResult | null>(null);

  useEffect(() => {
    // Fetch settings first to get the default exam type
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const savedExam = (d as any).publicDashboardExamType || "Half Yearly";
        setExamType(savedExam);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!examType) return;
    setLoading(true);
    fetch(`/api/results?examType=${encodeURIComponent(examType)}`)
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [examType]);

  const ranked = results
    .filter((r) => r.hasMarks)
    .sort((a, b) => {
      if (b.gpa !== a.gpa) return b.gpa - a.gpa;
      return b.totalObtained - a.totalObtained;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        {/* Back Button & Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-full liquid-glass-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:bg-white/60 transition-all shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              Full Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Complete rankings of all students — {examType}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Top 3 Crown Podium */}
            {ranked.length >= 3 && (
              <Leaderboard3DPodium top3={ranked.slice(0, 3)} onSelectStudent={setDetailStudent} />
            )}

            {/* Full Rank List — no limit */}
            <LeaderboardRankList
              students={ranked}
              onSelectStudent={setDetailStudent}
              title="All Rankings"
              searchPlaceholder="Search by name or roll..."
            />
          </>
        )}
      </div>

      {/* Student Result Card Modal */}
      {detailStudent && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setDetailStudent(null)}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setDetailStudent(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="text-center mb-5">
              {detailStudent.profilePicture ? (
                <img src={detailStudent.profilePicture} alt={detailStudent.name} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 shadow-xl ring-4 ring-indigo-100" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3 shadow-xl">{detailStudent.name.charAt(0)}</div>
              )}
              <h2 className="text-xl font-bold text-slate-800">{detailStudent.name}</h2>
              <p className="text-sm text-slate-500">Roll {detailStudent.rollNumber} · Rank #{detailStudent.rank || "—"} · GPA {detailStudent.gpa.toFixed(2)}</p>
              <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold ${detailStudent.overallPass ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{detailStudent.overallPass ? "PASS" : "FAIL"}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[{l:"Total",v:`${detailStudent.totalObtained}/${detailStudent.maxPossibleTotal}`},{l:"Avg",v:`${detailStudent.average}%`},{l:"Grade",v:detailStudent.overallGrade},{l:"GPA",v:detailStudent.gpa.toFixed(2)}].map(s=>(
                <div key={s.l} className="bg-slate-50 rounded-xl p-2 text-center"><p className="text-[9px] text-slate-400">{s.l}</p><p className="text-sm font-bold text-slate-800">{s.v}</p></div>
              ))}
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Subject Marks</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 mb-4">
              <table className="w-full text-xs"><thead><tr className="bg-slate-50"><th className="px-3 py-2 text-left font-semibold text-slate-500">Subject</th><th className="px-3 py-2 text-center font-semibold text-slate-500">Total</th><th className="px-3 py-2 text-center font-semibold text-slate-500">Grade</th><th className="px-3 py-2 text-center font-semibold text-slate-500">GP</th></tr></thead>
              <tbody>{detailStudent.subjects.filter(x => x.total > 0).map(sub => (
                <tr key={sub.subject} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-3 py-2 font-medium">{sub.subject}</td><td className="px-3 py-2 text-center font-bold">{sub.total}/{sub.maxTotal}</td><td className="px-3 py-2 text-center font-bold" style={{color:GRADE_COLORS[sub.grade]||"#6B7280"}}>{sub.grade}</td><td className="px-3 py-2 text-center">—</td></tr>
              ))}</tbody></table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
