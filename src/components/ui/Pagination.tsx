"use client";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages = getPageWindow(page, totalPages);

  return (
    <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Pagination">
      <p className="text-xs text-text-secondary">
        Showing <span className="font-medium text-text-primary">{Math.min((page - 1) * pageSize + 1, total)}</span>–
        <span className="font-medium text-text-primary">{Math.min(page * pageSize, total)}</span> of{" "}
        <span className="font-medium text-text-primary">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-outline !px-3 !py-1.5 text-xs disabled:opacity-40"
          aria-label="Previous page"
        >
          ← Prev
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-2 text-xs text-text-secondary">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              aria-current={p === page ? "page" : undefined}
              className={`h-8 min-w-8 rounded-md px-2 text-xs font-medium transition-colors ${
                p === page ? "bg-primary text-primary-foreground" : "text-text-secondary hover:bg-surface-muted"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-outline !px-3 !py-1.5 text-xs disabled:opacity-40"
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
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
