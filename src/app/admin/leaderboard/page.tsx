"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { EXAM_TYPES, SUBJECTS, GRADE_COLORS, calculateWeightedFinal } from "@/lib/constants";
import { generateReportCardPDF, type ReportCardData } from "@/lib/pdfGenerator";

interface SubjectResult {
  subject: string; cq: number; mcq: number; total: number; maxTotal: number; grade: string; pass: boolean; hasMark?: boolean;
}

interface StudentResult {
  studentId: number; name: string; rollNumber: number; section: string; profilePicture: string;
  totalObtained: number; maxPossibleTotal: number; average: number; overallGrade: string;
  gpa: number; overallPass: boolean; rank: number | null; cqRank: number | null; mcqRank: number | null;
  totalCq: number; totalMcq: number; subjects: SubjectResult[]; gradedSubjectsCount: number;
  totalSubjects: number; hasMarks: boolean; subjectRanks?: Record<string, number | null>;
  fatherName?: string; motherName?: string;
}

type TabType = "marks" | "gpa" | "cq" | "mcq" | "subject";

export default function LeaderboardPage() {
  const [examType, setExamType] = useState<string>("Half Yearly");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [settings, setSettings] = useState<{ schoolName: string; classTeacherName: string; principalName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("marks");
  const [selectedSubject, setSelectedSubject] = useState<string>(SUBJECTS[0]);
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/results?examType=${encodeURIComponent(examType)}`).then(r => r.json()),
      fetch("/api/settings").then(r => r.json()).catch(() => ({})),
    ]).then(([d, s]) => {
      setResults(d.results || []);
      setSettings(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [examType]);

  const withMarks = results.filter((r): r is StudentResult => r.hasMarks === true);
  const filtered = sectionFilter === "all" ? withMarks : withMarks.filter(r => r.section === sectionFilter);
  const displayData = tab === "subject"
    ? filtered.filter(s => s.subjects.find(x => x.subject === selectedSubject && x.total > 0))
    : filtered;

  const sorted = [...displayData].sort((a, b) => {
    if (tab === "gpa") return b.gpa - a.gpa;
    if (tab === "cq") return b.totalCq - a.totalCq;
    if (tab === "mcq") return b.totalMcq - a.totalMcq;
    if (tab === "subject") {
      const aT = a.subjects.find(x => x.subject === selectedSubject && x.total > 0)?.total ?? -1;
      const bT = b.subjects.find(x => x.subject === selectedSubject && x.total > 0)?.total ?? -1;
      if (aT < 0 && bT < 0) return 0;
      if (aT < 0) return 1;
      if (bT < 0) return -1;
      return bT - aT;
    }
    return b.totalObtained - a.totalObtained;
  });

  // Simple sequential ranking — #1, #2, #3...
  const ranked = sorted.map((s, i) => ({ ...s, displayRank: i + 1 }));

  const toggleExpand = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const downloadPDF = (student: StudentResult) => {
    const studentSubjects = student.subjects.filter(s => s.total > 0).map(s => {
      const m = calculateWeightedFinal(s.cq, s.mcq, 0);
      return {
        subject: s.subject, cq: s.cq, mcq: s.mcq, examTotal: m.examTotal,
        weighted80: m.weighted80, monthly: 0, finalMark: m.finalMark, grade: m.grade, gp: m.gp, pass: m.pass,
      };
    });
    const data: ReportCardData = {
      schoolName: settings?.schoolName || "Bir Uttam Shaheed Samad School & College",
      examType, studentName: student.name, rollNumber: student.rollNumber,
      studentId: "", section: student.section || "Dahlia (B)",
      fatherName: (student as any).fatherName || "", motherName: (student as any).motherName || "",
      className: "Class VIII — Dahlia (B)",
      subjects: studentSubjects,
      totalMarks: student.totalObtained, maxTotal: student.maxPossibleTotal,
      gpa: student.gpa, overallGrade: student.overallGrade,
      rank: student.rank, passed: student.overallPass,
      classTeacher: settings?.classTeacherName || "", principalName: settings?.principalName || "",
    };
    const doc = generateReportCardPDF(data);
    doc.save(`Report-${student.rollNumber}-${student.name.replace(/\s+/g, "_")}.pdf`);
  };

  const handleExport = () => {
    const header = "Rank,Roll,Section,Name,Total Marks,GPA,Grade,Status";
    const rows = ranked.map(s => `${s.displayRank},${s.rollNumber},${s.section},${s.name},${s.totalObtained},${s.gpa.toFixed(2)},${s.overallGrade},${s.overallPass ? "PASS" : "FAIL"}`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leaderboard-${examType}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const handleBatchPDF = async () => {
    setPrinting(true);
    for (const s of ranked) {
      downloadPDF(s);
    }
    setPrinting(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Leaderboard</h1>
          <p className="text-sm text-muted">
            {withMarks.length > 0 && <span>{withMarks.length} students with marks</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="px-4 py-2.5 rounded-2xl text-sm font-semibold liquid-glass-sm text-charcoal hover:bg-white/60 transition-all flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            CSV
          </button>
          <button onClick={handleBatchPDF} disabled={printing}
            className="gradient-royal text-white px-4 py-2.5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-royal/25 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            {printing ? "Printing..." : "Batch PDF"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAM_TYPES.map(exam => (
          <button key={exam} onClick={() => setExamType(exam)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${examType === exam ? "gradient-royal text-white shadow-lg shadow-royal/25" : "liquid-glass-sm text-muted hover:text-charcoal"}`}
          >{exam}</button>
        ))}
      </div>

      <div className="liquid-glass rounded-2xl p-2 flex flex-wrap gap-1 items-center">
        {(["marks", "gpa", "cq", "mcq", "subject"] as TabType[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold capitalize transition-all ${tab === t ? "gradient-royal text-white" : "text-muted hover:text-charcoal"}`}
          >{t === "subject" ? "By Subject" : t === "marks" ? "By Marks" : t.toUpperCase()}</button>
        ))}
        {tab === "subject" && (
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
            className="ml-2 px-3 py-2 rounded-2xl text-sm bg-white/40 border border-white/40 backdrop-blur-sm">
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <div className="ml-auto flex gap-1">
          {["all", "shapla", "dahlia"].map(s => (
            <button key={s} onClick={() => setSectionFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${sectionFilter === s ? "gradient-royal text-white" : "text-muted hover:text-charcoal"}`}
            >{s === "all" ? "All" : s === "shapla" ? "🌺 Shapla" : "🌸 Dahlia"}</button>
          ))}
        </div>
      </div>

      <div className="liquid-glass-strong rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-14 rounded-xl skeleton" />)}</div>
        ) : ranked.length === 0 ? (
          <div className="py-16 text-center text-muted text-sm">
            <div className="w-16 h-16 rounded-3xl bg-amber/10 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
            </div>
            <p className="text-base font-semibold text-charcoal mb-1">No results available</p>
            <p className="text-sm text-muted">Enter marks for students in the Mark Entry page first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider w-12">Rank</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Student</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell w-16">Roll</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell w-20">Section</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Total Marks</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider w-20">GPA</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider w-16">Grade</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider w-16">Status</th>
                  <th className="text-right px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(s => {
                  const isTop3 = s.displayRank <= 3;
                  const isExpanded = expandedRows.has(s.studentId);
                  return (
                    <>
                      <tr key={s.studentId} className="border-b border-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(s.studentId)}>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold ${isTop3 ? ["bg-amber/15 text-amber", "bg-gray-500/10 text-gray-500", "bg-orange-500/15 text-orange-600"][s.displayRank - 1] : "text-muted"}`}>
                            {isTop3 ? ["🥇", "🥈", "🥉"][s.displayRank - 1] : `#${s.displayRank}`}
                          </span>
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
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${s.section === "shapla" ? "bg-rose-50 text-rose-600" : "bg-purple-50 text-purple-600"}`}>
                            {s.section === "shapla" ? "🌺 Shapla" : "🌸 Dahlia"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-sm font-bold text-charcoal">
                          {s.totalObtained}<span className="text-muted font-normal">/{s.maxPossibleTotal}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-sm font-bold ${s.gpa >= 5 ? "text-emerald" : s.gpa >= 4 ? "text-royal" : s.gpa >= 3 ? "text-amber" : s.gpa >= 2 ? "text-orange-500" : s.gpa > 0 ? "text-crimson" : "text-gray-400"}`}>
                            {s.gpa.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold" style={{
                            backgroundColor: `${GRADE_COLORS[s.overallGrade] || "#6B7280"}18`,
                            color: GRADE_COLORS[s.overallGrade] || "#6B7280"
                          }}>{s.overallGrade}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${s.overallPass ? "bg-emerald/10 text-emerald" : "bg-crimson/10 text-crimson"}`}>
                            {s.overallPass ? "PASS" : "FAIL"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={(e) => { e.stopPropagation(); downloadPDF(s); }}
                            className="p-2 rounded-xl bg-royal/10 text-royal hover:bg-royal/20 transition-all" title="Download PDF">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${s.studentId}-detail`} className="bg-royal/[0.02]">
                          <td colSpan={9} className="p-4">
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {s.subjects.filter(x => x.total > 0).map(sub => {
                                const w = calculateWeightedFinal(sub.cq, sub.mcq, 0);
                                return (
                                  <div key={sub.subject} className="bg-white/50 rounded-xl p-3 border border-white/60">
                                    <p className="text-xs font-bold text-charcoal mb-1">{sub.subject}</p>
                                    <div className="grid grid-cols-4 gap-1 text-[10px]">
                                      <div><span className="text-muted">CQ:</span> <span className="font-semibold">{sub.cq}</span></div>
                                      <div><span className="text-muted">MCQ:</span> <span className="font-semibold">{sub.mcq}</span></div>
                                      <div><span className="text-muted">80%:</span> <span className="font-semibold">{w.weighted80.toFixed(1)}</span></div>
                                      <div><span className="text-muted">Final:</span> <span className="font-semibold">{w.finalMark}</span></div>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-[10px] font-bold" style={{ color: GRADE_COLORS[w.grade] }}>{w.grade}</span>
                                      <span className="text-[10px] text-muted">GP: {w.gp.toFixed(2)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {results.filter(r => !r.hasMarks).length > 0 && ranked.length > 0 && (
        <div className="liquid-glass rounded-2xl p-4 text-center text-sm text-muted">
          <span className="font-medium">{results.filter(r => !r.hasMarks).length} student(s)</span> have no marks yet.
        </div>
      )}
    </div>
  );
}
