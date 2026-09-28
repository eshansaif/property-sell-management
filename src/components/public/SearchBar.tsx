"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, useRef } from "react";

function SearchBarInner({
  defaultValue = "",
  placeholder = "Search...",
  redirectTo,
}: {
  defaultValue?: string;
  placeholder?: string;
  /** If provided, always navigates here (e.g. homepage search -> /services). Otherwise updates the current page's `q` param. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  function navigate(q: string) {
    if (redirectTo) {
      router.push(q ? `${redirectTo}?q=${encodeURIComponent(q)}` : redirectTo);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function onChange(v: string) {
    setValue(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(v), 400);
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); clearTimeout(debounceRef.current); navigate(value); }}
      className="relative"
      role="search"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
        <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M18 18L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10"
        aria-label={placeholder}
      />
    </form>
  );
}

// useSearchParams() needs a Suspense boundary on statically rendered pages (e.g. the homepage).
export function SearchBar(props: {
  defaultValue?: string;
  placeholder?: string;
  redirectTo?: string;
}) {
  return (
    <Suspense fallback={<div className="input h-[42px]" aria-hidden />}>
      <SearchBarInner {...props} />
    </Suspense>
  );
}
