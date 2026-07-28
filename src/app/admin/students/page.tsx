"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/Toast";

interface Student {
  id: number;
  name: string;
  rollNumber: number;
  password: string;
  profilePicture: string;
  studentId: string;
  fatherName: string;
  motherName: string;
  mobileNumber: string;
  createdAt: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState<number>(2);
  const [password, setPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [studentId, setStudentId] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      toast("Failed to load students", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const resetForm = () => {
    setName("");
    setRollNumber(2);
    setPassword("");
    setProfilePicture("");
    setStudentId("");
    setFatherName("");
    setMotherName("");
    setMobileNumber("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast("Name is required", "error");
    if (!rollNumber) return toast("Roll number is required", "error");
    if (!password.trim()) return toast("Password is required", "error");

    setSaving(true);
    try {
      const payload = { name, rollNumber, password, profilePicture, studentId, fatherName, motherName, mobileNumber };
      if (editingId) {
        const res = await fetch(`/api/students/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) { toast("Student updated", "success"); resetForm(); fetchStudents(); }
        else { const d = await res.json(); toast(d.error || "Failed", "error"); }
      } else {
        const res = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) { toast("Student created", "success"); resetForm(); fetchStudents(); }
        else { const d = await res.json(); toast(d.error || "Failed", "error"); }
      }
    } catch { toast("Network error", "error"); }
    setSaving(false);
  };

  const handleEdit = (s: Student) => {
    setEditingId(s.id);
    setName(s.name);
    setRollNumber(s.rollNumber);
    setPassword(s.password);
    setProfilePicture(s.profilePicture || "");
    setStudentId(s.studentId || "");
    setFatherName(s.fatherName || "");
    setMotherName(s.motherName || "");
    setMobileNumber(s.mobileNumber || "");
    setShowForm(true);
    setViewingStudent(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this student? This will also delete all their marks.")) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) { toast("Student deleted", "success"); fetchStudents(); setViewingStudent(null); }
    } catch { toast("Delete failed", "error"); }
  };

  const filtered = searchQuery
    ? students.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber.toString().includes(searchQuery) ||
        s.fatherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.mobileNumber?.includes(searchQuery)
      )
    : students;

  const evenRolls = Array.from({ length: 125 }, (_, i) => (i + 1) * 2);
  const usedRolls = new Set(students.map((s) => s.rollNumber));
  const availableRolls = editingId ? evenRolls : evenRolls.filter((r) => !usedRolls.has(r));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Students</h1>
          <p className="text-sm text-muted">{students.length} students registered</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="gradient-royal text-white px-5 py-2.5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-royal/25 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Student
        </button>
      </div>

      {/* Search */}
      <div className="liquid-glass rounded-2xl p-4">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search by name, roll, father's name, or mobile..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="liquid-glass-strong rounded-3xl p-6 animate-scale-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center text-royal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-charcoal">{editingId ? "Edit Student" : "New Student"}</h3>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField label="Name *" value={name} onChange={setName} placeholder="Student name" required />
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Roll Number *</label>
              <select value={rollNumber} onChange={(e) => setRollNumber(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" required>
                {availableRolls.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
            <InputField label="Password *" value={password} onChange={setPassword} placeholder="Login password" required />
            <InputField label="Student ID" value={studentId} onChange={setStudentId} placeholder="e.g. 2025-001" />
            <InputField label="Father's Name" value={fatherName} onChange={setFatherName} placeholder="Father's name" />
            <InputField label="Mother's Name" value={motherName} onChange={setMotherName} placeholder="Mother's name" />
            <InputField label="Mobile Number" value={mobileNumber} onChange={setMobileNumber} placeholder="e.g. 01712345678" />
            <InputField label="Profile Picture URL" value={profilePicture} onChange={setProfilePicture} placeholder="https://..." />
            <div className="lg:col-span-3 flex gap-3 mt-2">
              <button type="submit" disabled={saving}
                className="gradient-royal text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-royal/25 flex items-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> {editingId ? "Update" : "Create"}</>
                )}
              </button>
              <button type="button" onClick={resetForm}
                className="px-6 py-3 rounded-2xl text-sm font-semibold liquid-glass-sm text-muted hover:text-charcoal transition-all">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Student Detail Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-xl" onClick={() => setViewingStudent(null)} />
          <div className="relative liquid-glass-strong rounded-3xl p-8 w-full max-w-lg animate-scale-in">
            <button onClick={() => setViewingStudent(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full liquid-glass-sm flex items-center justify-center text-muted hover:text-charcoal transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="text-center mb-6">
              {viewingStudent.profilePicture ? (
                <img src={viewingStudent.profilePicture} alt={viewingStudent.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-royal/20 shadow-xl mx-auto mb-4" />
              ) : (
                <div className="w-24 h-24 rounded-full gradient-royal flex items-center justify-center text-white text-3xl font-bold ring-4 ring-royal/20 shadow-xl mx-auto mb-4">
                  {viewingStudent.name.charAt(0)}
                </div>
              )}
              <h3 className="text-xl font-bold text-charcoal">{viewingStudent.name}</h3>
              <p className="text-sm text-muted">Roll No. {viewingStudent.rollNumber}</p>
            </div>
            <div className="space-y-3">
              {viewingStudent.studentId && <InfoRow label="Student ID" value={viewingStudent.studentId} />}
              {viewingStudent.fatherName && <InfoRow label="Father's Name" value={viewingStudent.fatherName} />}
              {viewingStudent.motherName && <InfoRow label="Mother's Name" value={viewingStudent.motherName} />}
              {viewingStudent.mobileNumber && <InfoRow label="Mobile Number" value={viewingStudent.mobileNumber} />}
              <InfoRow label="Password" value={viewingStudent.password} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => handleEdit(viewingStudent)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-royal/10 text-royal hover:bg-royal/20 transition-all">Edit</button>
              <button onClick={() => handleDelete(viewingStudent.id)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-crimson/10 text-crimson hover:bg-crimson/20 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="liquid-glass-strong rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => (<div key={i} className="h-14 rounded-xl skeleton" />))}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-4 px-6">Roll</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-4 px-6">Student</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-4 px-6 hidden lg:table-cell">Father</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider py-4 px-6 hidden md:table-cell">Mobile</th>
                  <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                    onClick={() => setViewingStudent(s)}>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-royal/10 text-royal text-sm font-bold">
                        {s.rollNumber}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {s.profilePicture ? (
                          <img src={s.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50" />
                        ) : (
                          <div className="w-10 h-10 rounded-full gradient-royal flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/50">
                            {s.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-semibold text-charcoal block">{s.name}</span>
                          {s.studentId && <span className="text-xs text-muted">ID: {s.studentId}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-muted hidden lg:table-cell">{s.fatherName || "—"}</td>
                    <td className="py-4 px-6 text-sm text-muted hidden md:table-cell">{s.mobileNumber || "—"}</td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(s)}
                          className="p-2 rounded-xl bg-royal/10 text-royal hover:bg-royal/20 transition-all" title="Edit">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(s.id)}
                          className="p-2 rounded-xl bg-crimson/10 text-crimson hover:bg-crimson/20 transition-all" title="Delete">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="py-16 text-center text-muted text-sm">
                    <div className="w-16 h-16 rounded-3xl bg-royal/10 flex items-center justify-center mx-auto mb-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#006FEE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                      </svg>
                    </div>
                    No students found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal mb-1.5">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" required={required} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/20">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-charcoal">{value}</span>
    </div>
  );
}
