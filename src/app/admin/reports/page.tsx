"use client";

import { useState, useEffect } from "react";
import { EXAM_TYPES, GRADE_COLORS } from "@/lib/constants";

interface SubjectResult { subject: string; cq: number; mcq: number; total: number; maxTotal: number; grade: string; pass: boolean; }
interface StudentResult {
  studentId: number; name: string; rollNumber: number; totalObtained: number; maxPossibleTotal: number;
  average: number; overallGrade: string; overallPass: boolean; rank: number | null; subjects: SubjectResult[]; hasMarks: boolean;
}
interface Settings { schoolName: string; schoolLogo: string; principalName: string; classTeacherName: string; academicYear: string; }

export default function ReportsPage() {
  const [examType, setExamType] = useState<string>(EXAM_TYPES[0]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/results?examType=${encodeURIComponent(examType)}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([r, s]) => { setResults(r.results || []); setSettings(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [examType]);

  const student = results.find((r) => r.studentId === selectedStudent);

  const handleExportCSV = () => {
    const header = "Roll,Name,Total,Average,Grade,Status";
    const rows = results.filter((r) => r.hasMarks).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
      .map((s) => `${s.rollNumber},${s.name},${s.totalObtained}/${s.maxPossibleTotal},${s.average}%,${s.overallGrade},${s.overallPass ? "PASS" : "FAIL"}`);
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `results-${examType}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Reports</h1>
          <p className="text-sm text-muted">Generate and print report cards</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="px-5 py-2.5 rounded-2xl text-sm font-semibold liquid-glass-sm text-charcoal hover:bg-white/60 transition-all flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          {student && (
            <button onClick={() => window.print()} className="gradient-royal text-white px-5 py-2.5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-royal/25 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAM_TYPES.map((exam) => (
          <button key={exam} onClick={() => setExamType(exam)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${examType === exam ? "gradient-royal text-white shadow-lg shadow-royal/25" : "liquid-glass-sm text-muted hover:text-charcoal"}`}
          >{exam}</button>
        ))}
      </div>

      <div className="liquid-glass rounded-3xl p-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-charcoal mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Select Student
        </label>
        <select value={selectedStudent ?? ""} onChange={(e) => setSelectedStudent(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm">
          <option value="">Select a student...</option>
          {results.filter((r) => r.hasMarks).map((r) => (<option key={r.studentId} value={r.studentId}>Roll {r.rollNumber} — {r.name}</option>))}
        </select>
      </div>

      {loading && <div className="space-y-4">{[...Array(5)].map((_, i) => (<div key={i} className="h-16 rounded-2xl skeleton" />))}</div>}

      {student && settings && (
        <div className="bg-white rounded-3xl card-shadow-lg p-8 md:p-12 max-w-3xl mx-auto" id="report-card">
          <div className="text-center border-b-2 border-charcoal pb-6 mb-6">
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl gradient-royal flex items-center justify-center shadow-lg">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-charcoal">{settings.schoolName || "Sunshine Academy"}</h1>
            <p className="text-sm text-muted mt-1">Academic Year: {settings.academicYear || "2025"}</p>
            <p className="text-lg font-semibold text-royal mt-2">REPORT CARD — {examType}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div><span className="text-muted">Student Name:</span> <span className="ml-2 font-semibold text-charcoal">{student.name}</span></div>
            <div><span className="text-muted">Roll Number:</span> <span className="ml-2 font-semibold text-charcoal">{student.rollNumber}</span></div>
            <div><span className="text-muted">Class:</span> <span className="ml-2 font-semibold text-charcoal">Class 8 — Dahlia (B)</span></div>
            <div><span className="text-muted">Rank:</span> <span className="ml-2 font-semibold text-royal">{student.rank ?? "N/A"}</span></div>
          </div>

          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="bg-charcoal text-white">
                <th className="py-3 px-4 text-left text-xs font-semibold">Subject</th>
                <th className="py-3 px-4 text-center text-xs font-semibold">CQ</th>
                <th className="py-3 px-4 text-center text-xs font-semibold">MCQ</th>
                <th className="py-3 px-4 text-center text-xs font-semibold">Total</th>
                <th className="py-3 px-4 text-center text-xs font-semibold">Grade</th>
              </tr>
            </thead>
            <tbody>
              {student.subjects.map((sub, idx) => (
                <tr key={sub.subject} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="py-2.5 px-4 text-sm font-medium text-charcoal">{sub.subject}</td>
                  <td className="py-2.5 px-4 text-center text-sm">{sub.cq}</td>
                  <td className="py-2.5 px-4 text-center text-sm">{sub.mcq}</td>
                  <td className="py-2.5 px-4 text-center text-sm font-semibold">{sub.total}/{sub.maxTotal}</td>
                  <td className="py-2.5 px-4 text-center"><span className="text-xs font-bold" style={{ color: GRADE_COLORS[sub.grade] || "#6B7280" }}>{sub.grade}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-charcoal text-white font-bold">
                <td className="py-3 px-4 text-sm">Grand Total</td>
                <td className="py-3 px-4 text-center text-sm" colSpan={2}></td>
                <td className="py-3 px-4 text-center text-sm">{student.totalObtained}/{student.maxPossibleTotal}</td>
                <td className="py-3 px-4 text-center text-sm">{student.overallGrade}</td>
              </tr>
            </tfoot>
          </table>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-xs text-muted">Average</p><p className="text-lg font-bold text-charcoal">{student.average}%</p></div>
            <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-xs text-muted">Grade</p><p className="text-lg font-bold" style={{ color: GRADE_COLORS[student.overallGrade] }}>{student.overallGrade}</p></div>
            <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-xs text-muted">Rank</p><p className="text-lg font-bold text-royal">{student.rank ?? "—"}</p></div>
            <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-xs text-muted">Result</p><p className={`text-lg font-bold ${student.overallPass ? "text-emerald" : "text-crimson"}`}>{student.overallPass ? "PASS" : "FAIL"}</p></div>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
            <div className="text-center"><div className="border-b border-charcoal mb-2 pb-8"></div><p className="text-xs text-muted">Class Teacher</p><p className="text-sm font-medium text-charcoal">{settings.classTeacherName || "____________"}</p></div>
            <div className="text-center"><div className="border-b border-charcoal mb-2 pb-8"></div><p className="text-xs text-muted">School Seal</p></div>
            <div className="text-center"><div className="border-b border-charcoal mb-2 pb-8"></div><p className="text-xs text-muted">Principal</p><p className="text-sm font-medium text-charcoal">{settings.principalName || "____________"}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
