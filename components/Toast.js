"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export default function Toast({ message, type = "info", onClose, duration = 4500 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: {
      bg: "bg-[#113F32] border-[#2D8A6E] text-white",
      icon: <CheckCircle2 className="w-5 h-5 text-[#6EE7B7] shrink-0" />,
      badge: "Success",
    },
    error: {
      bg: "bg-[#45141A] border-[#991B1B] text-white",
      icon: <AlertCircle className="w-5 h-5 text-[#FCA5A5] shrink-0" />,
      badge: "Error",
    },
    warning: {
      bg: "bg-[#452A0A] border-[#B45309] text-white",
      icon: <AlertTriangle className="w-5 h-5 text-[#FCD34D] shrink-0" />,
      badge: "Attention",
    },
    info: {
      bg: "bg-[#14261C] border-[#3D5A4C] text-white",
      icon: <Info className="w-5 h-5 text-[#93C5FD] shrink-0" />,
      badge: "Notice",
    },
  }[type] || {
    bg: "bg-[#14261C] border-[#3D5A4C] text-white",
    icon: <Info className="w-5 h-5 text-[#93C5FD] shrink-0" />,
    badge: "Notice",
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] animate-fade-up shadow-2xl transition-all"
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md ${styles.bg} shadow-lg`}
      >
        {styles.icon}
        <div className="flex-1 text-sm leading-relaxed pr-2">
          <p className="font-semibold text-xs tracking-wider uppercase opacity-75 mb-0.5">
            {styles.badge}
          </p>
          <p className="text-gray-100 font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
