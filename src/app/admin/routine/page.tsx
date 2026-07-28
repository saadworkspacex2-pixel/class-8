"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/Toast";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
interface R { id: number; dayOfWeek: number; periodNumber: number; subject: string; teacher: string; startTime: string; endTime: string; }

export default function RoutinePage() {
  const [items, setItems] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(1);
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:45");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/routine").then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) return toast("Subject required", "error");
    setSaving(true);
    const dayItems = items.filter(i => i.dayOfWeek === day);
    const period = dayItems.length + 1;
    const res = await fetch("/api/routine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dayOfWeek: day, periodNumber: period, subject, teacher, startTime, endTime }) });
    if (res.ok) { toast("Period added", "success"); setSubject(""); setTeacher(""); load(); } else toast("Failed", "error");
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/routine?id=${id}`, { method: "DELETE" });
    toast("Deleted", "success");
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-charcoal">Routine Builder</h1><p className="text-sm text-muted">Manage class schedule — changes reflect live on public dashboard</p></div>

      {/* Day Tabs */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d, i) => (
          <button key={i} onClick={() => setDay(i)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${day === i ? "gradient-royal text-white shadow-lg shadow-royal/25" : "liquid-glass-sm text-muted hover:text-charcoal"}`}>{d}</button>
        ))}
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="liquid-glass-strong rounded-3xl p-6">
        <h3 className="text-lg font-bold text-charcoal mb-4">Add Period to {DAYS[day]}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">Subject *</label><input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" required /></div>
          <div><label className="block text-sm font-medium mb-1.5">Teacher</label><input type="text" value={teacher} onChange={e => setTeacher(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Start</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" /></div>
          <div><label className="block text-sm font-medium mb-1.5">End</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/40 text-sm backdrop-blur-sm" /></div>
        </div>
        <button type="submit" disabled={saving} className="mt-4 gradient-royal text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-royal/25 disabled:opacity-60">
          {saving ? "Adding..." : "+ Add Period"}
        </button>
      </form>

      {/* Periods List */}
      <div className="liquid-glass-strong rounded-3xl overflow-hidden">
        {loading ? <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl skeleton" />)}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/20">
                <th className="text-left text-xs font-semibold text-muted uppercase py-4 px-6">Day</th>
                <th className="text-left text-xs font-semibold text-muted uppercase py-4 px-6">Time</th>
                <th className="text-left text-xs font-semibold text-muted uppercase py-4 px-6">Subject</th>
                <th className="text-left text-xs font-semibold text-muted uppercase py-4 px-6">Teacher</th>
                <th className="text-right text-xs font-semibold text-muted uppercase py-4 px-6"></th>
              </tr></thead>
              <tbody>
                {items.filter(i => day === -1 || i.dayOfWeek === day).map(i => (
                  <tr key={i.id} className="border-b border-white/10 hover:bg-white/20 transition-colors">
                    <td className="py-3 px-6 text-sm font-medium text-charcoal">{DAYS[i.dayOfWeek]?.slice(0,3)}</td>
                    <td className="py-3 px-6 text-sm text-muted font-mono">{i.startTime}–{i.endTime}</td>
                    <td className="py-3 px-6 text-sm font-semibold text-charcoal">{i.subject}</td>
                    <td className="py-3 px-6 text-sm text-muted">{i.teacher || "—"}</td>
                    <td className="py-3 px-6 text-right">
                      <button onClick={() => handleDelete(i.id)} className="p-2 rounded-xl bg-crimson/10 text-crimson hover:bg-crimson/20 transition-all">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {items.filter(i => i.dayOfWeek === day).length === 0 && <tr><td colSpan={5} className="py-12 text-center text-muted text-sm">No periods for {DAYS[day]}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
