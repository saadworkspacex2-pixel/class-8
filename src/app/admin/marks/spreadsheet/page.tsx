"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "@/components/Toast";
import { EXAM_TYPES, SUBJECTS, GPA_SUBJECTS, GPA_SUBJECT_MAP, SUBJECT_CONFIGS, DEFAULT_MONTHLY_FULL_MARKS } from "@/lib/constants";

interface Student {
  id: number; name: string; rollNumber: number; section: string;
}

interface MarkEntry {
  studentId: number; studentName: string; rollNumber: number; section: string;
  cq: string; mcq: string; rawTotal: number;
  weighted80: number; monthlyMT1: string; monthlyAvg: number;
  finalMark: number; grade: string; gp: number; passMark: number; maxTotal: number;
  hasError: boolean;
}

export default function SpreadsheetPage() {
  const [examType, setExamType] = useState<string>("Half Yearly");
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [entries, setEntries] = useState<MarkEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [undoStack, setUndoStack] = useState<MarkEntry[][]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [editPassMark, setEditPassMark] = useState<Record<string, number>>({});
  const [editTotalMax, setEditTotalMax] = useState<Record<string, number>>({});
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const config = SUBJECT_CONFIGS[subject] || { cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true };
  const hasMcq = config.hasMcq;
  // Paper-level max = (cqMax+mcqMax) * 0.8 + monthlyMax
  const mmolMax = DEFAULT_MONTHLY_FULL_MARKS[subject] || 20;
  const paperMaxTotal = Math.round(((config.cqMax + config.mcqMax) * 0.8 + mmolMax) * 100) / 100;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, marksRes, mt1Res] = await Promise.all([
        fetch("/api/students"),
        fetch(`/api/marks?examType=${encodeURIComponent(examType)}&subject=${encodeURIComponent(subject)}`),
        fetch(`/api/marks?examType=1st Monthly&subject=${encodeURIComponent(subject)}`),
      ]);
      const studentsData: Student[] = await studentsRes.json();
      const marksData = await marksRes.json();
      const mt1 = await mt1Res.json();

      const mmMax = DEFAULT_MONTHLY_FULL_MARKS[subject] || 20;
      const studentList = Array.isArray(studentsData) ? studentsData : [];

      const newEntries: MarkEntry[] = studentList.map((s: Student) => {
        const mark = (Array.isArray(marksData) ? marksData : []).find((m: any) => m.studentId === s.id);
        const m1 = (Array.isArray(mt1) ? mt1 : []).find((m: any) => m.studentId === s.id);
        const cqVal = mark?.cq?.toString() ?? "";
        const mcqVal = mark?.mcq?.toString() ?? "";
        const cqNum = parseFloat(cqVal) || 0;
        const mcqNum = hasMcq ? (parseFloat(mcqVal) || 0) : 0;
        const rawTotal = cqNum + mcqNum;
        const mt1Val = m1 ? (m1.cq ?? 0) : 0;
        const monthlyMark = mt1Val;
        const weighted80 = Math.round(rawTotal * 0.8 * 100) / 100;
        const finalMark = Math.round((weighted80 + monthlyMark) * 100) / 100;
        const passMark = 33;
        const maxTotal = paperMaxTotal;
        const pct = (finalMark / maxTotal) * 100;
        let grade = "N/A", gp = 0;
        if (finalMark > 0) {
          if (pct >= 80) { grade = "A+"; gp = 5.00; }
          else if (pct >= 70) { grade = "A"; gp = 4.00; }
          else if (pct >= 60) { grade = "A-"; gp = 3.50; }
          else if (pct >= 50) { grade = "B"; gp = 3.00; }
          else if (pct >= 40) { grade = "C"; gp = 2.00; }
          else if (pct >= 33) { grade = "D"; gp = 1.00; }
          else { grade = "F"; gp = 0.00; }
        }
        return {
          studentId: s.id, studentName: s.name, rollNumber: s.rollNumber, section: s.section || "dahlia",
          cq: cqVal, mcq: mcqVal, rawTotal: cqNum + mcqNum,
          weighted80, monthlyMT1: mt1Val.toString(), monthlyAvg: monthlyMark,
          finalMark, grade, gp, passMark, maxTotal, hasError: false,
        };
      });
      setEntries(newEntries);
      setEditPassMark(GPA_SUBJECTS.reduce((acc, s) => ({ ...acc, [s]: GPA_SUBJECT_MAP[s]?.passMark || 33 }), {}));
      setEditTotalMax(GPA_SUBJECTS.reduce((acc, s) => ({ ...acc, [s]: GPA_SUBJECT_MAP[s]?.maxTotal || 100 }), {}));
    } catch { toast("Failed to load data", "error"); }
    setLoading(false);
  }, [examType, subject, config.cqMax, config.mcqMax, 33, paperMaxTotal]);

  useEffect(() => { loadData(); }, [loadData]);

  const recalc = (entry: MarkEntry): MarkEntry => {
    const cqNum = parseFloat(entry.cq) || 0;
    const mcqNum = hasMcq ? parseFloat(entry.mcq) || 0 : 0;
    const rawTotal = cqNum + mcqNum;
    const weighted80 = Math.round(rawTotal * 0.8 * 100) / 100;
    const monthlyMT1 = parseFloat(entry.monthlyMT1) || 0;
    const monthlyMark = monthlyMT1;
    const finalMark = Math.round((weighted80 + monthlyMark) * 100) / 100;
    const pm = 33;
    const mx = paperMaxTotal;
    const pct = (finalMark / mx) * 100;
    let grade = "N/A", gp = 0;
    if (finalMark > 0) {
      if (pct >= 80) { grade = "A+"; gp = 5.00; }
      else if (pct >= 70) { grade = "A"; gp = 4.00; }
      else if (pct >= 60) { grade = "A-"; gp = 3.50; }
      else if (pct >= 50) { grade = "B"; gp = 3.00; }
      else if (pct >= 40) { grade = "C"; gp = 2.00; }
      else if (pct >= 33) { grade = "D"; gp = 1.00; }
      else { grade = "F"; gp = 0.00; }
    }
    return { ...entry, rawTotal, weighted80, monthlyAvg: monthlyMark, finalMark, grade, gp, passMark: pm, maxTotal: mx, hasError: false };
  };

  const handleCellChange = (index: number, field: string, value: string) => {
    setUndoStack(prev => [...prev.slice(-20), [...entries]]);
    setEntries(prev => {
      const next = [...prev];
      next[index] = recalc({ ...next[index], [field]: value });
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: string) => {
    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      inputRefs.current.get(`${index + 1}-${field}`)?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      inputRefs.current.get(`${index - 1}-${field}`)?.focus();
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    setEntries(undoStack[undoStack.length - 1]);
    setUndoStack(s => s.slice(0, -1));
    toast("Undone", "info");
  };

  const handleSaveAll = async () => {
    if (entries.some(e => e.hasError)) return toast("Fix errors before saving", "error");
    setSaving(true);
    try {
      // Save Half Yearly marks
      const hyPayload = entries.filter(e => e.cq !== "" || e.mcq !== "").map(e => ({
        studentId: e.studentId, examType, subject,
        cq: parseFloat(e.cq) || 0,
        mcq: hasMcq ? parseFloat(e.mcq) || 0 : 0,
        total: e.finalMark,
      }));
      // Save monthly marks separately
      const mt1Payload = entries.filter(e => e.monthlyMT1 !== "0").map(e => ({
        studentId: e.studentId, examType: "1st Monthly", subject,
        cq: parseFloat(e.monthlyMT1) || 0, mcq: 0, total: parseFloat(e.monthlyMT1) || 0,
      }));
      const results = await Promise.all([
        hyPayload.length > 0 ? fetch("/api/marks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entries: hyPayload }) }) : null,
        mt1Payload.length > 0 ? fetch("/api/marks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entries: mt1Payload }) }) : null,
      ]);
      const allOk = results.every(r => !r || r.ok);
      if (allOk) toast("All marks saved!", "success");
      else toast("Some saves failed", "error");
    } catch { toast("Network error", "error"); }
    setSaving(false);
  };

  const handlePaste = (e: React.ClipboardEvent, startIndex: number, field: string) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    const rows = text.split(/\n/).map(r => r.split(/\t/));
    setUndoStack(prev => [...prev.slice(-20), [...entries]]);
    setEntries(prev => {
      const next = [...prev];
      for (let i = 0; i < rows.length && startIndex + i < next.length; i++) {
        if (rows[i][0] !== undefined) {
          next[startIndex + i] = recalc({ ...next[startIndex + i], [field]: rows[i][0].trim() });
        }
      }
      return next;
    });
    toast("Pasted from clipboard", "info");
  };

  const handleBulkFill = (field: "cq" | "mcq", value: string) => {
    if (!value) return;
    setUndoStack(prev => [...prev.slice(-20), [...entries]]);
    setEntries(prev => prev.map(e => recalc({ ...e, [field]: value })));
    toast(`Bulk filled ${field.toUpperCase()} = ${value}`, "info");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        <a href="/admin/marks" className="px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-sm text-muted hover:text-charcoal transition-all">Manual Entry</a>
        <a href="/admin/marks/bulk-upload" className="px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-sm text-muted hover:text-charcoal transition-all">Bulk Upload</a>
        <a href="/admin/marks/import" className="px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-sm text-muted hover:text-charcoal transition-all">Smart Import</a>
        <span className="px-4 py-2 rounded-xl text-xs font-semibold gradient-royal text-white shadow-md">Spreadsheet</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Full Spreadsheet</h1>
          <p className="text-sm text-muted">CQ → MCQ → Total → 80% → Monthly → Final → Grade → GP</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleUndo} disabled={undoStack.length === 0}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold liquid-glass-sm text-muted hover:text-charcoal transition-all disabled:opacity-40 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg> Undo
          </button>
          <button onClick={() => setShowSettings(!showSettings)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showSettings ? "bg-royal/10 text-royal" : "liquid-glass-sm text-muted"}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </button>
          <button onClick={handleSaveAll} disabled={saving}
            className="gradient-royal text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 shadow-lg shadow-royal/25 flex items-center gap-1.5">
            {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : "Save All"}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="liquid-glass-strong rounded-3xl p-6 overflow-hidden">
          <h3 className="text-sm font-bold text-charcoal mb-4">Subject Configuration</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {GPA_SUBJECTS.map(s => (
              <div key={s} className="bg-white/40 rounded-xl p-3">
                <p className="text-xs font-bold text-charcoal mb-2">{s}</p>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted block">Pass Mark</label>
                  <input type="number" value={editPassMark[s] || ""}
                    onChange={e => { setEditPassMark(prev => ({ ...prev, [s]: parseFloat(e.target.value) || 0 })); }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-white/40 bg-white/50 text-xs" />
                  <label className="text-[10px] text-muted block">Total Max</label>
                  <input type="number" value={editTotalMax[s] || ""}
                    onChange={e => { setEditTotalMax(prev => ({ ...prev, [s]: parseFloat(e.target.value) || 0 })); }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-white/40 bg-white/50 text-xs" />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => {
            setEntries(prev => prev.map(e => recalc(e)));
            toast("Recalculated with new settings", "success");
          }} className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold gradient-royal text-white">Apply & Recalculate</button>
        </motion.div>
      )}

      {/* Subject + Exam Selectors */}
      <div className="liquid-glass rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted">Exam:</span>
          <div className="flex gap-1">
            {EXAM_TYPES.map(e => (
              <button key={e} onClick={() => setExamType(e)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${examType === e ? "gradient-royal text-white shadow-sm" : "liquid-glass-sm text-muted hover:text-charcoal"}`}>{e}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted">Subject:</span>
          <select value={subject} onChange={e => setSubject(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/40 border border-white/40 backdrop-blur-sm font-medium">
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 ml-auto text-[10px] text-muted">
          <span className="px-2 py-0.5 rounded-lg bg-royal/10 text-royal font-semibold">CQ Max: {config.cqMax}</span>
          <span className="px-2 py-0.5 rounded-lg bg-emerald/10 text-emerald font-semibold">MCQ Max: {config.mcqMax}</span>
          <span className="px-2 py-0.5 rounded-lg bg-amber/10 text-amber font-semibold">Pass: {editPassMark[subject] || 33}</span>
        </div>
      </div>

      {/* Bulk Fill Bar */}
      <div className="liquid-glass rounded-2xl p-3 flex gap-2 items-center flex-wrap text-[10px]">
        <span className="text-muted font-semibold">Bulk Fill:</span>
        <input placeholder="CQ value" className="w-20 px-2.5 py-1.5 rounded-lg border border-white/40 bg-white/50"
          onKeyDown={e => { if (e.key === "Enter") handleBulkFill("cq", (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; }} />
        <input placeholder="MCQ value" className="w-20 px-2.5 py-1.5 rounded-lg border border-white/40 bg-white/50"
          onKeyDown={e => { if (e.key === "Enter") handleBulkFill("mcq", (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; }} />
        <span className="text-muted ml-2">Type value + Enter to fill all rows</span>
      </div>

      {/* Main Spreadsheet */}
      <div className="liquid-glass-strong rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-xl skeleton" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/20">
                  <th className="px-3 py-3 text-left font-semibold text-muted uppercase tracking-wider" style={{ minWidth: 50 }}>Roll</th>
                  <th className="px-3 py-3 text-left font-semibold text-muted uppercase tracking-wider" style={{ minWidth: 120 }}>Name</th>
                  <th className="px-3 py-3 text-center font-semibold uppercase tracking-wider bg-royal/5" style={{ minWidth: 70 }}>
                    CQ<br /><span className="text-royal text-[9px]">({config.cqMax})</span>
                  </th>
                  {hasMcq && (
                    <th className="px-3 py-3 text-center font-semibold uppercase tracking-wider bg-emerald/5" style={{ minWidth: 70 }}>
                      MCQ<br /><span className="text-emerald text-[9px]">({config.mcqMax})</span>
                    </th>
                  )}
                  <th className="px-3 py-3 text-center font-semibold text-muted uppercase tracking-wider bg-amber/5" style={{ minWidth: 70 }}>
                    Raw<br /><span className="text-amber text-[9px]">CQ+MCQ</span>
                  </th>
                  <th className="px-3 py-3 text-center font-semibold text-muted uppercase tracking-wider bg-purple-500/5" style={{ minWidth: 80 }}>
                    ×80%<br /><span className="text-purple-500 text-[9px]">Weighted</span>
                  </th>
                  <th className="px-3 py-3 text-center font-semibold uppercase tracking-wider bg-rose-500/5" style={{ minWidth: 70 }}>
                    1st MT<br /><span className="text-rose-500 text-[9px]">1st Monthly</span>
                  </th>
                  <th className="px-3 py-3 text-center font-semibold text-muted uppercase tracking-wider bg-cyan-500/5" style={{ minWidth: 75 }}>
                    +MT1<br /><span className="text-cyan-500 text-[9px]">Add Monthly</span>
                  </th>
                  <th className="px-3 py-3 text-center font-bold uppercase tracking-wider bg-charcoal/5" style={{ minWidth: 80 }}>
                     FINAL<br /><span className="text-charcoal text-[9px]">/{paperMaxTotal}</span>
                  </th>
                  <th className="px-3 py-3 text-center font-semibold uppercase tracking-wider" style={{ minWidth: 55 }}>Grade</th>
                  <th className="px-3 py-3 text-center font-semibold uppercase tracking-wider" style={{ minWidth: 55 }}>GP</th>
                  <th className="px-3 py-3 text-center font-semibold uppercase tracking-wider" style={{ minWidth: 55 }}>Pass?</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr key={entry.studentId} className={`border-b border-white/10 hover:bg-white/20 transition-colors ${entry.hasError ? "bg-crimson/5" : ""}`}>
                    <td className="px-3 py-2 font-bold text-royal text-center">{entry.rollNumber}</td>
                    <td className="px-3 py-2 font-medium text-charcoal text-sm">{entry.studentName}</td>
                    <td className="px-2 py-1.5">
                      <input
                        ref={el => { if (el) inputRefs.current.set(`${idx}-cq`, el); }}
                        type="number" min="0" max={config.cqMax} step="0.5"
                        value={entry.cq} onChange={e => handleCellChange(idx, "cq", e.target.value)}
                        onKeyDown={e => handleKeyDown(e, idx, "cq")} onPaste={e => handlePaste(e, idx, "cq")}
                        className="w-full px-2.5 py-2 rounded-lg border border-white/50 bg-white/70 text-center text-sm font-medium focus:ring-2 focus:ring-royal/30 transition-all" placeholder="0"
                      />
                    </td>
                    {hasMcq && (
                      <td className="px-2 py-1.5">
                        <input
                          ref={el => { if (el) inputRefs.current.set(`${idx}-mcq`, el); }}
                          type="number" min="0" max={config.mcqMax} step="0.5"
                          value={entry.mcq} onChange={e => handleCellChange(idx, "mcq", e.target.value)}
                          onKeyDown={e => handleKeyDown(e, idx, "mcq")} onPaste={e => handlePaste(e, idx, "mcq")}
                          className="w-full px-2.5 py-2 rounded-lg border border-white/50 bg-white/70 text-center text-sm font-medium focus:ring-2 focus:ring-emerald/30 transition-all" placeholder="0"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2 text-center font-bold text-amber">{entry.rawTotal}</td>
                    <td className="px-3 py-2 text-center font-bold text-purple-500">{entry.weighted80.toFixed(1)}</td>
                    <td className="px-2 py-1.5">
                      <input
                        ref={el => { if (el) inputRefs.current.set(`${idx}-mt1`, el); }}
                        type="number" min="0" max="20" step="0.5"
                        value={entry.monthlyMT1}
                        onChange={e => handleCellChange(idx, "monthlyMT1", e.target.value)}
                        onKeyDown={e => handleKeyDown(e, idx, "monthlyMT1")}
                        className="w-full px-2 py-1.5 rounded-lg border border-white/50 bg-white/70 text-center text-xs font-medium focus:ring-2 focus:ring-rose-500/30 transition-all" placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-cyan-500">{entry.monthlyAvg.toFixed(1)}</td>
                    <td className="px-3 py-2 text-center font-black text-lg">{entry.finalMark}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-bold ${entry.grade === "A+" || entry.grade === "A" ? "text-emerald" : entry.grade === "A-" || entry.grade === "B" ? "text-royal" : entry.grade === "C" ? "text-amber" : entry.grade === "D" ? "text-orange-500" : entry.grade === "F" ? "text-crimson" : "text-muted"}`}>{entry.grade}</span>
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-sm">{entry.gp.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">
                      {entry.finalMark > 0 ? (
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${entry.finalMark >= entry.passMark ? "bg-emerald/10 text-emerald" : "bg-crimson/10 text-crimson"}`}>
                          {entry.finalMark >= entry.passMark ? "PASS" : "FAIL"}
                        </span>
                      ) : <span className="text-muted text-[10px]">—</span>}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td colSpan={hasMcq ? 12 : 11} className="py-16 text-center text-muted text-sm">No students found. Add students first.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      {entries.length > 0 && (
        <div className="liquid-glass rounded-2xl p-4 flex flex-wrap gap-4 items-center text-xs text-muted">
          <span className="font-semibold text-charcoal">{entries.length} students</span>
          <span>Avg CQ: <b className="text-charcoal">{(entries.reduce((s, e) => s + (parseFloat(e.cq) || 0), 0) / entries.length).toFixed(1)}</b></span>
           {hasMcq && <span>Avg MCQ: <b className="text-charcoal">{(entries.reduce((s, e) => s + (parseFloat(e.mcq) || 0), 0) / entries.length).toFixed(1)}</b></span>}
          <span>Avg Final: <b className="text-charcoal">{(entries.reduce((s, e) => s + e.finalMark, 0) / entries.length).toFixed(1)}</b></span>
          <span className="ml-auto">Pass Rate: <b className="text-emerald">{entries.filter(e => e.finalMark >= e.passMark).length}/{entries.length}</b></span>
        </div>
      )}

      {/* Legend */}
      <div className="liquid-glass rounded-2xl p-3 text-[10px] text-muted flex flex-wrap gap-x-6 gap-y-1">
        <span><b className="text-charcoal">CQ</b> + <b className="text-charcoal">MCQ</b> = <b className="text-amber">Raw</b></span>
        <span><b className="text-amber">Raw</b> × 0.80 = <b className="text-purple-500">×80%</b></span>
        <span><b className="text-purple-500">×80%</b> + <b className="text-cyan-500">MT1</b> = <b className="text-charcoal">FINAL</b></span>
        <span className="ml-auto">Pass: FINAL ≥ <b className="text-charcoal">Pass Mark</b></span>
      </div>
    </div>
  );
}
