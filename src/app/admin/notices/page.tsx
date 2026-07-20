"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/Toast";
interface N { id: number; title: string; titleBn: string; content: string; contentBn: string; priority: string; createdAt: string; }

export default function NoticesPage() {
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(""); const [titleBn, setTitleBn] = useState("");
  const [content, setContent] = useState(""); const [contentBn, setContentBn] = useState("");
  const [priority, setPriority] = useState("normal");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => { setLoading(true); fetch("/api/notices").then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return toast("Title required", "error");
    setSaving(true);
    const res = await fetch("/api/notices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, titleBn, content, contentBn, priority }) });
    if (res.ok) { toast("Notice posted!", "success"); setTitle(""); setTitleBn(""); setContent(""); setContentBn(""); load(); } else toast("Failed", "error");
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/notices?id=${id}`, { method: "DELETE" }); toast("Deleted", "success"); load();
  };

  const pStyle: Record<string, string> = { urgent: "bg-crimson/10 text-crimson", important: "bg-amber/10 text-amber", normal: "bg-royal/10 text-royal" };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-charcoal">Notice Board Manager</h1><p className="text-sm text-muted">Post announcements visible on public dashboard</p></div>

      <form onSubmit={handleAdd} className="liquid-glass-strong rounded-3xl p-6">
        <h3 className="text-lg font-bold text-charcoal mb-4">Post Notice</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">Title (English) *</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" required /></div>
          <div><label className="block text-sm font-medium mb-1.5">Title (Bangla)</label><input type="text" value={titleBn} onChange={e => setTitleBn(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Content (English)</label><textarea value={content} onChange={e => setContent(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm resize-none" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Content (Bangla)</label><textarea value={contentBn} onChange={e => setContentBn(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm resize-none" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm">
              <option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option>
            </select></div>
        </div>
        <button type="submit" disabled={saving} className="mt-4 gradient-royal text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-royal/25 disabled:opacity-60">{saving ? "Posting..." : "📢 Post Notice"}</button>
      </form>

      <div className="space-y-3">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-3xl skeleton" />) :
          items.length === 0 ? <div className="liquid-glass-strong rounded-3xl p-16 text-center text-muted text-sm">No notices posted yet</div> :
          items.map(n => (
            <div key={n.id} className="liquid-glass-strong rounded-3xl p-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-bold text-charcoal">{n.title}</h4>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${pStyle[n.priority] || pStyle.normal}`}>{n.priority}</span>
                </div>
                {n.titleBn && <p className="text-sm text-muted font-bangla">{n.titleBn}</p>}
                {n.content && <p className="text-sm text-muted mt-1">{n.content}</p>}
                <p className="text-xs text-muted/60 mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleDelete(n.id)} className="p-2 rounded-xl bg-crimson/10 text-crimson hover:bg-crimson/20 transition-all flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
