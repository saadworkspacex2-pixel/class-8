"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/Toast";
import { SUBJECTS } from "@/lib/constants";

interface Teacher {
  id: number;
  name: string;
  degree: string;
  subject: string;
  profilePicture: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [degree, setDegree] = useState("");
  const [subject, setSubject] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      setTeachers(Array.isArray(data) ? data : []);
    } catch {
      toast("Failed to load teachers", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const resetForm = () => {
    setName("");
    setDegree("");
    setSubject("");
    setProfilePicture("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast("Name is required", "error");
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/teachers/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, degree, subject, profilePicture }),
        });
        if (res.ok) { toast("Teacher updated", "success"); resetForm(); fetchTeachers(); }
        else { const d = await res.json(); toast(d.error || "Failed", "error"); }
      } else {
        const res = await fetch("/api/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, degree, subject, profilePicture }),
        });
        if (res.ok) { toast("Teacher added", "success"); resetForm(); fetchTeachers(); }
        else { const d = await res.json(); toast(d.error || "Failed", "error"); }
      }
    } catch { toast("Network error", "error"); }
    setSaving(false);
  };

  const handleEdit = (t: Teacher) => {
    setEditingId(t.id);
    setName(t.name);
    setDegree(t.degree);
    setSubject(t.subject);
    setProfilePicture(t.profilePicture || "");
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this teacher?")) return;
    try {
      const res = await fetch(`/api/teachers/${id}`, { method: "DELETE" });
      if (res.ok) { toast("Teacher deleted", "success"); fetchTeachers(); }
    } catch { toast("Delete failed", "error"); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Teachers</h1>
          <p className="text-sm text-muted">Manage faculty members</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="gradient-royal text-white px-5 py-2.5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-royal/25 flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Teacher
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="liquid-glass-strong rounded-3xl p-6 animate-scale-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center text-royal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-charcoal">{editingId ? "Edit Teacher" : "New Teacher"}</h3>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm"
                placeholder="Teacher name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Degree / Qualification</label>
              <input type="text" value={degree} onChange={(e) => setDegree(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm"
                placeholder="e.g. M.A., B.Ed." />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm">
                <option value="">Select subject...</option>
                <option value="Class Teacher">Class Teacher</option>
                <option value="Principal">Principal</option>
                <option value="Assistant Teacher">Assistant Teacher</option>
                {SUBJECTS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Profile Picture URL</label>
              <input type="text" value={profilePicture} onChange={(e) => setProfilePicture(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm"
                placeholder="https://... (optional)" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="gradient-royal text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-royal/25 flex items-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> {editingId ? "Update" : "Add Teacher"}</>
                )}
              </button>
              <button type="button" onClick={resetForm}
                className="px-6 py-3 rounded-2xl text-sm font-semibold liquid-glass-sm text-muted hover:text-charcoal transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teachers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (<div key={i} className="h-48 rounded-3xl skeleton" />))}
        </div>
      ) : teachers.length === 0 ? (
        <div className="liquid-glass-strong rounded-3xl p-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-royal/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#006FEE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-charcoal mb-2">No Teachers Added</h3>
          <p className="text-muted">Add your first teacher to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((t) => (
            <div key={t.id} className="liquid-glass-strong rounded-3xl p-6 liquid-glass-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {t.profilePicture ? (
                    <img src={t.profilePicture} alt={t.name}
                      className="w-14 h-14 rounded-full object-cover ring-3 ring-white/60 shadow-md" />
                  ) : (
                    <div className="w-14 h-14 rounded-full gradient-royal flex items-center justify-center text-white text-lg font-bold ring-3 ring-white/60 shadow-md">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-base font-bold text-charcoal">{t.name}</h4>
                    {t.degree && <p className="text-xs text-muted">{t.degree}</p>}
                  </div>
                </div>
              </div>
              {t.subject && (
                <div className="mb-4">
                  <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-royal/10 text-royal">
                    {t.subject}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleEdit(t)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-royal/10 text-royal hover:bg-royal/20 transition-all flex items-center justify-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button onClick={() => handleDelete(t.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-crimson/10 text-crimson hover:bg-crimson/20 transition-all flex items-center justify-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
