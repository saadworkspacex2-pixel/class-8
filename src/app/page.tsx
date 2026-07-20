"use client";

import { useState, useEffect } from "react";
import ToastContainer from "@/components/Toast";
import PublicDashboard from "@/components/PublicDashboard";
import LoginModal from "@/components/LoginModal";
import DynamicIsland from "@/components/DynamicIsland";
import DashNav from "@/components/DashNav";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { playToggle, playOpen } from "@/lib/sounds";

function HomeContent() {
  const { t, lang, toggleLang } = useI18n();
  const [showLogin, setShowLogin] = useState(false);
  const [settings, setSettings] = useState<{ schoolName: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => setSettings(d)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-bg relative overflow-x-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-royal/8 rounded-full blur-[80px] md:blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-blue-400/6 rounded-full blur-[60px] md:blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-emerald/5 rounded-full blur-[60px] md:blur-[100px]" />
      </div>

      <DynamicIsland />

      {/* Hero */}
      <header className="gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-100px] left-1/4 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-royal rounded-full blur-[60px] md:blur-[100px]" />
          <div className="absolute bottom-[-50px] right-1/3 w-[150px] md:w-[300px] h-[150px] md:h-[300px] bg-blue-400 rounded-full blur-[50px] md:blur-[80px]" />
          <div className="absolute top-1/2 right-0 w-[100px] md:w-[200px] h-[100px] md:h-[200px] bg-emerald rounded-full blur-[50px] md:blur-[80px]" />
        </div>

        {/* Top Nav - Fully Responsive */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl liquid-glass-dark flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-5" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm md:text-xl font-bold tracking-tight truncate">{settings?.schoolName || "Sunshine Academy"}</h1>
                <p className="text-[10px] md:text-xs text-blue-200 truncate">{t("site.subtitle")}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
              <a href="/portal"
                className="liquid-glass-dark text-white p-2.5 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold transition-all hover:bg-white/20 flex items-center gap-1.5 md:gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span className="hidden sm:inline">{lang === "bn" ? "পোর্টাল" : "Portal"}</span>
              </a>
              <button onClick={() => { toggleLang(); playToggle(); }}
                className="liquid-glass-dark p-2.5 md:px-3 md:py-2 rounded-xl text-xs font-bold text-white hover:bg-white/20 transition-all flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span className="hidden sm:inline">{lang === "en" ? "বাংলা" : "English"}</span>
                <span className="sm:hidden">{lang === "en" ? "বাং" : "EN"}</span>
              </button>
              <button onClick={() => { setShowLogin(true); playOpen(); }}
                className="liquid-glass-dark text-white p-2.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold transition-all hover:bg-white/20 flex items-center gap-1.5 md:gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                <span className="hidden md:inline">{t("nav.admin_login")}</span>
                <span className="md:hidden text-[11px]">{lang === "bn" ? "লগইন" : "Admin"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pb-12 md:pb-20 pt-6 md:pt-14 text-center">
          <div className="inline-flex items-center gap-2 liquid-glass-dark px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-medium text-blue-200 mb-4 md:mb-6">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald animate-pulse" />
            {t("nav.live")}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-3 md:mb-4 px-2">{t("dash.result")}</h2>
          <p className="text-sm md:text-lg text-blue-200 max-w-2xl mx-auto px-4">{t("dash.desc")}</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full h-8 md:h-auto" preserveAspectRatio="none">
            <path d="M0,60 L0,20 Q720,0 1440,20 L1440,60 Z" fill="var(--color-bg)" />
          </svg>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 -mt-2 md:-mt-4 pb-12 md:pb-16 relative z-10">
        <PublicDashboard />
      </main>

      <footer className="liquid-glass-sm py-6 md:py-8 text-center text-xs md:text-sm text-muted border-t border-white/40 px-4">
        <p>© 2025 {settings?.schoolName || "Sunshine Academy"}. {t("footer.rights")}</p>
      </footer>

      <DashNav />
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <ToastContainer />
    </div>
  );
}

export default function HomePage() {
  return (
    <I18nProvider>
      <HomeContent />
    </I18nProvider>
  );
}
