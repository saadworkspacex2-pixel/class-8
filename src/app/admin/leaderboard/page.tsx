"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { EXAM_TYPES, SUBJECTS, SUBJECT_CONFIGS, GRADE_COLORS } from "@/lib/constants";

interface SubjectResult { subject: string; cq: number; mcq: number; total: number; maxTotal: number; grade: string; pass: boolean; }
interface GpaSubject { name: string; total: number; maxTotal: number; grade: string; gp: number; pass: boolean; hasMark: boolean; papers: string[]; }
interface StudentResult {
  studentId: number; name: string; rollNumber: number; section: string; profilePicture: string;
  totalObtained: number; maxPossibleTotal: number; average: number; overallGrade: string;
  gpa: number; overallPass: boolean; rank: number | null; cqRank: number | null; mcqRank: number | null;
  totalCq: number; totalMcq: number; subjects: SubjectResult[];
  gpaSubjects?: GpaSubject[];
  gradedSubjectsCount: number; totalSubjects: number; hasMarks: boolean;
  subjectRanks?: Record<string, number | null>;
}
type TabType = "marks" | "gpa" | "cq" | "mcq" | "subject";

function getPaperMax(subject: string): number { const cfg = SUBJECT_CONFIGS[subject]; return cfg ? cfg.totalMax : 100; }

function computeRanks<T extends { totalObtained?: number; gpa?: number }>(arr: T[], getVal: (s: T) => number): (T & { displayRank: number })[] {
  const result: (T & { displayRank: number })[] = [];
  if (arr.length === 0) return result;
  let i = 0;
  while (i < arr.length) {
    const val = getVal(arr[i]); let j = i;
    while (j < arr.length && getVal(arr[j]) === val) j++;
    for (let k = i; k < j; k++) result.push({ ...arr[k], displayRank: i + 1 });
    i = j;
  }
  return result;
}

const podiumConfig = [
  { index: 1, label: "2nd", height: "h-24 md:h-32", bg: "from-gray-300 via-gray-200 to-gray-400", border: "border-gray-300/50", text: "text-gray-700", medal: "🥈", col: "order-1" },
  { index: 0, label: "1st", height: "h-32 md:h-44", bg: "from-amber-300 via-yellow-300 to-amber-500", border: "border-amber-300/60", text: "text-amber-900", medal: "🥇", col: "order-2" },
  { index: 2, label: "3rd", height: "h-20 md:h-28", bg: "from-orange-400 via-orange-500 to-orange-700", border: "border-orange-400/50", text: "text-orange-100", medal: "🥉", col: "order-3" },
];

export default function LeaderboardPage() {
  const [examType, setExamType] = useState<string>("Half Yearly");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("marks");
  const [selectedSubject, setSelectedSubject] = useState<string>(SUBJECTS[0]);
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingStudent, setViewingStudent] = useState<(StudentResult & { displayRank: number }) | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/results?examType=${encodeURIComponent(examType)}`)
      .then(r => r.json()).then(d => { setResults(d.results || []); setLoading(false); }).catch(() => setLoading(false));
  }, [examType]);

  // Keyboard shortcut: Ctrl+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "/" && document.activeElement === document.body) { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const withMarks = useMemo(() => results.filter((r): r is StudentResult => r.hasMarks === true), [results]);
  const filtered = useMemo(() => {
    let arr = sectionFilter === "all" ? withMarks : withMarks.filter(r => r.section === sectionFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter(r => r.name.toLowerCase().includes(q) || r.rollNumber.toString().includes(q));
    }
    return arr;
  }, [withMarks, sectionFilter, searchQuery]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (tab === "gpa") { const d = b.gpa - a.gpa; return d !== 0 ? d : b.totalObtained - a.totalObtained; }
    if (tab === "cq") return b.totalCq - a.totalCq;
    if (tab === "mcq") return b.totalMcq - a.totalMcq;
    if (tab === "subject") { const d = (b.subjects.find(x => x.subject === selectedSubject)?.total ?? 0) - (a.subjects.find(x => x.subject === selectedSubject)?.total ?? 0); if (d !== 0) return d; return b.gpa - a.gpa || b.totalObtained - a.totalObtained; }
    return b.totalObtained - a.totalObtained;
  }), [filtered, tab, selectedSubject]);

  const getSortVal = (s: StudentResult): number => {
    if (tab === "gpa") return s.gpa;
    if (tab === "cq") return s.totalCq;
    if (tab === "mcq") return s.totalMcq;
    if (tab === "subject") return s.subjects.find(x => x.subject === selectedSubject)?.total ?? 0;
    return s.totalObtained;
  };
  const ranked = useMemo(() => computeRanks(sorted, getSortVal), [sorted, getSortVal]);
  const top5 = ranked.slice(0, 5);

  const toggleExpand = (id: number) => setExpandedRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleExport = () => {
    const rows = ranked.map(s => `${s.displayRank},${s.rollNumber},${s.section},${s.name},${s.totalObtained},${s.gpa.toFixed(2)},${s.overallGrade},${s.overallPass ? "PASS" : "FAIL"}`);
    const csv = ["Rank,Roll,Section,Name,Total,GPA,Grade,Status", ...rows].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `leaderboard-${examType}.csv`; a.click();
  };

  const printRanking = () => {
    try {
    const w = window.open("", "leaderboard_print", "width=900,height=700");
    if (!w) { alert("Please allow popups for this site to print rankings."); return; }
    w.document.write(`<!DOCTYPE html><html><head><title>Leaderboard - ${examType}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;font-family:system-ui,sans-serif}
        body{background:#f8fafc;padding:40px;color:#1e293b}
        .header{text-align:center;margin-bottom:30px}
        .header h1{font-size:24px;font-weight:800;background:linear-gradient(135deg,#4F46E5,#7C3AED);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .header p{font-size:13px;color:#64748b;margin-top:4px}
        .podium{display:flex;gap:16px;justify-content:center;align-items:flex-end;margin-bottom:30px}
        .podium-card{flex:1;max-width:180px;text-align:center;border-radius:20px;padding:20px 12px 16px;color:white;box-shadow:0 4px 20px rgba(0,0,0,.1)}
        .podium-card.gold{background:linear-gradient(135deg,#f59e0b,#d97706);min-height:180px}
        .podium-card.silver{background:linear-gradient(135deg,#94a3b8,#64748b);min-height:150px}
        .podium-card.bronze{background:linear-gradient(135deg,#ea580c,#c2410c);min-height:130px}
        .podium-card .avatar{width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.25);margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700}
        .podium-card .name{font-size:13px;font-weight:700;margin-bottom:2px}
        .podium-card .score{font-size:18px;font-weight:900}
        .podium-card .gpa{font-size:11px;opacity:.8}
        table{width:100%;border-collapse:collapse;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)}
        th{background:#1e293b;color:white;font-size:10px;text-transform:uppercase;letter-spacing:.5px;padding:10px 12px;text-align:left}
        td{padding:10px 12px;font-size:12px;border-bottom:1px solid #f1f5f9}
        .rank-badge{display:inline-flex;width:28px;height:28px;border-radius:8px;align-items:center;justify-content:center;font-size:11px;font-weight:700}
        .rank-1{background:#fef3c7;color:#92400e}.rank-2{background:#f1f5f9;color:#64748b}.rank-3{background:#fff7ed;color:#c2410c}
        .pass{color:#059669;font-weight:700}.fail{color:#dc2626;font-weight:700}
        .footer{text-align:center;margin-top:30px;font-size:11px;color:#94a3b8}
      </style></head><body>
      <div class="header"><h1>🏆 Leaderboard</h1><p>${examType} · Class 8 — Dahlia (B) · ${ranked.length} students</p></div>`);

    // Podium
    if (ranked.length >= 3) {
      const order = [1, 0, 2]; // 2nd, 1st, 3rd
      const classes = ["silver", "gold", "bronze"];
      w.document.write('<div class="podium">');
      order.forEach(i => {
        const s = ranked[i]; if (!s) return;
        w.document.write(`<div class="podium-card ${classes[i]}"><div class="avatar">${s.name.charAt(0)}</div><div class="name">${s.name}</div><div class="score">${s.totalObtained}</div><div class="gpa">GPA ${s.gpa.toFixed(2)}</div></div>`);
      });
      w.document.write('</div>');
    }

    // Table
    w.document.write('<table><thead><tr><th>Rank</th><th>Student</th><th>Roll</th><th>Total</th><th>GPA</th><th>Grade</th><th>Status</th></tr></thead><tbody>');
    ranked.forEach(s => {
      const rc = s.displayRank === 1 ? "rank-1" : s.displayRank === 2 ? "rank-2" : s.displayRank === 3 ? "rank-3" : "";
      w.document.write(`<tr><td><span class="rank-badge ${rc}">#${s.displayRank}</span></td><td><strong>${s.name}</strong></td><td>${s.rollNumber}</td><td><strong>${s.totalObtained}</strong></td><td>${s.gpa.toFixed(2)}</td><td>${s.overallGrade}</td><td class="${s.overallPass ? 'pass' : 'fail'}">${s.overallPass ? 'PASS' : 'FAIL'}</td></tr>`);
    });
    w.document.write('</tbody></table>');
    w.document.write(`<div class="footer">Generated from Admin Dashboard · ${new Date().toLocaleDateString()}</div></body></html>`);
    w.document.close();
    setTimeout(() => { try { w.print(); } catch {} }, 500);
    } catch (e) { alert("Pop-up blocked. Please allow popups for this site."); }
  };

  const rankIndicator = (rank: number, roll: number) => {
    const rp = Math.ceil(roll / 2);
    if (rank < rp) return <span className="text-emerald text-[10px] font-bold">↑{rp - rank}</span>;
    if (rank > rp) return <span className="text-crimson text-[10px] font-bold">↓{rank - rp}</span>;
    return <span className="text-muted text-[10px]">—</span>;
  };

  const safePct = (obtained: number, max: number) => (!max || max <= 0) ? 0 : (obtained / max) * 100;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">🏆 Leaderboard</h1>
          <p className="text-sm text-muted">{withMarks.length} students ranked · {examType}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2.5 rounded-2xl text-sm font-semibold liquid-glass-sm text-charcoal hover:bg-white/60 transition-all flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> CSV
          </button>
          <button onClick={printRanking} className="gradient-royal text-white px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-royal/25 hover:shadow-xl transition-all flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Print Ranking
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input ref={searchRef} type="text" placeholder="Search by name or roll number..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-20 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-royal/30 transition-all" />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-white/60 text-[10px] text-muted font-mono border border-white/40 hidden sm:inline-block">⌘K</kbd>
        </div>

        {/* Exam selector + Tabs + Section */}
        <div className="flex flex-wrap gap-2 items-center">
          {EXAM_TYPES.map(exam => (
            <button key={exam} onClick={() => setExamType(exam)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${examType === exam ? "gradient-royal text-white shadow-md" : "liquid-glass-sm text-muted hover:text-charcoal"}`}>{exam}</button>
          ))}
          <span className="w-px h-5 bg-border mx-1 hidden md:block" />
          {(["marks", "gpa", "cq", "mcq", "subject"] as TabType[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${tab === t ? "gradient-royal text-white shadow-md" : "liquid-glass-sm text-muted hover:text-charcoal"}`}>{t === "subject" ? "Subject" : t === "marks" ? "By Marks" : t.toUpperCase()}</button>
          ))}
          {tab === "subject" && (
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-white/40 border border-white/40 backdrop-blur-sm font-semibold">
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <div className="ml-auto flex gap-1">
            {["all", "shapla", "dahlia"].map(s => (
              <button key={s} onClick={() => setSectionFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${sectionFilter === s ? "gradient-royal text-white" : "text-muted hover:text-charcoal"}`}>{s === "all" ? "All" : s === "shapla" ? "🌺 Shapla" : "🌸 Dahlia"}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-2xl skeleton" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="py-20 text-center text-muted text-sm">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-amber/10 flex items-center justify-center">
            <span className="text-3xl">🏆</span>
          </div>
          <p className="text-base font-semibold text-charcoal mb-1">No students found</p>
          <p className="text-sm">Enter marks or adjust your filters</p>
        </div>
      ) : (
        <>
          {/* ===== PODIUM TOP 5 — ALL IN ONE ROW ===== */}
          {ranked.length >= 3 && (
            <LayoutGroup>
              <motion.div layout className="grid grid-cols-5 gap-1.5 md:gap-3 items-end">
                {/* 2nd (index 1) → column 1 */}
                {[1, 0, 2, 3, 4].map((idx, colIndex) => {
                  const s = top5[idx];
                  if (!s) return <div key={`empty-${colIndex}`} />;
                  const isTop3 = idx <= 2;
                  const is4th = idx === 3;
                  const is5th = idx === 4;
                  const height = isTop3
                    ? (idx === 0 ? "h-28 md:h-40" : idx === 1 ? "h-20 md:h-32" : "h-16 md:h-24")
                    : (is4th ? "h-14 md:h-20" : "h-12 md:h-16");
                  const bg = isTop3
                    ? (idx === 0 ? "from-amber-300 via-yellow-300 to-amber-500 border-amber-300/60" : idx === 1 ? "from-gray-300 via-gray-200 to-gray-400 border-gray-300/50" : "from-orange-400 via-orange-500 to-orange-700 border-orange-400/50")
                    : (is4th ? "from-blue-300 via-blue-400 to-blue-600 border-blue-400/50" : "from-emerald-300 via-emerald-500 to-emerald-700 border-emerald-400/50");
                  const text = isTop3
                    ? (idx === 0 ? "text-amber-900" : idx === 1 ? "text-gray-700" : "text-orange-100")
                    : (is4th ? "text-blue-50" : "text-emerald-50");
                  const medal = isTop3 ? ["🥇","🥈","🥉"][idx] : is4th ? "4️⃣" : "5️⃣";
                  const borderColor = isTop3
                    ? (idx === 0 ? "#fbbf24" : idx === 1 ? "#d4d4d8" : "#fb923c")
                    : (is4th ? "#60a5fa" : "#34d399");
                  return (
                    <motion.div key={s.studentId} layout
                      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: colIndex * 0.08 }}
                      className="flex flex-col items-center cursor-pointer min-w-0"
                      onClick={() => setViewingStudent(s)}>
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: colIndex * 0.3 }}
                        className={`rounded-full bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-xl border shadow-lg flex items-center justify-center mb-1.5 relative ${isTop3 ? "w-11 h-11 md:w-14 md:h-14" : "w-9 h-9 md:w-11 md:h-11"}`}
                        style={{ borderColor }}>
                        {s.profilePicture ? <img src={s.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                          : <span className={`font-bold gradient-text ${isTop3 ? "text-sm md:text-lg" : "text-xs md:text-sm"}`}>{s.name.charAt(0)}</span>}
                      </motion.div>
                      <p className="text-[9px] md:text-[10px] font-bold text-charcoal text-center truncate max-w-[55px] md:max-w-[90px]">{s.name}</p>
                      <p className="text-[7px] md:text-[8px] text-muted mb-1">R{s.rollNumber}</p>
                      <div className={`${height} w-full rounded-t-2xl bg-gradient-to-b ${bg} border border-b-0 flex flex-col items-center justify-start pt-2.5 md:pt-3 relative overflow-hidden shadow-xl`}>
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
                        <span className={`relative z-10 ${isTop3 ? "text-xl md:text-3xl" : "text-base md:text-xl"}`}>{medal}</span>
                        <span className={`mt-0.5 md:mt-1 font-bold relative z-10 ${isTop3 ? "text-[9px] md:text-xs" : "text-[8px] md:text-[10px]"} ${text}`}>{s.totalObtained}</span>
                        <span className={`font-semibold relative z-10 ${isTop3 ? "text-[8px] md:text-[10px]" : "text-[7px] md:text-[9px]"} ${text}/70`}>GPA {s.gpa.toFixed(2)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </LayoutGroup>
          )}

          {/* ===== FULL TABLE ===== */}
          <motion.div layout className="liquid-glass-strong rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase w-14">Rank</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase hidden md:table-cell w-12">Roll</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase w-16">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase w-16">GPA</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase w-12">Grade</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase w-16">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map(s => {
                    const isExpanded = expandedRows.has(s.studentId);
                    const isTop5 = s.displayRank <= 5;
                    return (
                      <motion.tr key={s.studentId} layout
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                        className={`border-b border-white/10 hover:bg-white/20 transition-colors cursor-pointer ${isTop5 ? "bg-amber/[0.02]" : ""}`}
                        onClick={() => setViewingStudent(s)}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${s.displayRank === 1 ? "bg-amber/15 text-amber" : s.displayRank === 2 ? "bg-gray-300/20 text-gray-500" : s.displayRank === 3 ? "bg-orange-500/15 text-orange-600" : "text-muted"}`}>
                              {s.displayRank <= 3 ? ["🥇","🥈","🥉"][s.displayRank-1] : `#${s.displayRank}`}
                            </span>
                            {rankIndicator(s.displayRank, s.rollNumber)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full gradient-royal flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/50 shrink-0">{s.name.charAt(0)}</div>
                            <div>
                              <span className="text-sm font-semibold text-charcoal">{s.name}</span>
                              <span className="md:hidden text-[10px] text-muted ml-1">R{s.rollNumber}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted hidden md:table-cell">{s.rollNumber}</td>
                        <td className="py-3 px-4 text-center text-sm font-bold text-charcoal">{s.totalObtained}<span className="text-muted font-normal text-[10px]">/{s.maxPossibleTotal}</span></td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-sm font-bold ${s.gpa >= 5 ? "text-emerald" : s.gpa >= 4 ? "text-royal" : s.gpa >= 3 ? "text-amber" : s.gpa >= 2 ? "text-orange-500" : s.gpa > 0 ? "text-crimson" : "text-gray-400"}`}>{s.gpa.toFixed(2)}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ backgroundColor: `${GRADE_COLORS[s.overallGrade] || "#6B7280"}18`, color: GRADE_COLORS[s.overallGrade] || "#6B7280" }}>{s.overallGrade}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${s.overallPass ? "bg-emerald/10 text-emerald" : "bg-crimson/10 text-crimson"}`}>{s.overallPass ? "PASS" : "FAIL"}</span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* ===== STUDENT QUICK-VIEW MODAL ===== */}
          <AnimatePresence>
            {viewingStudent && (
              <motion.div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={() => setViewingStudent(null)} />
                <motion.div
                  initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl p-6 sm:p-8">
                  {/* Close */}
                  <button onClick={() => setViewingStudent(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>

                  {/* Student header */}
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-2xl gradient-royal flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3 shadow-xl shadow-royal/20">{viewingStudent.name.charAt(0)}</div>
                    <h2 className="text-xl font-bold text-charcoal">{viewingStudent.name}</h2>
                    <div className="flex items-center justify-center gap-3 mt-1 text-sm text-muted">
                      <span>Roll {viewingStudent.rollNumber}</span>
                      <span className="w-1 h-1 rounded-full bg-muted/40" />
                      <span>{viewingStudent.section === "shapla" ? "🌺 Shapla" : "🌸 Dahlia"}</span>
                      <span className="w-1 h-1 rounded-full bg-muted/40" />
                      <span>Rank #{viewingStudent.displayRank}</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {[
                      { label: "Total", value: `${viewingStudent.totalObtained}`, sub: `/${viewingStudent.maxPossibleTotal}` },
                      { label: "GPA", value: viewingStudent.gpa.toFixed(2), sub: "/5.00", color: viewingStudent.gpa >= 5 ? "text-emerald" : viewingStudent.gpa >= 4 ? "text-royal" : "text-amber" },
                      { label: "Grade", value: viewingStudent.overallGrade, sub: "", color: GRADE_COLORS[viewingStudent.overallGrade] },
                      { label: "Status", value: viewingStudent.overallPass ? "PASS" : "FAIL", sub: "", color: viewingStudent.overallPass ? "text-emerald" : "text-crimson" },
                    ].map(stat => (
                      <div key={stat.label} className="bg-slate-50 rounded-2xl p-3 text-center">
                        <p className="text-[10px] text-muted uppercase font-semibold mb-0.5">{stat.label}</p>
                        <p className={`text-lg font-bold ${stat.color || "text-charcoal"}`}>{stat.value}<span className="text-[10px] font-normal text-muted">{stat.sub}</span></p>
                      </div>
                    ))}
                  </div>

                  {/* Subject breakdown table */}
                  <h3 className="text-sm font-bold text-charcoal mb-3">Subject-wise Marks</h3>
                  <div className="overflow-x-auto rounded-2xl border border-border mb-6">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-slate-50"><th className="px-3 py-2 text-left font-semibold text-muted">Subject</th><th className="px-3 py-2 text-center font-semibold text-muted">CQ</th><th className="px-3 py-2 text-center font-semibold text-muted">MCQ</th><th className="px-3 py-2 text-center font-semibold text-muted">Total</th><th className="px-3 py-2 text-center font-semibold text-muted">Grade</th><th className="px-3 py-2 text-center font-semibold text-muted">GP</th></tr></thead>
                      <tbody>
                        {(viewingStudent.gpaSubjects || []).filter(x => x.hasMark).map(sub => (
                          <tr key={sub.name} className="border-t border-border hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-charcoal">{sub.name}</td>
                            <td className="px-3 py-2 text-center">—</td>
                            <td className="px-3 py-2 text-center">—</td>
                            <td className="px-3 py-2 text-center font-bold">{sub.total}/{sub.maxTotal}</td>
                            <td className="px-3 py-2 text-center"><span className="font-bold" style={{ color: GRADE_COLORS[sub.grade] }}>{sub.grade}</span></td>
                            <td className="px-3 py-2 text-center font-bold">{sub.gp.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-bold">
                          <td className="px-3 py-2.5">Overall</td>
                          <td colSpan={2} className="px-3 py-2.5 text-center">{viewingStudent.totalObtained}/{viewingStudent.maxPossibleTotal}</td>
                          <td className="px-3 py-2.5 text-center">{viewingStudent.overallGrade}</td>
                          <td className="px-3 py-2.5 text-center">{viewingStudent.gpa.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Footer actions */}
                  <div className="flex gap-2">
                    <button onClick={() => setViewingStudent(null)} className="flex-1 py-3 rounded-2xl text-sm font-semibold border border-border hover:bg-slate-50 transition-all">Close</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
