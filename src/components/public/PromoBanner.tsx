import Link from "next/link";
import type { PublicPromoItem } from "@/lib/promo-data";

/**
 * Slim scrolling strip at the very top of the homepage (managed from Admin → Promo Banner).
 * Pure CSS marquee: the item list is rendered twice so the loop is seamless; the second
 * copy is aria-hidden so screen readers don't read everything twice.
 */
export function PromoBanner({ items }: { items: PublicPromoItem[] }) {
  if (items.length === 0) return null;

  // Make sure one copy is wider than the screen even with only 1–2 items.
  const reps = Math.max(1, Math.ceil(6 / items.length));
  const one = Array.from({ length: reps }).flatMap(() => items);

  return (
    <aside aria-label="Promotions" className="bg-primary text-primary-foreground">
      <div className="promo-mask relative overflow-hidden">
        <div className="promo-track flex w-max">
          {[false, true].map((hidden) => (
            <ul key={String(hidden)} className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
              {one.map((it, i) => {
                const external = /^https?:\/\//i.test(it.href);
                const inner = (
                  <>
                    {it.badge && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">{it.badge}</span>
                    )}
                    <span className="truncate">{it.label}</span>
                    <span aria-hidden>→</span>
                  </>
                );
                const cls = "flex items-center gap-2 whitespace-nowrap px-6 py-2 text-xs font-medium hover:underline sm:text-sm";
                return (
                  <li key={`${it.id}-${i}`} className="flex items-center">
                    {external ? (
                      <a href={it.href} target="_blank" rel="noopener noreferrer" tabIndex={hidden ? -1 : undefined} className={cls}>{inner}</a>
                    ) : (
                      <Link href={it.href} tabIndex={hidden ? -1 : undefined} className={cls}>{inner}</Link>
                    )}
                    <span aria-hidden className="h-1 w-1 rounded-full bg-primary-foreground/40" />
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>
    </aside>
  );
}
