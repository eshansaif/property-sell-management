"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; type: ToastType; title: string; description?: string; duration: number };

export type ToastApi = {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: number) => void;
};

const noop = () => {};
const ToastContext = createContext<ToastApi>({ success: noop, error: noop, info: noop, dismiss: noop });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

const DURATION: Record<ToastType, number> = { success: 3500, info: 4500, error: 6500 };
const MAX_VISIBLE = 4;
let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((type: ToastType, title: string, description?: string) => {
    const id = ++counter;
    setToasts((t) => [...t.slice(-(MAX_VISIBLE - 1)), { id, type, title, description, duration: DURATION[type] }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, d) => push("success", t, d),
      error: (t, d) => push("error", t, d),
      info: (t, d) => push("info", t, d),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:w-[380px]"
      >
        {toasts.map((t) => (
          <ToastView key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const STYLES: Record<ToastType, { bar: string; icon: string; path: string }> = {
  success: { bar: "bg-success", icon: "text-success bg-success/10", path: "M5 13l4 4L19 7" },
  error: { bar: "bg-error", icon: "text-error bg-error/10", path: "M6 6l12 12M18 6L6 18" },
  info: { bar: "bg-info", icon: "text-info bg-info/10", path: "M12 8h.01M11 12h1v5h1" },
};

function ToastView({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(onClose, remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, onClose]);

  const s = STYLES[toast.type];

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="animate-toast-in pointer-events-auto relative overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
    >
      <div className="flex items-start gap-3 p-3.5 pr-9">
        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${s.icon}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d={s.path} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{toast.title}</p>
          {toast.description && <p className="mt-0.5 break-words text-xs text-text-secondary">{toast.description}</p>}
        </div>
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded text-text-secondary hover:bg-surface-muted"
      >
        ×
      </button>
      <div
        className={`toast-progress absolute bottom-0 left-0 h-0.5 w-full origin-left ${s.bar}`}
        style={{ animationDuration: `${toast.duration}ms`, animationPlayState: paused ? "paused" : "running" }}
      />
    </div>
  );
}
