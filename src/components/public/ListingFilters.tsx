"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Combobox } from "@/components/ui/Combobox";
import { formatSpecText } from "@/lib/spec-values";

import type { FilterableSpec } from "@/lib/listing-query";
export type { FilterableSpec };

function ListingFiltersInner({ specs }: { specs: FilterableSpec[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page"); // any filter change resets pagination
    router.push(`${pathname}?${params.toString()}`);
  }

  function onSearchInput(value: string) {
    setQ(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam("q", value), 400);
  }

  const activeFilterCount = Array.from(searchParams.keys()).filter((k) => k.startsWith("spec_") || k === "q").length;

  return (
    <div className="card mb-8 space-y-4 p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="input"
          placeholder="Search by keyword or location..."
          value={q}
          onChange={(e) => onSearchInput(e.target.value)}
        />
        {specs.map((spec) => (
          <Combobox
            key={spec.id}
            options={spec.values.map((v) => ({ value: v, label: spec.type === "MULTI_SELECT" ? v : formatSpecText(spec.type, v, spec.unit) }))}
            value={searchParams.get(`spec_${spec.id}`) ?? ""}
            onChange={(v) => updateParam(`spec_${spec.id}`, v)}
            placeholder={spec.name}
          />
        ))}
      </div>
      {activeFilterCount > 0 && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs font-medium text-accent hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

export function ListingFilters(props: { specs: FilterableSpec[] }) {
  return (
    <Suspense fallback={<div className="card mb-8 h-[76px]" aria-hidden />}>
      <ListingFiltersInner {...props} />
    </Suspense>
  );
}
