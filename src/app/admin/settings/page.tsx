"use client";

import { useState, useEffect } from "react";
import { toast } from "@/components/Toast";
import { EXAM_TYPES, SUBJECTS, DEFAULT_MONTHLY_FULL_MARKS, SUBJECT_CONFIGS } from "@/lib/constants";

interface SettingsData {
  id: number;
  schoolName: string;
  schoolLogo: string;
  principalName: string;
  classTeacherName: string;
  classTeacherDegree: string;
  classTeacherPicture: string;
  academicYear: string;
  nextRollNumber: number;
  adminPassword: string;
  examFullMarks: Record<string, Record<string, number>> | null;
  developerName: string;
  developerRoll: number;
  developerBio: string;
  developerPicture: string;
  captainRoll: number | null;
  captainTitle: string;
  monitorRoll: number | null;
  monitorTitle: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "people" | "exam" | "security">("general");

  // General
  const [schoolName, setSchoolName] = useState("");
  const [schoolLogo, setSchoolLogo] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [nextRollNumber, setNextRollNumber] = useState(2);

  // People
  const [principalName, setPrincipalName] = useState("");
  const [classTeacherName, setClassTeacherName] = useState("");
  const [classTeacherDegree, setClassTeacherDegree] = useState("");
  const [classTeacherPicture, setClassTeacherPicture] = useState("");
  const [developerName, setDeveloperName] = useState("");
  const [developerRoll, setDeveloperRoll] = useState(6);
  const [developerBio, setDeveloperBio] = useState("");
  const [developerPicture, setDeveloperPicture] = useState("");
  const [captainRoll, setCaptainRoll] = useState<number | null>(null);
  const [captainTitle, setCaptainTitle] = useState("Captain");
  const [monitorRoll, setMonitorRoll] = useState<number | null>(null);
  const [monitorTitle, setMonitorTitle] = useState("Monitor");
  const [studentsList, setStudentsList] = useState<Array<{id:number;name:string;rollNumber:number}>>([]);

  // Security
  const [adminPassword, setAdminPassword] = useState("");

  // Exam marks
  const [examFullMarks, setExamFullMarks] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    fetch("/api/students").then(r=>r.json()).then(d=>setStudentsList(Array.isArray(d)?d:[])).catch(()=>{});
    fetch("/api/settings").then((r) => r.json()).then((d: SettingsData) => {
      setSchoolName(d.schoolName || "Sunshine Academy");
      setSchoolLogo(d.schoolLogo || "");
      setPrincipalName(d.principalName || "");
      setClassTeacherName(d.classTeacherName || "");
      setClassTeacherDegree(d.classTeacherDegree || "");
      setClassTeacherPicture(d.classTeacherPicture || "");
      setAcademicYear(d.academicYear || "2025");
      setNextRollNumber(d.nextRollNumber || 2);
      setAdminPassword(d.adminPassword || "admin123");
      setCaptainRoll(d.captainRoll ?? null);
      setCaptainTitle(d.captainTitle || "Captain");
      setMonitorRoll(d.monitorRoll ?? null);
      setMonitorTitle(d.monitorTitle || "Monitor");
      setDeveloperName(d.developerName || "");
      setDeveloperRoll(d.developerRoll || 6);
      setDeveloperBio(d.developerBio || "");
      setDeveloperPicture(d.developerPicture || "");

      const existing = d.examFullMarks || {};
      const full: Record<string, Record<string, number>> = {};
      for (const exam of EXAM_TYPES) {
        full[exam] = {};
        for (const subj of SUBJECTS) {
          if (exam === "1st Monthly" || exam === "2nd Monthly") {
            full[exam][subj] = existing[exam]?.[subj] ?? DEFAULT_MONTHLY_FULL_MARKS[subj] ?? 20;
          } else {
            full[exam][subj] = existing[exam]?.[subj] ?? SUBJECT_CONFIGS[subj]?.totalMax ?? 100;
          }
        }
      }
      setExamFullMarks(full);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName,
          schoolLogo,
          principalName,
          classTeacherName,
          classTeacherDegree,
          classTeacherPicture,
          academicYear,
          nextRollNumber,
          adminPassword,
          examFullMarks,
          developerName,
          developerRoll,
          developerBio,
          developerPicture,
          captainRoll,
          captainTitle,
          monitorRoll,
          monitorTitle,
        }),
      });
      if (res.ok) toast("Settings saved!", "success");
      else toast("Save failed", "error");
    } catch { toast("Network error", "error"); }
    setSaving(false);
  };

  const handleExamMarkChange = (exam: string, subject: string, value: string) => {
    setExamFullMarks((prev) => ({ ...prev, [exam]: { ...prev[exam], [subject]: parseInt(value) || 0 } }));
  };

  if (loading) return <div className="space-y-4">{[...Array(6)].map((_, i) => (<div key={i} className="h-16 rounded-2xl skeleton" />))}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Settings</h1>
          <p className="text-sm text-muted">Configure your school system</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="gradient-royal text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-royal/25 flex items-center gap-2">
          {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save All</>
          )}
        </button>
      </div>

      {/* Tab Selector */}
      <div className="liquid-glass rounded-2xl p-2 flex gap-1 flex-wrap">
        {(["general", "people", "exam", "security"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === tab ? "gradient-royal text-white" : "text-muted hover:text-charcoal"}`}>
            {tab === "general" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-5"/></svg>}
            {tab === "people" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            {tab === "exam" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
            {tab === "security" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
            {tab === "general" ? "General" : tab === "people" ? "People" : tab === "exam" ? "Exam Marks" : "Security"}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="liquid-glass-strong rounded-3xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="School Name" value={schoolName} onChange={setSchoolName}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-5"/></svg>} />
            <InputField label="School Logo URL" value={schoolLogo} onChange={setSchoolLogo} placeholder="https://..."
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} />
            <InputField label="Academic Year" value={academicYear} onChange={setAcademicYear}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-charcoal mb-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
                Next Roll Number
              </label>
              <input type="number" value={nextRollNumber} onChange={(e) => setNextRollNumber(parseInt(e.target.value) || 2)}
                className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" min="2" step="2" />
            </div>
          </div>
        </div>
      )}

      {/* People Tab */}
      {activeTab === "people" && (
        <div className="space-y-6">
          {/* Class Teacher Section */}
          <div className="liquid-glass-strong rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center text-royal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-charcoal">Class Teacher</h3>
                <p className="text-xs text-muted">Displayed on public dashboard</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Name" value={classTeacherName} onChange={setClassTeacherName} placeholder="e.g. Md. Antazur Rahman"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
              <InputField label="Degree / Qualification" value={classTeacherDegree} onChange={setClassTeacherDegree} placeholder="e.g. B.A., B.Ed."
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-5"/></svg>} />
              <InputField label="Profile Picture URL" value={classTeacherPicture} onChange={setClassTeacherPicture} placeholder="https://..."
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} />
              <InputField label="Principal Name" value={principalName} onChange={setPrincipalName} placeholder="For report cards"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
            </div>
          </div>

          {/* Developer Section */}
          <div className="liquid-glass-strong rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-charcoal">Website Developer</h3>
                <p className="text-xs text-muted">Your info displayed at bottom of dashboard</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Your Name" value={developerName} onChange={setDeveloperName} placeholder="e.g. Saad Bin Ashraf"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-charcoal mb-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/></svg>
                  Your Roll Number
                </label>
                <input type="number" value={developerRoll} onChange={(e) => setDeveloperRoll(parseInt(e.target.value) || 6)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" min="2" step="2" />
              </div>
              <InputField label="Profile Picture URL" value={developerPicture} onChange={setDeveloperPicture} placeholder="https://..."
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} />
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-charcoal mb-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  Bio / Description
                </label>
                <textarea value={developerBio} onChange={(e) => setDeveloperBio(e.target.value)} rows={2}
                  className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm resize-none"
                  placeholder="e.g. Web Developer & Student of Class 8" />
              </div>
            </div>
          </div>
          {/* Captain & Monitor */}
          <div className="liquid-glass-strong rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-charcoal">Captain & Monitor</h3>
                <p className="text-xs text-muted">Displayed on public dashboard with performance</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Captain (Select Student)</label>
                <select value={captainRoll ?? ""} onChange={(e) => setCaptainRoll(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm">
                  <option value="">None</option>
                  {studentsList.map(s => <option key={s.id} value={s.rollNumber}>Roll {s.rollNumber} — {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Captain Title</label>
                <input type="text" value={captainTitle} onChange={(e) => setCaptainTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" placeholder="e.g. Captain, Class Captain" />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Monitor (Select Student)</label>
                <select value={monitorRoll ?? ""} onChange={(e) => setMonitorRoll(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm">
                  <option value="">None</option>
                  {studentsList.map(s => <option key={s.id} value={s.rollNumber}>Roll {s.rollNumber} — {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Monitor Title</label>
                <input type="text" value={monitorTitle} onChange={(e) => setMonitorTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" placeholder="e.g. Monitor, Class Monitor" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exam Tab */}
      {activeTab === "exam" && (
        <div className="space-y-6">
          {EXAM_TYPES.map((exam) => (
            <div key={exam} className="liquid-glass-strong rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-royal/10 flex items-center justify-center text-royal">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </div>
                <h3 className="text-lg font-bold text-charcoal">{exam}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {SUBJECTS.map((subj) => (
                  <div key={subj}>
                    <label className="block text-xs font-medium text-muted mb-1">{subj}</label>
                    <input type="number" value={examFullMarks[exam]?.[subj] ?? 0}
                      onChange={(e) => handleExamMarkChange(exam, subj, e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/40 text-sm text-center backdrop-blur-sm" min="0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="liquid-glass-strong rounded-3xl p-6">
          <div className="max-w-md">
            <label className="flex items-center gap-2 text-sm font-semibold text-charcoal mb-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Admin Password
            </label>
            <input type="text" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" />
            <p className="text-xs text-muted mt-2">This password is used to access the admin panel.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-charcoal mb-1.5">{icon}{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" />
    </div>
  );
}
