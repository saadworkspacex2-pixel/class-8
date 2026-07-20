"use client";

import { useEffect, useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { playClick } from "@/lib/sounds";

const sections = [
  { id: "results", en: "Results", bn: "ফলাফল", icon: "📊" },
  { id: "leaderboard", en: "Leaderboard", bn: "লিডারবোর্ড", icon: "🏆" },
  { id: "routine", en: "Routine", bn: "রুটিন", icon: "📅" },
  { id: "materials", en: "Materials", bn: "শিক্ষা সামগ্রী", icon: "📚" },
  { id: "students", en: "Students", bn: "শিক্ষার্থী", icon: "👨‍🎓" },
  { id: "teachers", en: "Teachers", bn: "শিক্ষক", icon: "👨‍🏫" },
];

export default function DashNav() {
  const { lang } = useI18n();
  const [active, setActive] = useState("");
  const [visible, setVisible] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);

      // Find which section is visible
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 100) {
            setActive(s.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    playClick();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9990] animate-fade-in" ref={navRef}>
      <div
        className="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-2 rounded-full"
        style={{
          background: "linear-gradient(135deg, rgba(26,26,46,0.88) 0%, rgba(15,52,96,0.78) 100%)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={`flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-semibold transition-all whitespace-nowrap ${
              active === s.id
                ? "bg-white/20 text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <span className="text-sm md:text-base">{s.icon}</span>
            <span className="hidden sm:inline">{lang === "bn" ? s.bn : s.en}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
