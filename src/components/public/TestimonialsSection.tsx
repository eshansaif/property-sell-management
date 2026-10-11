import Image from "next/image";
import type { PublicTestimonial } from "@/lib/testimonials-data";

export function TestimonialsSection({ items }: { items: PublicTestimonial[] }) {
  if (items.length === 0) return null;
  return (
    <section className="border-y border-border bg-surface-muted/60 py-16">
      <div className="container-page">
        <h2 className="mb-10 font-display text-2xl text-text-primary">What people say</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <figure key={t.id} className="card flex flex-col p-6">
              {t.rating ? (
                <div className="mb-3 flex gap-0.5 text-accent" role="img" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < (t.rating ?? 0) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" strokeLinejoin="round" />
                    </svg>
                  ))}
                </div>
              ) : null}
              <blockquote className="flex-1 text-sm leading-relaxed text-text-primary">“{t.content}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                {t.authorPhoto ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border">
                    <Image src={t.authorPhoto} alt={t.authorName} fill className="object-cover" sizes="40px" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">{t.authorName.charAt(0).toUpperCase()}</div>
                )}
                <div>
                  <p className="text-sm font-medium text-text-primary">{t.authorName}</p>
                  {t.authorRole && <p className="text-xs text-text-secondary">{t.authorRole}</p>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
