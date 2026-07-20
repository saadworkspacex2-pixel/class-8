"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { EXAM_TYPES, SUBJECTS, getSubjectMaxForExam, isMonthlyExam } from "@/lib/constants";
import { toast } from "@/components/Toast";

interface Student {
  id: number;
  name: string;
  rollNumber: number;
}

interface MarkEntry {
  studentId: number;
  studentName: string;
  rollNumber: number;
  cq: string;
  mcq: string;
  total: number;
  hasError: boolean;
}

export default function MarkEntryPage() {
  const [examType, setExamType] = useState<string>(EXAM_TYPES[0]);
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [entries, setEntries] = useState<MarkEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customMarks, setCustomMarks] = useState<Record<string, Record<string, number>> | null>(null);
  const [undoStack, setUndoStack] = useState<MarkEntry[][]>([]);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const config = getSubjectMaxForExam(subject, examType, customMarks);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, marksRes, settingsRes] = await Promise.all([
        fetch("/api/students"),
        fetch(`/api/marks?examType=${encodeURIComponent(examType)}&subject=${encodeURIComponent(subject)}`),
        fetch("/api/settings"),
      ]);
      const studentsData: Student[] = await studentsRes.json();
      const marksData = await marksRes.json();
      const settingsData = await settingsRes.json();

      setCustomMarks(settingsData.examFullMarks || null);
      const cfg = getSubjectMaxForExam(subject, examType, settingsData.examFullMarks);

      const newEntries: MarkEntry[] = studentsData.map((s: Student) => {
        const mark = marksData.find((m: { studentId: number }) => m.studentId === s.id);
        const cqVal = mark?.cq?.toString() ?? "";
        const mcqVal = mark?.mcq?.toString() ?? "";
        const cqNum = parseFloat(cqVal) || 0;
        const mcqNum = parseFloat(mcqVal) || 0;
        return {
          studentId: s.id,
          studentName: s.name,
          rollNumber: s.rollNumber,
          cq: cqVal,
          mcq: cfg.hasMcq ? mcqVal : "0",
          total: cqNum + mcqNum,
          hasError: false,
        };
      });

      setEntries(newEntries);
    } catch {
      toast("Failed to load data", "error");
    }
    setLoading(false);
  }, [examType, subject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const validate = useCallback(
    (entry: MarkEntry): MarkEntry => {
      const cfg = getSubjectMaxForExam(subject, examType, customMarks);
      const cqNum = parseFloat(entry.cq) || 0;
      const mcqNum = cfg.hasMcq ? parseFloat(entry.mcq) || 0 : 0;
      const total = cqNum + mcqNum;
      const hasError =
        cqNum < 0 || cqNum > cfg.cqMax ||
        mcqNum < 0 || mcqNum > cfg.mcqMax ||
        (entry.cq !== "" && isNaN(parseFloat(entry.cq))) ||
        (cfg.hasMcq && entry.mcq !== "" && isNaN(parseFloat(entry.mcq)));
      return { ...entry, total, hasError };
    },
    [subject, examType, customMarks]
  );

  const handleCellChange = (index: number, field: "cq" | "mcq", value: string) => {
    setUndoStack((prev) => [...prev.slice(-20), [...entries]]);
    setEntries((prev) => {
      const next = [...prev];
      next[index] = validate({ ...next[index], [field]: value });
      return next;
    });
  };

  const handlePaste = (e: React.ClipboardEvent, startIndex: number, field: "cq" | "mcq") => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    const rows = text.split(/\n/).map((r) => r.split(/\t/));
    setUndoStack((prev) => [...prev.slice(-20), [...entries]]);
    setEntries((prev) => {
      const next = [...prev];
      for (let i = 0; i < rows.length && startIndex + i < next.length; i++) {
        const cols = rows[i];
        if (cols[0] !== undefined) {
          next[startIndex + i] = validate({ ...next[startIndex + i], [field]: cols[0].trim() });
        }
        if (cols[1] !== undefined && field === "cq" && config.hasMcq) {
          next[startIndex + i] = validate({ ...next[startIndex + i], mcq: cols[1].trim() });
        }
      }
      return next;
    });
    toast("Pasted from clipboard", "info");
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: "cq" | "mcq") => {
    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      inputRefs.current.get(`${index + 1}-${field}`)?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      inputRefs.current.get(`${index - 1}-${field}`)?.focus();
    } else if (e.key === "Tab" && !e.shiftKey && field === "cq" && config.hasMcq) {
      e.preventDefault();
      inputRefs.current.get(`${index}-mcq`)?.focus();
    } else if (e.key === "Tab" && e.shiftKey && field === "mcq") {
      e.preventDefault();
      inputRefs.current.get(`${index}-cq`)?.focus();
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    setEntries(undoStack[undoStack.length - 1]);
    setUndoStack((s) => s.slice(0, -1));
    toast("Undone", "info");
  };

  const handleSaveAll = async () => {
    if (entries.some((e) => e.hasError)) return toast("Fix errors before saving", "error");
    setSaving(true);
    try {
      const cfg = getSubjectMaxForExam(subject, examType, customMarks);
      const payload = entries
        .filter((e) => e.cq !== "" || e.mcq !== "")
        .map((e) => ({
          studentId: e.studentId,
          examType,
          subject,
          cq: parseFloat(e.cq) || 0,
          mcq: cfg.hasMcq ? parseFloat(e.mcq) || 0 : 0,
          total: (parseFloat(e.cq) || 0) + (cfg.hasMcq ? parseFloat(e.mcq) || 0 : 0),
        }));
      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: payload }),
      });
      if (res.ok) toast("All marks saved!", "success");
      else toast("Save failed", "error");
    } catch {
      toast("Network error", "error");
    }
    setSaving(false);
  };

  const monthlyExam = isMonthlyExam(examType);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Mark Entry</h1>
        <p className="text-sm text-muted">Excel-like spreadsheet for fast mark entry</p>
      </div>

      {/* Selectors */}
      <div className="liquid-glass-strong rounded-3xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-charcoal mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              Examination
            </label>
            <div className="flex flex-wrap gap-2">
              {EXAM_TYPES.map((exam) => (
                <button
                  key={exam}
                  onClick={() => setExamType(exam)}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${
                    examType === exam
                      ? "gradient-royal text-white shadow-lg shadow-royal/25"
                      : "liquid-glass-sm text-muted hover:text-charcoal"
                  }`}
                >
                  {exam}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-charcoal mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm font-medium backdrop-blur-sm"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Config Info */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-royal/10 text-royal font-semibold flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            CQ: {config.cqMax}
          </span>
          {config.hasMcq && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald/10 text-emerald font-semibold flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              MCQ: {config.mcqMax}
            </span>
          )}
          <span className="px-3 py-1.5 rounded-xl bg-amber/10 text-amber font-semibold flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/></svg>
            Total: {config.totalMax}
          </span>
          {monthlyExam && (
            <span className="px-3 py-1.5 rounded-xl bg-crimson/10 text-crimson font-semibold">
              Monthly Test — No MCQ
            </span>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="gradient-royal text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-royal/25 flex items-center gap-2"
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save All</>
          )}
        </button>
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="px-5 py-3 rounded-2xl text-sm font-semibold liquid-glass-sm text-muted hover:text-charcoal transition-all disabled:opacity-40 flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          Undo
        </button>
      </div>

      {/* Spreadsheet */}
      <div className="liquid-glass-strong rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl skeleton" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4 w-16">Roll</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4">Name</th>
                  <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4 w-28">
                    CQ <span className="text-royal">({config.cqMax})</span>
                  </th>
                  {config.hasMcq && (
                    <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4 w-28">
                      MCQ <span className="text-emerald">({config.mcqMax})</span>
                    </th>
                  )}
                  <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider py-4 px-4 w-24">
                    Total <span className="text-amber">({config.totalMax})</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr
                    key={entry.studentId}
                    className={`border-b border-white/10 transition-colors ${
                      entry.hasError ? "bg-crimson/5" : "hover:bg-white/20"
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      <span className="text-sm font-bold text-royal">{entry.rollNumber}</span>
                    </td>
                    <td className="py-2.5 px-4 text-sm font-medium text-charcoal">{entry.studentName}</td>
                    <td className="py-2.5 px-4">
                      <input
                        ref={(el) => { if (el) inputRefs.current.set(`${idx}-cq`, el); }}
                        type="number"
                        min="0"
                        max={config.cqMax}
                        step="0.5"
                        value={entry.cq}
                        onChange={(e) => handleCellChange(idx, "cq", e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, "cq")}
                        onKeyDown={(e) => handleKeyDown(e, idx, "cq")}
                        className={`w-full px-3 py-2.5 rounded-xl border text-center text-sm font-medium transition-all ${
                          entry.hasError
                            ? "border-crimson/50 bg-crimson/10 text-crimson"
                            : "border-white/40 bg-white/40 text-charcoal"
                        }`}
                        placeholder="0"
                      />
                    </td>
                    {config.hasMcq && (
                      <td className="py-2.5 px-4">
                        <input
                          ref={(el) => { if (el) inputRefs.current.set(`${idx}-mcq`, el); }}
                          type="number"
                          min="0"
                          max={config.mcqMax}
                          step="0.5"
                          value={entry.mcq}
                          onChange={(e) => handleCellChange(idx, "mcq", e.target.value)}
                          onPaste={(e) => handlePaste(e, idx, "mcq")}
                          onKeyDown={(e) => handleKeyDown(e, idx, "mcq")}
                          className={`w-full px-3 py-2.5 rounded-xl border text-center text-sm font-medium transition-all ${
                            entry.hasError
                              ? "border-crimson/50 bg-crimson/10 text-crimson"
                              : "border-white/40 bg-white/40 text-charcoal"
                          }`}
                          placeholder="0"
                        />
                      </td>
                    )}
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-sm font-bold ${
                        entry.total > config.totalMax ? "text-crimson" : "text-charcoal"
                      }`}>
                        {entry.total}
                      </span>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={config.hasMcq ? 5 : 4} className="py-16 text-center text-muted text-sm">
                      <div className="w-16 h-16 rounded-3xl bg-royal/10 flex items-center justify-center mx-auto mb-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#006FEE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </div>
                      No students found. Add students first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
