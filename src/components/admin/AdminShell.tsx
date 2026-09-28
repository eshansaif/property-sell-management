"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { can, ROLE_LABELS } from "@/lib/rbac";
import { LABELS } from "@/lib/labels";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "grid", perm: null },
  { href: "/admin/listings", label: LABELS.allListings, icon: "list", perm: "listing:read" },
  { href: "/admin/inquiries", label: "Inquiries", icon: "inbox", perm: "inquiry:read" },
  { href: "/admin/services", label: "Services", icon: "layers", perm: "service:read" },
  { href: "/admin/sub-services", label: "Sub-services", icon: "folder", perm: "subservice:read" },
  { href: "/admin/specifications", label: "Specifications", icon: "sliders", perm: "listing:read" },
  { href: "/admin/settings", label: "Settings", icon: "settings", perm: null },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = session?.user?.role;
  const isLogin = pathname === "/admin/login";

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Deactivated (or removed) accounts lose access immediately: the session callback drops the role.
  useEffect(() => {
    if (!isLogin && status === "authenticated" && !role) {
      toast.error("Your access has ended", "Your account was deactivated or changed. Please sign in again.");
      signOut({ callbackUrl: "/admin/login" });
    }
  }, [isLogin, status, role, toast]);

  if (isLogin) return <>{children}</>;

  const items = NAV.filter((i) => !i.perm || can(role, i.perm));

  const navContent = (
    <nav className="space-y-1 p-4" aria-label="Admin">
      {status === "loading"
        ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
        : items.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                }`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:block">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/admin" className="font-display text-lg text-text-primary">Admin</Link>
        </div>
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 overflow-y-auto bg-surface shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <span className="font-display text-lg text-text-primary">Admin</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-text-secondary">✕</button>
            </div>
            {navContent}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-md text-text-primary md:hidden" aria-label="Open menu">
              <span className="block h-3.5 w-5">
                <span className="block h-0.5 w-5 bg-current" />
                <span className="mt-1 block h-0.5 w-5 bg-current" />
                <span className="mt-1 block h-0.5 w-5 bg-current" />
              </span>
            </button>
            {status === "loading" ? (
              <Skeleton className="hidden h-4 w-40 sm:block" />
            ) : (
              <p className="hidden text-sm text-text-secondary sm:block">
                {session?.user?.name} <span className="ml-1 text-xs text-text-secondary/70">({role ? ROLE_LABELS[role] : ""})</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a href="/manual.html" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-text-primary">Help</a>
            <Link href="/" className="text-sm text-text-secondary hover:text-text-primary">View site</Link>
            <button onClick={() => signOut({ callbackUrl: "/admin/login" })} className="btn-outline !px-3 !py-1.5 text-xs">Sign out</button>
          </div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    grid: "M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z",
    layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5",
    folder: "M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V6z",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    sliders: "M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6",
    inbox: "M22 12h-6l-2 3h-4l-2-3H2M5 12l2-8h10l2 8v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6z",
    settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z",
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d={paths[name] ?? paths.grid} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
