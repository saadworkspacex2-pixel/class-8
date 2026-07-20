"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/Toast";

interface Application {
  id: number;
  name: string;
  rollNumber: number;
  studentId: string;
  fatherName: string;
  motherName: string;
  mobileNumber: string;
  status: string;
  createdAt: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      toast("Failed to load applications", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === "approve") {
          toast(`Approved! Default password: ${data.password}`, "success");
        } else {
          toast("Application rejected", "info");
        }
        fetchApplications();
      } else {
        toast(data.error || "Action failed", "error");
      }
    } catch {
      toast("Network error", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this application?")) return;
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Application deleted", "success");
        fetchApplications();
      }
    } catch {
      toast("Delete failed", "error");
    }
  };

  const filtered = applications.filter((a) => filter === "all" || a.status === filter);
  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal flex items-center gap-3">
            Applications
            {pendingCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber/15 text-amber">
                {pendingCount} pending
              </span>
            )}
          </h1>
          <p className="text-sm text-muted">Review and approve student registrations</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="liquid-glass rounded-2xl p-2 flex gap-1 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold capitalize transition-all ${
              filter === f ? "gradient-royal text-white" : "text-muted hover:text-charcoal"
            }`}
          >
            {f}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-3xl skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="liquid-glass-strong rounded-3xl p-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-royal/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#006FEE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-charcoal mb-2">No Applications</h3>
          <p className="text-muted">No {filter !== "all" ? filter : ""} applications found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div key={app.id} className="liquid-glass-strong rounded-3xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl gradient-royal flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {app.rollNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-bold text-charcoal">{app.name}</h4>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        app.status === "pending" ? "bg-amber/15 text-amber" :
                        app.status === "approved" ? "bg-emerald/15 text-emerald" :
                        "bg-crimson/15 text-crimson"
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                      {app.studentId && (
                        <p className="text-muted">
                          <span className="font-medium text-charcoal">ID:</span> {app.studentId}
                        </p>
                      )}
                      {app.fatherName && (
                        <p className="text-muted">
                          <span className="font-medium text-charcoal">Father:</span> {app.fatherName}
                        </p>
                      )}
                      {app.motherName && (
                        <p className="text-muted">
                          <span className="font-medium text-charcoal">Mother:</span> {app.motherName}
                        </p>
                      )}
                      {app.mobileNumber && (
                        <p className="text-muted">
                          <span className="font-medium text-charcoal">Mobile:</span> {app.mobileNumber}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-2">
                      Applied: {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {app.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(app.id, "approve")}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald/10 text-emerald hover:bg-emerald/20 transition-all flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(app.id, "reject")}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-crimson/10 text-crimson hover:bg-crimson/20 transition-all flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Reject
                    </button>
                  </div>
                )}

                {app.status !== "pending" && (
                  <button
                    onClick={() => handleDelete(app.id)}
                    className="p-2 rounded-xl bg-muted/10 text-muted hover:bg-muted/20 transition-all"
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
