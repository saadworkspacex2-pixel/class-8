"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "@/components/Toast";
import { SUBJECTS } from "@/lib/constants";

interface Hw { id: number; subject: string; title: string; description: string; dueDate: string; updatedAt: string; }

export default function HomeworkPage() {
  const [hw, setHw] = useState<Hw[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject: "Bangla 1st", title: "", description: "", dueDate: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchHw = () => { setLoading(true); fetch("/api/homework").then(r => r.json()).then(d => { setHw(Array.isArray(d) ? d : []); setLoading(false); }); };
  useEffect(() => { fetchHw(); }, []);

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!form.title) return toast("Title required", "error"); setSaving(true);
    const url = editingId ? "/api/homework" : "/api/homework";
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { id: editingId, ...form } : form;
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    toast(editingId ? "Updated" : "Added", "success"); setForm({ subject: "Bangla 1st", title: "", description: "", dueDate: "" }); setEditingId(null); setSaving(false); fetchHw();
  };

  const handleDelete = async (id: number) => { if (!confirm("Delete?")) return; await fetch(`/api/homework?id=${id}`, { method: "DELETE" }); toast("Deleted", "success"); setHw(prev => prev.filter(h => h.id !== id)); };
  const handleEdit = (h: Hw) => { setForm({ subject: h.subject, title: h.title, description: h.description, dueDate: h.dueDate }); setEditingId(h.id); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-charcoal">Homework Management</h1><p className="text-sm text-muted">Manage daily homework</p></div>
      <motion.form onSubmit={handleSubmit} className="liquid-glass-strong rounded-3xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-sm font-medium mb-1 block">Subject</label><select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm"><option value="">Select</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="text-sm font-medium mb-1 block">Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm" /></div>
          <div className="md:col-span-2"><label className="text-sm font-medium mb-1 block">Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="HW title" className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm" required /></div>
          <div className="md:col-span-2"><label className="text-sm font-medium mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details..." rows={3} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm resize-none" /></div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="gradient-royal text-white px-6 py-3 rounded-2xl text-sm font-semibold disabled:opacity-60 shadow-lg">{saving ? "Saving..." : editingId ? "Update" : "Add Homework"}</button>
          {editingId && <button type="button" onClick={() => { setForm({ subject: "Bangla 1st", title: "", description: "", dueDate: "" }); setEditingId(null); }} className="px-4 py-3 rounded-2xl text-sm font-semibold liquid-glass-sm text-muted">Cancel</button>}
        </div>
      </motion.form>
      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}</div> : (
        <div className="space-y-3">{hw.map(h => (
          <div key={h.id} className="liquid-glass rounded-2xl p-4 flex items-start justify-between gap-3">
            <div><div className="flex items-center gap-2 mb-1"><span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-royal/10 text-royal">{h.subject}</span>{h.dueDate && <span className="text-[10px] text-muted">{h.dueDate}</span>}</div><p className="text-sm font-bold text-charcoal">{h.title}</p>{h.description && <p className="text-xs text-muted mt-1">{h.description}</p>}</div>
            <div className="flex gap-1 shrink-0"><button onClick={() => handleEdit(h)} className="p-2 rounded-xl bg-royal/10 text-royal hover:bg-royal/20"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button onClick={() => handleDelete(h.id)} className="p-2 rounded-xl bg-crimson/10 text-crimson hover:bg-crimson/20"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>
          </div>))}{hw.length === 0 && <div className="text-center text-muted text-sm py-8">No homework yet.</div>}</div>
      )}
    </div>
  );
}
