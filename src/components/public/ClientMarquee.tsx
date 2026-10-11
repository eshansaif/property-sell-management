import Image from "next/image";
import type { PublicClient } from "@/lib/clients-data";

/**
 * Infinite-scrolling logo strip ("Trusted by"). Pure CSS animation (no JS) —
 * the logo list is duplicated once so the loop point is invisible, and the
 * animation pauses automatically for prefers-reduced-motion via globals.css.
 */
export function ClientMarquee({ clients }: { clients: PublicClient[] }) {
  if (clients.length === 0) return null;

  // Duplicate the list so the CSS animation can scroll exactly -50% and loop seamlessly.
  const track = [...clients, ...clients];

  return (
    <section className="border-y border-border bg-surface-muted/40 py-12">
      <div className="container-page">
        <p className="mb-7 text-center text-xs font-medium uppercase tracking-wider text-text-secondary">
          Trusted by teams and businesses like
        </p>
      </div>
      <div className="marquee-mask relative overflow-hidden">
        <div className="marquee-track flex w-max items-center gap-14">
          {track.map((c, i) => (
            <LogoItem key={`${c.id}-${i}`} client={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoItem({ client }: { client: PublicClient }) {
  const img = (
    <div className="relative h-10 w-28 shrink-0 grayscale transition-all duration-200 hover:grayscale-0 sm:h-12 sm:w-32">
      <Image src={client.logoUrl} alt={client.name} fill className="object-contain" sizes="150px" />
    </div>
  );

  if (client.websiteUrl) {
    return (
      <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={client.name}>
        {img}
      </a>
    );
  }
  return <div aria-label={client.name}>{img}</div>;
}
