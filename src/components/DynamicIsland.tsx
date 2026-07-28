"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { playNotification } from "@/lib/sounds";

interface NoticeItem {
  id: number;
  title: string;
  titleBn: string;
  content: string;
  contentBn: string;
  priority: string;
  createdAt: string;
}

export default function DynamicIsland() {
  const { lang } = useI18n();
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/notices")
      .then((r) => r.json())
      .then((d) => {
        const items = Array.isArray(d) ? d : [];
        setNotices(items);
        if (items.length > 0) {
          // Show first notice after a short delay
          setTimeout(() => {
            setVisible(true);
            playNotification();
          }, 1500);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-cycle through notices
  useEffect(() => {
    if (notices.length === 0) return;

    // Auto-hide after 6 seconds if not expanded
    const hideTimer = setTimeout(() => {
      if (!expanded) {
        setVisible(false);
        // Show next notice after a pause
        setTimeout(() => {
          if (currentIdx < notices.length - 1) {
            setCurrentIdx((prev) => prev + 1);
            setVisible(true);
            playNotification();
          }
        }, 3000);
      }
    }, 6000);

    return () => clearTimeout(hideTimer);
  }, [currentIdx, notices.length, expanded]);

  const handleDismiss = () => {
    setVisible(false);
    setExpanded(false);
    // Show next after delay
    setTimeout(() => {
      if (currentIdx < notices.length - 1) {
        setCurrentIdx((prev) => prev + 1);
        setVisible(true);
        playNotification();
      }
    }, 2000);
  };

  if (notices.length === 0 || !visible) return null;

  const notice = notices[currentIdx];
  if (!notice) return null;

  const title = lang === "bn" && notice.titleBn ? notice.titleBn : notice.title;
  const content = lang === "bn" && notice.contentBn ? notice.contentBn : notice.content;

  const priorityDot: Record<string, string> = {
    urgent: "bg-red-500",
    important: "bg-amber-400",
    normal: "bg-blue-400",
  };

  return (
    <div className="fixed top-2 md:top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto px-2 w-full max-w-md">
      <div
        onClick={() => setExpanded(!expanded)}
        className={`cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] mx-auto ${
          expanded ? "w-full" : "w-fit max-w-[90vw] md:max-w-xs"
        }`}
        style={{
          background: "linear-gradient(135deg, rgba(26,26,46,0.85) 0%, rgba(15,52,96,0.75) 100%)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          borderRadius: expanded ? "28px" : "50px",
        }}
      >
        {/* Collapsed pill */}
        {!expanded && (
          <div className="flex items-center gap-3 px-5 py-3 animate-fade-in">
            <span className={`w-2.5 h-2.5 rounded-full ${priorityDot[notice.priority] || priorityDot.normal} animate-pulse flex-shrink-0`} />
            <p className="text-white text-sm font-medium truncate">{title}</p>
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
              className="ml-1 text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Expanded card */}
        {expanded && (
          <div className="p-5 animate-fade-in">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${priorityDot[notice.priority] || priorityDot.normal} flex-shrink-0`} />
                <h4 className="text-white text-sm font-bold">{title}</h4>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0 mt-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {content && (
              <p className="text-white/70 text-xs leading-relaxed ml-4.5">{content}</p>
            )}
            <div className="flex items-center justify-between mt-3 ml-4.5">
              <span className="text-white/30 text-[10px]">{new Date(notice.createdAt).toLocaleDateString()}</span>
              {notices.length > 1 && (
                <span className="text-white/30 text-[10px]">{currentIdx + 1}/{notices.length}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
