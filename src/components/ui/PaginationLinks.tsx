"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * URL-driven pagination for server-rendered public pages — real <a> links
 * (crawlable, shareable, back-button-safe) rather than client-only state.
 * Pairs with a server component that reads `searchParams.page`.
 */
function PaginationLinksInner({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const pages = getPageWindow(page, totalPages);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      <Link
        href={hrefFor(page - 1)}
        aria-disabled={page <= 1}
        className={`btn-outline !px-3 !py-1.5 text-xs ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
      >
        ← Prev
      </Link>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-xs text-text-secondary">…</span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p as number)}
            aria-current={p === page ? "page" : undefined}
            className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors ${
              p === page ? "bg-primary text-primary-foreground" : "text-text-secondary hover:bg-surface-muted"
            }`}
          >
            {p}
          </Link>
        )
      )}
      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page >= totalPages}
        className={`btn-outline !px-3 !py-1.5 text-xs ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
      >
        Next →
      </Link>
    </nav>
  );
}

function getPageWindow(current: number, total: number): (number | "...")[] {
  const delta = 1;
  const range: (number | "...")[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push("...");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("...");
  if (total > 1) range.push(total);

  return range;
}

export function PaginationLinks(props: { page: number; pageSize: number; total: number }) {
  return (
    <Suspense fallback={null}>
      <PaginationLinksInner {...props} />
    </Suspense>
  );
}
