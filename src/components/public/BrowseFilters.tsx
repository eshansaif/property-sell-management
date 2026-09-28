"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Combobox } from "@/components/ui/Combobox";
import { formatSpecText } from "@/lib/spec-values";
import type { NavService } from "@/lib/nav-data";
import type { FilterableSpec } from "@/lib/listing-query";

const SORTS = [
  { value: "", label: "Recommended" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "Title A–Z" },
];

function BrowseFiltersInner({ services, specs }: { services: NavService[]; specs: FilterableSpec[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setQ(sp.get("q") ?? ""); }, [sp]);

  const serviceSlug = sp.get("service") ?? "";
  const subSlug = sp.get("sub") ?? "";
  const currentService = services.find((s) => s.slug === serviceSlug);

  function push(mutate: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(sp.toString());
    mutate(p);
    p.delete("page"); // any filter change resets pagination
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const activeCount = Array.from(sp.keys()).filter((k) => k !== "page" && k !== "sort").length;

  return (
    <div className="card mb-8 space-y-4 p-4 sm:p-5">
      <div className="relative">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
          <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M18 18L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          className="input pl-10"
          placeholder="Search by title, location, service or detail…"
          value={q}
          aria-label="Search listings"
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            clearTimeout(debounce.current);
            debounce.current = setTimeout(() => push((p) => (v.trim() ? p.set("q", v.trim()) : p.delete("q"))), 400);
          }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Combobox
          options={services.map((s) => ({ value: s.slug, label: s.name }))}
          value={serviceSlug}
          onChange={(v) =>
            push((p) => {
              if (v) p.set("service", v); else p.delete("service");
              p.delete("sub");
              Array.from(p.keys()).filter((k) => k.startsWith("spec_")).forEach((k) => p.delete(k));
            })
          }
          placeholder="All services"
        />
        <Combobox
          options={(currentService?.subServices ?? []).map((s) => ({ value: s.slug, label: s.name }))}
          value={subSlug}
          onChange={(v) =>
            push((p) => {
              if (v) p.set("sub", v); else p.delete("sub");
              Array.from(p.keys()).filter((k) => k.startsWith("spec_")).forEach((k) => p.delete(k));
            })
          }
          placeholder={currentService ? "All categories" : "Pick a service first"}
          disabled={!currentService}
        />
        {specs.map((spec) => (
          <Combobox
            key={spec.id}
            options={spec.values.map((v) => ({ value: v, label: spec.type === "MULTI_SELECT" ? v : formatSpecText(spec.type, v, spec.unit) }))}
            value={sp.get(`spec_${spec.id}`) ?? ""}
            onChange={(v) => push((p) => (v ? p.set(`spec_${spec.id}`, v) : p.delete(`spec_${spec.id}`)))}
            placeholder={spec.name}
          />
        ))}
        <Combobox
          options={SORTS}
          value={sp.get("sort") ?? ""}
          onChange={(v) => push((p) => (v ? p.set("sort", v) : p.delete("sort")))}
          placeholder="Sort"
          clearable={false}
        />
      </div>

      {activeCount > 0 && (
        <button onClick={() => router.push(pathname)} className="text-xs font-medium text-accent hover:underline">
          Clear all filters
        </button>
      )}
    </div>
  );
}

export function BrowseFilters(props: { services: NavService[]; specs: FilterableSpec[] }) {
  return (
    <Suspense fallback={<div className="card mb-8 h-[132px]" aria-hidden />}>
      <BrowseFiltersInner {...props} />
    </Suspense>
  );
}
