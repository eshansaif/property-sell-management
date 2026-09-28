import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ListingCard } from "@/components/ListingCard";
import { InquiryForm } from "@/components/InquiryForm";
import { ListingFilters } from "@/components/public/ListingFilters";
import { PaginationLinks } from "@/components/ui/PaginationLinks";
import { buildPublicListingWhere, getFilterableSpecs, sortToOrderBy } from "@/lib/listing-query";
import { LABELS } from "@/lib/labels";

const PAGE_SIZE = 9;

async function getSubServiceMeta(serviceSlug: string, subSlug: string) {
  const service = await prisma.service.findFirst({ where: { slug: serviceSlug, status: "PUBLISHED" } });
  if (!service) return null;
  const sub = await prisma.subService.findFirst({ where: { slug: subSlug, serviceId: service.id, status: "PUBLISHED" } });
  if (!sub) return null;
  return { service, sub };
}

export async function generateMetadata({ params, searchParams }: { params: { serviceSlug: string; subSlug: string }; searchParams: { [k: string]: string | undefined } }): Promise<Metadata> {
  const data = await getSubServiceMeta(params.serviceSlug, params.subSlug);
  if (!data) return {};
  const filtered = Object.keys(searchParams).some((k) => k !== "page");
  return {
    title: data.sub.seoTitle || data.sub.name,
    description: data.sub.seoDescription || data.sub.shortDesc || undefined,
    alternates: { canonical: `/services/${data.service.slug}/${data.sub.slug}` },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function SubServicePage({
  params,
  searchParams,
}: {
  params: { serviceSlug: string; subSlug: string };
  searchParams: { [key: string]: string | undefined };
}) {
  const data = await getSubServiceMeta(params.serviceSlug, params.subSlug);
  if (!data) return notFound();
  const { service, sub } = data;

  const { specs, typeById } = await getFilterableSpecs(service.id, sub.id);
  const page = Math.max(1, Number(searchParams.page || 1) || 1);
  const where = buildPublicListingWhere({ q: searchParams.q, subServiceId: sub.id, params: searchParams, typeById });

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: sortToOrderBy(searchParams.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { images: { where: { isCover: true }, take: 1 } },
    }),
    prisma.listing.count({ where }),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10 md:py-16">
        <nav className="mb-4 text-xs text-text-secondary" aria-label="Breadcrumb">
          <Link href="/services" className="hover:text-text-primary">{LABELS.services}</Link>
          <span className="mx-2">/</span>
          <Link href={`/services/${service.slug}`} className="hover:text-text-primary">{service.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">{sub.name}</span>
        </nav>

        <h1 className="font-display text-3xl text-text-primary">{sub.name}</h1>
        {sub.description && <p className="mt-3 max-w-2xl text-text-secondary">{sub.description}</p>}

        <div className="mt-8">
          <ListingFilters specs={specs} />
        </div>

        {listings.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-text-secondary">No listings match your search. Try adjusting the filters.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  title={l.title}
                  slug={l.slug}
                  serviceSlug={service.slug}
                  subServiceSlug={sub.slug}
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

        <div className="mt-16 max-w-xl">
          <h2 className="mb-4 font-display text-xl text-text-primary">Interested in {sub.name}?</h2>
          <InquiryForm
            serviceId={service.id}
            subServiceId={sub.id}
            contextLabel={`${service.name} → ${sub.name}`}
            sourcePage={`/services/${service.slug}/${sub.slug}`}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
