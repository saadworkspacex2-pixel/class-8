"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/Toast";
import { SUBJECTS } from "@/lib/constants";

interface M { id: number; title: string; titleBn: string; subject: string; type: string; url: string; description: string; }

export default function MaterialsPage() {
  const [items, setItems] = useState<M[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(""); const [titleBn, setTitleBn] = useState("");
  const [subject, setSubject] = useState(""); const [type, setType] = useState("note");
  const [url, setUrl] = useState(""); const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => { setLoading(true); fetch("/api/study-materials").then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); if (!title) return toast("Title required", "error"); setSaving(true);
    const res = await fetch("/api/study-materials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, titleBn, subject, type, url, description: desc }) });
    if (res.ok) { toast("Added!", "success"); setTitle(""); setTitleBn(""); setSubject(""); setUrl(""); setDesc(""); load(); } else toast("Failed", "error");
    setSaving(false);
  };

  const handleDelete = async (id: number) => { if (!confirm("Delete?")) return; await fetch(`/api/study-materials?id=${id}`, { method: "DELETE" }); toast("Deleted", "success"); load(); };

  const typeIcons: Record<string, string> = { note: "📝", pdf: "📄", video: "🎬", link: "🔗" };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-xl md:text-2xl font-bold text-charcoal">Study Materials</h1><p className="text-sm text-muted">Share notes, PDFs, videos & links with students</p></div>

      <form onSubmit={handleAdd} className="liquid-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-bold text-charcoal mb-4">Add Material</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div><label className="block text-xs md:text-sm font-medium mb-1.5">Title (English) *</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm" required /></div>
          <div><label className="block text-xs md:text-sm font-medium mb-1.5">Title (Bangla)</label><input type="text" value={titleBn} onChange={e => setTitleBn(e.target.value)} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm" /></div>
          <div><label className="block text-xs md:text-sm font-medium mb-1.5">Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm">
              <option value="">General</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <div><label className="block text-xs md:text-sm font-medium mb-1.5">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm">
              <option value="note">📝 Note</option><option value="pdf">📄 PDF</option><option value="video">🎬 Video</option><option value="link">🔗 Link</option>
            </select></div>
          <div><label className="block text-xs md:text-sm font-medium mb-1.5">URL</label><input type="text" value={url} onChange={e => setUrl(e.target.value)} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm" placeholder="https://..." /></div>
          <div><label className="block text-xs md:text-sm font-medium mb-1.5">Description</label><input type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm" /></div>
        </div>
        <button type="submit" disabled={saving} className="mt-4 gradient-royal text-white px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold shadow-lg shadow-royal/20 disabled:opacity-60">{saving ? "Adding..." : "+ Add Material"}</button>
      </form>

      <div className="space-y-2 md:space-y-3">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl skeleton" />) :
          items.length === 0 ? <div className="liquid-glass-strong rounded-2xl md:rounded-3xl p-12 md:p-16 text-center text-muted text-sm">No materials added yet</div> :
          items.map(m => (
            <div key={m.id} className="liquid-glass-strong rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl md:text-2xl flex-shrink-0">{typeIcons[m.type] || "📝"}</span>
                <div className="min-w-0"><p className="text-xs md:text-sm font-bold text-charcoal truncate">{m.title}</p><p className="text-[10px] md:text-xs text-muted">{m.subject || "General"} • {m.type}</p></div>
              </div>
              <button onClick={() => handleDelete(m.id)} className="p-2 rounded-xl bg-crimson/10 text-crimson hover:bg-crimson/20 transition-all flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
