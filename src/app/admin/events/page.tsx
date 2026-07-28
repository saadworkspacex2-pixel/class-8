"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/Toast";

interface E { id: number; title: string; titleBn: string; description: string; eventDate: string; eventType: string; }

export default function EventsPage() {
  const [items, setItems] = useState<E[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(""); const [titleBn, setTitleBn] = useState("");
  const [desc, setDesc] = useState(""); const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("exam");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => { setLoading(true); fetch("/api/events").then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); if (!title || !eventDate) return toast("Title & date required", "error"); setSaving(true);
    const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, titleBn, description: desc, eventDate, eventType }) });
    if (res.ok) { toast("Event added!", "success"); setTitle(""); setTitleBn(""); setDesc(""); setEventDate(""); load(); } else toast("Failed", "error");
    setSaving(false);
  };

  const handleDelete = async (id: number) => { if (!confirm("Delete?")) return; await fetch(`/api/events?id=${id}`, { method: "DELETE" }); toast("Deleted", "success"); load(); };

  const typeIcons: Record<string, string> = { exam: "📝", event: "🎉", holiday: "🏖️", deadline: "⏰" };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-xl md:text-2xl font-bold text-charcoal">Events & Calendar</h1><p className="text-sm text-muted">Add exams, holidays, deadlines & events</p></div>

      <form onSubmit={handleAdd} className="liquid-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-bold text-charcoal mb-4">Add Event</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div><label className="block text-xs md:text-sm font-medium mb-1.5">Title *</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm" required /></div>
          <div><label className="block text-xs md:text-sm font-medium mb-1.5">Title (Bangla)</label><input type="text" value={titleBn} onChange={e => setTitleBn(e.target.value)} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm" /></div>
          <div><label className="block text-xs md:text-sm font-medium mb-1.5">Date *</label><input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm" required /></div>
          <div><label className="block text-xs md:text-sm font-medium mb-1.5">Type</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm">
              <option value="exam">📝 Exam</option><option value="event">🎉 Event</option><option value="holiday">🏖️ Holiday</option><option value="deadline">⏰ Deadline</option>
            </select></div>
          <div className="md:col-span-2"><label className="block text-xs md:text-sm font-medium mb-1.5">Description</label><input type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm" /></div>
        </div>
        <button type="submit" disabled={saving} className="mt-4 gradient-royal text-white px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold shadow-lg shadow-royal/20 disabled:opacity-60">{saving ? "Adding..." : "📅 Add Event"}</button>
      </form>

      <div className="space-y-2 md:space-y-3">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl skeleton" />) :
          items.length === 0 ? <div className="liquid-glass-strong rounded-2xl md:rounded-3xl p-12 md:p-16 text-center text-muted text-sm">No events added yet</div> :
          items.map(e => (
            <div key={e.id} className="liquid-glass-strong rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl md:text-2xl flex-shrink-0">{typeIcons[e.eventType] || "📌"}</span>
                <div className="min-w-0"><p className="text-xs md:text-sm font-bold text-charcoal truncate">{e.title}</p><p className="text-[10px] md:text-xs text-muted">{e.eventDate} • {e.eventType}</p></div>
              </div>
              <button onClick={() => handleDelete(e.id)} className="p-2 rounded-xl bg-crimson/10 text-crimson hover:bg-crimson/20 transition-all flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
