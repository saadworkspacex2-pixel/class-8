"use client";

import { useState, useEffect } from "react";
import { EXAM_TYPES, SUBJECTS, GRADE_COLORS } from "@/lib/constants";

interface SubjectResult {
  subject: string; cq: number; mcq: number; total: number; maxTotal: number;
  grade: string; pass: boolean; hasMark: boolean;
}

interface StudentResult {
  studentId: number;
  name: string;
  rollNumber: number;
  section: string;
  profilePicture: string;
  totalObtained: number;
  maxPossibleTotal: number;
  average: number;
  overallGrade: string;
  gpa: number;
  overallPass: boolean;
  rank: number | null;
  cqRank: number | null;
  mcqRank: number | null;
  subjects: SubjectResult[];
  gradedSubjectsCount: number;
  hasMarks: boolean;
  subjectRanks?: Record<string, number | null>;
}

type TabType = "overall" | "cq" | "mcq" | "subject";

export default function LeaderboardPage() {
  const [examType, setExamType] = useState<string>("Half Yearly");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("overall");
  const [selectedSubject, setSelectedSubject] = useState<string>(SUBJECTS[0]);
  const [sectionFilter, setSectionFilter] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/results?examType=${encodeURIComponent(examType)}`)
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [examType]);

  // Only students WITH marks
  const withMarks = results.filter((r): r is StudentResult => r.hasMarks === true);

  // Filter by section
  const filtered = sectionFilter === "all"
    ? withMarks
    : withMarks.filter((r) => r.section === sectionFilter);

  // For subject tab, filter out students without marks in that subject
  const displayData = tab === "subject"
    ? filtered.filter((s) => s.subjects.find((x) => x.subject === selectedSubject && x.hasMark))
    : filtered;

  // Sort and assign ranks server-side uses calculateRanks which does:
  // same value = same rank, next rank = current_position + 1
  const getRank = (s: StudentResult): number | null => {
    if (tab === "cq") return s.cqRank;
    if (tab === "mcq") return s.mcqRank;
    if (tab === "subject") return s.subjectRanks?.[selectedSubject] ?? null;
    return s.rank;
  };

  const getVal = (s: StudentResult): number | string => {
    if (tab === "cq") return s.subjects.reduce((sum, x) => sum + x.cq, 0);
    if (tab === "mcq") return s.subjects.reduce((sum, x) => sum + x.mcq, 0);
    if (tab === "subject") {
      return s.subjects.find((x) => x.subject === selectedSubject && x.hasMark)?.total ?? 0;
    }
    return s.gpa;
  };

  const handleExport = () => {
    const header = "Rank,Name,Roll,Section,GPA,Grade,Graded Subjects";
    const rows = displayData.map((s) =>
      `${getRank(s) || "-"},${s.name},${s.rollNumber},${s.section},${s.gpa.toFixed(2)},${s.overallGrade},${s.gradedSubjectsCount}/${SUBJECTS.length}`
    );
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
          <p className="text-sm text-muted">
            Ranked by GPA — same GPA shares the same rank
            {withMarks.length > 0 && <span className="text-royal font-semibold"> · {withMarks.length} students with marks</span>}
          </p>
        </div>
        <button onClick={handleExport}
          className="px-5 py-2.5 rounded-2xl text-sm font-semibold liquid-glass-sm text-charcoal hover:bg-white/60 transition-all flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      <div className="liquid-glass rounded-2xl p-2 flex flex-wrap gap-1 items-center">
        {(["overall", "cq", "mcq", "subject"] as TabType[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold capitalize transition-all ${tab === t ? "gradient-royal text-white" : "text-muted hover:text-charcoal"}`}
          >{t === "subject" ? "By Subject" : t === "overall" ? "By GPA" : t.toUpperCase()}</button>
        ))}
        {tab === "subject" && (
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
            className="ml-2 px-3 py-2 rounded-2xl text-sm bg-white/40 border border-white/40 backdrop-blur-sm">
            {SUBJECTS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        )}
        <div className="ml-auto flex gap-1">
          {["all", "shapla", "dahlia"].map((s) => (
            <button key={s} onClick={() => setSectionFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                sectionFilter === s ? "gradient-royal text-white" : "text-muted hover:text-charcoal"
              }`}>
              {s === "all" ? "All" : s === "shapla" ? "🌺 Shapla" : "🌸 Dahlia"}
            </button>
          ))}
        </div>
      </div>

      <div className="liquid-glass-strong rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(8)].map((_, i) => (<div key={i} className="h-14 rounded-xl skeleton" />))}</div>
        ) : displayData.length === 0 ? (
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
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4 w-16">Rank</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4">Student</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4 hidden md:table-cell w-16">Roll</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4 hidden md:table-cell w-20">Section</th>
                  {tab !== "overall" && (
                    <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4">
                      {tab === "cq" ? "CQ" : tab === "mcq" ? "MCQ" : "Marks"}
                    </th>
                  )}
                  <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4 w-24">GPA</th>
                  <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4 w-16">Grade</th>
                  <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4 w-20">Subjects</th>
                  <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4 w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((s) => {
                  const rank = getRank(s);
                  const displayRank = rank ?? displayData.indexOf(s) + 1;
                  const isTop3 = displayRank <= 3;
                  return (
                    <tr key={s.studentId} className="border-b border-white/10 hover:bg-white/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold ${
                          displayRank === 1 ? "bg-amber/15 text-amber" : displayRank === 2 ? "bg-gray-500/10 text-gray-500" : displayRank === 3 ? "bg-orange-500/15 text-orange-600" : "text-muted"
                        }`}>
                          {isTop3 ? ["🥇", "🥈", "🥉"][displayRank - 1] : `#${displayRank}`}
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
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                          s.section === "shapla" ? "bg-rose-50 text-rose-600" : "bg-purple-50 text-purple-600"
                        }`}>{s.section === "shapla" ? "🌺 Shapla" : "🌸 Dahlia"}</span>
                      </td>
                      {tab !== "overall" && (
                        <td className="py-3 px-4 text-right text-sm font-bold text-charcoal">
                          {tab === "subject"
                            ? (s.subjects.find((x) => x.subject === selectedSubject && x.hasMark)?.total ?? "—")
                            : (tab === "cq" ? s.subjects.reduce((sum, x) => sum + x.cq, 0) : s.subjects.reduce((sum, x) => sum + x.mcq, 0))}
                        </td>
                      )}
                      <td className="py-3 px-4 text-center">
                        <span className={`text-lg font-black ${
                          s.gpa >= 5 ? "text-emerald" : s.gpa >= 4 ? "text-royal" : s.gpa >= 3 ? "text-amber" : s.gpa >= 2 ? "text-orange-500" : s.gpa > 0 ? "text-crimson" : "text-gray-400"
                        }`}>{s.gpa.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold" style={{
                          backgroundColor: s.overallGrade === "N/A" ? "#6B728018" : `${GRADE_COLORS[s.overallGrade] || "#6B7280"}18`,
                          color: s.overallGrade === "N/A" ? "#6B7280" : GRADE_COLORS[s.overallGrade] || "#6B7280"
                        }}>{s.overallGrade}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs font-medium text-muted">{s.gradedSubjectsCount}/{SUBJECTS.length}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${s.overallPass ? "bg-emerald/10 text-emerald" : "bg-crimson/10 text-crimson"}`}>{s.overallPass ? "PASS" : "FAIL"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {results.filter((r) => !r.hasMarks).length > 0 && displayData.length > 0 && (
        <div className="liquid-glass rounded-2xl p-4 text-center text-sm text-muted">
          <span className="font-medium">{results.filter((r) => !r.hasMarks).length} student(s)</span> have no marks yet and are not shown in the leaderboard.
        </div>
      )}
    </div>
  );
}
