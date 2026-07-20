"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";

/* ───── Types ───── */
interface RoutineItem { id: number; dayOfWeek: number; periodNumber: number; subject: string; teacher: string; startTime: string; endTime: string; }
interface DisplayItem { id: number | string; subject: string; teacher: string; startTime: string; endTime: string; periodNumber: number; isBreak?: boolean; }
interface GalleryItem { id: number; title: string; titleBn: string; description: string; descriptionBn: string; imageUrl: string; category: string; }
interface NoticeItem { id: number; title: string; titleBn: string; content: string; contentBn: string; priority: string; createdAt: string; }

/* ───── GALLERY SHOWCASE ───── */
export function GalleryShowcase() {
  const { lang } = useI18n();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  useEffect(() => {
    fetch("/api/gallery").then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      <div className="liquid-glass rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4 md:mb-5">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-[18px] md:h-[18px]"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-base md:text-lg font-bold text-charcoal">{lang === "bn" ? "গ্যালারি" : "Gallery"}</h3>
            <p className="text-xs md:text-sm text-muted truncate">{lang === "bn" ? "ক্লাসের মুহূর্ত ও প্রকল্প" : "Class moments & projects"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {items.slice(0, 6).map(item => (
            <button key={item.id} onClick={() => setSelected(item)}
              className="relative group rounded-xl md:rounded-2xl overflow-hidden aspect-square">
              <img src={item.imageUrl} alt={lang === "bn" && item.titleBn ? item.titleBn : item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 md:p-3">
                <p className="text-white text-[10px] md:text-xs font-semibold truncate">{lang === "bn" && item.titleBn ? item.titleBn : item.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[9997] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-xl" onClick={() => setSelected(null)} />
          <div className="relative liquid-glass-strong rounded-2xl md:rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <button onClick={() => setSelected(null)}
              className="absolute top-3 right-3 md:top-4 md:right-4 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full liquid-glass-dark flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <img src={selected.imageUrl} alt={selected.title} className="w-full h-48 md:h-80 object-cover" />
            <div className="p-4 md:p-6">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber/10 text-amber uppercase tracking-wider mb-3 inline-block">{selected.category}</span>
              <h3 className="text-lg md:text-xl font-bold text-charcoal mb-2">{lang === "bn" && selected.titleBn ? selected.titleBn : selected.title}</h3>
              <p className="text-xs md:text-sm text-muted leading-relaxed">{lang === "bn" && selected.descriptionBn ? selected.descriptionBn : selected.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ───── FULL WEEKLY ROUTINE TABLE ───── */
export function WeeklyRoutineTable() {
  const { lang, tSubject } = useI18n();
  const [allPeriods, setAllPeriods] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileDay, setMobileDay] = useState<number>(new Date().getDay() >=0 && new Date().getDay() <=4 ? new Date().getDay() : 0);

  useEffect(() => {
    fetch("/api/routine")
      .then((r) => r.json())
      .then((d) => { setAllPeriods(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const daysBn = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার"];
  const daysShortEn = ["Sun", "Mon", "Tue", "Wed", "Thu"];
  const daysShortBn = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ"];
  const dayIndices = [0, 1, 2, 3, 4];

  const periodLabelsEn = ["1st", "2nd", "3rd", "4th", "5th", "Tiffin", "6th", "7th"];
  const periodLabelsBn = ["১ম", "২য়", "৩য়", "৪র্থ", "৫ম", "টিফিন", "৬ষ্ঠ", "৭ম"];
  const periodTimes = ["08:15–09:05", "09:05–09:45", "09:45–10:25", "10:25–11:05", "11:05–11:45", "11:45–12:10", "12:10–12:50", "12:50–01:30"];
  const periodMap = [1, 2, 3, 4, 5, 0, 6, 7];

  const getCell = (dayIdx: number, periodNum: number): RoutineItem | undefined => {
    return allPeriods.find((p) => p.dayOfWeek === dayIdx && p.periodNumber === periodNum);
  };

  const getDayPeriods = (dayIdx: number) => {
    const periods: Array<{ period: number; isBreak: boolean; data?: RoutineItem }> = [];
    for (const p of periodMap) {
      if (p === 0) periods.push({ period: 0, isBreak: true });
      else periods.push({ period: p, isBreak: false, data: getCell(dayIdx, p) });
    }
    return periods;
  };

  if (loading) {
    return <div className="liquid-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-6"><div className="h-48 md:h-64 rounded-xl md:rounded-2xl skeleton" /></div>;
  }

  if (allPeriods.length === 0) return null;

  const days = lang === "bn" ? daysBn : daysEn;
  const daysShort = lang === "bn" ? daysShortBn : daysShortEn;
  const pLabels = lang === "bn" ? periodLabelsBn : periodLabelsEn;

  return (
    <div className="liquid-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-6 overflow-hidden">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-royal/10 flex items-center justify-center text-royal flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-[18px] md:h-[18px]">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className="text-base md:text-xl font-bold text-charcoal truncate">{lang === "bn" ? "সাপ্তাহিক ক্লাস রুটিন" : "Weekly Class Routine"}</h3>
          <p className="text-xs md:text-sm text-muted truncate">{lang === "bn" ? "ক্লাসের সময়সূচী" : "Full class schedule"}</p>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {/* Day selector - scrollable pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          {dayIndices.map((dIdx, i) => {
            const isToday = new Date().getDay() === dIdx;
            const isSelected = mobileDay === dIdx;
            return (
              <button key={dIdx} onClick={() => setMobileDay(dIdx)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  isSelected ? "gradient-royal text-white shadow-md" : isToday ? "bg-royal/10 text-royal ring-1 ring-royal/20" : "liquid-glass-sm text-muted"
                }`}>
                {daysShort[i]}{isToday ? " •" : ""}
              </button>
            );
          })}
        </div>

        {/* Selected day periods */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-bold text-charcoal px-1">{days[dayIndices.indexOf(mobileDay)]} {new Date().getDay() === mobileDay ? <span className="text-royal text-xs">(আজ)</span> : null}</h4>
          {getDayPeriods(mobileDay).map((item, idx) => (
            <div key={idx} className={`flex items-center gap-3 p-3 rounded-2xl ${item.isBreak ? "bg-amber/10 border border-amber/20" : "liquid-glass-sm"}`}>
              <div className="flex flex-col items-center w-12 flex-shrink-0">
                <span className={`text-xs font-bold ${item.isBreak ? "text-amber" : "text-charcoal"}`}>{pLabels[periodMap.indexOf(item.period)]}</span>
                <span className="text-[10px] font-mono text-muted/70 mt-0.5">{periodTimes[periodMap.indexOf(item.period)]}</span>
              </div>
              <div className="flex-1 min-w-0">
                {item.isBreak ? (
                  <p className="text-sm font-semibold text-amber">🍱 {lang === "bn" ? "টিফিন বিরতি" : "Tiffin Break"}</p>
                ) : item.data ? (
                  <>
                    <p className="text-sm font-semibold text-charcoal truncate">{tSubject(item.data.subject)}</p>
                    {item.data.teacher && <p className="text-xs text-muted truncate mt-0.5">{item.data.teacher}</p>}
                  </>
                ) : (
                  <p className="text-sm text-muted">— {lang === "bn" ? "ফাঁকা" : "Free"}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto -mx-2">
        <table className="w-full min-w-[700px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 liquid-glass-sm text-left text-[11px] font-bold text-muted uppercase tracking-wider py-3 px-3 rounded-tl-2xl">
                {lang === "bn" ? "পিরিয়ড" : "Period"}
              </th>
              <th className="sticky left-0 z-10 liquid-glass-sm text-left text-[11px] font-bold text-muted uppercase tracking-wider py-3 px-2">
                {lang === "bn" ? "সময়" : "Time"}
              </th>
              {days.map((day, i) => (
                <th key={i} className={`text-center text-[11px] font-bold uppercase tracking-wider py-3 px-2 ${
                  new Date().getDay() === dayIndices[i] ? "text-royal bg-royal/5 rounded-t-2xl" : "text-muted"
                }`}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodMap.map((pNum, rowIdx) => {
              const isTiffin = pNum === 0;
              return (
                <tr key={rowIdx} className={isTiffin ? "bg-amber/5" : rowIdx % 2 === 0 ? "bg-white/20" : ""}>
                  <td className={`sticky left-0 z-10 py-2.5 px-3 text-xs font-bold ${isTiffin ? "text-amber bg-amber/5" : "text-charcoal liquid-glass-sm"}`}>
                    {isTiffin ? "🍱" : ""} {pLabels[rowIdx]}
                  </td>
                  <td className={`py-2.5 px-2 text-[10px] font-mono ${isTiffin ? "text-amber" : "text-muted"}`}>
                    {periodTimes[rowIdx]}
                  </td>
                  {dayIndices.map((dayIdx) => {
                    if (isTiffin) {
                      return (
                        <td key={dayIdx} className="py-2.5 px-2 text-center">
                          <span className="text-xs text-amber font-medium">{lang === "bn" ? "টিফিন" : "Tiffin"}</span>
                        </td>
                      );
                    }
                    const cell = getCell(dayIdx, pNum);
                    const isToday = new Date().getDay() === dayIdx;
                    return (
                      <td key={dayIdx} className={`py-2.5 px-2 ${isToday ? "bg-royal/5" : ""}`}>
                        {cell ? (
                          <div className="text-center">
                            <p className={`text-xs font-semibold ${isToday ? "text-royal" : "text-charcoal"}`}>{tSubject(cell.subject)}</p>
                            {cell.teacher && <p className="text-[10px] text-muted mt-0.5 truncate max-w-[100px] mx-auto">{cell.teacher}</p>}
                          </div>
                        ) : <p className="text-[10px] text-muted text-center">—</p>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
