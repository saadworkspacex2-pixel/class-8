"use client";

import { useState, useEffect } from "react";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { playLogin, playClick, playToggle, playLogout } from "@/lib/sounds";
import { GRADE_COLORS } from "@/lib/constants";

interface StudentProfile {
  student: { id: number; name: string; rollNumber: number; profilePicture: string; fatherName: string; motherName: string; studentId: string };
  marks: Array<{ examType: string; subject: string; total: number }>;
  behavior: { punctuality: number; discipline: number; participation: number; homework: number; teamwork: number; creativity: number } | null;
  behaviorAvg: number;
  comments: Array<{ id: number; teacherName: string; teacherSubject: string; teacherPicture: string; comment: string; type: string; createdAt: string }>;
  stats: { totalObtained: number; maxTotal: number; average: number; grade: string; tier: "S" | "A" | "B" | "C" | "D" };
}

function StudentPortalContent() {
  const { t, lang, toggleLang } = useI18n();
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [roll, setRoll] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check session
    fetch("/api/auth/session").then(r => r.json()).then(d => {
      if (d.authenticated && d.role === "student") {
        fetchProfile();
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/student/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setLoggedIn(true);
      }
    } catch {}
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "student", rollNumber: roll, password }),
      });
      const data = await res.json();
      if (data.success) {
        playLogin();
        await fetchProfile();
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error");
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    playLogout();
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    setProfile(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-bg"><div className="w-12 h-12 border-4 border-royal/20 border-t-royal rounded-full animate-spin" /></div>;
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-bg relative flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-royal/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/6 rounded-full blur-[120px]" />
        </div>

        {/* Top nav */}
        <div className="fixed top-0 left-0 right-0 z-20 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-charcoal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            {lang === "bn" ? "হোম" : "Home"}
          </a>
          <button onClick={() => { toggleLang(); playToggle(); }}
            className="liquid-glass-sm px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {lang === "en" ? "বাংলা" : "English"}
          </button>
        </div>

        <div className="liquid-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-8 w-full max-w-[95vw] md:max-w-md animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl gradient-royal flex items-center justify-center mx-auto mb-4 shadow-xl shadow-royal/20">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-charcoal">{t("portal.login_title")}</h1>
            <p className="text-muted text-sm mt-1">{t("portal.login_desc")}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">{t("portal.roll")}</label>
              <input type="number" value={roll} onChange={(e) => setRoll(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-white/40 bg-white/50 text-sm backdrop-blur-sm" placeholder="e.g. 6" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">{t("form.password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-white/40 bg-white/50 text-sm backdrop-blur-sm" placeholder="••••••" required />
            </div>
            {error && <p className="text-sm text-crimson bg-crimson/10 px-4 py-2 rounded-xl">{error}</p>}
            <button type="submit" disabled={loginLoading}
              className="w-full gradient-royal text-white py-3.5 rounded-2xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-royal/20 flex items-center justify-center gap-2">
              {loginLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t("form.signing_in")}</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> {t("form.sign_in")}</>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const tierInfo = {
    S: { label: t("portal.tier_s"), color: "tier-s", emoji: "👑", pct: 95 },
    A: { label: t("portal.tier_a"), color: "tier-a", emoji: "⭐", pct: 80 },
    B: { label: t("portal.tier_b"), color: "tier-b", emoji: "🚀", pct: 60 },
    C: { label: t("portal.tier_c"), color: "tier-c", emoji: "🌱", pct: 40 },
    D: { label: t("portal.tier_d"), color: "tier-d", emoji: "🌟", pct: 20 },
  }[profile.stats.tier];

  const behaviorItems = [
    { key: "punctuality", label: t("portal.punctuality"), icon: "⏰", value: profile.behavior?.punctuality ?? 0 },
    { key: "discipline", label: t("portal.discipline"), icon: "🎯", value: profile.behavior?.discipline ?? 0 },
    { key: "participation", label: t("portal.participation"), icon: "🙋", value: profile.behavior?.participation ?? 0 },
    { key: "homework", label: t("portal.homework"), icon: "📚", value: profile.behavior?.homework ?? 0 },
    { key: "teamwork", label: t("portal.teamwork"), icon: "🤝", value: profile.behavior?.teamwork ?? 0 },
    { key: "creativity", label: t("portal.creativity"), icon: "🎨", value: profile.behavior?.creativity ?? 0 },
  ];

  const getBarColor = (v: number) => {
    if (v >= 85) return "bg-gradient-to-r from-emerald to-emerald-400";
    if (v >= 70) return "bg-gradient-to-r from-royal to-blue-400";
    if (v >= 50) return "bg-gradient-to-r from-amber to-orange-400";
    return "bg-gradient-to-r from-crimson to-red-400";
  };

  return (
    <div className="min-h-screen bg-bg relative pb-12 overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-royal/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-amber/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 liquid-glass px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {profile.student.profilePicture ? (
            <img src={profile.student.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50" />
          ) : (
            <div className="w-10 h-10 rounded-full gradient-royal flex items-center justify-center text-white font-bold ring-2 ring-white/50">
              {profile.student.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-charcoal">{t("portal.welcome")}, {profile.student.name}</p>
            <p className="text-xs text-muted">{t("common.roll")} {profile.student.rollNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { toggleLang(); playToggle(); }}
            className="w-9 h-9 rounded-xl liquid-glass-sm flex items-center justify-center text-muted hover:text-charcoal transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </button>
          <button onClick={handleLogout}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-crimson/10 text-crimson hover:bg-crimson/20 transition-all flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {t("portal.logout")}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 mt-4 md:mt-8 space-y-5 md:space-y-8 overflow-x-hidden">
        {/* Tier Badge — HERO */}
        <div className="relative liquid-glass-strong rounded-2xl md:rounded-[2.5rem] p-5 md:p-12 overflow-hidden">
          {/* Glow background */}
          <div className="absolute inset-0 opacity-30">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[80px] ${profile.stats.tier === "S" ? "bg-amber-300" : profile.stats.tier === "A" ? "bg-purple-400" : profile.stats.tier === "B" ? "bg-cyan-400" : "bg-emerald-300"}`} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Badge */}
            <div className="relative flex-shrink-0">
              <div className={`w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl md:rounded-[2rem] flex flex-col items-center justify-center ${tierInfo.color} relative`}>
                <span className="text-4xl sm:text-5xl md:text-6xl">{tierInfo.emoji}</span>
                <span className="text-white font-black text-3xl sm:text-4xl md:text-5xl mt-1 tracking-wider drop-shadow-lg">{profile.stats.tier}</span>
                <span className="text-white/90 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">TIER</span>
              </div>
              {/* Floating particles */}
              <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-white/60 animate-float" />
              <div className="absolute -bottom-1 -left-3 w-2 h-2 rounded-full bg-white/40 animate-float" style={{ animationDelay: "1s" }} />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-charcoal tracking-tight">{tierInfo.label}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-4 justify-center md:justify-start">
                <div className="px-4 py-2 rounded-2xl liquid-glass-sm flex items-center gap-2">
                  <span className="text-xs text-muted">{t("portal.academic")}</span>
                  <span className="text-sm font-bold text-charcoal">{profile.stats.average}%</span>
                </div>
                <div className="px-4 py-2 rounded-2xl liquid-glass-sm flex items-center gap-2">
                  <span className="text-xs text-muted">{t("portal.grade")}</span>
                  <span className="text-sm font-bold px-2 py-0.5 rounded-lg" style={{ backgroundColor: `${GRADE_COLORS[profile.stats.grade] || "#6B7280"}18`, color: GRADE_COLORS[profile.stats.grade] || "#6B7280" }}>{profile.stats.grade}</span>
                </div>
                <div className="px-4 py-2 rounded-2xl liquid-glass-sm flex items-center gap-2">
                  <span className="text-xs text-muted">{t("portal.overall_behavior")}</span>
                  <span className="text-sm font-bold text-charcoal">{profile.behaviorAvg}%</span>
                </div>
              </div>

              {/* Tier progress */}
              <div className="mt-6">
                <div className="flex justify-between text-[11px] font-semibold text-muted mb-2">
                  <span>D</span><span>C</span><span>B</span><span>A</span><span>S</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/30 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${profile.stats.tier === "S" ? "tier-s" : profile.stats.tier === "A" ? "tier-a" : profile.stats.tier === "B" ? "tier-b" : profile.stats.tier === "C" ? "tier-c" : "tier-d"}`}
                    style={{ width: `${tierInfo.pct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Behavioral Rating Bars */}
          <div className="liquid-glass-strong rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center text-royal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-charcoal">{t("portal.behavior")}</h3>
                <p className="text-xs text-muted">{t("portal.behavior_desc")}</p>
              </div>
            </div>

            <div className="space-y-5">
              {behaviorItems.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-charcoal flex items-center gap-2">
                      <span>{item.icon}</span> {item.label}
                    </span>
                    <span className="text-xs font-bold text-charcoal">{item.value}%</span>
                  </div>
                  <div className="behavior-bar h-2.5 w-full">
                    <div className={`behavior-fill h-full ${getBarColor(item.value)}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Comments Feed */}
          <div className="liquid-glass rounded-3xl p-6 flex flex-col h-[480px]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-charcoal">{t("portal.comments")}</h3>
                <p className="text-xs text-muted">{t("portal.comments_desc")}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
              {profile.comments.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-royal/10 flex items-center justify-center mx-auto mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006FEE" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <p className="text-sm text-muted">{t("portal.no_comments")}</p>
                </div>
              ) : (
                profile.comments.map((c) => (
                  <div key={c.id} className={`rounded-2xl p-4 border ${
                    c.type === "positive" ? "bg-emerald/5 border-emerald/10" :
                    c.type === "advice" ? "bg-amber/5 border-amber/10" :
                    "bg-white/40 border-white/30"
                  }`}>
                    <div className="flex items-start gap-3">
                      {c.teacherPicture ? (
                        <img src={c.teacherPicture} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-white/50 flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full gradient-royal flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/50 flex-shrink-0">
                          {c.teacherName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-charcoal truncate">{c.teacherName}</p>
                          {c.teacherSubject && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-royal/10 text-royal font-medium flex-shrink-0">{c.teacherSubject}</span>
                          )}
                          <span className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${c.type === "positive" ? "bg-emerald" : c.type === "advice" ? "bg-amber" : "bg-muted"}`} />
                        </div>
                        <p className="text-sm text-charcoal/80 leading-relaxed">{c.comment}</p>
                        <p className="text-[10px] text-muted mt-2">{new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Academic Overview */}
        <div className="liquid-glass rounded-3xl p-6">
          <h3 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            {t("portal.academic")}
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black text-charcoal">{profile.stats.average}%</div>
            <div>
              <p className="text-sm text-muted">{profile.stats.totalObtained}/{profile.stats.maxTotal} marks</p>
              <span className="inline-block mt-1 px-2.5 py-1 rounded-xl text-xs font-bold" style={{ backgroundColor: `${GRADE_COLORS[profile.stats.grade] || "#6B7280"}18`, color: GRADE_COLORS[profile.stats.grade] || "#6B7280" }}>{profile.stats.grade}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PortalPage() {
  return (
    <I18nProvider>
      <StudentPortalContent />
    </I18nProvider>
  );
}
