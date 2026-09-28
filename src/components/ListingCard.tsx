import Link from "next/link";
import Image from "next/image";

export function ListingCard({
  title,
  slug,
  serviceSlug,
  subServiceSlug,
  shortDesc,
  priceLabel,
  location,
  coverImage,
}: {
  title: string;
  slug: string;
  serviceSlug: string;
  subServiceSlug: string;
  shortDesc?: string | null;
  priceLabel?: string | null;
  location?: string | null;
  coverImage?: string | null;
}) {
  return (
    <Link
      href={`/services/${serviceSlug}/${subServiceSlug}/${slug}`}
      className="card-interactive group flex flex-col overflow-hidden"
    >
      <div className="relative h-48 w-full bg-surface-muted">
        {coverImage ? (
          <Image src={coverImage} alt={title} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-secondary/40 text-sm">No image</div>
        )}
        {priceLabel && (
          <span className="absolute bottom-3 left-3 rounded-md bg-surface/95 px-2.5 py-1 text-sm font-medium text-text-primary shadow-card">
            {priceLabel}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 font-display text-base text-text-primary">{title}</h3>
        {location && <p className="text-xs text-text-secondary">{location}</p>}
        {shortDesc && <p className="line-clamp-2 text-sm text-text-secondary">{shortDesc}</p>}
      </div>
    </Link>
  );
}
