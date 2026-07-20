"use client";

import { useState, useEffect } from "react";
import { EXAM_TYPES, SUBJECTS, GRADE_COLORS } from "@/lib/constants";
import { GalleryShowcase, WeeklyRoutineTable } from "@/components/BentoWidgets";
import { StudyMaterials, UpcomingEvents, MarkFinder } from "@/components/StudentWidgets";
import { useI18n } from "@/lib/i18n";
import { playClick, playOpen } from "@/lib/sounds";

interface SubjectResult {
  subject: string;
  cq: number;
  mcq: number;
  total: number;
  maxTotal: number;
  grade: string;
  pass: boolean;
}

interface StudentResult {
  studentId: number;
  name: string;
  rollNumber: number;
  profilePicture: string;
  totalObtained: number;
  maxPossibleTotal: number;
  average: number;
  overallGrade: string;
  overallPass: boolean;
  rank: number | null;
  cqRank: number | null;
  mcqRank: number | null;
  totalCq: number;
  totalMcq: number;
  subjects: SubjectResult[];
  subjectRanks: Record<string, number | null>;
  hasMarks: boolean;
}

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

interface Teacher {
  id: number;
  name: string;
  degree: string;
  subject: string;
  profilePicture: string;
}

interface Settings {
  classTeacherName: string;
  classTeacherDegree: string;
  classTeacherPicture: string;
  developerName: string;
  developerRoll: number;
  developerBio: string;
  developerPicture: string;
  captainRoll: number | null;
  captainTitle: string;
  monitorRoll: number | null;
  monitorTitle: string;
}

interface StudentInfo {
  id: number;
  name: string;
  rollNumber: number;
  profilePicture: string;
  studentId: string;
  fatherName: string;
  motherName: string;
  mobileNumber: string;
}

type LeaderboardType = "overall" | "cq" | "mcq";

export default function PublicDashboard() {
  const { t, lang, tSubject, tExam } = useI18n();
  const [examType, setExamType] = useState<string>(EXAM_TYPES[0]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>("overall");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [allStudents, setAllStudents] = useState<StudentInfo[]>([]);
  const [viewingStudentInfo, setViewingStudentInfo] = useState<StudentInfo | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyForm, setApplyForm] = useState({
    name: "", rollNumber: "", studentId: "", fatherName: "", motherName: "", mobileNumber: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => setAllStudents(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d))
      .catch(() => {});
    fetch("/api/teachers")
      .then((r) => r.json())
      .then((d) => setTeachers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/results?examType=${encodeURIComponent(examType)}`)
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results || []);
        setStats(d.stats || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [examType]);

  const ranked = results
    .filter((r) => r.hasMarks)
    .sort((a, b) => {
      if (leaderboardType === "cq") return b.totalCq - a.totalCq;
      if (leaderboardType === "mcq") return b.totalMcq - a.totalMcq;
      return b.totalObtained - a.totalObtained;
    });

  const subjectRanked = selectedSubject
    ? results.filter((r) => r.hasMarks).sort((a, b) => {
        const aTotal = a.subjects.find((s) => s.subject === selectedSubject)?.total ?? 0;
        const bTotal = b.subjects.find((s) => s.subject === selectedSubject)?.total ?? 0;
        return bTotal - aTotal;
      })
    : [];

  const filtered = searchQuery
    ? ranked.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.rollNumber.toString().includes(searchQuery))
    : ranked;

  const top3 = ranked.slice(0, 3);
  const devRoll = settings?.developerRoll || 6;
  const devStudent = results.find((r) => r.rollNumber === devRoll);

  const Skeleton = () => (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-14 md:h-16 rounded-xl md:rounded-2xl skeleton" />
      ))}
    </div>
  );

  return (
    <div className="space-y-5 md:space-y-8 animate-fade-in overflow-x-hidden">
      {/* Class Teacher & Exam Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {settings?.classTeacherName && (
          <div className="liquid-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-6 flex items-center gap-3 md:gap-5">
            {settings.classTeacherPicture ? (
              <img src={settings.classTeacherPicture} alt={settings.classTeacherName}
                className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover ring-2 md:ring-4 ring-white/60 shadow-lg flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full gradient-royal flex items-center justify-center text-white text-base md:text-xl font-bold ring-2 md:ring-4 ring-white/60 shadow-lg flex-shrink-0">
                {settings.classTeacherName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted font-semibold uppercase tracking-wider mb-0.5 md:mb-1">{t("dash.class_teacher")}</p>
              <h3 className="text-sm md:text-lg font-bold text-charcoal truncate">{settings.classTeacherName}</h3>
              {settings.classTeacherDegree && <p className="text-xs md:text-sm text-muted truncate">{settings.classTeacherDegree}</p>}
            </div>
          </div>
        )}
        <div className="liquid-glass rounded-2xl md:rounded-3xl p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg gradient-royal flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="md:w-[14px] md:h-[14px]"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-xs md:text-sm font-bold text-charcoal truncate">{t("dash.exam")}</h3>
              <p className="text-[10px] md:text-xs text-muted truncate">{t("dash.exam_desc")}</p>
            </div>
          </div>
          <div className="flex gap-1.5 md:gap-2 flex-wrap">
            {EXAM_TYPES.map((exam) => (
              <button key={exam} onClick={() => { setExamType(exam); playClick(); }}
                className={`px-2.5 md:px-3.5 py-1 md:py-1.5 rounded-full md:rounded-xl text-[11px] md:text-xs font-semibold transition-all ${
                  examType === exam ? "gradient-royal text-white shadow-md" : "liquid-glass-sm text-charcoal hover:bg-white/60"
                }`}>
                {tExam(exam)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? <Skeleton /> : (
        <>
          {/* Captain & Monitor Cards */}
          {(settings?.captainRoll || settings?.monitorRoll) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {[
                { roll: settings?.captainRoll, title: settings?.captainTitle || "Captain", gradient: "from-amber-400 to-orange-500", shadow: "shadow-amber-500/20", icon: "👑", glow: "bg-amber-400/20" },
                { roll: settings?.monitorRoll, title: settings?.monitorTitle || "Monitor", gradient: "from-royal to-blue-600", shadow: "shadow-royal/20", icon: "🎖️", glow: "bg-royal/20" },
              ].map(({ roll, title, gradient, shadow, icon, glow }) => {
                if (!roll) return null;
                const student = results.find(r => r.rollNumber === roll);
                const info = allStudents.find(s => s.rollNumber === roll);
                if (!info) return null;
                return (
                  <div key={title} className="liquid-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-5 relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-32 h-32 ${glow} rounded-full blur-[50px] -mr-10 -mt-10`} />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 md:gap-4">
                        {info.profilePicture ? (
                          <img src={info.profilePicture} alt={info.name} className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover ring-3 ring-white/60 shadow-lg flex-shrink-0" />
                        ) : (
                          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg md:text-xl font-bold ring-3 ring-white/60 shadow-lg ${shadow} flex-shrink-0`}>
                            {info.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-lg md:text-xl">{icon}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold bg-gradient-to-r ${gradient} text-white shadow-sm`}>{title}</span>
                          </div>
                          <h4 className="text-sm md:text-base font-bold text-charcoal truncate">{info.name}</h4>
                          <p className="text-[10px] md:text-xs text-muted">{lang === "bn" ? "রোল" : "Roll"} {info.rollNumber}</p>
                        </div>
                      </div>
                      {student?.hasMarks && (
                        <div className="flex gap-2 mt-3">
                          <div className="flex-1 liquid-glass-sm rounded-xl p-2 md:p-2.5 text-center">
                            <p className="text-lg md:text-xl font-black text-charcoal">{student.rank ?? "—"}</p>
                            <p className="text-[9px] md:text-[10px] text-muted">{t("common.rank")}</p>
                          </div>
                          <div className="flex-1 liquid-glass-sm rounded-xl p-2 md:p-2.5 text-center">
                            <p className="text-lg md:text-xl font-black text-charcoal">{student.average}%</p>
                            <p className="text-[9px] md:text-[10px] text-muted">{t("common.average")}</p>
                          </div>
                          <div className="flex-1 liquid-glass-sm rounded-xl p-2 md:p-2.5 text-center">
                            <p className="text-lg md:text-xl font-black" style={{ color: GRADE_COLORS[student.overallGrade] || "#6B7280" }}>{student.overallGrade}</p>
                            <p className="text-[9px] md:text-[10px] text-muted">{t("common.grade")}</p>
                          </div>
                          <div className="flex-1 liquid-glass-sm rounded-xl p-2 md:p-2.5 text-center">
                            <p className="text-lg md:text-xl font-black text-charcoal">{student.totalObtained}</p>
                            <p className="text-[9px] md:text-[10px] text-muted">{t("common.total")}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats */}
          {stats && stats.studentsWithMarks > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
              <StatCard label={t("dash.students")} value={stats.totalStudents} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} color="text-royal" bgColor="bg-royal/10" />
              <StatCard label={t("dash.highest")} value={stats.highest} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} color="text-emerald" bgColor="bg-emerald/10" />
              <StatCard label={t("dash.average")} value={stats.average} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>} color="text-amber" bgColor="bg-amber/10" />
              <StatCard label={t("dash.pass_rate")} value={`${stats.passCount > 0 ? Math.round((stats.passCount / stats.studentsWithMarks) * 100) : 0}%`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} color="text-emerald" bgColor="bg-emerald/10" />
            </div>
          )}

          {/* Quick Result Lookup + Upcoming Events */}
          <div id="results" className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <MarkFinder />
            <UpcomingEvents />
          </div>

          {/* Podium */}
          {top3.length >= 3 && (
            <div className="liquid-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-8 overflow-hidden">
              <div className="flex items-center gap-2 md:gap-3 justify-center mb-5 md:mb-8">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" className="md:w-6 md:h-6"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>
                <h3 className="text-lg md:text-2xl font-bold text-charcoal">{t("dash.top_performers")}</h3>
              </div>
              <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-8">
                <PodiumCard student={top3[1]} position={2} height="h-20 sm:h-28 md:h-32" bgClass="podium-silver" />
                <PodiumCard student={top3[0]} position={1} height="h-28 sm:h-36 md:h-44" bgClass="podium-gold" />
                <PodiumCard student={top3[2]} position={3} height="h-16 sm:h-20 md:h-24" bgClass="podium-bronze" />
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div id="leaderboard" className="liquid-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-6 overflow-hidden">
            <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-xl font-bold text-charcoal truncate">{t("dash.leaderboard")}</h3>
                    <p className="text-[11px] md:text-sm text-muted truncate">{t("dash.rankings")}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 md:gap-2 flex-wrap items-center">
                {(["overall", "cq", "mcq"] as LeaderboardType[]).map((type) => (
                  <button key={type} onClick={() => { setLeaderboardType(type); setSelectedSubject(null); playClick(); }}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full md:rounded-2xl text-[11px] md:text-xs font-semibold uppercase tracking-wider transition-all ${
                      leaderboardType === type && !selectedSubject ? "gradient-royal text-white shadow-md" : "liquid-glass-sm text-muted hover:text-charcoal"
                    }`}>{type === "overall" ? t("common.overall") : type === "cq" ? t("common.cq") : t("common.mcq")}</button>
                ))}
                <select value={selectedSubject || ""} onChange={(e) => { setSelectedSubject(e.target.value || null); if (e.target.value) setLeaderboardType("overall"); }}
                  className="px-2.5 md:px-3 py-1.5 md:py-2 rounded-full md:rounded-2xl text-[11px] md:text-xs font-semibold liquid-glass-sm text-charcoal border-0 max-w-[120px] md:max-w-none">
                  <option value="">{t("common.subject_sel")}</option>
                  {SUBJECTS.map((s) => (<option key={s} value={s}>{tSubject(s)}</option>))}
                </select>
              </div>
            </div>

            <div className="mb-3 md:mb-4">
              <div className="relative">
                <svg className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input type="text" placeholder={t("dash.search")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 md:pl-11 pr-3 md:pr-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm backdrop-blur-sm" />
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
              <div className="min-w-[320px]">
                {selectedSubject ? <SubjectLeaderboardTable students={subjectRanked} subject={selectedSubject} /> : <OverallLeaderboardTable students={filtered} type={leaderboardType} maxTotal={stats?.maxPossibleTotal || 0} />}
              </div>
            </div>
          </div>

          {/* Subject Performance */}
          {stats && stats.subjectAverages.length > 0 && stats.studentsWithMarks > 0 && (
            <div className="liquid-glass rounded-2xl md:rounded-3xl p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-royal/10 flex items-center justify-center text-royal flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                </div>
                <h3 className="text-base md:text-xl font-bold text-charcoal">{t("dash.subject_perf")}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-4">
                {stats.subjectAverages.map((sa) => (
                  <div key={sa.subject} className="liquid-glass-sm rounded-xl md:rounded-2xl p-3 md:p-4">
                    <div className="flex items-center justify-between mb-1.5 md:mb-2 gap-2">
                      <span className="text-xs md:text-sm font-semibold text-charcoal truncate">{tSubject(sa.subject)}</span>
                      <span className="text-[10px] md:text-xs text-muted font-medium flex-shrink-0">{sa.average}/{sa.max}</span>
                    </div>
                    <div className="w-full bg-white/50 rounded-full h-1.5 md:h-2.5"><div className="gradient-royal h-1.5 md:h-2.5 rounded-full transition-all duration-700" style={{ width: `${sa.max > 0 ? (sa.average / sa.max) * 100 : 0}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grade Distribution */}
          {stats && stats.studentsWithMarks > 0 && (
            <div className="liquid-glass rounded-2xl md:rounded-3xl p-4 md:p-6 overflow-hidden">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="12" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="12" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/></svg>
                </div>
                <h3 className="text-base md:text-xl font-bold text-charcoal">{t("dash.grade_dist")}</h3>
              </div>
              <div className="flex items-end justify-center gap-1.5 sm:gap-2 md:gap-3 h-32 md:h-48 overflow-x-auto scrollbar-hide px-2">
                {Object.entries(stats.gradeDistribution).map(([grade, count]) => {
                  const maxCount = Math.max(...Object.values(stats.gradeDistribution), 1);
                  const height = (count / maxCount) * 100;
                  return (
                    <div key={grade} className="flex flex-col items-center gap-1 md:gap-2 flex-shrink-0">
                      <span className="text-[10px] md:text-xs font-bold text-charcoal">{count}</span>
                      <div className="w-7 sm:w-8 md:w-10 lg:w-14 rounded-t-lg md:rounded-t-xl transition-all duration-700" style={{ height: `${Math.max(height, 4)}%`, minHeight: "8px", backgroundColor: GRADE_COLORS[grade] || "#6B7280" }} />
                      <span className="text-[10px] md:text-xs font-semibold text-muted">{grade}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Study Materials */}
          <div id="materials"><StudyMaterials /></div>

          <GalleryShowcase />

          {teachers.length > 0 && (
            <div id="teachers" className="liquid-glass rounded-2xl md:rounded-3xl p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-royal/10 flex items-center justify-center text-royal flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <h3 className="text-base md:text-xl font-bold text-charcoal">{t("dash.our_teachers")}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-4">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="liquid-glass-sm rounded-xl md:rounded-2xl p-3 md:p-5 text-center liquid-glass-hover">
                    {teacher.profilePicture ? (
                      <img src={teacher.profilePicture} alt={teacher.name} className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover ring-2 md:ring-3 ring-white/60 shadow-md mx-auto mb-2 md:mb-3" />
                    ) : (
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full gradient-royal flex items-center justify-center text-white text-base md:text-xl font-bold ring-2 md:ring-3 ring-white/60 shadow-md mx-auto mb-2 md:mb-3">{teacher.name.charAt(0)}</div>
                    )}
                    <h4 className="text-xs md:text-sm font-bold text-charcoal truncate">{teacher.name}</h4>
                    {teacher.degree && <p className="text-[10px] md:text-xs text-muted mt-0.5 truncate">{teacher.degree}</p>}
                    {teacher.subject && <span className="inline-block mt-1.5 md:mt-2 px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg text-[9px] md:text-[10px] font-semibold bg-royal/10 text-royal truncate max-w-full">{teacher.subject}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div id="routine"><WeeklyRoutineTable /></div>

          {results.filter((r) => r.hasMarks).length === 0 && (
            <div className="liquid-glass-strong rounded-2xl md:rounded-3xl p-8 md:p-16 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-royal/10 flex items-center justify-center mx-auto mb-4 md:mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#006FEE" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-charcoal mb-2">{t("dash.no_results")}</h3>
              <p className="text-xs md:text-sm text-muted">{t("dash.no_results_desc")}</p>
            </div>
          )}

          {/* Student Directory */}
          <div id="students" className="liquid-glass rounded-2xl md:rounded-3xl p-4 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-royal/10 flex items-center justify-center text-royal flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-[18px] md:h-[18px]"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm md:text-xl font-bold text-charcoal truncate">{t("dash.student_dir")}</h3>
                  <p className="text-[10px] md:text-sm text-muted truncate hidden sm:block">{t("dash.click_view")}</p>
                </div>
              </div>
              <button onClick={() => { setShowApplyForm(true); playOpen(); }}
                className="gradient-royal text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full md:rounded-xl text-xs md:text-sm font-semibold hover:opacity-90 transition-all shadow-md flex items-center gap-1 md:gap-2 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                {t("dash.apply")}
              </button>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-3">
              {allStudents.map((s) => (
                <button key={s.id} onClick={() => { setViewingStudentInfo(s); playOpen(); }}
                  className="liquid-glass-sm rounded-xl md:rounded-2xl p-3 md:p-4 text-center hover:bg-white/50 transition-all">
                  {s.profilePicture ? (
                    <img src={s.profilePicture} alt={s.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-white/50 mx-auto mb-1.5 md:mb-2" />
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full gradient-royal flex items-center justify-center text-white text-xs md:text-sm font-bold ring-2 ring-white/50 mx-auto mb-1.5 md:mb-2">{s.name.charAt(0)}</div>
                  )}
                  <p className="text-[11px] md:text-xs font-semibold text-charcoal truncate">{s.name}</p>
                  <p className="text-[9px] md:text-[10px] text-muted">{t("common.roll")} {s.rollNumber}</p>
                </button>
              ))}
              {allStudents.length === 0 && <div className="col-span-full text-center py-6 md:py-8 text-muted text-xs md:text-sm">{t("dash.no_students")}</div>}
            </div>
          </div>

          {/* Modals */}
          {viewingStudentInfo && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 md:p-4">
              <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-xl" onClick={() => setViewingStudentInfo(null)} />
              <div className="relative liquid-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-8 w-full max-w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
                <button onClick={() => setViewingStudentInfo(null)} className="absolute top-3 right-3 md:top-4 md:right-4 w-8 h-8 rounded-full liquid-glass-sm flex items-center justify-center text-muted hover:text-charcoal transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
                <div className="text-center mb-4 md:mb-6">
                  {viewingStudentInfo.profilePicture ? (
                    <img src={viewingStudentInfo.profilePicture} alt={viewingStudentInfo.name} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-royal/20 shadow-xl mx-auto mb-3 md:mb-4" />
                  ) : (
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full gradient-royal flex items-center justify-center text-white text-2xl md:text-3xl font-bold ring-4 ring-royal/20 shadow-xl mx-auto mb-3 md:mb-4">{viewingStudentInfo.name.charAt(0)}</div>
                  )}
                  <h3 className="text-lg md:text-xl font-bold text-charcoal truncate px-8">{viewingStudentInfo.name}</h3>
                  <p className="text-xs md:text-sm text-muted">{t("common.roll")} {viewingStudentInfo.rollNumber}</p>
                </div>
                <div className="space-y-2 md:space-y-3">
                  {viewingStudentInfo.studentId && <div className="flex justify-between items-center py-2 border-b border-white/20 gap-2"><span className="text-xs md:text-sm text-muted flex-shrink-0">{t("form.student_id")}</span><span className="text-xs md:text-sm font-medium text-charcoal truncate">{viewingStudentInfo.studentId}</span></div>}
                  {viewingStudentInfo.fatherName && <div className="flex justify-between items-center py-2 border-b border-white/20 gap-2"><span className="text-xs md:text-sm text-muted flex-shrink-0">{t("form.father_name")}</span><span className="text-xs md:text-sm font-medium text-charcoal truncate">{viewingStudentInfo.fatherName}</span></div>}
                  {viewingStudentInfo.motherName && <div className="flex justify-between items-center py-2 border-b border-white/20 gap-2"><span className="text-xs md:text-sm text-muted flex-shrink-0">{t("form.mother_name")}</span><span className="text-xs md:text-sm font-medium text-charcoal truncate">{viewingStudentInfo.motherName}</span></div>}
                  {viewingStudentInfo.mobileNumber && <div className="flex justify-between items-center py-2 border-b border-white/20 gap-2"><span className="text-xs md:text-sm text-muted flex-shrink-0">{t("form.mobile")}</span><span className="text-xs md:text-sm font-medium text-charcoal">{viewingStudentInfo.mobileNumber}</span></div>}
                </div>
              </div>
            </div>
          )}

          {showApplyForm && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 md:p-4">
              <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-xl" onClick={() => { setShowApplyForm(false); setSubmitSuccess(false); }} />
              <div className="relative liquid-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-8 w-full max-w-[95vw] md:max-w-lg max-h-[95vh] overflow-y-auto animate-scale-in">
                <button onClick={() => { setShowApplyForm(false); setSubmitSuccess(false); }} className="absolute top-3 right-3 md:top-4 md:right-4 w-8 h-8 rounded-full liquid-glass-sm flex items-center justify-center text-muted hover:text-charcoal transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
                {submitSuccess ? (
                  <div className="text-center py-6 md:py-8">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald/10 flex items-center justify-center mx-auto mb-3 md:mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-charcoal mb-2">{t("dash.apply_success")}</h3>
                    <p className="text-xs md:text-sm text-muted px-2">{t("dash.apply_pending")}</p>
                    <button onClick={() => { setShowApplyForm(false); setSubmitSuccess(false); }} className="mt-5 md:mt-6 gradient-royal text-white px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold">{t("dash.close")}</button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-5 md:mb-6">
                      <div className="w-14 h-14 md:w-16 md:h-16 gradient-royal rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-charcoal">{t("dash.apply_title")}</h2>
                      <p className="text-muted text-xs md:text-sm mt-1">{t("dash.apply_desc")}</p>
                    </div>
                    <form onSubmit={async (e) => {
                      e.preventDefault(); setSubmitting(true);
                      try {
                        const res = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(applyForm) });
                        if (res.ok) { setSubmitSuccess(true); setApplyForm({ name: "", rollNumber: "", studentId: "", fatherName: "", motherName: "", mobileNumber: "" }); }
                        else { const data = await res.json(); alert(data.error || "Failed"); }
                      } catch { alert("Network error"); }
                      setSubmitting(false);
                    }} className="space-y-3 md:space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs md:text-sm font-medium text-charcoal mb-1 md:mb-1.5">{t("form.full_name")} *</label>
                          <input type="text" required value={applyForm.name} onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm backdrop-blur-sm" placeholder={t("form.full_name")} />
                        </div>
                        <div>
                          <label className="block text-xs md:text-sm font-medium text-charcoal mb-1 md:mb-1.5">{t("form.roll_number")} *</label>
                          <select required value={applyForm.rollNumber} onChange={(e) => setApplyForm({ ...applyForm, rollNumber: e.target.value })} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm backdrop-blur-sm">
                            <option value="">{t("form.select_roll")}</option>
                            {Array.from({ length: 125 }, (_, i) => (i + 1) * 2).map((r) => (<option key={r} value={r}>{r}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs md:text-sm font-medium text-charcoal mb-1 md:mb-1.5">{t("form.student_id")}</label>
                          <input type="text" value={applyForm.studentId} onChange={(e) => setApplyForm({ ...applyForm, studentId: e.target.value })} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm backdrop-blur-sm" placeholder={t("form.student_id")} />
                        </div>
                        <div>
                          <label className="block text-xs md:text-sm font-medium text-charcoal mb-1 md:mb-1.5">{t("form.father_name")}</label>
                          <input type="text" value={applyForm.fatherName} onChange={(e) => setApplyForm({ ...applyForm, fatherName: e.target.value })} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm backdrop-blur-sm" placeholder={t("form.father_name")} />
                        </div>
                        <div>
                          <label className="block text-xs md:text-sm font-medium text-charcoal mb-1 md:mb-1.5">{t("form.mother_name")}</label>
                          <input type="text" value={applyForm.motherName} onChange={(e) => setApplyForm({ ...applyForm, motherName: e.target.value })} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm backdrop-blur-sm" placeholder={t("form.mother_name")} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs md:text-sm font-medium text-charcoal mb-1 md:mb-1.5">{t("form.mobile")}</label>
                          <input type="tel" value={applyForm.mobileNumber} onChange={(e) => setApplyForm({ ...applyForm, mobileNumber: e.target.value })} className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-white/40 bg-white/40 text-xs md:text-sm backdrop-blur-sm" placeholder={t("form.mobile")} />
                        </div>
                      </div>
                      <button type="submit" disabled={submitting} className="w-full gradient-royal text-white py-3 md:py-3.5 rounded-xl md:rounded-2xl font-semibold text-xs md:text-sm hover:opacity-90 transition-all disabled:opacity-60 shadow-lg flex items-center justify-center gap-2">
                        {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t("dash.submitting")}</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg> {t("dash.submit_app")}</>}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          {settings?.developerName && (
            <div className="liquid-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                </div>
                <h3 className="text-base md:text-lg font-bold text-charcoal">{t("dash.web_dev")}</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                {(settings.developerPicture || devStudent?.profilePicture) ? (
                  <img src={settings.developerPicture || devStudent?.profilePicture} alt={settings.developerName} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-royal/20 shadow-xl flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full gradient-royal flex items-center justify-center text-white text-2xl md:text-3xl font-bold ring-4 ring-royal/20 shadow-xl flex-shrink-0">{settings.developerName.charAt(0)}</div>
                )}
                <div className="text-center sm:text-left min-w-0">
                  <h4 className="text-lg md:text-xl font-bold text-charcoal truncate">{settings.developerName}</h4>
                  <p className="text-xs md:text-sm text-muted mt-1">{t("common.roll")} {settings.developerRoll || 6} • {t("site.class_section")}</p>
                  {settings.developerBio && <p className="text-xs md:text-sm text-muted mt-1 break-words">{settings.developerBio}</p>}
                  <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2 md:mt-3 justify-center sm:justify-start">
                    <span className="px-2.5 md:px-3 py-1 md:py-1.5 rounded-full md:rounded-xl text-[10px] md:text-xs font-bold bg-royal/10 text-royal flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>
                      {t("common.rank")}: {devStudent?.rank ?? "—"}
                    </span>
                    {devStudent?.hasMarks && (
                      <>
                        <span className="px-2.5 md:px-3 py-1 md:py-1.5 rounded-full md:rounded-xl text-[10px] md:text-xs font-bold bg-emerald/10 text-emerald">{devStudent.totalObtained}/{devStudent.maxPossibleTotal}</span>
                        <span className="px-2.5 md:px-3 py-1 md:py-1.5 rounded-full md:rounded-xl text-[10px] md:text-xs font-bold" style={{ backgroundColor: `${GRADE_COLORS[devStudent.overallGrade] || "#6B7280"}18`, color: GRADE_COLORS[devStudent.overallGrade] || "#6B7280" }}>{t("common.grade")}: {devStudent.overallGrade}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, bgColor }: { label: string; value: string | number; icon: React.ReactNode; color: string; bgColor: string; }) {
  return (
    <div className="liquid-glass rounded-xl md:rounded-2xl p-3 md:p-5 liquid-glass-hover">
      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-3 ${bgColor} ${color}`}>{icon}</div>
      <p className="text-lg md:text-2xl font-bold text-charcoal truncate">{value}</p>
      <p className="text-[10px] md:text-xs text-muted mt-0.5 md:mt-1 truncate">{label}</p>
    </div>
  );
}

function PodiumCard({ student, position, height, bgClass }: { student: StudentResult; position: number; height: string; bgClass: string; }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="flex flex-col items-center min-w-0">
      {student.profilePicture ? (
        <img src={student.profilePicture} alt={student.name} className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-full object-cover border-2 md:border-4 border-white shadow-lg mb-2 md:mb-3" />
      ) : (
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-full gradient-royal flex items-center justify-center text-white text-base sm:text-lg md:text-2xl font-bold border-2 md:border-4 border-white shadow-lg mb-2 md:mb-3">{student.name.charAt(0)}</div>
      )}
      <span className="text-[11px] sm:text-xs md:text-base font-bold text-charcoal text-center truncate max-w-[70px] sm:max-w-[90px] md:max-w-[140px]">{student.name}</span>
      <span className="text-[9px] sm:text-[10px] md:text-xs text-muted mb-1 md:mb-2">{/* Roll label */} {student.rollNumber}</span>
      <div className={`${bgClass} ${height} w-14 sm:w-16 md:w-28 rounded-t-xl md:rounded-t-2xl flex flex-col items-center justify-start pt-1.5 md:pt-3 shadow-lg`}>
        <span className="text-base sm:text-xl md:text-3xl">{medals[position - 1]}</span>
        <span className="text-white text-[10px] sm:text-xs md:text-sm font-bold mt-0.5 md:mt-1">{student.totalObtained}</span>
      </div>
    </div>
  );
}

function OverallLeaderboardTable({ students, type, maxTotal }: { students: StudentResult[]; type: LeaderboardType; maxTotal: number }) {
  const { t } = useI18n();
  return (
    <table className="w-full text-xs md:text-sm">
      <thead>
        <tr className="border-b border-white/30">
          <th className="text-left text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider py-2 md:py-3 px-2 md:px-3">{t("common.rank")}</th>
          <th className="text-left text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider py-2 md:py-3 px-2 md:px-3">{t("common.student")}</th>
          <th className="text-left text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider py-2 md:py-3 px-2 md:px-3 hidden md:table-cell">{t("common.roll")}</th>
          <th className="text-right text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider py-2 md:py-3 px-2 md:px-3">{type === "cq" ? t("common.cq_total") : type === "mcq" ? t("common.mcq_total") : t("common.total")}</th>
          <th className="text-right text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider py-2 md:py-3 px-2 md:px-3 hidden sm:table-cell">{t("common.average")}</th>
          <th className="text-center text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider py-2 md:py-3 px-2 md:px-3">{t("common.grade")}</th>
        </tr>
      </thead>
      <tbody>
        {students.map((s, i) => {
          const getVal = () => { if (type === "cq") return s.totalCq; if (type === "mcq") return s.totalMcq; return s.totalObtained; };
          const getRank = () => { if (type === "cq") return s.cqRank; if (type === "mcq") return s.mcqRank; return s.rank; };
          return (
            <tr key={s.studentId} className={`border-b border-white/20 hover:bg-white/30 transition-colors ${i < 3 ? "font-medium" : ""}`}>
              <td className="py-2 md:py-3 px-2 md:px-3"><span className={`inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl text-[11px] md:text-sm font-bold ${getRank() === 1 ? "bg-amber/15 text-amber" : getRank() === 2 ? "bg-gray-500/10 text-gray-500" : getRank() === 3 ? "bg-orange-500/15 text-orange-600" : "text-muted"}`}>{getRank() || "-"}</span></td>
              <td className="py-2 md:py-3 px-2 md:px-3"><div className="flex items-center gap-2"><div className="hidden sm:flex w-6 h-6 md:w-8 md:h-8 rounded-full gradient-royal items-center justify-center text-white text-[10px] md:text-xs font-bold ring-1 md:ring-2 ring-white/50 flex-shrink-0">{s.name.charAt(0)}</div><span className="text-xs md:text-sm font-medium text-charcoal truncate max-w-[90px] sm:max-w-none">{s.name}</span></div></td>
              <td className="py-2 md:py-3 px-2 md:px-3 text-[11px] md:text-sm text-muted hidden md:table-cell">{s.rollNumber}</td>
              <td className="py-2 md:py-3 px-2 md:px-3 text-right text-xs md:text-sm font-semibold text-charcoal">{getVal()}<span className="text-muted font-normal hidden sm:inline">/{maxTotal}</span></td>
              <td className="py-2 md:py-3 px-2 md:px-3 text-right text-[11px] md:text-sm text-muted hidden sm:table-cell">{s.average}%</td>
              <td className="py-2 md:py-3 px-2 md:px-3 text-center"><span className="px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold" style={{ backgroundColor: `${GRADE_COLORS[s.overallGrade] || "#6B7280"}18`, color: GRADE_COLORS[s.overallGrade] || "#6B7280" }}>{s.overallGrade}</span></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function SubjectLeaderboardTable({ students, subject }: { students: StudentResult[]; subject: string }) {
  const { t } = useI18n();
  return (
    <table className="w-full text-xs md:text-sm">
      <thead>
        <tr className="border-b border-white/30">
          <th className="text-left text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider py-2 md:py-3 px-2 md:px-3">{t("common.rank")}</th>
          <th className="text-left text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider py-2 md:py-3 px-2 md:px-3">{t("common.student")}</th>
          <th className="text-right text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider py-2 md:py-3 px-2">CQ</th>
          <th className="text-right text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider py-2 md:py-3 px-2">MCQ</th>
          <th className="text-right text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider py-2 md:py-3 px-2 md:px-3">{t("common.total")}</th>
          <th className="text-center text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider py-2 md:py-3 px-2 md:px-3">{t("common.grade")}</th>
        </tr>
      </thead>
      <tbody>
        {students.map((s) => {
          const mark = s.subjects.find((x) => x.subject === subject);
          return (
            <tr key={s.studentId} className="border-b border-white/20 hover:bg-white/30 transition-colors">
              <td className="py-2 md:py-3 px-2 md:px-3 text-xs font-bold text-charcoal">{s.subjectRanks[subject] ?? "-"}</td>
              <td className="py-2 md:py-3 px-2 md:px-3"><div className="flex items-center gap-2"><div className="hidden sm:flex w-6 h-6 md:w-8 md:h-8 rounded-full gradient-royal items-center justify-center text-white text-[10px] md:text-xs font-bold flex-shrink-0">{s.name.charAt(0)}</div><span className="text-xs md:text-sm font-medium truncate max-w-[80px] sm:max-w-none">{s.name}</span></div></td>
              <td className="py-2 md:py-3 px-2 text-right text-[11px] md:text-sm text-muted">{mark?.cq ?? 0}</td>
              <td className="py-2 md:py-3 px-2 text-right text-[11px] md:text-sm text-muted">{mark?.mcq ?? 0}</td>
              <td className="py-2 md:py-3 px-2 md:px-3 text-right text-xs font-semibold">{mark?.total ?? 0}</td>
              <td className="py-2 md:py-3 px-2 md:px-3 text-center"><span className="px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-lg text-[10px] md:text-xs font-bold" style={{ backgroundColor: `${GRADE_COLORS[mark?.grade || "F"] || "#6B7280"}18`, color: GRADE_COLORS[mark?.grade || "F"] || "#6B7280" }}>{mark?.grade || "N/A"}</span></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
