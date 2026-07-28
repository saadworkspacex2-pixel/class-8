"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { playClick } from "@/lib/sounds";
import { 
  BarChart2, 
  Trophy, 
  Calendar, 
  BookOpen, 
  Users, 
  GraduationCap 
} from "lucide-react";

const sections = [
  { id: "results", en: "Results", bn: "ফলাফল", icon: BarChart2 },
  { id: "leaderboard", en: "Leaderboard", bn: "লিডারবোর্ড", icon: Trophy },
  { id: "routine", en: "Routine", bn: "রুটিন", icon: Calendar },
  { id: "materials", en: "Materials", bn: "সামগ্রী", icon: BookOpen },
  { id: "students", en: "Students", bn: "শিক্ষার্থী", icon: Users },
  { id: "teachers", en: "Teachers", bn: "শিক্ষক", icon: GraduationCap },
];

export default function DashNav() {
  const { lang } = useI18n();
  // Default active state to the first item so it looks good on load
  const [active, setActive] = useState("results");

  useEffect(() => {
    // This now ONLY updates the active highlighted color, it doesn't hide the nav
    const handleScroll = () => {
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
    window.addEventListener("touchmove", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
    };
  }, []);

  const scrollTo = (id: string) => {
    playClick();
    setActive(id); // Instantly update active state on click
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.nav 
      // Same reliable entrance animation from your working code
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      className="fixed z-[9990] 
                 /* Mobile Layout: Bottom Expanding Pill Bar */
                 bottom-4 left-3 right-3 flex flex-row items-center justify-between px-3 py-2.5 rounded-[2rem]
                 /* PC Layout: Left Vertical Sidebar */
                 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-6 md:right-auto md:flex-col md:justify-center md:gap-3 md:px-3 md:py-4 md:rounded-[2.5rem]
                 /* Premium Dark Glassmorphism */
                 bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
    >
      {sections.map((s) => {
        const isActive = active === s.id;
        const Icon = s.icon;
        const label = lang === "bn" ? s.bn : s.en;

        return (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            title={label}
            className={`relative flex items-center justify-center p-2.5 md:p-3 rounded-full transition-colors duration-300 z-10 group ${
              isActive 
                ? "text-indigo-300" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {/* Active Highlight Background Pill */}
            {isActive && (
              <motion.div
                layoutId="active-nav-indicator"
                className="absolute inset-0 bg-indigo-500/20 md:bg-white/10 rounded-full -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}

            {/* Icon (Always Visible) */}
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />

            {/* Label (Expands on Mobile when Active, Hidden completely on PC) */}
            <span 
              className={`text-[11px] font-semibold tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 md:hidden ${
                isActive 
                  ? "max-w-[100px] opacity-100 ml-2" 
                  : "max-w-0 opacity-0 ml-0"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </motion.nav>
  );
}
