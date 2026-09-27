import Link from "next/link";
import Image from "next/image";

export function ServiceCard({
  name,
  slug,
  shortDesc,
  coverImage,
  listingCount,
}: {
  name: string;
  slug: string;
  shortDesc?: string | null;
  coverImage?: string | null;
  listingCount?: number;
}) {
  return (
    <Link
      href={`/services/${slug}`}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-md"
    >
      <div className="relative h-40 w-full bg-surface-muted">
        {coverImage ? (
          <Image src={coverImage} alt={name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-secondary/40">
            <span className="font-display text-3xl">{name.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg text-text-primary">{name}</h3>
        {shortDesc && <p className="line-clamp-2 text-sm text-text-secondary">{shortDesc}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          {typeof listingCount === "number" && (
            <span className="text-xs text-text-secondary">{listingCount} listing{listingCount === 1 ? "" : "s"}</span>
          )}
          <span className="text-sm font-medium text-accent group-hover:underline">View →</span>
        </div>
      </div>
    </Link>
  );
}
