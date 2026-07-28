"use client";

import { useEffect, useState, useCallback } from "react";
import { playSuccess, playError } from "@/lib/sounds";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let addToastFn: ((msg: string, type: "success" | "error" | "info") => void) | null = null;

export function toast(message: string, type: "success" | "error" | "info" = "success") {
  if (addToastFn) addToastFn(message, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" | "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (type === "success") playSuccess();
    else if (type === "error") playError();
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  const bgColors = {
    success: "bg-emerald text-white",
    error: "bg-crimson text-white",
    info: "bg-royal text-white",
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[9999] flex flex-col gap-2 sm:gap-3 items-stretch sm:items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${bgColors[t.type]} px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl shadow-lg text-xs md:text-sm font-medium animate-fade-in max-w-full sm:max-w-xs`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
