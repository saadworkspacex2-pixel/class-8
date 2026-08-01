"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

function computeRanks<T extends { gpa?: number; totalObtained?: number }>(arr: T[], getVal: (s: T) => number): (T & { displayRank: number })[] {
  const result: (T & { displayRank: number })[] = [];
  if (arr.length === 0) return result;
  let i = 0;
  while (i < arr.length) { const val = getVal(arr[i]); let j = i; while (j < arr.length && getVal(arr[j]) === val) j++; for (let k = i; k < j; k++) result.push({ ...arr[k], displayRank: i + 1 }); i = j; }
  return result;
}

type TabType = "marks" | "gpa";

const TOP5_CONFIG = [
  { idx: 1, label: "2nd", glow: "rgba(148,163,184,0.15)", ring: "#94a3b8", size: "lg", emoji: "🥈" },
  { idx: 0, label: "1st", glow: "rgba(251,191,36,0.2)", ring: "#fbbf24", size: "xl", emoji: "🥇" },
  { idx: 2, label: "3rd", glow: "rgba(251,146,60,0.15)", ring: "#fb923c", size: "lg", emoji: "🥉" },
  { idx: 3, label: "4th", glow: "rgba(96,165,250,0.12)", ring: "#60a5fa", size: "md", emoji: "4️⃣" },
  { idx: 4, label: "5th", glow: "rgba(52,211,153,0.12)", ring: "#34d399", size: "md", emoji: "5️⃣" },
];

export default function LeaderboardPage() {
  const [examType, setExamType] = useState("Half Yearly");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("marks");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewing, setViewing] = useState<(StudentResult & { displayRank: number }) | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLoading(true); fetch(`/api/results?examType=${encodeURIComponent(examType)}`).then(r => r.json()).then(d => { setResults(d.results || []); setLoading(false); }).catch(() => setLoading(false)); }, [examType]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); } if (e.key === "/" && document.activeElement === document.body) { e.preventDefault(); searchRef.current?.focus(); } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, []);

  const withMarks = useMemo(() => results.filter((r): r is StudentResult => r.hasMarks === true), [results]);
  const filtered = useMemo(() => { let arr = sectionFilter === "all" ? withMarks : withMarks.filter(r => r.section === sectionFilter); if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); arr = arr.filter(r => r.name.toLowerCase().includes(q) || r.rollNumber.toString().includes(q)); } return arr; }, [withMarks, sectionFilter, searchQuery]);
  const getSortVal = (s: StudentResult) => tab === "gpa" ? s.gpa : s.totalObtained;
  const sorted = useMemo(() => [...filtered].sort((a, b) => { const d = getSortVal(b) - getSortVal(a); return d !== 0 ? d : b.gpa - a.gpa || b.totalObtained - a.totalObtained; }), [filtered, tab]);
  const ranked = useMemo(() => computeRanks(sorted, getSortVal), [sorted]);
  const top5 = ranked.slice(0, 5);
  const rest = ranked.slice(5);

  const handleExport = () => { const rows = ranked.map(s => `${s.displayRank},${s.rollNumber},${s.section},${s.name},${s.totalObtained},${s.gpa.toFixed(2)},${s.overallGrade},${s.overallPass ? "PASS" : "FAIL"}`); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([["Rank,Roll,Section,Name,Total,GPA,Grade,Status", ...rows].join("\n")], { type: "text/csv" })); a.download = `leaderboard-${examType}.csv`; a.click(); };
  const printRanking = () => { try { const w = window.open("", "lb_print", "width=900,height=700"); if (!w) { alert("Allow popups."); return; } w.document.write(`<!DOCTYPE html><html><head><title>Leaderboard</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui}body{background:#f8fafc;padding:40px;color:#1e293b}h1{text-align:center;font-size:24px;margin-bottom:30px;background:linear-gradient(135deg,#4F46E5,#7C3AED);-webkit-background-clip:text;-webkit-text-fill-color:transparent}table{width:100%;border-collapse:collapse;background:#fff;border-radius:16px;overflow:hidden}th{background:#1e293b;color:#fff;font-size:10px;text-transform:uppercase;padding:10px 12px;text-align:left}td{padding:10px 12px;font-size:12px;border-bottom:1px solid #f1f5f9}.pass{color:#059669;font-weight:700}.fail{color:#dc2626;font-weight:700}</style></head><body><h1>🏆 Leaderboard — ${examType}</h1><table><tr><th>Rank</th><th>Student</th><th>Roll</th><th>Total</th><th>GPA</th><th>Grade</th><th>Status</th></tr>${ranked.map(s => `<tr><td>#${s.displayRank}</td><td><b>${s.name}</b></td><td>${s.rollNumber}</td><td>${s.totalObtained}</td><td>${s.gpa.toFixed(2)}</td><td>${s.overallGrade}</td><td class="${s.overallPass ? 'pass' : 'fail'}">${s.overallPass ? 'PASS' : 'FAIL'}</td></tr>`).join("")}</table></body></html>`); w.document.close(); setTimeout(() => { try { w.print(); } catch {} }, 500); } catch { alert("Pop-up blocked."); } };

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}</div>;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black tracking-tight text-charcoal">Leaderboard</h1><p className="text-sm text-muted mt-0.5">{withMarks.length} students · {examType}</p></div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2.5 rounded-2xl text-sm font-semibold bg-white/50 backdrop-blur-sm border border-white/40 text-charcoal hover:bg-white/70 transition-all flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> CSV</button>
          <button onClick={printRanking} className="gradient-royal text-white px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-royal/25 hover:shadow-xl transition-all flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Print</button>
        </div>
      </div>

      {/* ─── CONTROLS ─── */}
      <div className="space-y-3">
        <div className="relative"><svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input ref={searchRef} type="text" placeholder="Search by name or roll..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-11 pr-20 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-royal/30 transition-all" /><kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-white/60 text-[10px] text-muted font-mono border border-white/40 hidden sm:inline-block">⌘K</kbd></div>
        <div className="flex flex-wrap gap-2 items-center">
          {EXAM_TYPES.map(e => (<button key={e} onClick={() => setExamType(e)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${examType === e ? "gradient-royal text-white shadow-md" : "bg-white/30 text-muted hover:text-charcoal"}`}>{e}</button>))}
          <span className="w-px h-5 bg-border mx-1 hidden md:block" />
          {(["marks", "gpa"] as TabType[]).map(t => (<button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${tab === t ? "gradient-royal text-white shadow-md" : "bg-white/30 text-muted hover:text-charcoal"}`}>{t === "marks" ? "By Marks" : "By GPA"}</button>))}
          <div className="ml-auto flex gap-1">{["all", "shapla", "dahlia"].map(s => (<button key={s} onClick={() => setSectionFilter(s)} className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${sectionFilter === s ? "gradient-royal text-white" : "text-muted hover:text-charcoal"}`}>{s === "all" ? "All" : s === "shapla" ? "🌺 Shapla" : "🌸 Dahlia"}</button>))}</div>
        </div>
      </div>

      {ranked.length === 0 ? <div className="py-24 text-center text-muted text-sm">No students found.</div> : (
        <>
          {/* ═══════ TOP 5 HERO PODIUM ═══════ */}
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="hidden md:flex items-end justify-center gap-3 lg:gap-5">
              {TOP5_CONFIG.map(({ idx, glow, ring, size, emoji }) => {
                const s = top5[idx];
                if (!s) return <div key={`e-${idx}`} className="w-28 lg:w-32" />;
                const avatarSizes: Record<string, string> = { xl: "w-16 h-16 md:w-20 md:h-20", lg: "w-14 h-14 md:w-18 md:h-18", md: "w-12 h-12 md:w-16 md:h-16" };
                return (
                  <motion.div key={s.studentId}
                    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ scale: 1.06, y: -8 }}
                    className="relative flex flex-col items-center group cursor-pointer shrink-0" onClick={() => setViewing(s)}>
                    <div className="absolute -inset-6 rounded-full blur-[60px] transition-opacity opacity-0 group-hover:opacity-100 duration-700" style={{ background: glow }} />
                    <div className={`${avatarSizes[size]} rounded-full p-[3px] relative -mb-7 z-20`} style={{ background: `linear-gradient(135deg, ${ring}, transparent)` }}>
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-xl">{s.profilePicture ? <img src={s.profilePicture} alt="" className="w-full h-full rounded-full object-cover" /> : <span className="text-lg md:text-2xl font-bold bg-gradient-to-br from-royal to-purple-600 bg-clip-text text-transparent">{s.name.charAt(0)}</span>}</div>
                    </div>
                    <div className="w-full pt-12 pb-4 px-3 rounded-3xl bg-white/40 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col items-center gap-1">
                      <span className="text-xl md:text-3xl">{emoji}</span>
                      <p className="text-[10px] md:text-xs font-bold text-charcoal text-center truncate max-w-[80px]">{s.name}</p>
                      <p className="text-[9px] text-muted">Roll {s.rollNumber}</p>
                      <div className="flex items-center gap-2 mt-1"><span className="text-xs md:text-sm font-black text-charcoal">{s.totalObtained}</span><span className="w-1 h-1 rounded-full bg-border" /><span className={`text-xs font-bold ${s.gpa >= 5 ? "text-emerald" : s.gpa >= 4 ? "text-royal" : "text-amber"}`}>{s.gpa.toFixed(2)}</span></div>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 5 }} className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl border border-white/60 rounded-2xl px-3 py-2 shadow-2xl text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-30 pointer-events-none">
                      <span className="font-bold text-charcoal">{s.totalObtained}/{s.maxPossibleTotal}</span> · GPA {s.gpa.toFixed(2)} · {s.overallGrade}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
            <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-4 px-4">
              {TOP5_CONFIG.map(({ idx, glow, ring, size, emoji }) => { const s = top5[idx]; if (!s) return <div key={`m-${idx}`} className="w-28 shrink-0" />; const avs: Record<string, string> = { xl: "w-16 h-16", lg: "w-14 h-14", md: "w-12 h-12" }; return (<div key={s.studentId} className="snap-center shrink-0 w-32"><div className="relative flex flex-col items-center group cursor-pointer" onClick={() => setViewing(s)}><div className={`${avs[size]} rounded-full p-[3px] relative -mb-5 z-20`} style={{ background: `linear-gradient(135deg, ${ring}, transparent)` }}><div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-xl"><span className="text-lg font-bold bg-gradient-to-br from-royal to-purple-600 bg-clip-text text-transparent">{s.name.charAt(0)}</span></div></div><div className="w-full pt-10 pb-3 px-2 rounded-3xl bg-white/40 backdrop-blur-2xl border border-white/50 flex flex-col items-center gap-0.5"><span className="text-xl">{emoji}</span><p className="text-[10px] font-bold text-charcoal truncate max-w-[70px]">{s.name}</p><p className="text-[8px] text-muted">R{s.rollNumber}</p><span className="text-xs font-bold">{s.totalObtained}</span></div></div></div>); })}
            </div>
          </div>

          {/* ═══════ MINIMALIST LIST ═══════ */}
          <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="px-6 py-4 border-b border-white/30"><h3 className="text-sm font-bold text-charcoal">All Rankings</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider"><th className="py-3 px-5 w-14">Rank</th><th className="py-3 px-5">Student</th><th className="py-3 px-5 w-14">Roll</th><th className="py-3 px-5 w-20 text-center">Total</th><th className="py-3 px-5 w-16 text-center">GPA</th><th className="py-3 px-5 w-14 text-center">Grade</th><th className="py-3 px-5 w-16 text-center">Status</th></tr></thead>
                <tbody>{ranked.map((s, i) => (
                  <motion.tr key={s.studentId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} onClick={() => setViewing(s)} className="hover:bg-white/40 transition-colors cursor-pointer">
                    <td className="py-2.5 px-5"><span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-bold ${s.displayRank===1?"bg-amber/15 text-amber":s.displayRank===2?"bg-gray-300/20 text-gray-500":s.displayRank===3?"bg-orange-500/15 text-orange-600":"text-muted"}`}>{s.displayRank<=3?["🥇","🥈","🥉"][s.displayRank-1]:`#${s.displayRank}`}</span></td>
                    <td className="py-2.5 px-5"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-full gradient-royal flex items-center justify-center text-white text-[10px] font-bold">{s.name.charAt(0)}</div><span className="text-sm font-medium text-charcoal">{s.name}</span></div></td>
                    <td className="py-2.5 px-5 text-sm text-muted">{s.rollNumber}</td>
                    <td className="py-2.5 px-5 text-center text-sm font-bold text-charcoal">{s.totalObtained}</td>
                    <td className="py-2.5 px-5 text-center"><span className={`text-sm font-bold ${s.gpa>=5?"text-emerald":s.gpa>=4?"text-royal":s.gpa>=3?"text-amber":s.gpa>=2?"text-orange-500":s.gpa>0?"text-crimson":"text-gray-400"}`}>{s.gpa.toFixed(2)}</span></td>
                    <td className="py-2.5 px-5 text-center"><span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{backgroundColor:`${GRADE_COLORS[s.overallGrade]||"#6B7280"}18`,color:GRADE_COLORS[s.overallGrade]||"#6B7280"}}>{s.overallGrade}</span></td>
                    <td className="py-2.5 px-5 text-center"><span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${s.overallPass?"bg-emerald/10 text-emerald":"bg-crimson/10 text-crimson"}`}>{s.overallPass?"PASS":"FAIL"}</span></td>
                  </motion.tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── STUDENT MODAL ─── */}
      <AnimatePresence>{viewing && (
        <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <motion.div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={()=>setViewing(null)} />
          <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}} className="relative bg-white/80 backdrop-blur-3xl border border-white/50 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 md:p-8">
            <button onClick={()=>setViewing(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/60 flex items-center justify-center hover:bg-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            <div className="text-center mb-6"><div className="w-20 h-20 rounded-2xl gradient-royal flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3 shadow-xl shadow-royal/20">{viewing.name.charAt(0)}</div><h2 className="text-xl font-bold text-charcoal">{viewing.name}</h2><div className="flex items-center justify-center gap-3 mt-1 text-sm text-muted"><span>Roll {viewing.rollNumber}</span><span className="w-1 h-1 rounded-full bg-muted/40"/><span>{viewing.section==="shapla"?"🌺 Shapla":"🌸 Dahlia"}</span><span className="w-1 h-1 rounded-full bg-muted/40"/><span>Rank #{viewing.displayRank}</span></div></div>
            <div className="grid grid-cols-4 gap-2 mb-6">{[{l:"Total",v:`${viewing.totalObtained}`},{l:"GPA",v:viewing.gpa.toFixed(2),c:viewing.gpa>=5?"text-emerald":viewing.gpa>=4?"text-royal":"text-amber"},{l:"Grade",v:viewing.overallGrade,c:GRADE_COLORS[viewing.overallGrade]},{l:"Status",v:viewing.overallPass?"PASS":"FAIL",c:viewing.overallPass?"text-emerald":"text-crimson"}].map(s=>(<div key={s.l} className="bg-slate-50 rounded-2xl p-3 text-center"><p className="text-[10px] text-muted uppercase font-semibold mb-0.5">{s.l}</p><p className={`text-lg font-bold ${s.c||"text-charcoal"}`}>{s.v}</p></div>))}</div>
            <h3 className="text-sm font-bold text-charcoal mb-3">Subject-wise Marks</h3>
            <div className="overflow-x-auto rounded-2xl border border-border"><table className="w-full text-xs"><thead><tr className="bg-slate-50"><th className="px-3 py-2 text-left font-semibold text-muted">Subject</th><th className="px-3 py-2 text-center font-semibold text-muted">Total</th><th className="px-3 py-2 text-center font-semibold text-muted">Grade</th></tr></thead><tbody>{(viewing.gpaSubjects||[]).filter(x=>x.hasMark).map(sub=>(<tr key={sub.name} className="border-t border-border hover:bg-slate-50"><td className="px-3 py-2 font-medium">{sub.name}</td><td className="px-3 py-2 text-center font-bold">{sub.total}/{sub.maxTotal}</td><td className="px-3 py-2 text-center font-bold" style={{color:GRADE_COLORS[sub.grade]}}>{sub.grade}</td></tr>))}</tbody></table></div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}
