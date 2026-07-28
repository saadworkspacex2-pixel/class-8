"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/Toast";
interface G { id: number; title: string; titleBn: string; description: string; descriptionBn: string; imageUrl: string; category: string; }

export default function GalleryPage() {
  const [items, setItems] = useState<G[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(""); const [titleBn, setTitleBn] = useState("");
  const [desc, setDesc] = useState(""); const [descBn, setDescBn] = useState("");
  const [imageUrl, setImageUrl] = useState(""); const [category, setCategory] = useState("event");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => { setLoading(true); fetch("/api/gallery").then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) return toast("Title & image URL required", "error");
    setSaving(true);
    const res = await fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, titleBn, description: desc, descriptionBn: descBn, imageUrl, category }) });
    if (res.ok) { toast("Added!", "success"); setTitle(""); setTitleBn(""); setDesc(""); setDescBn(""); setImageUrl(""); load(); } else toast("Failed", "error");
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/gallery?id=${id}`, { method: "DELETE" }); toast("Deleted", "success"); load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-charcoal">Gallery Manager</h1><p className="text-sm text-muted">Add photos for the public gallery showcase</p></div>

      <form onSubmit={handleAdd} className="liquid-glass-strong rounded-3xl p-6">
        <h3 className="text-lg font-bold text-charcoal mb-4">Add Photo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">Title (English) *</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" required /></div>
          <div><label className="block text-sm font-medium mb-1.5">Title (Bangla)</label><input type="text" value={titleBn} onChange={e => setTitleBn(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Description (English)</label><textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm resize-none" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Description (Bangla)</label><textarea value={descBn} onChange={e => setDescBn(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm resize-none" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Image URL *</label><input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" placeholder="https://..." required /></div>
          <div><label className="block text-sm font-medium mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm">
              <option value="event">Event</option><option value="project">Project</option><option value="activity">Activity</option><option value="sports">Sports</option>
            </select></div>
        </div>
        <button type="submit" disabled={saving} className="mt-4 gradient-royal text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-royal/25 disabled:opacity-60">{saving ? "Adding..." : "+ Add Photo"}</button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(i => (
          <div key={i.id} className="liquid-glass-strong rounded-2xl overflow-hidden group">
            <div className="relative aspect-square"><img src={i.imageUrl} alt={i.title} className="w-full h-full object-cover" />
              <button onClick={() => handleDelete(i.id)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-crimson/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button></div>
            <div className="p-3"><p className="text-sm font-semibold text-charcoal truncate">{i.title}</p><span className="text-[10px] text-muted uppercase">{i.category}</span></div>
          </div>
        ))}
        {loading && [...Array(4)].map((_, i) => <div key={i} className="aspect-square rounded-2xl skeleton" />)}
      </div>
    </div>
  );
}
