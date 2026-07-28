"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { EXAM_TYPES, GRADE_COLORS, SECTIONS, calculateWeightedFinal } from "@/lib/constants";
import { generateReportCardPDF, type ReportCardData } from "@/lib/pdfGenerator";

interface SubjectResult { subject: string; cq: number; mcq: number; total: number; maxTotal: number; grade: string; pass: boolean; }
interface StudentResult {
  studentId: number; name: string; rollNumber: number; section: string; profilePicture: string;
  totalObtained: number; maxPossibleTotal: number; average: number; overallGrade: string;
  gpa: number; overallPass: boolean; rank: number | null; subjects: SubjectResult[];
  gradedSubjectsCount: number; totalSubjects: number; hasMarks: boolean;
  fatherName?: string; motherName?: string; studentIdDisplay?: string;
}
interface Settings { schoolName: string; schoolLogo: string; principalName: string; classTeacherName: string; academicYear: string; }

export default function ReportsPage() {
  const [examType, setExamType] = useState<string>("Half Yearly");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewStudent, setPreviewStudent] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/results?examType=${encodeURIComponent(examType)}`).then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(([r, s]) => { setResults(r.results || []); setSettings(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [examType]);

  const student = results.find(r => r.studentId === selectedStudent);

  const withMarks = results.filter(r => r.hasMarks);
  const filtered = withMarks
    .filter(r => sectionFilter === "all" || r.section === sectionFilter)
    .filter(r => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.rollNumber.toString().includes(q);
    })
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

  const buildReportData = (s: StudentResult): ReportCardData => {
    const studentSubjects = s.subjects.filter(sub => sub.total > 0).map(sub => {
      // Use monthly=0 as default since monthly isn't in the subject result from API
      // In practice monthly marks come from the 1st Monthly exam marks
      const w = calculateWeightedFinal(sub.cq, sub.mcq, 0);
      return {
        subject: sub.subject, cq: sub.cq, mcq: sub.mcq,
        examTotal: w.examTotal, weighted80: w.weighted80,
        monthly: 0, finalMark: w.finalMark, grade: w.grade, gp: w.gp, pass: w.pass,
      };
    });
    return {
      schoolName: settings?.schoolName || "Bir Uttam Shaheed Samad School & College",
      examType, studentName: s.name, rollNumber: s.rollNumber,
      studentId: (s as any).studentId || "", section: s.section || "Dahlia (B)",
      fatherName: (s as any).fatherName || "", motherName: (s as any).motherName || "",
      className: "Class VIII — Dahlia (B)",
      subjects: studentSubjects, totalMarks: s.totalObtained, maxTotal: s.maxPossibleTotal,
      gpa: s.gpa, overallGrade: s.overallGrade, rank: s.rank, passed: s.overallPass,
      classTeacher: settings?.classTeacherName || "", principalName: settings?.principalName || "",
    };
  };

  const downloadPDF = (s: StudentResult) => {
    const data = buildReportData(s);
    const doc = generateReportCardPDF(data);
    doc.save(`Report-${s.rollNumber}-${s.name.replace(/\s+/g, "_")}.pdf`);
  };

  const handleBatchPDF = async () => {
    setGenerating(true);
    for (const s of filtered) {
      downloadPDF(s);
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Reports</h1>
          <p className="text-sm text-muted">Generate, preview and print report cards</p>
        </div>
        <div className="flex gap-2">
          {filtered.length > 0 && (
            <button onClick={handleBatchPDF} disabled={generating}
              className="gradient-royal text-white px-5 py-2.5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-royal/25 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {generating ? "Generating..." : `Batch PDF (${filtered.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="liquid-glass-strong rounded-3xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {EXAM_TYPES.map(exam => (
            <button key={exam} onClick={() => setExamType(exam)}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${examType === exam ? "gradient-royal text-white shadow-lg shadow-royal/25" : "liquid-glass-sm text-muted hover:text-charcoal"}`}
            >{exam}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1">
            {["all", ...SECTIONS].map(s => (
              <button key={s} onClick={() => setSectionFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${sectionFilter === s ? "gradient-royal text-white" : "liquid-glass-sm text-muted hover:text-charcoal"}`}
              >{s === "all" ? "All" : s === "shapla" ? "🌺 Shapla" : "🌸 Dahlia"}</button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search by name or roll..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-white/40 bg-white/40 backdrop-blur-sm outline-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl skeleton" />)}</div>
      ) : (
        <>
          {/* Student Cards */}
          {filtered.length === 0 ? (
            <div className="liquid-glass rounded-3xl p-12 text-center text-muted text-sm">
              No students found with marks for {examType}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(s => (
                <motion.div key={s.studentId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="liquid-glass rounded-2xl p-4 card-premium">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {s.profilePicture ? (
                        <img src={s.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50" />
                      ) : (
                        <div className="w-10 h-10 rounded-full gradient-royal flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/50">{s.name.charAt(0)}</div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-charcoal">{s.name}</p>
                        <p className="text-[10px] text-muted">Roll {s.rollNumber} · {s.section === "shapla" ? "🌺 Shapla" : "🌸 Dahlia"}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${s.overallPass ? "bg-emerald/10 text-emerald" : "bg-crimson/10 text-crimson"}`}>
                      {s.overallPass ? "PASS" : "FAIL"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    <div className="bg-white/40 rounded-xl p-2">
                      <p className="text-muted text-[9px]">Total</p>
                      <p className="font-bold text-charcoal">{s.totalObtained}/{s.maxPossibleTotal}</p>
                    </div>
                    <div className="bg-white/40 rounded-xl p-2">
                      <p className="text-muted text-[9px]">GPA</p>
                      <p className="font-bold text-charcoal">{s.gpa.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/40 rounded-xl p-2">
                      <p className="text-muted text-[9px]">Grade</p>
                      <p className="font-bold" style={{ color: GRADE_COLORS[s.overallGrade] }}>{s.overallGrade}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedStudent(s.studentId)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-royal/10 text-royal hover:bg-royal/20 transition-all">
                      Preview
                    </button>
                    <button onClick={() => downloadPDF(s)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald/10 text-emerald hover:bg-emerald/20 transition-all">
                      Download PDF
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Report Card Preview Modal */}
          {selectedStudent && student && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
              <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={() => setSelectedStudent(null)} />
              <div className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-border">
                  <h3 className="text-sm font-bold text-charcoal">Report Card Preview</h3>
                  <div className="flex gap-2">
                    <button onClick={() => { downloadPDF(student); }}
                      className="gradient-royal text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      PDF
                    </button>
                    <button onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-sm text-charcoal hover:bg-white/60 transition-all flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      Print
                    </button>
                  </div>
                </div>
                <div className="p-6 md:p-10" id="report-card-preview">
                  {/* School Header */}
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-charcoal">{settings?.schoolName || "Bir Uttam Shaheed Samad School & College"}</h2>
                    <p className="text-xs text-muted">Class VIII — Dahlia (B) | Academic Result Card</p>
                    <p className="text-sm font-bold text-royal mt-1">{examType} Examination</p>
                  </div>

                  {/* Student Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-6 bg-slate-50 rounded-2xl p-4">
                    <div><span className="text-muted">Name:</span> <span className="font-semibold ml-1">{student.name}</span></div>
                    <div><span className="text-muted">Roll:</span> <span className="font-semibold ml-1">{student.rollNumber}</span></div>
                    <div><span className="text-muted">Section:</span> <span className="font-semibold ml-1">{student.section === "shapla" ? "Shapla" : "Dahlia"}</span></div>
                    <div><span className="text-muted">Rank:</span> <span className="font-semibold ml-1 text-royal">{student.rank ? `#${student.rank}` : "—"}</span></div>
                  </div>

                  {/* Marks Table */}
                  <table className="w-full text-xs border-collapse mb-6">
                    <thead>
                      <tr className="bg-charcoal text-white">
                        <th className="py-2.5 px-3 text-left">Subject</th>
                        <th className="py-2.5 px-3 text-center">CQ</th>
                        <th className="py-2.5 px-3 text-center">MCQ</th>
                        <th className="py-2.5 px-3 text-center">Exam Total</th>
                        <th className="py-2.5 px-3 text-center">80% Weight</th>
                        <th className="py-2.5 px-3 text-center">Monthly</th>
                        <th className="py-2.5 px-3 text-center">Final Mark</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-center">GP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.subjects.filter(s => s.total > 0).map((sub, idx) => {
                        const w = calculateWeightedFinal(sub.cq, sub.mcq, 0);
                        return (
                          <tr key={sub.subject} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="py-2 px-3 font-medium">{sub.subject}</td>
                            <td className="py-2 px-3 text-center">{sub.cq}</td>
                            <td className="py-2 px-3 text-center">{sub.mcq}</td>
                            <td className="py-2 px-3 text-center font-semibold">{w.examTotal}</td>
                            <td className="py-2 px-3 text-center">{w.weighted80.toFixed(1)}</td>
                            <td className="py-2 px-3 text-center">0</td>
                            <td className={`py-2 px-3 text-center font-bold ${w.pass ? "text-charcoal" : "text-crimson"}`}>{w.finalMark}</td>
                            <td className="py-2 px-3 text-center">
                              <span className="font-bold" style={{ color: GRADE_COLORS[w.grade] }}>{w.grade}</span>
                            </td>
                            <td className="py-2 px-3 text-center font-bold">{w.gp.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-charcoal/90 text-white font-bold">
                        <td className="py-3 px-3">Grand Total</td>
                        <td colSpan={3} className="py-3 px-3 text-center">{student.totalObtained}/{student.maxPossibleTotal}</td>
                        <td colSpan={3} className="py-3 px-3 text-center">GPA: {student.gpa.toFixed(2)} | Grade: {student.overallGrade}</td>
                        <td colSpan={2} className="py-3 px-3 text-center">
                          <span className={student.overallPass ? "text-emerald" : "text-crimson"}>
                            {student.overallPass ? "PASSED" : "FAILED"}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Signature */}
                  <div className="grid grid-cols-4 gap-4 pt-6 border-t border-border text-xs text-center">
                    <div><div className="border-b border-charcoal mb-1 pb-6"></div><p className="text-muted">Class Teacher</p></div>
                    <div><div className="border-b border-charcoal mb-1 pb-6"></div><p className="text-muted">Exam Controller</p></div>
                    <div><div className="border-b border-charcoal mb-1 pb-6"></div><p className="text-muted">Principal</p></div>
                    <div><div className="border-b border-charcoal mb-1 pb-6"></div><p className="text-muted">Guardian</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
