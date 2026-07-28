"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "@/components/Toast";
import { SUBJECTS } from "@/lib/constants";
import * as XLSX from "xlsx";

interface UploadRow {
  sl: number;
  idNo: string;
  studentName: string;
  roll: number | null;
  mt1Cq: number | null;
  mt1Mcq: number | null;
  mt2Cq: number | null;
  mt2Mcq: number | null;
  mtTotal: number | null;
  termCq: number | null;
  termMcq: number | null;
  termPract: number | null;
  termSba: number | null;
  termTotal: number | null;
}

export default function BulkUploadPage() {
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [parsedRows, setParsedRows] = useState<UploadRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
const [result, setResult] = useState<{
    message: string;
    summary: { total: number; processed: number; created: number; errors: number };
    errors?: string[];
  } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
      toast("Please upload an Excel file (.xlsx, .xls, or .csv)", "error");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        toast("Excel file is empty", "error");
        return;
      }
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      if (jsonData.length === 0) {
        toast("No data found in the file", "error");
        return;
      }

      // Store detected column names for debugging
      setDetectedColumns(Object.keys(jsonData[0] || {}));

      // Normalize column names (case-insensitive, space-tolerant)
      const normalizeKey = (k: string) => k.toLowerCase().replace(/[\s/-]+/g, "").replace(/[^a-z0-9]/g, "");
      const findByKey = (row: Record<string, unknown>, patterns: string[]): unknown => {
        for (const [key, val] of Object.entries(row)) {
          const nk = normalizeKey(key);
          for (const p of patterns) {
            if (nk === normalizeKey(p) || nk.includes(normalizeKey(p))) return val;
          }
        }
        return undefined;
      };

      const rows: UploadRow[] = jsonData.map((row: Record<string, unknown>, idx: number) => {
        const parseNum = (val: unknown): number | null => {
          if (val === undefined || val === null || val === "") return null;
          const n = Number(val);
          return isNaN(n) ? null : n;
        };
        const strVal = (patterns: string[]) => String(findByKey(row, patterns) || "").trim();
        const numVal = (patterns: string[]) => parseNum(findByKey(row, patterns));
        return {
          sl: numVal(["SL", "Sl", "s.l"]) || idx + 1,
          idNo: strVal(["ID No", "IDNO", "IdNo", "Student ID", "StudentID"]),
          studentName: strVal(["Student Name", "StudentName", "Name", "Student_Name"]),
          roll: numVal(["Roll", "Roll No", "RollNo", "Roll Number"]),
          mt1Cq: numVal(["MT1 CQ", "MT1_CQ", "Mt1Cq", "Monthly 1 CQ"]),
          mt1Mcq: numVal(["MT1 MCQ", "MT1_MCQ", "Mt1Mcq", "Monthly 1 MCQ"]),
          mt2Cq: numVal(["MT2 CQ", "MT2_CQ", "Mt2Cq", "Monthly 2 CQ"]),
          mt2Mcq: numVal(["MT2 MCQ", "MT2_MCQ", "Mt2Mcq", "Monthly 2 MCQ"]),
          mtTotal: numVal(["MT Total", "MT_Total", "MtTotal", "Monthly Total"]),
          termCq: numVal(["Term CQ", "Term_CQ", "TermCq", "Half Yearly CQ", "HY CQ"]),
          termMcq: numVal(["Term MCQ", "Term_MCQ", "TermMcq", "Half Yearly MCQ", "HY MCQ"]),
          termPract: numVal(["Term Pract", "Term_Pract", "TermPract", "Practical", "Pract"]),
          termSba: numVal(["Term SBA/Atten", "Term_SBA", "TermSBA", "SBA", "Attendance", "Atten"]),
          termTotal: numVal(["Term Total", "Term_Total", "TermTotal", "Half Yearly Total", "HY Total"]),
        };
      });

      setParsedRows(rows);
      setResult(null);
      toast(`Parsed ${rows.length} rows from "${file.name}"`, "success");
    } catch (err) {
      toast("Failed to parse Excel file: " + (err instanceof Error ? err.message : "Unknown error"), "error");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUpload = async () => {
    if (parsedRows.length === 0) {
      toast("No data to upload", "error");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const res = await fetch("/api/marks/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, entries: parsedRows }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data);
        toast(data.message || "Upload successful!", "success");
      } else {
        toast(data.error || "Upload failed", "error");
      }
    } catch {
      toast("Network error", "error");
    }

    setUploading(false);
  };

  const hasData = parsedRows.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub-navigation */}
      <div className="flex items-center gap-2">
        <a href="/admin/marks" className="px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-sm text-muted hover:text-charcoal transition-all">
          Manual Entry
        </a>
        <span className="px-4 py-2 rounded-xl text-xs font-semibold gradient-royal text-white shadow-md">
          Bulk Upload
        </span>
        <a href="/admin/marks/import" className="px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-sm text-muted hover:text-charcoal transition-all">
          Smart Import
        </a>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Bulk Mark Upload</h1>
        <p className="text-sm text-muted">Upload marks from an Excel spreadsheet</p>
      </div>

      {/* Subject Selector */}
      <div className="liquid-glass rounded-2xl p-4">
        <label className="block text-sm font-medium text-charcoal mb-2">Select Subject</label>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm">
          {SUBJECTS.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
      </div>

      {/* Drag & Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`relative border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all cursor-pointer ${
          dragOver
            ? "border-royal bg-royal/5 shadow-lg shadow-royal/10"
            : hasData
              ? "border-emerald/40 bg-emerald/5"
              : "border-white/50 bg-white/30 hover:border-royal/40 hover:bg-royal/[0.02]"
        }`}
        onClick={() => !hasData && document.getElementById("excel-input")?.click()}
      >
        <input
          id="excel-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileInput}
        />

        {hasData ? (
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald/10 flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-sm font-semibold text-emerald">{parsedRows.length} rows parsed</p>
            <p className="text-xs text-muted">Click to upload a different file</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-royal/10 flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006FEE" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <p className="text-sm font-semibold text-charcoal">Drop Excel file here</p>
            <p className="text-xs text-muted">or click to browse — .xlsx, .xls, .csv</p>
          {detectedColumns.length > 0 && (
            <div className="mt-3 inline-flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-lg bg-amber/5 border border-amber/20 text-[10px]">
              <span className="font-semibold text-amber">Detected columns:</span>
              {detectedColumns.map((col, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-white/50 font-mono">{col}</span>
              ))}
            </div>
          )}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/40 text-[10px] text-muted font-mono mt-2">
              SL · ID No · Student Name · Roll · MT1 CQ · MT1 MCQ · MT2 CQ · MT2 MCQ · MT Total · Term CQ · Term MCQ · Term Pract · Term SBA/Atten · Term Total
            </div>
          </div>
        )}
      </motion.div>

      {/* Preview Table */}
      {hasData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass-strong rounded-3xl overflow-hidden"
        >
          <div className="p-4 border-b border-white/20 flex items-center justify-between">
            <h3 className="text-sm font-bold text-charcoal">Preview ({parsedRows.length} rows)</h3>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="gradient-royal text-white px-5 py-2.5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-royal/25 flex items-center gap-2"
            >
              {uploading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Upload to Database</>
              )}
            </button>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto scrollbar-hide">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white/80 backdrop-blur-md">
                <tr className="border-b border-white/20">
                  <th className="p-2 text-left text-[10px] font-semibold text-muted uppercase">SL</th>
                  <th className="p-2 text-left text-[10px] font-semibold text-muted uppercase">Name</th>
                  <th className="p-2 text-center text-[10px] font-semibold text-muted uppercase">Roll</th>
                  <th className="p-2 text-center text-[10px] font-semibold text-muted uppercase">MT1 CQ</th>
                  <th className="p-2 text-center text-[10px] font-semibold text-muted uppercase">MT1 MCQ</th>
                  <th className="p-2 text-center text-[10px] font-semibold text-muted uppercase">MT2 CQ</th>
                  <th className="p-2 text-center text-[10px] font-semibold text-muted uppercase">MT2 MCQ</th>
                  <th className="p-2 text-center text-[10px] font-semibold text-muted uppercase">Term CQ</th>
                  <th className="p-2 text-center text-[10px] font-semibold text-muted uppercase">Term MCQ</th>
                  <th className="p-2 text-center text-[10px] font-semibold text-muted uppercase">Term Total</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="border-b border-white/10 hover:bg-white/20">
                    <td className="p-2 text-muted">{row.sl || idx + 1}</td>
                    <td className="p-2 font-medium text-charcoal">{row.studentName || "—"}</td>
                    <td className="p-2 text-center font-bold text-royal">{row.roll || "—"}</td>
                    <td className="p-2 text-center">{row.mt1Cq ?? "—"}</td>
                    <td className="p-2 text-center">{row.mt1Mcq ?? "—"}</td>
                    <td className="p-2 text-center">{row.mt2Cq ?? "—"}</td>
                    <td className="p-2 text-center">{row.mt2Mcq ?? "—"}</td>
                    <td className="p-2 text-center">{row.termCq ?? "—"}</td>
                    <td className="p-2 text-center">{row.termMcq ?? "—"}</td>
                    <td className="p-2 text-center font-semibold">{row.termTotal ?? "—"}</td>
                  </tr>
                ))}
                {parsedRows.length > 50 && (
                  <tr><td colSpan={10} className="p-4 text-center text-muted text-xs">... and {parsedRows.length - 50} more rows</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Result Summary */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-6 ${result.summary.errors > 0 ? "bg-amber/5 border border-amber/20" : "bg-emerald/5 border border-emerald/20"}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${result.summary.errors > 0 ? "bg-amber/10 text-amber" : "bg-emerald/10 text-emerald"}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {result.summary.errors > 0 ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> : <><polyline points="20 6 9 17 4 12"/></>}
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-charcoal">Upload Complete</h3>
              <p className="text-xs text-muted">{result.message}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-white/40 rounded-xl px-4 py-2 text-center">
              <p className="text-lg font-bold text-charcoal">{result.summary.total}</p>
              <p className="text-[10px] text-muted">Total Rows</p>
            </div>
            <div className="bg-white/40 rounded-xl px-4 py-2 text-center">
              <p className="text-lg font-bold text-emerald">{result.summary.processed}</p>
              <p className="text-[10px] text-muted">Processed</p>
            </div>
            <div className="bg-white/40 rounded-xl px-4 py-2 text-center">
              <p className="text-lg font-bold text-royal">{result.summary.created}</p>
              <p className="text-[10px] text-muted">New Students</p>
            </div>
            {result.summary.errors > 0 && (
              <div className="bg-white/40 rounded-xl px-4 py-2 text-center">
                <p className="text-lg font-bold text-crimson">{result.summary.errors}</p>
                <p className="text-[10px] text-muted">Errors</p>
              </div>
            )}
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-3 bg-crimson/5 rounded-xl p-3">
              <p className="text-xs font-semibold text-crimson mb-1">Errors:</p>
              {result.errors.map((err, i) => (
                <p key={i} className="text-[10px] text-muted ml-2">• {err}</p>
              ))}
            </div>
          )}
          <button onClick={() => { setParsedRows([]); setResult(null); }}
            className="mt-4 text-xs font-semibold text-royal hover:underline">
            Upload another file
          </button>
        </motion.div>
      )}

      {/* Required Columns Info */}
      <div className="liquid-glass rounded-2xl p-4 text-xs text-muted">
        <p className="font-semibold text-charcoal mb-1">Required Excel Columns:</p>
        <code className="text-[10px]">
          SL, ID No, Student Name, Roll, MT1 CQ, MT1 MCQ, MT2 CQ, MT2 MCQ, MT Total, Term CQ, Term MCQ, Term Pract, Term SBA/Atten, Term Total
        </code>
        <p className="mt-2">New students are automatically created if they don&apos;t exist. Missing values are safely handled.</p>
      </div>
    </div>
  );
}
