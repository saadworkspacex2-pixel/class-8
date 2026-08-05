"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { EXAM_TYPES, SUBJECTS, GRADE_COLORS } from "@/lib/constants";

interface SubjectResult { subject: string; cq: number; mcq: number; total: number; maxTotal: number; grade: string; pass: boolean; }
interface GpaSubject { name: string; total: number; maxTotal: number; grade: string; gp: number; pass: boolean; hasMark: boolean; papers: string[]; }
interface StudentResult {
  studentId: number; name: string; rollNumber: number; section: string; profilePicture: string;
  totalObtained: number; maxPossibleTotal: number; average: number; overallGrade: string;
  gpa: number; overallPass: boolean; rank: number | null; cqRank: number | null; mcqRank: number | null;
  totalCq: number; totalMcq: number; subjects: SubjectResult[];
  gpaSubjects?: GpaSubject[];
  gradedSubjectsCount: number; totalSubjects: number; hasMarks: boolean;
}

function denseRank<T extends { gpa?: number; totalObtained?: number }>(arr: T[], gv: (s: T) => number): (T & { rank: number })[] {
  const r: (T & { rank: number })[] = [];
  if (!arr.length) return r;
  let dr = 1;
  for (let i = 0; i < arr.length; i++) {
    if (i > 0) { const a = arr[i - 1], b = arr[i]; if (gv(b) < gv(a)) dr++; else if (gv(b) === gv(a) && (b.totalObtained ?? 0) < (a.totalObtained ?? 0)) dr++; }
    r.push({ ...arr[i], rank: dr });
  }
  return r;
}

export default function LeaderboardPage() {
  const [examType, setExamType] = useState("Half Yearly");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"marks" | "gpa">("marks");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewing, setViewing] = useState<(StudentResult & { rank: number }) | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { setLoading(true); fetch(`/api/results?examType=${encodeURIComponent(examType)}`).then(r => r.json()).then(d => { setResults(d.results || []); setLoading(false); }).catch(() => setLoading(false)); }, [examType]);

  const withMarks = useMemo(() => results.filter(r => r.hasMarks) as StudentResult[], [results]);
  const filtered = useMemo(() => {
    let a = sectionFilter === "all" ? withMarks : withMarks.filter(r => r.section === sectionFilter);
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); a = a.filter(r => r.name.toLowerCase().includes(q) || r.rollNumber.toString().includes(q)); }
    return a;
  }, [withMarks, sectionFilter, searchQuery]);
  const getVal = (s: StudentResult) => tab === "gpa" ? s.gpa : s.totalObtained;
  const sorted = useMemo(() => [...filtered].sort((a, b) => { const d = getVal(b) - getVal(a); return d !== 0 ? d : b.gpa - a.gpa || b.totalObtained - a.totalObtained; }), [filtered, tab]);
  const ranked = useMemo(() => denseRank(sorted, getVal), [sorted]);
  const top3 = ranked.slice(0, 3);
  const restOfStudents = ranked.slice(3);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const handleExport = () => { const rows = ranked.map(s => `${s.rank},${s.rollNumber},${s.section},${s.name},${s.totalObtained},${s.gpa.toFixed(2)},${s.overallGrade},${s.overallPass ? "PASS" : "FAIL"}`); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([["Rank,Roll,Section,Name,Total,GPA,Grade,Status", ...rows].join("\n")], { type: "text/csv" })); a.download = `leaderboard-${examType}.csv`; a.click(); };

  const printRanking = () => { window.print(); };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md px-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/60 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-x-hidden">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          table tr { break-inside: avoid; }
        }
      `}</style>

      {/* Print-Only */}
      <div className="print-only hidden bg-white p-8 text-charcoal">
        <div className="text-center mb-6 border-b-2 border-charcoal pb-4">
          <h1 className="text-2xl font-black">Bir Uttam Shaheed Samad School &amp; College</h1>
          <p className="text-sm text-muted">Rangpur Cantonment, Rangpur</p>
          <h2 className="text-lg font-bold mt-3">{examType} Examination</h2>
          <p className="text-sm">Class VIII · Dahlia (B) · {today}</p>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6 text-center text-xs">
          {[{ l: "Date", v: today }, { l: "Total", v: ranked.length }, { l: "Passed", v: ranked.filter(s => s.overallPass).length }, { l: "Highest", v: ranked[0]?.gpa?.toFixed(2) || "—" }].map(s => (<div key={s.l} className="border rounded-lg p-3"><p className="text-muted font-semibold">{s.l}</p><p className="text-base font-bold">{s.v}</p></div>))}
        </div>
        <table className="w-full border text-xs"><thead><tr className="bg-charcoal text-white"><th className="p-2 text-left">Rank</th><th className="p-2 text-left">Student</th><th className="p-2 text-left">Roll</th><th className="p-2 text-right">Total</th><th className="p-2 text-center">GPA</th><th className="p-2 text-center">Grade</th><th className="p-2 text-center">Status</th></tr></thead>
        <tbody>{ranked.map(s => (<tr key={s.studentId} className="border-b"><td className="p-2 font-bold">#{s.rank}</td><td className="p-2">{s.name}</td><td className="p-2">{s.rollNumber}</td><td className="p-2 text-right font-bold">{s.totalObtained}</td><td className="p-2 text-center">{s.gpa.toFixed(2)}</td><td className="p-2 text-center">{s.overallGrade}</td><td className="p-2 text-center"><span className={s.overallPass ? "text-emerald font-bold" : "text-crimson font-bold"}>{s.overallPass ? "PASS" : "FAIL"}</span></td></tr>))}</tbody></table>
        <div className="grid grid-cols-4 gap-6 mt-10 pt-8 border-t text-xs text-center">
          {["Class Teacher", "Exam Controller", "Principal", "Guardian"].map(t => (<div key={t}><div className="border-b border-charcoal mb-2 pb-6" /><p className="text-muted">{t}</p></div>))}
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-14 space-y-8 md:space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-charcoal">
              <span className="bg-gradient-to-r from-royal to-purple-600 bg-clip-text text-transparent">Leaderboard</span>
            </h1>
            <p className="text-sm text-muted mt-1">{withMarks.length} students · {examType}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="px-4 py-2.5 rounded-2xl text-sm font-semibold bg-white/60 backdrop-blur-sm border border-white/40 text-charcoal hover:bg-white/80 transition-all flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> CSV
            </button>
            <button onClick={printRanking} className="gradient-royal text-white px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-royal/20 hover:shadow-xl transition-all flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Print
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3 no-print">
          <div className="flex flex-wrap gap-2 items-center">
            {EXAM_TYPES.map(e => (<button key={e} onClick={() => setExamType(e)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${examType === e ? "gradient-royal text-white shadow-md" : "bg-white/40 text-muted hover:text-charcoal"}`}>{e}</button>))}
            <span className="w-px h-5 bg-border mx-1 hidden md:block" />
            {(["marks", "gpa"] as const).map(t => (<button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${tab === t ? "gradient-royal text-white shadow-md" : "bg-white/40 text-muted hover:text-charcoal"}`}>{t === "marks" ? "By Marks" : "By GPA"}</button>))}
            <div className="ml-auto flex gap-1">{["all", "shapla", "dahlia"].map(s => (<button key={s} onClick={() => setSectionFilter(s)} className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${sectionFilter === s ? "gradient-royal text-white" : "text-muted hover:text-charcoal"}`}>{s === "all" ? "All" : s === "shapla" ? "🌺 Shapla" : "🌸 Dahlia"}</button>))}</div>
          </div>
          <Link href="/?#leaderboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-royal hover:underline">
            View Full Leaderboard <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
          </Link>
        </div>

        {ranked.length === 0 ? (
          <div className="py-24 text-center text-muted text-sm">No results available. Enter marks first.</div>
        ) : (
          <>
            {/* ═══════ TOP 3 PREMIUM PODIUM ═══════ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white/50 p-6 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.05)] relative overflow-hidden no-print">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber/5 rounded-full blur-[80px] pointer-events-none" />
              <div className="flex items-center gap-3 justify-center mb-8 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></div>
                <h3 className="text-lg md:text-2xl font-extrabold text-charcoal">Top 3 Performers</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 md:gap-6 items-end max-w-xl mx-auto relative z-10">
                {[1, 0, 2].map((idx, col) => {
                  const s = top3[idx]; if (!s) return <div key={`e-${col}`} />;
                  const cfg = [{ h: "h-24 md:h-36", bg: "from-amber-100 to-amber-200", border: "border-amber-300", ring: "#fbbf24", icon: "#f59e0b", label: "1st" }, { h: "h-20 md:h-28", bg: "from-slate-100 to-slate-200", border: "border-slate-300", ring: "#94a3b8", icon: "#64748b", label: "2nd" }, { h: "h-16 md:h-24", bg: "from-orange-100 to-orange-200", border: "border-orange-300", ring: "#fb923c", icon: "#ea580c", label: "3rd" }][idx];
                  return (
                    <motion.div key={s.studentId} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: col * 0.1, type: "spring", stiffness: 200 }}
                      className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setViewing(s)}>
                      <motion.div whileHover={{ scale: 1.1, y: -4 }} className="w-14 h-14 md:w-18 md:h-18 rounded-full bg-white shadow-lg flex items-center justify-center shrink-0" style={{ border: `3px solid ${cfg.ring}` }}>
                        <span className="text-lg md:text-xl font-bold bg-gradient-to-br from-royal to-purple-600 bg-clip-text text-transparent">{s.name.charAt(0)}</span>
                      </motion.div>
                      <p className="text-[11px] md:text-xs font-bold text-charcoal truncate max-w-[80px]">{s.name}</p>
                      <p className="text-[9px] text-muted">R{s.rollNumber}</p>
                      <div className={`${cfg.h} w-full rounded-2xl bg-gradient-to-b ${cfg.bg} border ${cfg.border} flex flex-col items-center justify-center gap-1 shadow-md transition-transform group-hover:scale-[1.02]`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cfg.icon} strokeWidth="1.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                        <span className="text-[9px] md:text-[10px] font-extrabold text-muted">{cfg.label}</span>
                        <span className="text-xs md:text-sm font-extrabold text-charcoal">{s.totalObtained}</span>
                        <span className={`text-[9px] md:text-[10px] font-bold ${s.gpa >= 5 ? "text-emerald" : s.gpa >= 4 ? "text-royal" : "text-amber"}`}>GPA {s.gpa.toFixed(2)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* ═══════ ALL RANKS LIST ═══════ */}
            {restOfStudents.length > 0 && (
              <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl overflow-hidden shadow-sm no-print">
                <div className="px-6 py-4 border-b border-white/30 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-royal/10 flex items-center justify-center text-royal"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></svg></div>
                  <h3 className="text-sm font-bold text-charcoal">All Rankings — {ranked.length} Students</h3>
                </div>
                <div className="space-y-0.5 p-3">
                  {restOfStudents.map((s, i) => (
                    <motion.div key={s.studentId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/50 transition-colors cursor-pointer"
                      onClick={() => setViewing(s)}>
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-muted">#{s.rank}</span>
                      <div className="w-8 h-8 rounded-full gradient-royal flex items-center justify-center text-white text-xs font-bold shrink-0">{s.name.charAt(0)}</div>
                      <span className="text-sm font-medium text-charcoal flex-1 truncate">{s.name}</span>
                      <span className="text-xs text-muted hidden sm:block">{s.rollNumber}</span>
                      <span className="text-sm font-bold text-charcoal w-16 text-center">{s.totalObtained}</span>
                      <span className={`text-sm font-bold w-16 text-center ${s.gpa >= 5 ? "text-emerald" : s.gpa >= 4 ? "text-royal" : s.gpa >= 3 ? "text-amber" : "text-muted"}`}>{s.gpa.toFixed(2)}</span>
                      <span className={`text-[10px] font-bold ${s.overallPass ? "text-emerald" : "text-crimson"}`}>{s.overallPass ? "PASS" : "FAIL"}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Student Modal */}
        <AnimatePresence>{viewing && (
          <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" onClick={() => setViewing(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-white/90 backdrop-blur-3xl border border-white/50 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 md:p-8">
              <button onClick={() => setViewing(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/60 flex items-center justify-center hover:bg-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              <div className="text-center mb-6"><div className="w-20 h-20 rounded-2xl gradient-royal flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3 shadow-xl">{viewing.name.charAt(0)}</div><h2 className="text-xl font-bold text-charcoal">{viewing.name}</h2><p className="text-sm text-muted mt-1">Roll {viewing.rollNumber} · Rank #{viewing.rank}</p></div>
              <div className="grid grid-cols-4 gap-2 mb-6">{[{l:"Total",v:`${viewing.totalObtained}`},{l:"GPA",v:viewing.gpa.toFixed(2),c:viewing.gpa>=5?"text-emerald":viewing.gpa>=4?"text-royal":"text-amber"},{l:"Grade",v:viewing.overallGrade},{l:"Status",v:viewing.overallPass?"PASS":"FAIL",c:viewing.overallPass?"text-emerald":"text-crimson"}].map(si=>(<div key={si.l} className="bg-slate-50 rounded-2xl p-3 text-center"><p className="text-[10px] text-muted uppercase font-semibold mb-0.5">{si.l}</p><p className={`text-lg font-bold ${si.c||"text-charcoal"}`}>{si.v}</p></div>))}</div>
              <h3 className="text-sm font-bold text-charcoal mb-3">Subject Marks</h3>
              <div className="overflow-x-auto rounded-2xl border"><table className="w-full text-xs"><thead><tr className="bg-slate-50"><th className="px-3 py-2 text-left font-semibold text-muted">Subject</th><th className="px-3 py-2 text-center font-semibold text-muted">Total</th><th className="px-3 py-2 text-center font-semibold text-muted">Grade</th></tr></thead><tbody>{(viewing.gpaSubjects||[]).filter(x=>x.hasMark).map(sub=>(<tr key={sub.name} className="border-t hover:bg-slate-50"><td className="px-3 py-2 font-medium">{sub.name}</td><td className="px-3 py-2 text-center font-bold">{sub.total}/{sub.maxTotal}</td><td className="px-3 py-2 text-center font-bold" style={{color:GRADE_COLORS[sub.grade]}}>{sub.grade}</td></tr>))}</tbody></table></div>
            </motion.div>
          </motion.div>
        )}</AnimatePresence>
      </div>
    </div>
  );
}
