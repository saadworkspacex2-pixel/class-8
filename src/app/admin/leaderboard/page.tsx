"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EXAM_TYPES, GRADE_COLORS } from "@/lib/constants";

/* ------------------------- TYPES ------------------------- */
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

/* ------------------------- RANKING UTILS ------------------------- */
function computeRanks<T extends { gpa?: number; totalObtained?: number }>(arr: T[], getVal: (s: T) => number): (T & { displayRank: number })[] {
  const result: (T & { displayRank: number })[] = [];
  if (arr.length === 0) return result;
  let i = 0;
  while (i < arr.length) { const val = getVal(arr[i]); let j = i; while (j < arr.length && getVal(arr[j]) === val) j++; for (let k = i; k < j; k++) result.push({ ...arr[k], displayRank: i + 1 }); i = j; }
  return result;
}

/* ------------------------- CONFIG ------------------------- */
const TOP5_CONFIG = [
  { idx: 1, label: "2ND", pos: "left-inner", scale: 0.85, glow: "rgba(168,85,247,0.15)", ring: "#a855f7", medal: "🥈", delay: 0.2 },
  { idx: 0, label: "1ST", pos: "center",    scale: 1.00, glow: "rgba(250,204,21,0.22)", ring: "#facc15", medal: "🥇", delay: 0.0 },
  { idx: 2, label: "3RD", pos: "right-inner",scale: 0.85, glow: "rgba(249,115,22,0.15)", ring: "#f97316", medal: "🥉", delay: 0.2 },
  { idx: 3, label: "4TH", pos: "left-outer", scale: 0.75, glow: "rgba(34,211,238,0.12)", ring: "#22d3ee", medal: "4️⃣", delay: 0.3 },
  { idx: 4, label: "5TH", pos: "right-outer",scale: 0.75, glow: "rgba(52,211,153,0.12)", ring: "#34d399", medal: "5️⃣", delay: 0.3 },
] as const;

export default function LeaderboardPage() {
  const [examType, setExamType] = useState("Half Yearly");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"marks" | "gpa">("marks");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewing, setViewing] = useState<(StudentResult & { displayRank: number }) | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLoading(true); fetch(`/api/results?examType=${encodeURIComponent(examType)}`).then(r => r.json()).then(d => { setResults(d.results || []); setLoading(false); }).catch(() => setLoading(false)); }, [examType]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); } if (e.key === "/" && document.activeElement === document.body) { e.preventDefault(); searchRef.current?.focus(); } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, []);

  /* --------------- data pipeline --------------- */
  const withMarks = useMemo(() => results.filter((r): r is StudentResult => r.hasMarks === true), [results]);
  const filtered = useMemo(() => {
    let arr = sectionFilter === "all" ? withMarks : withMarks.filter(r => r.section === sectionFilter);
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); arr = arr.filter(r => r.name.toLowerCase().includes(q) || r.rollNumber.toString().includes(q)); }
    return arr;
  }, [withMarks, sectionFilter, searchQuery]);
  const getSortVal = (s: StudentResult) => tab === "gpa" ? s.gpa : s.totalObtained;
  const sorted = useMemo(() => [...filtered].sort((a, b) => { const d = getSortVal(b) - getSortVal(a); return d !== 0 ? d : b.gpa - a.gpa || b.totalObtained - a.totalObtained; }), [filtered, tab]);
  const ranked = useMemo(() => computeRanks(sorted, getSortVal), [sorted]);
  const top5 = ranked.slice(0, 5);
  const rest = ranked.slice(5);

  /* --------------- actions --------------- */
  const handleExport = () => { const rows = ranked.map(s => `${s.displayRank},${s.rollNumber},${s.section},${s.name},${s.totalObtained},${s.gpa.toFixed(2)},${s.overallGrade},${s.overallPass ? "PASS" : "FAIL"}`); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([["Rank,Roll,Section,Name,Total,GPA,Grade,Status", ...rows].join("\n")], { type: "text/csv" })); a.download = `leaderboard-${examType}.csv`; a.click(); };
  const printRanking = () => { try { const w = window.open("", "lb_print", "width=900,height=700"); if (!w) { alert("Allow popups."); return; } w.document.write(`<!DOCTYPE html><html><head><title>Leaderboard</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui;color:#f1f5f9}body{background:#0f0a1a;padding:40px}h1{text-align:center;font-size:24px;margin-bottom:30px;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent}table{width:100%;border-collapse:collapse;background:rgba(255,255,255,0.05);border-radius:16px;overflow:hidden}th{background:rgba(255,255,255,0.08);color:#cbd5e1;font-size:10px;text-transform:uppercase;padding:10px 12px;text-align:left}td{padding:10px 12px;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.06)}.pass{color:#34d399;font-weight:700}.fail{color:#f87171;font-weight:700}</style></head><body><h1>🏆 Leaderboard — ${examType}</h1><table><tr><th>Rank</th><th>Student</th><th>Roll</th><th>Total</th><th>GPA</th><th>Grade</th><th>Status</th></tr>${ranked.map(s => `<tr><td>#${s.displayRank}</td><td><b>${s.name}</b></td><td>${s.rollNumber}</td><td>${s.totalObtained}</td><td>${s.gpa.toFixed(2)}</td><td>${s.overallGrade}</td><td class="${s.overallPass ? 'pass' : 'fail'}">${s.overallPass ? 'PASS' : 'FAIL'}</td></tr>`).join("")}</table></body></html>`); w.document.close(); setTimeout(() => { try { w.print(); } catch {} }, 500); } catch { alert("Pop-up blocked."); } };

  if (loading) return (
    <div className="min-h-screen bg-[#0F0A1A] flex items-center justify-center">
      <div className="space-y-6 w-full max-w-3xl px-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F0A1A] relative overflow-x-hidden">
      {/* ─────── AMBIENT BACKGROUND ─────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Stage spotlight */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-purple-500/15 via-pink-500/5 to-transparent rounded-full blur-[120px]" />
        {/* Subtle orbs */}
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] right-[-5%] w-80 h-80 bg-emerald-500/5 rounded-full blur-[80px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-10">
        {/* ─────── HEADER ─────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">Leaderboard</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">{withMarks.length} students ranked · {examType}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="px-4 py-2.5 rounded-2xl text-sm font-semibold bg-white/5 backdrop-blur-xl border border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> CSV
            </button>
            <button onClick={printRanking} className="px-4 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transition-all flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Print
            </button>
          </div>
        </div>

        {/* ─────── CONTROLS ─────── */}
        <div className="space-y-3">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input ref={searchRef} type="text" placeholder="Search by name or roll..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-20 py-3 rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-zinc-200 placeholder:text-zinc-600 backdrop-blur-xl outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 transition-all" />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-white/[0.06] text-[10px] text-zinc-500 font-mono border border-white/10 hidden sm:inline-block">⌘K</kbd>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {EXAM_TYPES.map(e => (<button key={e} onClick={() => setExamType(e)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${examType === e ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30" : "bg-white/[0.04] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08]"}`}>{e}</button>))}
            <span className="w-px h-5 bg-white/10 mx-1 hidden md:block" />
            {(["marks", "gpa"] as const).map(t => (<button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${tab === t ? "bg-purple-600 text-white shadow-lg" : "bg-white/[0.04] text-zinc-400 hover:text-zinc-200"}`}>{t === "marks" ? "By Marks" : "By GPA"}</button>))}
            <div className="ml-auto flex gap-1">{["all", "shapla", "dahlia"].map(s => (<button key={s} onClick={() => setSectionFilter(s)} className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${sectionFilter === s ? "bg-purple-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>{s === "all" ? "All" : s === "shapla" ? "🌺 Shapla" : "🌸 Dahlia"}</button>))}</div>
          </div>
        </div>

        {ranked.length === 0 ? (
          <div className="py-32 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-white/[0.04] flex items-center justify-center">
              <span className="text-3xl opacity-40">🏆</span>
            </div>
            <p className="text-zinc-400 text-sm">No students found with marks</p>
          </div>
        ) : (
          <>
            {/* ═══════════ TOP 5 FLOATING PODIUM ═══════════ */}
            <div className="relative py-6 md:py-10">
              {/* Ambient glow behind center card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gradient-to-t from-amber-500/8 via-purple-500/5 to-transparent rounded-full blur-[100px] pointer-events-none" />

              {/* Desktop: 5-column flex layout with scale arc */}
              <div className="hidden md:flex items-end justify-center gap-3 lg:gap-4">
                {TOP5_CONFIG.map(({ idx, glow, ring, medal, scale, label, delay }) => {
                  const s = ranked[idx];
                  if (!s) return <div key={`empty-${idx}`} className="w-28 lg:w-32" />;
                  return <Top5Card key={s.studentId} s={s} glow={glow} ring={ring} medal={medal} scale={scale} label={label} delay={delay} onClick={() => setViewing(s)} />;
                })}
              </div>

              {/* Mobile: horizontal snap scroll */}
              <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-3 -mx-4 px-4">
                {TOP5_CONFIG.map(({ idx, glow, ring, medal, scale, label, delay }) => {
                  const s = ranked[idx];
                  if (!s) return <div key={`m-${idx}`} className="w-28 shrink-0" />;
                  return (
                    <div key={s.studentId} className="snap-center shrink-0" style={{ width: '140px' }}>
                      <Top5Card s={s} glow={glow} ring={ring} medal={medal} scale={Math.min(scale, 0.9)} label={label} delay={delay} onClick={() => setViewing(s)} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══════════ LIST: RANK 6+ ═══════════ */}
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <h3 className="text-sm font-bold text-zinc-200">All Rankings</h3>
              </div>

              <div className="p-3 md:p-4 space-y-1">
                {ranked.map((s, i) => (
                  <motion.div key={s.studentId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 md:gap-5 px-4 py-3 rounded-2xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    onClick={() => setViewing(s)}>
                    {/* Rank */}
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      s.displayRank === 1 ? "bg-amber-500/20 text-amber-300" :
                      s.displayRank === 2 ? "bg-zinc-500/20 text-zinc-300" :
                      s.displayRank === 3 ? "bg-orange-500/20 text-orange-300" :
                      "text-zinc-500"
                    }`}>
                      {s.displayRank <= 3 ? ["🥇","🥈","🥉"][s.displayRank-1] : `#${s.displayRank}`}
                    </span>
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white/10">{s.name.charAt(0)}</div>
                      <span className="text-sm font-medium text-zinc-200 truncate">{s.name}</span>
                    </div>
                    {/* Roll */}
                    <span className="text-xs text-zinc-500 w-12 text-center hidden sm:block">{s.rollNumber}</span>
                    {/* Total */}
                    <span className="text-sm font-bold text-zinc-200 w-16 text-center">{s.totalObtained}</span>
                    {/* GPA */}
                    <span className={`text-sm font-bold w-16 text-center ${s.gpa >= 5 ? "text-emerald-400" : s.gpa >= 4 ? "text-purple-400" : s.gpa >= 3 ? "text-amber-400" : s.gpa >= 2 ? "text-orange-400" : s.gpa > 0 ? "text-red-400" : "text-zinc-500"}`}>{s.gpa.toFixed(2)}</span>
                    {/* View Result Button */}
                    <button className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-white/[0.04] text-zinc-400 border border-white/[0.06] group-hover:border-purple-500/40 group-hover:text-purple-300 group-hover:bg-purple-500/10 transition-all shrink-0">
                      View Result
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─────── STUDENT DETAIL MODAL ─────── */}
        <AnimatePresence>
          {viewing && (
            <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewing(null)} />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-[#1A1025] backdrop-blur-3xl border border-white/10 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl shadow-purple-500/10 p-6 md:p-8">
                <button onClick={() => setViewing(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.12] transition-colors text-zinc-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3 shadow-xl shadow-purple-500/20">{viewing.name.charAt(0)}</div>
                  <h2 className="text-xl font-bold text-white">{viewing.name}</h2>
                  <div className="flex items-center justify-center gap-3 mt-1 text-sm text-zinc-400">
                    <span>Roll {viewing.rollNumber}</span><span className="w-1 h-1 rounded-full bg-zinc-600"/><span>{viewing.section === "shapla" ? "🌺 Shapla" : "🌸 Dahlia"}</span><span className="w-1 h-1 rounded-full bg-zinc-600"/><span>Rank #{viewing.displayRank}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {[
                    {l:"Total",v:`${viewing.totalObtained}`,c:"text-white"},
                    {l:"GPA",v:viewing.gpa.toFixed(2),c:viewing.gpa>=5?"text-emerald-400":viewing.gpa>=4?"text-purple-400":"text-amber-400"},
                    {l:"Grade",v:viewing.overallGrade,c:"text-white"},
                    {l:"Status",v:viewing.overallPass?"PASS":"FAIL",c:viewing.overallPass?"text-emerald-400":"text-red-400"}
                  ].map(si=>(<div key={si.l} className="bg-white/[0.04] rounded-2xl p-3 text-center"><p className="text-[10px] text-zinc-500 uppercase font-semibold mb-0.5">{si.l}</p><p className={`text-lg font-bold ${si.c}`}>{si.v}</p></div>))}
                </div>
                <h3 className="text-sm font-bold text-zinc-200 mb-3">Subject-wise Marks</h3>
                <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
                  <table className="w-full text-xs"><thead><tr className="bg-white/[0.03]"><th className="px-3 py-2 text-left font-semibold text-zinc-500">Subject</th><th className="px-3 py-2 text-center font-semibold text-zinc-500">Total</th><th className="px-3 py-2 text-center font-semibold text-zinc-500">Grade</th></tr></thead>
                  <tbody>{(viewing.gpaSubjects||[]).filter(x=>x.hasMark).map(sub=>(<tr key={sub.name} className="border-t border-white/[0.04] hover:bg-white/[0.02]"><td className="px-3 py-2 font-medium text-zinc-300">{sub.name}</td><td className="px-3 py-2 text-center font-bold text-white">{sub.total}/{sub.maxTotal}</td><td className="px-3 py-2 text-center font-bold" style={{color:GRADE_COLORS[sub.grade]}}>{sub.grade}</td></tr>))}</tbody></table>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────── Top 5 Arc Card ─────────────── */
function Top5Card({ s, glow, ring, medal, scale, label, delay, onClick }: {
  s: StudentResult & { displayRank: number };
  glow: string; ring: string; medal: string; scale: number; label: string; delay: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: [0, -4, 0, 4, 0] }}
      transition={{
        opacity: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
        y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: delay + 0.6 }
      }}
      whileHover={{ scale: scale * 1.08, y: -12 }}
      style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}
      className="relative flex flex-col items-center group cursor-pointer shrink-0"
      onClick={onClick}
    >
      {/* Glow halo */}
      <motion.div
        className="absolute -inset-8 rounded-full blur-[60px] transition-opacity duration-700"
        style={{ background: glow, opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: delay + 1 }}
      />

      {/* Rank label */}
      <span className="text-[9px] font-black tracking-[0.15em] text-zinc-500 mb-2">{label}</span>

      {/* Avatar ring */}
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[3px] relative z-10" style={{ background: `linear-gradient(135deg, ${ring}, transparent)` }}>
        <div className="w-full h-full rounded-full bg-[#1A1025] flex items-center justify-center">
          <span className="text-xl md:text-2xl font-bold bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent">{s.name.charAt(0)}</span>
        </div>
      </div>

      {/* Glass card body */}
      <div className="w-28 md:w-32 mt-3 pt-5 pb-4 px-3 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] flex flex-col items-center gap-1.5 shadow-lg shadow-black/20">
        {/* Medal emoji */}
        <span className="text-2xl md:text-3xl absolute -top-4 left-1/2 -translate-x-1/2">{medal}</span>
        <p className="text-[11px] md:text-xs font-bold text-zinc-200 text-center truncate max-w-[100px]">{s.name}</p>
        <p className="text-[9px] text-zinc-500">Roll {s.rollNumber}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm md:text-base font-black text-white">{s.totalObtained}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-600" />
          <span className={`text-xs font-bold ${s.gpa >= 5 ? "text-emerald-400" : s.gpa >= 4 ? "text-purple-400" : "text-amber-400"}`}>{s.gpa.toFixed(2)}</span>
        </div>
      </div>

      {/* Hover tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-[#1A1025]/95 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 shadow-2xl text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-30 pointer-events-none">
        <span className="font-bold text-white">{s.totalObtained}/{s.maxPossibleTotal}</span> · GPA {s.gpa.toFixed(2)} · {s.overallGrade}
      </motion.div>
    </motion.div>
  );
}
