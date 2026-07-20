"use client";

import { useState } from "react";
import { toast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { playLogin, playError, playClose } from "@/lib/sounds";

interface Props {
  onClose: () => void;
}

export default function LoginModal({ onClose }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin", password }),
      });
      const data = await res.json();
      if (data.success) {
        playLogin();
        toast("Welcome back, Admin!", "success");
        router.push("/admin");
      } else {
        playError();
        toast(data.error || "Login failed", "error");
      }
    } catch {
      toast("Network error", "error");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-xl" onClick={() => { onClose(); playClose(); }} />
      <div className="relative liquid-glass-strong rounded-3xl p-8 w-full max-w-md animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full liquid-glass-sm flex items-center justify-center text-muted hover:text-charcoal transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-royal rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-charcoal">{t("login.title")}</h2>
          <p className="text-muted text-sm mt-1">{t("login.desc")}</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">{t("form.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-white/40 bg-white/50 text-charcoal text-sm backdrop-blur-sm transition-all"
              placeholder={t("form.enter_password")}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-royal text-white py-3.5 rounded-2xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t("form.signing_in")}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                {t("form.sign_in")}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
