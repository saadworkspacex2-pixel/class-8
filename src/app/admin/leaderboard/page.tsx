"use client";

import { useState, useEffect } from "react";
import { EXAM_TYPES, SUBJECTS, GRADE_COLORS } from "@/lib/constants";

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
  subjects: Array<{
    subject: string; cq: number; mcq: number; total: number; maxTotal: number; grade: string; pass: boolean;
  }>;
  subjectRanks: Record<string, number | null>;
  hasMarks: boolean;
}

type TabType = "overall" | "cq" | "mcq" | "subject";

export default function LeaderboardPage() {
  const [examType, setExamType] = useState<string>(EXAM_TYPES[0]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("overall");
  const [selectedSubject, setSelectedSubject] = useState<string>(SUBJECTS[0]);
  const [maxTotal, setMaxTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/results?examType=${encodeURIComponent(examType)}`)
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results || []);
        setMaxTotal(d.stats?.maxPossibleTotal || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [examType]);

  const sorted = results.filter((r) => r.hasMarks).sort((a, b) => {
    if (tab === "cq") return b.totalCq - a.totalCq;
    if (tab === "mcq") return b.totalMcq - a.totalMcq;
    if (tab === "subject") {
      const aT = a.subjects.find((s) => s.subject === selectedSubject)?.total ?? 0;
      const bT = b.subjects.find((s) => s.subject === selectedSubject)?.total ?? 0;
      return bT - aT;
    }
    return b.totalObtained - a.totalObtained;
  });

  const handleExport = () => {
    const header = "Rank,Roll,Name,Total,Average,Grade";
    const rows = sorted.map((s, i) => `${i + 1},${s.rollNumber},${s.name},${s.totalObtained},${s.average}%,${s.overallGrade}`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leaderboard-${examType}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Leaderboard</h1>
          <p className="text-sm text-muted">Rankings and performance analysis</p>
        </div>
        <button onClick={handleExport} className="px-5 py-2.5 rounded-2xl text-sm font-semibold liquid-glass-sm text-charcoal hover:bg-white/60 transition-all flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAM_TYPES.map((exam) => (
          <button key={exam} onClick={() => setExamType(exam)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${examType === exam ? "gradient-royal text-white shadow-lg shadow-royal/25" : "liquid-glass-sm text-muted hover:text-charcoal"}`}
          >{exam}</button>
        ))}
      </div>

      <div className="liquid-glass rounded-2xl p-2 flex flex-wrap gap-1">
        {(["overall", "cq", "mcq", "subject"] as TabType[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold capitalize transition-all ${tab === t ? "gradient-royal text-white" : "text-muted hover:text-charcoal"}`}
          >{t === "subject" ? "By Subject" : t.toUpperCase()}</button>
        ))}
        {tab === "subject" && (
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
            className="ml-auto px-3 py-2 rounded-2xl text-sm bg-white/40 border border-white/40 backdrop-blur-sm">
            {SUBJECTS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        )}
      </div>

      <div className="liquid-glass-strong rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(8)].map((_, i) => (<div key={i} className="h-14 rounded-xl skeleton" />))}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4">Rank</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4">Student</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4 hidden md:table-cell">Roll</th>
                  <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4">
                    {tab === "cq" ? "CQ Total" : tab === "mcq" ? "MCQ Total" : tab === "subject" ? selectedSubject : "Total"}
                  </th>
                  <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4 hidden sm:table-cell">Average</th>
                  <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4">Grade</th>
                  <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  const getVal = () => {
                    if (tab === "cq") return s.totalCq;
                    if (tab === "mcq") return s.totalMcq;
                    if (tab === "subject") return s.subjects.find((x) => x.subject === selectedSubject)?.total ?? 0;
                    return s.totalObtained;
                  };
                  const getRank = () => {
                    if (tab === "cq") return s.cqRank;
                    if (tab === "mcq") return s.mcqRank;
                    if (tab === "subject") return s.subjectRanks[selectedSubject];
                    return s.rank;
                  };
                  return (
                    <tr key={s.studentId} className="border-b border-white/10 hover:bg-white/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold ${
                          getRank() === 1 ? "bg-amber/15 text-amber" : getRank() === 2 ? "bg-gray-500/10 text-gray-500" : getRank() === 3 ? "bg-orange-500/15 text-orange-600" : "text-muted"
                        }`}>{getRank() || i + 1}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {s.profilePicture ? (
                            <img src={s.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/50" />
                          ) : (
                            <div className="w-8 h-8 rounded-full gradient-royal flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/50">{s.name.charAt(0)}</div>
                          )}
                          <span className="text-sm font-semibold text-charcoal">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted hidden md:table-cell">{s.rollNumber}</td>
                      <td className="py-3 px-4 text-right text-sm font-bold text-charcoal">
                        {getVal()}<span className="text-muted font-normal">/{tab === "subject" ? (s.subjects.find(x => x.subject === selectedSubject)?.maxTotal ?? 0) : maxTotal}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-muted hidden sm:table-cell">{s.average}%</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold" style={{ backgroundColor: `${GRADE_COLORS[s.overallGrade] || "#6B7280"}18`, color: GRADE_COLORS[s.overallGrade] || "#6B7280" }}>{s.overallGrade}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${s.overallPass ? "bg-emerald/10 text-emerald" : "bg-crimson/10 text-crimson"}`}>{s.overallPass ? "PASS" : "FAIL"}</span>
                      </td>
                    </tr>
                  );
                })}
                {sorted.length === 0 && (
                  <tr><td colSpan={7} className="py-16 text-center text-muted text-sm">
                    <div className="w-16 h-16 rounded-3xl bg-amber/10 flex items-center justify-center mx-auto mb-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                    </div>
                    No results available
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
