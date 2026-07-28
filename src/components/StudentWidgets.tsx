"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { playClick, playOpen } from "@/lib/sounds";

/* ───── Types ───── */
interface Material { id: number; title: string; titleBn: string; subject: string; type: string; url: string; description: string; }
interface Event { id: number; title: string; titleBn: string; description: string; eventDate: string; eventType: string; }

/* ───── STUDY MATERIALS ───── */
export function StudyMaterials() {
  const { lang } = useI18n();
  const [items, setItems] = useState<Material[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/study-materials").then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const typeIcons: Record<string, string> = { note: "📝", pdf: "📄", video: "🎬", link: "🔗" };
  const typeColors: Record<string, string> = {
    note: "bg-royal/10 text-royal",
    pdf: "bg-crimson/10 text-crimson",
    video: "bg-purple-500/10 text-purple-600",
    link: "bg-emerald/10 text-emerald",
  };

  const subjects = ["all", ...new Set(items.map(i => i.subject).filter(Boolean))];
  const filtered = filter === "all" ? items : items.filter(i => i.subject === filter);

  return (
    <div className="liquid-glass rounded-2xl md:rounded-3xl p-4 md:p-6">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-[18px] md:h-[18px]">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-bold text-charcoal">{lang === "bn" ? "📚 শিক্ষা সামগ্রী" : "📚 Study Materials"}</h3>
          <p className="text-[10px] md:text-xs text-muted truncate">{lang === "bn" ? "নোট, পিডিএফ, ভিডিও ও লিংক" : "Notes, PDFs, Videos & Links"}</p>
        </div>
      </div>

      {/* Subject filter pills */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 mb-3 -mx-1 px-1">
        {subjects.map(s => (
          <button key={s} onClick={() => { setFilter(s); playClick(); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
              filter === s ? "gradient-royal text-white shadow-sm" : "liquid-glass-sm text-muted hover:text-charcoal"
            }`}>
            {s === "all" ? (lang === "bn" ? "সব" : "All") : s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.slice(0, 6).map(m => (
          <a key={m.id} href={m.url || "#"} target={m.url ? "_blank" : undefined} rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl liquid-glass-sm hover:bg-white/50 transition-all group">
            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${typeColors[m.type] || typeColors.note}`}>
              {typeIcons[m.type] || "📝"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-semibold text-charcoal truncate group-hover:text-royal transition-colors">
                {lang === "bn" && m.titleBn ? m.titleBn : m.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {m.subject && <span className="text-[9px] md:text-[10px] text-muted">{m.subject}</span>}
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${typeColors[m.type] || typeColors.note}`}>{m.type}</span>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted group-hover:text-royal transition-colors flex-shrink-0 md:w-4 md:h-4">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ───── UPCOMING EVENTS & COUNTDOWN ───── */
export function UpcomingEvents() {
  const { lang } = useI18n();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch("/api/events").then(r => r.json()).then(d => setEvents(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  if (events.length === 0) return null;

  const typeIcons: Record<string, string> = { exam: "📝", event: "🎉", holiday: "🏖️", deadline: "⏰" };
  const typeColors: Record<string, string> = {
    exam: "bg-crimson/10 border-crimson/20 text-crimson",
    event: "bg-royal/10 border-royal/20 text-royal",
    holiday: "bg-emerald/10 border-emerald/20 text-emerald",
    deadline: "bg-amber/10 border-amber/20 text-amber",
  };

  const now = new Date();
  const upcoming = events
    .map(e => ({ ...e, date: new Date(e.eventDate) }))
    .filter(e => e.date >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (upcoming.length === 0) return null;

  const daysUntil = (d: Date) => {
    const diff = d.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="liquid-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-6">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-[18px] md:h-[18px]">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-bold text-charcoal">{lang === "bn" ? "📅 আসন্ন ইভেন্ট" : "📅 Upcoming Events"}</h3>
          <p className="text-[10px] md:text-xs text-muted truncate">{lang === "bn" ? "পরীক্ষা, ছুটি ও গুরুত্বপূর্ণ তারিখ" : "Exams, holidays & key dates"}</p>
        </div>
      </div>

      <div className="space-y-2 md:space-y-3">
        {upcoming.slice(0, 5).map(e => {
          const days = daysUntil(e.date);
          const isToday = days === 0;
          const isTomorrow = days === 1;
          return (
            <div key={e.id} className={`rounded-xl md:rounded-2xl p-3 md:p-4 border ${typeColors[e.eventType] || typeColors.event}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 md:gap-3 min-w-0">
                  <span className="text-lg md:text-xl flex-shrink-0 mt-0.5">{typeIcons[e.eventType] || "📌"}</span>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-bold truncate">{lang === "bn" && e.titleBn ? e.titleBn : e.title}</p>
                    {e.description && <p className="text-[10px] md:text-xs opacity-70 mt-0.5 line-clamp-2">{e.description}</p>}
                    <p className="text-[10px] opacity-60 mt-1">{e.date.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  {isToday ? (
                    <span className="px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold bg-white/30 animate-pulse">{lang === "bn" ? "আজ!" : "Today!"}</span>
                  ) : isTomorrow ? (
                    <span className="px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold bg-white/30">{lang === "bn" ? "আগামীকাল" : "Tomorrow"}</span>
                  ) : (
                    <div>
                      <span className="text-lg md:text-xl font-black">{days}</span>
                      <span className="text-[9px] md:text-[10px] block opacity-70">{lang === "bn" ? "দিন বাকি" : "days left"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───── STUDENT MARK FINDER (Quick Lookup) ───── */
export function MarkFinder() {
  const { t, lang, tSubject, tExam } = useI18n();
  const [roll, setRoll] = useState("");
  const [result, setResult] = useState<{
    name: string; rollNumber: number; rank: number | null; average: number; overallGrade: string; totalObtained: number; maxPossibleTotal: number;
    subjects: Array<{ subject: string; cq: number; mcq: number; total: number; maxTotal: number; grade: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState("Half Yearly");
  const [searched, setSearched] = useState(false);

  const EXAMS = ["1st Monthly", "2nd Monthly", "Half Yearly", "Annual"];

  const handleSearch = async () => {
    if (!roll) return;
    setLoading(true);
    setSearched(true);
    playClick();
    try {
      const res = await fetch(`/api/results?examType=${encodeURIComponent(exam)}`);
      const data = await res.json();
      const student = data.results?.find((r: { rollNumber: number }) => r.rollNumber === parseInt(roll));
      if (student && student.hasMarks) {
        setResult(student);
      } else {
        setResult(null);
      }
    } catch { setResult(null); }
    setLoading(false);
  };

  return (
    <div className="liquid-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-6">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-[18px] md:h-[18px]">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-bold text-charcoal">{lang === "bn" ? "🔍 রেজাল্ট খুঁজুন" : "🔍 Quick Result Lookup"}</h3>
          <p className="text-[10px] md:text-xs text-muted truncate">{lang === "bn" ? "রোল দিয়ে নিজের রেজাল্ট দেখুন" : "Enter roll to see your marks"}</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <select value={exam} onChange={e => setExam(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-white/40 bg-white/40 text-xs font-medium backdrop-blur-sm flex-shrink-0 w-[110px] md:w-auto">
          {EXAMS.map(e => <option key={e} value={e}>{tExam(e)}</option>)}
        </select>
        <input type="number" placeholder={lang === "bn" ? "রোল নম্বর" : "Roll No."} value={roll} onChange={e => setRoll(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          className="flex-1 px-3 py-2.5 rounded-xl border border-white/40 bg-white/40 text-xs md:text-sm backdrop-blur-sm min-w-0" />
        <button onClick={handleSearch} disabled={loading}
          className="gradient-royal text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex-shrink-0 shadow-md">
          {loading ? "..." : lang === "bn" ? "খুঁজুন" : "Search"}
        </button>
      </div>

      {/* Result */}
      {searched && !loading && !result && (
        <div className="text-center py-6">
          <p className="text-xs md:text-sm text-muted">{lang === "bn" ? "কোনো ফলাফল পাওয়া যায়নি" : "No result found for this roll"}</p>
        </div>
      )}

      {result && (
        <div className="animate-fade-in">
          {/* Student Header */}
          <div className="liquid-glass-sm rounded-xl md:rounded-2xl p-3 md:p-4 mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm md:text-base font-bold text-charcoal">{result.name}</p>
              <p className="text-[10px] md:text-xs text-muted">{t("common.roll")} {result.rollNumber}</p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-center">
                <p className="text-lg md:text-xl font-black text-royal">{result.rank ?? "—"}</p>
                <p className="text-[9px] text-muted">{t("common.rank")}</p>
              </div>
              <div className="text-center">
                <p className="text-lg md:text-xl font-black text-charcoal">{result.average}%</p>
                <p className="text-[9px] text-muted">{t("common.average")}</p>
              </div>
            </div>
          </div>

          {/* Subject marks */}
          <div className="space-y-1.5">
            {result.subjects.filter(s => s.total > 0).map(s => (
              <div key={s.subject} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/30 transition-colors">
                <span className="text-[11px] md:text-xs font-medium text-charcoal flex-1 min-w-0 truncate">{tSubject(s.subject)}</span>
                <span className="text-[11px] md:text-xs text-muted flex-shrink-0">{s.total}/{s.maxTotal}</span>
                <div className="w-12 md:w-16 h-1.5 bg-white/30 rounded-full overflow-hidden flex-shrink-0">
                  <div className="h-full gradient-royal rounded-full" style={{ width: `${s.maxTotal > 0 ? (s.total / s.maxTotal) * 100 : 0}%` }} />
                </div>
                <span className="text-[9px] md:text-[10px] font-bold flex-shrink-0 w-5 text-center" style={{ color: s.grade === "F" ? "#DC2626" : "#059669" }}>{s.grade}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
