"use client";

import { useState, useEffect } from "react";
import { EXAM_TYPES, GRADE_COLORS } from "@/lib/constants";

interface Stats {
  totalStudents: number;
  studentsWithMarks: number;
  highest: number;
  lowest: number;
  average: number;
  passCount: number;
  failCount: number;
  maxPossibleTotal: number;
  gradeDistribution: Record<string, number>;
  subjectAverages: Array<{ subject: string; average: number; max: number }>;
}

interface StudentResult {
  studentId: number;
  name: string;
  rollNumber: number;
  totalObtained: number;
  average: number;
  overallGrade: string;
  overallPass: boolean;
  rank: number | null;
  hasMarks: boolean;
}

export default function AdminDashboard() {
  const [examType, setExamType] = useState<string>(EXAM_TYPES[0]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/results?examType=${encodeURIComponent(examType)}`)
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setResults(d.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [examType]);

  const top10 = results
    .filter((r) => r.hasMarks)
    .sort((a, b) => b.totalObtained - a.totalObtained)
    .slice(0, 10);

  const topStudent = top10[0];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 rounded-3xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Exam Selector */}
      <div className="flex flex-wrap gap-2 mb-2">
        {EXAM_TYPES.map((exam) => (
          <button
            key={exam}
            onClick={() => setExamType(exam)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${
              examType === exam
                ? "gradient-royal text-white shadow-lg shadow-royal/25"
                : "liquid-glass-sm text-muted hover:text-charcoal"
            }`}
          >
            {exam}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          label="Total Students"
          value={stats?.totalStudents ?? 0}
          color="text-royal"
          bgColor="bg-royal/10"
        />
        <DashCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
          label="Highest Marks"
          value={stats?.highest ?? 0}
          color="text-emerald"
          bgColor="bg-emerald/10"
        />
        <DashCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
          label="Lowest Marks"
          value={stats?.lowest ?? 0}
          color="text-crimson"
          bgColor="bg-crimson/10"
        />
        <DashCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
          label="Class Average"
          value={stats?.average ?? 0}
          color="text-amber"
          bgColor="bg-amber/10"
        />
        <DashCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          label="Pass %"
          value={`${stats && stats.studentsWithMarks > 0 ? Math.round((stats.passCount / stats.studentsWithMarks) * 100) : 0}%`}
          color="text-emerald"
          bgColor="bg-emerald/10"
        />
        <DashCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
          label="Fail %"
          value={`${stats && stats.studentsWithMarks > 0 ? Math.round((stats.failCount / stats.studentsWithMarks) * 100) : 0}%`}
          color="text-crimson"
          bgColor="bg-crimson/10"
        />
        <DashCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          label="Top Student"
          value={topStudent?.name ?? "—"}
          color="text-amber"
          bgColor="bg-amber/10"
          small
        />
        <DashCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
          label="Current Exam"
          value={examType}
          color="text-royal"
          bgColor="bg-royal/10"
          small
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Students */}
        <div className="liquid-glass-strong rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-charcoal">Top 10 Students</h3>
          </div>
          <div className="space-y-1">
            {top10.map((s, i) => (
              <div key={s.studentId} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/40 transition-colors">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                  i === 0 ? "bg-amber/15 text-amber" : i === 1 ? "bg-gray-500/10 text-gray-500" : i === 2 ? "bg-orange-500/15 text-orange-600" : "liquid-glass-sm text-muted"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal truncate">{s.name}</p>
                  <p className="text-xs text-muted">Roll {s.rollNumber}</p>
                </div>
                <span className="text-sm font-bold text-charcoal">{s.totalObtained}</span>
                <span
                  className="px-2 py-0.5 rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: `${GRADE_COLORS[s.overallGrade] || "#6B7280"}18`,
                    color: GRADE_COLORS[s.overallGrade] || "#6B7280",
                  }}
                >
                  {s.overallGrade}
                </span>
              </div>
            ))}
            {top10.length === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-royal/10 flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006FEE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                </div>
                <p className="text-muted text-sm">No results available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Grade Distribution & Subject Averages */}
        <div className="space-y-6">
          <div className="liquid-glass-strong rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="12" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="12" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-charcoal">Grade Distribution</h3>
            </div>
            <div className="flex items-end justify-around h-40">
              {stats &&
                Object.entries(stats.gradeDistribution).map(([grade, count]) => {
                  const maxCount = Math.max(...Object.values(stats.gradeDistribution), 1);
                  const height = (count / maxCount) * 100;
                  return (
                    <div key={grade} className="flex flex-col items-center gap-1">
                      <span className="text-xs font-bold">{count}</span>
                      <div
                        className="w-8 rounded-t-xl transition-all duration-700"
                        style={{
                          height: `${Math.max(height, 4)}%`,
                          backgroundColor: GRADE_COLORS[grade] || "#6B7280",
                        }}
                      />
                      <span className="text-xs font-semibold text-muted">{grade}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="liquid-glass rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center text-royal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-charcoal">Subject Averages</h3>
            </div>
            <div className="space-y-3">
              {stats?.subjectAverages.map((sa) => (
                <div key={sa.subject}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-charcoal">{sa.subject}</span>
                    <span className="text-muted">{sa.average}/{sa.max}</span>
                  </div>
                  <div className="w-full bg-white/40 rounded-full h-2">
                    <div
                      className="gradient-royal h-2 rounded-full transition-all duration-700"
                      style={{ width: `${sa.max > 0 ? (sa.average / sa.max) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashCard({ icon, label, value, color, bgColor, small }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  small?: boolean;
}) {
  return (
    <div className="liquid-glass rounded-3xl p-5 liquid-glass-hover">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bgColor} ${color}`}>
        {icon}
      </div>
      <p className={`${small ? "text-sm" : "text-2xl"} font-bold text-charcoal truncate`}>{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
