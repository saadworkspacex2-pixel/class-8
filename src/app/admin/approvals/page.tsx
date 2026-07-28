"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/Toast";

interface PendingChange {
  id: number;
  actionType: string;
  actionLabel: string;
  endpoint: string;
  method: string;
  payload: Record<string, unknown>;
  status: string;
  createdAt: string;
}

export default function ApprovalsPage() {
  const [items, setItems] = useState<PendingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [processing, setProcessing] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/pending")
      .then(r => r.json())
      .then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/pending/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(action === "approve" ? "✅ Change approved & applied!" : "❌ Change rejected", action === "approve" ? "success" : "info");
        load();
      } else {
        toast(data.error || "Failed", "error");
      }
    } catch {
      toast("Network error", "error");
    }
    setProcessing(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this record?")) return;
    await fetch(`/api/pending/${id}`, { method: "DELETE" });
    toast("Deleted", "success");
    load();
  };

  const filtered = items.filter(i => filter === "all" || i.status === filter);
  const pendingCount = items.filter(i => i.status === "pending").length;

  const actionTypeColors: Record<string, string> = {
    create_student: "bg-emerald/10 text-emerald",
    update_marks: "bg-royal/10 text-royal",
    delete_student: "bg-crimson/10 text-crimson",
    update_settings: "bg-amber/10 text-amber",
    create_notice: "bg-purple-500/10 text-purple-600",
    update_behavior: "bg-royal/10 text-royal",
    add_comment: "bg-emerald/10 text-emerald",
    other: "bg-muted/10 text-muted",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-charcoal flex items-center gap-3">
            ⚡ Approval Queue
            {pendingCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-crimson/15 text-crimson animate-pulse">
                {pendingCount} pending
              </span>
            )}
          </h1>
          <p className="text-sm text-muted">Review and approve changes made by secondary admin</p>
        </div>
      </div>

      {/* Filter */}
      <div className="liquid-glass rounded-2xl p-2 flex gap-1 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold capitalize transition-all ${
              filter === f ? "gradient-royal text-white" : "text-muted hover:text-charcoal"
            }`}>
            {f}{f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {/* Changes list */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="liquid-glass-strong rounded-2xl md:rounded-3xl p-12 md:p-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <h3 className="text-lg font-bold text-charcoal mb-2">{filter === "pending" ? "All Clear!" : "No items"}</h3>
          <p className="text-sm text-muted">{filter === "pending" ? "No pending changes to review." : `No ${filter} changes found.`}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="liquid-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${actionTypeColors[item.actionType] || actionTypeColors.other}`}>
                    {item.actionType === "create_student" ? "👤" :
                     item.actionType === "update_marks" ? "📝" :
                     item.actionType === "delete_student" ? "🗑️" :
                     item.actionType === "update_settings" ? "⚙️" :
                     item.actionType === "create_notice" ? "📢" :
                     item.actionType === "update_behavior" ? "📊" :
                     item.actionType === "add_comment" ? "💬" : "📋"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-sm font-bold text-charcoal">{item.actionLabel}</h4>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                        item.status === "pending" ? "bg-amber/15 text-amber" :
                        item.status === "approved" ? "bg-emerald/15 text-emerald" :
                        "bg-crimson/15 text-crimson"
                      }`}>{item.status}</span>
                    </div>
                    <p className="text-[11px] text-muted">{item.method} {item.endpoint}</p>
                    <p className="text-[10px] text-muted/60 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                    {/* Show payload preview */}
                    {item.payload && (
                      <details className="mt-2">
                        <summary className="text-[10px] text-royal cursor-pointer font-semibold">View payload</summary>
                        <pre className="text-[10px] text-muted mt-1 bg-white/30 rounded-lg p-2 overflow-x-auto max-h-32">{JSON.stringify(item.payload, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {item.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleAction(item.id, "approve")}
                        disabled={processing === item.id}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald/10 text-emerald hover:bg-emerald/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {processing === item.id ? <div className="w-3 h-3 border-2 border-emerald/30 border-t-emerald rounded-full animate-spin" /> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(item.id, "reject")}
                        disabled={processing === item.id}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-crimson/10 text-crimson hover:bg-crimson/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Reject
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl bg-muted/10 text-muted hover:bg-muted/20 transition-all">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
