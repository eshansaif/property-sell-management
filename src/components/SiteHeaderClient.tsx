"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavService } from "@/lib/nav-data";
import { LABELS } from "@/lib/labels";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SiteHeaderClient({ siteName, tree }: { siteName: string; tree: NavService[] }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(tree[0]?.id ?? null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setMobileOpen(false); setMegaOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const openMega = () => { clearTimeout(timer.current); setMegaOpen(true); };
  const closeMega = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setMegaOpen(false), 140); };

  const active = tree.find((s) => s.id === activeId) ?? tree[0];
  const linkClass = (href: string) =>
    `transition-colors hover:text-text-primary ${pathname === href || (href !== "/" && pathname?.startsWith(href)) ? "text-text-primary font-medium" : ""}`;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="shrink-0 font-display text-xl tracking-tight text-text-primary">{siteName}</Link>

        {/* Desktop navigation */}
        <nav className="hidden flex-1 items-center justify-center gap-7 text-sm text-text-secondary md:flex" aria-label="Main">
          {tree.length > 0 ? (
            <div
              className="relative"
              onMouseEnter={openMega}
              onMouseLeave={closeMega}
              onKeyDown={(e) => { if (e.key === "Escape") setMegaOpen(false); }}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={megaOpen}
                onClick={() => setMegaOpen((o) => !o)}
                className={`flex items-center gap-1.5 py-5 transition-colors hover:text-text-primary ${megaOpen || pathname?.startsWith("/services") ? "text-text-primary" : ""}`}
              >
                {LABELS.services} <Chevron open={megaOpen} />
              </button>

              {megaOpen && (
                <div className="absolute left-0 top-full z-50 w-[min(780px,90vw)] overflow-hidden rounded-b-xl rounded-tr-xl border border-border bg-surface shadow-xl">
                  <div className="grid grid-cols-[250px_1fr]">
                    <ul className="max-h-[420px] overflow-y-auto border-r border-border bg-surface-muted/50 p-2">
                      {tree.map((s) => (
                        <li key={s.id}>
                          <Link
                            href={`/services/${s.slug}`}
                            onMouseEnter={() => setActiveId(s.id)}
                            onFocus={() => setActiveId(s.id)}
                            className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors ${
                              active?.id === s.id ? "bg-surface text-text-primary shadow-card" : "text-text-secondary hover:text-text-primary"
                            }`}
                          >
                            {s.name}
                            <span aria-hidden className="text-xs text-text-secondary">›</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="max-h-[420px] overflow-y-auto p-5">
                      {active && (
                        <>
                          <div className="mb-3 flex items-center justify-between">
                            <p className="font-display text-base text-text-primary">{active.name}</p>
                            <Link href={`/services/${active.slug}`} className="text-xs font-medium text-accent hover:underline">View all →</Link>
                          </div>
                          {active.subServices.length === 0 ? (
                            <p className="text-sm text-text-secondary">No categories yet.</p>
                          ) : (
                            <ul className="grid grid-cols-2 gap-1">
                              {active.subServices.map((sub) => (
                                <li key={sub.id}>
                                  <Link
                                    href={`/services/${active.slug}/${sub.slug}`}
                                    className="block rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
                                  >
                                    {sub.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border bg-surface-muted/50 px-5 py-2.5 text-xs">
                    <Link href="/services" className="font-medium text-text-primary hover:underline">Browse all services</Link>
                    <Link href="/listings" className="font-medium text-accent hover:underline">{LABELS.allListings} →</Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/services" className={linkClass("/services")}>{LABELS.services}</Link>
          )}
          <Link href="/listings" className={linkClass("/listings")}>{LABELS.allListings}</Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-text-primary">{LABELS.howItWorks}</Link>
          <Link href="/#contact" className="transition-colors hover:text-text-primary">{LABELS.contact}</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/#contact" className="btn-accent hidden sm:inline-flex">{LABELS.sendInquiry}</Link>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-primary md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            <span className="relative block h-4 w-5">
              <span className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-all ${mobileOpen ? "top-2 rotate-45" : ""}`} />
              <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-3 h-0.5 w-5 bg-current transition-all ${mobileOpen ? "top-2 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-surface md:hidden">
          <nav className="container-page flex flex-col py-3" aria-label="Mobile">
            <Link href="/listings" className="rounded-md px-3 py-3 text-sm font-medium text-text-primary hover:bg-surface-muted">{LABELS.allListings}</Link>

            <p className="mt-2 px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-text-secondary">{LABELS.services}</p>
            {tree.map((s) => (
              <div key={s.id}>
                <div className="flex items-center">
                  <Link href={`/services/${s.slug}`} className="flex-1 rounded-md px-3 py-2.5 text-sm text-text-primary hover:bg-surface-muted">{s.name}</Link>
                  {s.subServices.length > 0 && (
                    <button
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                      aria-expanded={expanded === s.id}
                      aria-label={`Show ${s.name} categories`}
                      className="flex h-10 w-10 items-center justify-center text-text-secondary"
                    >
                      <Chevron open={expanded === s.id} />
                    </button>
                  )}
                </div>
                {expanded === s.id && (
                  <ul className="mb-1 ml-3 border-l border-border pl-2">
                    {s.subServices.map((sub) => (
                      <li key={sub.id}>
                        <Link href={`/services/${s.slug}/${sub.slug}`} className="block rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary">{sub.name}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <Link href="/services" className="rounded-md px-3 py-2.5 text-sm text-accent hover:bg-surface-muted">Browse all services →</Link>

            <div className="my-2 h-px bg-border" />
            <Link href="/#how-it-works" className="rounded-md px-3 py-2.5 text-sm text-text-primary hover:bg-surface-muted">{LABELS.howItWorks}</Link>
            <Link href="/#contact" className="rounded-md px-3 py-2.5 text-sm text-text-primary hover:bg-surface-muted">{LABELS.contact}</Link>
            <Link href="/#contact" className="btn-accent mt-3">{LABELS.sendInquiry}</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
