"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "@/components/Toast";
import { SUBJECTS } from "@/lib/constants";
import * as XLSX from "xlsx";

interface ParsedMetadata {
  examName: string;
  session: string;
  classStr: string;
  section: string;
  subject: string;
}

interface ParsedRow {
  idNo: string;
  studentName: string;
  roll: number | null;
  mtTotal: number;
  termCQ: number;
  termMCQ: number;
  termPractical: number;
  termSBA: number;
  rowIndex: number;
}

interface ImportResult {
  success: boolean;
  metadata: ParsedMetadata | null;
  summary: { totalRows: number; newStudents: number; marksSaved: number; errors: number };
  errors: string[];
}

// Helper: extract metadata from header rows
function extractMetadata(sheet: XLSX.WorkSheet): { metadata: ParsedMetadata; dataStartIndex: number } {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:Z1");
  const metadata: ParsedMetadata = { examName: "", session: "", classStr: "", section: "", subject: "" };
  let dataStartIndex = 10;

  for (let rowIdx = 0; rowIdx <= 10 && rowIdx <= range.e.r; rowIdx++) {
    const row: string[] = [];
    for (let colIdx = 0; colIdx <= range.e.c; colIdx++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: rowIdx, c: colIdx })];
      row.push(cell ? String(cell.v).trim() : "");
    }
    const joined = row.join(" ");

    if (joined.includes("Examination Name")) {
      const val = row.find((c) => c && !c.includes("Examination Name") && !c.includes(":")) || "";
      metadata.examName = val;
    }
    if (joined.includes("Session")) {
      const val = row.find((c) => c && /\d{4}/.test(c)) || "";
      metadata.session = val;
    }
    if (joined.includes("Class")) {
      const val = row.find((c) => c && !c.includes("Class") && !c.includes(":")) || "";
      metadata.classStr = val;
    }
    if (joined.includes("Section")) {
      const idx = row.findIndex((c) => c.includes("Section"));
      metadata.section = row[idx + 1] || row.find((c) => c && !c.includes("Section") && !c.includes(":")) || "";
    }
    if (joined.includes("Subject Name")) {
      const val = row.find((c) => c && !c.includes("Subject Name") && !c.includes(":")) || "";
      metadata.subject = val;
    }
  }

  // Find the actual row where student data starts (look for "ID No" or "Roll" column headers)
  for (let rowIdx = 7; rowIdx <= 12 && rowIdx <= range.e.r; rowIdx++) {
    const row: string[] = [];
    for (let colIdx = 0; colIdx <= range.e.c; colIdx++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: rowIdx, c: colIdx })];
      row.push(cell ? String(cell.v).trim().toLowerCase() : "");
    }
    const joined = row.join(" ");
    if (joined.includes("id no") || joined.includes("student name") || joined.includes("roll")) {
      dataStartIndex = rowIdx + 1;
      break;
    }
  }

  return { metadata, dataStartIndex };
}

// Parse student rows from the sheet
function parseRows(sheet: XLSX.WorkSheet, startRow: number): ParsedRow[] {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:Z1");
  const rows: ParsedRow[] = [];

  for (let rowIdx = startRow; rowIdx <= range.e.r; rowIdx++) {
    const getCell = (col: number): string => {
      const cell = sheet[XLSX.utils.encode_cell({ r: rowIdx, c: col })];
      if (!cell) return "";
      const v = String(cell.v).trim();
      return v === "undefined" || v === "null" ? "" : v;
    };

    const idNo = getCell(5);   // Col 5 = ID No
    const name = getCell(8);   // Col 8 = Student Name
    const rollStr = getCell(9); // Col 9 = Roll

    const mtTotal = parseFloat(getCell(14)) || 0;      // Col 14 = MT Total
    const termCQ = parseFloat(getCell(15)) || 0;        // Col 15 = Term CQ
    const termMCQ = parseFloat(getCell(16)) || 0;       // Col 16 = Term MCQ
    const termPract = parseFloat(getCell(17)) || 0;     // Col 17 = Term Pract
    const termSBA = parseFloat(getCell(18)) || 0;       // Col 18 = Term SBA/Atten

    // Skip completely empty rows
    if (!name && !rollStr && !idNo) continue;
    // Skip summary/note rows
    if (name.toLowerCase().includes("total") || name.toLowerCase().includes("subject") || name.toLowerCase().includes("note")) continue;

    const roll = parseInt(rollStr) || null;

    rows.push({
      idNo: idNo.replace(/\s+/g, ""),
      studentName: name,
      roll,
      mtTotal,
      termCQ,
      termMCQ,
      termPractical: termPract,
      termSBA,
      rowIndex: rowIdx + 1,
    });
  }

  return rows;
}

export default function MarksImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<ParsedMetadata | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const processFile = useCallback(async (f: File) => {
    if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
      toast("Please upload an Excel file (.xlsx or .xls)", "error");
      return;
    }

    try {
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) { toast("Excel file is empty", "error"); return; }

      const sheet = workbook.Sheets[sheetName];
      const { metadata: meta, dataStartIndex } = extractMetadata(sheet);
      const rows = parseRows(sheet, dataStartIndex);

      if (rows.length === 0) {
        toast("No student data found in the file", "error");
        return;
      }

      // Use selected subject as override if auto-detected subject is empty
      if (!meta.subject && subject) meta.subject = subject;
      setFile(f);
      setMetadata(meta);
      setParsedRows(rows);
      setResult(null);
      toast(`Parsed ${rows.length} students from "${f.name}"`, "success");
    } catch (err) {
      toast("Failed to parse file: " + (err instanceof Error ? err.message : "Unknown"), "error");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleImport = async () => {
    if (!metadata || parsedRows.length === 0) {
      toast("No data to import", "error");
      return;
    }

    setUploading(true);
    try {
      const res = await fetch("/api/marks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows, metadata: { ...metadata, subject: subject || metadata?.subject } }),
      });
      const data: ImportResult = await res.json();
      setResult(data);
      if (!res.ok) {
        toast(`Import failed: ${(data as any).error || "Server error"}`, "error");
      } else if (data.success) {
        toast(data.summary.marksSaved > 0 ? `Imported ${data.summary.marksSaved} marks!` : "Import completed", "success");
      }
    } catch (err) {
      toast("Network error: " + (err instanceof Error ? err.message : "Unknown"), "error");
    }
    setUploading(false);
  };

  const hasData = parsedRows.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigation sub-tabs */}
      <div className="flex items-center gap-2">
        <a href="/admin/marks" className="px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-sm text-muted hover:text-charcoal transition-all">
          Manual Entry
        </a>
        <a href="/admin/marks/bulk-upload" className="px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-sm text-muted hover:text-charcoal transition-all">
          Bulk Upload
        </a>
        <span className="px-4 py-2 rounded-xl text-xs font-semibold gradient-royal text-white shadow-md">
          Smart Import
        </span>
        <a href="/admin/marks/spreadsheet" className="px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-sm text-muted hover:text-charcoal transition-all">
          Spreadsheet
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-charcoal">Smart Excel Import</h1>
        <p className="text-sm text-muted">Upload PrintMarksEntry.xls — auto-detects exam, class, subject & registers students</p>
      </div>

      {/* Subject Selector */}
      <div className="liquid-glass rounded-2xl p-4">
        <label className="block text-sm font-medium text-charcoal mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1.5 -mt-0.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Subject (overrides auto-detected subject from Excel)
        </label>
        <select value={subject} onChange={(e) => {
          setSubject(e.target.value);
          setMetadata(prev => prev ? { ...prev, subject: e.target.value } : { examName: "", session: "", classStr: "", section: "", subject: e.target.value });
        }}
          className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm font-medium">
          {SUBJECTS.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
      </div>

      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !file && document.getElementById("import-excel")?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all cursor-pointer ${
          dragOver
            ? "border-royal bg-royal/5 shadow-lg"
            : hasData
              ? "border-emerald/40 bg-emerald/5"
              : "border-white/50 bg-white/30 hover:border-royal/40"
        }`}
      >
        <input id="import-excel" type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileInput} />

        {hasData ? (
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald/10 flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-sm font-semibold text-emerald">{parsedRows.length} students parsed</p>
            {metadata && (
              <div className="inline-flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-full bg-royal/10 text-royal font-semibold">{metadata.examName || "Exam"}</span>
                <span className="px-3 py-1.5 rounded-full bg-emerald/10 text-emerald font-semibold">{metadata.classStr || "Class"} {metadata.section ? `(${metadata.section})` : ""}</span>
                <span className="px-3 py-1.5 rounded-full bg-amber/10 text-amber font-semibold">{metadata.subject || "Subject"}</span>
                {metadata.session && <span className="px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-600 font-semibold">Session: {metadata.session}</span>}
              </div>
            )}
            <p className="text-[10px] text-muted">Click to browse a different file</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-royal/10 flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006FEE" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <p className="text-sm font-semibold text-charcoal">Drop PrintMarksEntry.xls here</p>
            <p className="text-xs text-muted">or click to browse — auto-detects exam, class & subject from headers</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/40 text-[10px] text-muted mt-1">
              Column format: ID No (E) · Student Name (H) · Roll (I) · MT Total (N) · Term CQ (O) · Term MCQ (P) · Term Pract (Q) · Term SBA (R)
            </div>
          </div>
        )}
      </motion.div>

      {/* Preview Table */}
      {hasData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-charcoal">Preview ({parsedRows.length} students)</h3>
              {metadata && (
                <p className="text-[10px] text-muted">{metadata.subject} · {metadata.examName || "Half Yearly"} · {metadata.session || "2026"}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setFile(null); setParsedRows([]); setMetadata(null); setResult(null); }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold liquid-glass-sm text-muted hover:text-charcoal">
                Clear
              </button>
              <button onClick={handleImport} disabled={uploading}
                className="gradient-royal text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-royal/25 flex items-center gap-2">
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing...</>
                ) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Import to Database</>
                )}
              </button>
            </div>
          </div>

          <div className="liquid-glass-strong rounded-3xl overflow-hidden">
            <div className="overflow-x-auto max-h-80 overflow-y-auto scrollbar-hide">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-10">
                  <tr className="border-b border-white/20">
                    <th className="p-2.5 text-left font-semibold text-muted uppercase text-[10px]">#</th>
                    <th className="p-2.5 text-left font-semibold text-muted uppercase text-[10px]">ID No</th>
                    <th className="p-2.5 text-left font-semibold text-muted uppercase text-[10px]">Student Name</th>
                    <th className="p-2.5 text-center font-semibold text-muted uppercase text-[10px]">Roll</th>
                    <th className="p-2.5 text-center font-semibold text-muted uppercase text-[10px]">MT Total</th>
                    <th className="p-2.5 text-center font-semibold text-muted uppercase text-[10px]">Term CQ</th>
                    <th className="p-2.5 text-center font-semibold text-muted uppercase text-[10px]">Term MCQ</th>
                    <th className="p-2.5 text-center font-semibold text-muted uppercase text-[10px]">Pract</th>
                    <th className="p-2.5 text-center font-semibold text-muted uppercase text-[10px]">SBA</th>
                    <th className="p-2.5 text-center font-semibold text-muted uppercase text-[10px]">Raw</th>
                    <th className="p-2.5 text-center font-semibold text-muted uppercase text-[10px]">×80%</th>
                    <th className="p-2.5 text-center font-semibold text-muted uppercase text-[10px]">+MT</th>
                    <th className="p-2.5 text-center font-semibold text-muted uppercase text-[10px]">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 100).map((row, idx) => {
                    const raw = row.termCQ + row.termMCQ + row.termPractical + row.termSBA;
                    const weighted = Math.round(raw * 0.8 * 100) / 100;
                    const finalMark = Math.round((weighted + row.mtTotal) * 100) / 100;
                    return (
                      <tr key={idx} className="border-b border-white/10 hover:bg-white/20 transition-colors">
                        <td className="p-2.5 text-muted">{idx + 1}</td>
                        <td className="p-2.5 text-muted font-mono text-[9px]">{row.idNo || "—"}</td>
                        <td className="p-2.5 font-medium text-charcoal">{row.studentName}</td>
                        <td className="p-2.5 text-center font-bold text-royal">{row.roll ?? "—"}</td>
                        <td className="p-2.5 text-center">{row.mtTotal || 0}</td>
                        <td className="p-2.5 text-center">{row.termCQ || 0}</td>
                        <td className="p-2.5 text-center">{row.termMCQ || 0}</td>
                        <td className="p-2.5 text-center">{row.termPractical || 0}</td>
                        <td className="p-2.5 text-center">{row.termSBA || 0}</td>
                        <td className="p-2.5 text-center font-semibold">{raw}</td>
                        <td className="p-2.5 text-center text-royal font-semibold">{weighted.toFixed(1)}</td>
                        <td className="p-2.5 text-center text-amber font-semibold">+{row.mtTotal}</td>
                        <td className="p-2.5 text-center font-bold">{finalMark}</td>
                      </tr>
                    );
                  })}
                  {parsedRows.length > 100 && (
                    <tr><td colSpan={13} className="p-4 text-center text-muted text-xs">... and {parsedRows.length - 100} more rows</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weighted Calculation Legend */}
          <div className="liquid-glass rounded-2xl p-3 text-[10px] text-muted">
            <span className="font-semibold text-charcoal">Formula: </span>
            Raw = CQ + MCQ + Pract + SBA &nbsp;|&nbsp;
            <span className="text-royal font-semibold">×80% = Raw × 0.80</span> &nbsp;|&nbsp;
            <span className="text-amber font-semibold">+MT = Weighted + Monthly Marks</span> &nbsp;|&nbsp;
            <span className="font-semibold text-charcoal">Final = Final Subject Mark</span>
          </div>
        </motion.div>
      )}

      {/* Result Summary */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-6 ${result.summary.errors > 0 ? "bg-amber/5 border border-amber/20" : "bg-emerald/5 border border-emerald/20"}`}>
          
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${result.summary.errors > 0 ? "bg-amber/10 text-amber" : "bg-emerald/10 text-emerald"}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {result.summary.errors > 0 ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> : <><polyline points="20 6 9 17 4 12"/></>}
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-charcoal">Import Complete</h3>
              <p className="text-xs text-muted">{result.summary.marksSaved} marks saved</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="bg-white/40 rounded-xl px-4 py-2 text-center min-w-[80px]">
              <p className="text-lg font-bold text-charcoal">{result.summary.totalRows}</p>
              <p className="text-[9px] text-muted">Total Rows</p>
            </div>
            <div className="bg-white/40 rounded-xl px-4 py-2 text-center min-w-[80px]">
              <p className="text-lg font-bold text-emerald">{result.summary.marksSaved}</p>
              <p className="text-[9px] text-muted">Marks Saved</p>
            </div>
            <div className="bg-white/40 rounded-xl px-4 py-2 text-center min-w-[80px]">
              <p className="text-lg font-bold text-royal">{result.summary.newStudents}</p>
              <p className="text-[9px] text-muted">New Students</p>
            </div>
            {result.summary.errors > 0 && (
              <div className="bg-white/40 rounded-xl px-4 py-2 text-center min-w-[80px]">
                <p className="text-lg font-bold text-crimson">{result.summary.errors}</p>
                <p className="text-[9px] text-muted">Errors</p>
              </div>
            )}
          </div>

          {result.errors.length > 0 && (
            <div className="mt-3 bg-crimson/5 rounded-xl p-3 max-h-32 overflow-y-auto">
              <p className="text-xs font-semibold text-crimson mb-1">Errors:</p>
              {result.errors.map((err, i) => (
                <p key={i} className="text-[10px] text-muted ml-2">• {err}</p>
              ))}
            </div>
          )}

          <button onClick={() => { setFile(null); setParsedRows([]); setMetadata(null); setResult(null); }}
            className="mt-4 text-xs font-semibold text-royal hover:underline">
            Import another file
          </button>
        </motion.div>
      )}
    </div>
  );
}
