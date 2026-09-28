import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ListingCard } from "@/components/ListingCard";
import { BrowseFilters } from "@/components/public/BrowseFilters";
import { PaginationLinks } from "@/components/ui/PaginationLinks";
import { getNavTreeSafe } from "@/lib/nav-data";
import { buildPublicListingWhere, getFilterableSpecs, sortToOrderBy, type FilterableSpec } from "@/lib/listing-query";
import { LABELS } from "@/lib/labels";

const PAGE_SIZE = 12;
type SP = { [key: string]: string | undefined };

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const filtered = Object.keys(searchParams).some((k) => k !== "page");
  return {
    title: LABELS.allListings,
    description: LABELS.allListingsIntro,
    alternates: { canonical: "/listings" }, // filtered/sorted variants point back to the clean URL
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function AllListingsPage({ searchParams }: { searchParams: SP }) {
  const tree = await getNavTreeSafe();
  const service = tree.find((s) => s.slug === searchParams.service);
  const sub = service?.subServices.find((s) => s.slug === searchParams.sub);

  let specs: FilterableSpec[] = [];
  let typeById = new Map<string, string>();
  if (service && sub) ({ specs, typeById } = await getFilterableSpecs(service.id, sub.id));

  const page = Math.max(1, Number(searchParams.page || 1) || 1);
  const where = buildPublicListingWhere({ q: searchParams.q, serviceId: service?.id, subServiceId: sub?.id, params: searchParams, typeById });

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: sortToOrderBy(searchParams.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        images: { where: { isCover: true }, take: 1 },
        service: { select: { slug: true } },
        subService: { select: { slug: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10 md:py-14">
        <nav className="mb-3 text-xs text-text-secondary" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-text-primary">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">{LABELS.allListings}</span>
        </nav>
        <h1 className="font-display text-3xl text-text-primary">{sub ? sub.name : service ? service.name : LABELS.allListingsHeading}</h1>
        <p className="mt-2 max-w-xl text-sm text-text-secondary">{LABELS.allListingsIntro}</p>

        <div className="mt-8">
          <BrowseFilters services={tree} specs={specs} />
        </div>

        <p className="mb-4 text-sm text-text-secondary" aria-live="polite">
          {total === 0 ? "No results" : `${total} listing${total === 1 ? "" : "s"} found`}
        </p>

        {listings.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-display text-lg text-text-primary">Nothing matches your search</p>
            <p className="mt-1 text-sm text-text-secondary">Try removing a filter or searching with a different keyword.</p>
            <Link href="/listings" className="btn-outline mt-5">Clear filters</Link>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  title={l.title}
                  slug={l.slug}
                  serviceSlug={l.service.slug}
                  subServiceSlug={l.subService.slug}
                  shortDesc={l.shortDesc}
                  priceLabel={l.priceLabel}
                  location={l.location}
                  coverImage={l.images[0]?.url}
                />
              ))}
            </div>
            <PaginationLinks page={page} pageSize={PAGE_SIZE} total={total} />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
