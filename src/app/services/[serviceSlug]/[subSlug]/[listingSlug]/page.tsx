// import type { Metadata } from "next";
// import Link from "next/link";
// import Image from "next/image";
// import { notFound } from "next/navigation";
// import { prisma } from "@/lib/prisma";
// import { SiteHeader } from "@/components/SiteHeader";
// import { SiteFooter } from "@/components/SiteFooter";
// import { ListingCard } from "@/components/ListingCard";
// import { InquiryForm } from "@/components/InquiryForm";
// import { formatSpecText } from "@/lib/spec-values";
// import { SpecTable, SpecValue, type SpecRowView } from "@/components/public/SpecSheet";
// import { LABELS } from "@/lib/labels";

// export const revalidate = 60;

// async function getListing(serviceSlug: string, subSlug: string, listingSlug: string) {
//   const listing = await prisma.listing.findFirst({
//     where: {
//       slug: listingSlug,
//       status: "PUBLISHED",
//       service: { slug: serviceSlug },
//       subService: { slug: subSlug },
//     },
//     include: {
//       service: true,
//       subService: true,
//       images: { orderBy: { sortOrder: "asc" } },
//       specs: { include: { specification: true }, orderBy: { specification: { displayOrder: "asc" } } },
//       customSpecs: { orderBy: { sortOrder: "asc" } },
//     },
//   });
//   return listing;
// }

// export async function generateMetadata({
//   params,
// }: {
//   params: { serviceSlug: string; subSlug: string; listingSlug: string };
// }): Promise<Metadata> {
//   const listing = await getListing(params.serviceSlug, params.subSlug, params.listingSlug);
//   if (!listing) return {};
//   return {
//     title: listing.seoTitle || listing.title,
//     description: listing.seoDescription || listing.shortDesc || undefined,
//     openGraph: { images: listing.images[0] ? [listing.images[0].url] : undefined },
//   };
// }

// export default async function ListingDetailPage({
//   params,
// }: {
//   params: { serviceSlug: string; subSlug: string; listingSlug: string };
// }) {
//   const listing = await getListing(params.serviceSlug, params.subSlug, params.listingSlug);
//   if (!listing) return notFound();

//   const related = await prisma.listing.findMany({
//     where: {
//       status: "PUBLISHED",
//       subServiceId: listing.subServiceId,
//       id: { not: listing.id },
//     },
//     take: 3,
//     include: { images: { where: { isCover: true }, take: 1 } },
//   });

//   const definedRows: SpecRowView[] = listing.specs.map((sp) => ({
//     key: sp.id,
//     label: sp.specification.name,
//     content: <SpecValue type={sp.specification.type} value={sp.value} unit={sp.specification.unit} />,
//   }));
//   const mainRows: SpecRowView[] = [
//     ...definedRows,
//     ...listing.customSpecs.filter((c) => !c.group).map((c) => ({ key: c.id, label: c.label, content: c.value })),
//   ];
//   const groups = new Map<string, SpecRowView[]>();
//   for (const c of listing.customSpecs) {
//     if (!c.group) continue;
//     if (!groups.has(c.group)) groups.set(c.group, []);
//     groups.get(c.group)!.push({ key: c.id, label: c.label, content: c.value });
//   }

//   const contextLabel = `${listing.service.name} → ${listing.subService.name} → ${listing.title}`;

//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "Product",
//     name: listing.title,
//     description: listing.shortDesc ?? undefined,
//     image: listing.images.map((i) => i.url),
//     additionalProperty: [
//       ...listing.specs.map((sp) => ({
//         "@type": "PropertyValue",
//         name: sp.specification.name,
//         value: formatSpecText(sp.specification.type, sp.value, sp.specification.unit),
//       })),
//       ...listing.customSpecs.map((c) => ({ "@type": "PropertyValue", name: c.label, value: c.value })),
//     ],
//     offers: listing.priceLabel ? { "@type": "Offer", priceCurrency: "BDT", price: undefined, availability: "https://schema.org/InStock", description: listing.priceLabel } : undefined,
//   };

//   const breadcrumbLd = {
//     "@context": "https://schema.org",
//     "@type": "BreadcrumbList",
//     itemListElement: [
//       { "@type": "ListItem", position: 1, name: listing.service.name, item: `/services/${listing.service.slug}` },
//       { "@type": "ListItem", position: 2, name: listing.subService.name, item: `/services/${listing.service.slug}/${listing.subService.slug}` },
//       { "@type": "ListItem", position: 3, name: listing.title },
//     ],
//   };

//   return (
//     <>
//       <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
//       <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
//       <SiteHeader />
//       <main className="container-page py-10 pb-28 md:pb-16">
//         <nav className="mb-4 text-xs text-text-secondary">
//           <Link href="/services" className="hover:text-text-primary">{LABELS.services}</Link>
//           <span className="mx-2">/</span>
//           <Link href={`/services/${listing.service.slug}`} className="hover:text-text-primary">{listing.service.name}</Link>
//           <span className="mx-2">/</span>
//           <Link href={`/services/${listing.service.slug}/${listing.subService.slug}`} className="hover:text-text-primary">{listing.subService.name}</Link>
//           <span className="mx-2">/</span>
//           <span className="text-text-primary">{listing.title}</span>
//         </nav>

//         <div className="grid gap-10 lg:grid-cols-3">
//           <div className="lg:col-span-2">
//             {/* Gallery */}
//             <div className="grid gap-2">
//               <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-surface-muted">
//                 {listing.images[0] && (
//                   <Image src={listing.images[0].url} alt={listing.images[0].altText ?? listing.title} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 66vw" />
//                 )}
//               </div>
//               {listing.images.length > 1 && (
//                 <div className="grid grid-cols-4 gap-2">
//                   {listing.images.slice(1, 5).map((img) => (
//                     <div key={img.id} className="relative aspect-square overflow-hidden rounded-md bg-surface-muted">
//                       <Image src={img.url} alt={img.altText ?? listing.title} fill className="object-cover" sizes="150px" />
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <h1 className="mt-6 font-display text-2xl text-text-primary sm:text-3xl">{listing.title}</h1>
//             <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
//               {listing.location && <span>{listing.location}</span>}
//               {listing.priceLabel && (
//                 <span className="rounded-md bg-accent/10 px-2.5 py-1 text-sm font-medium text-accent">{listing.priceLabel}</span>
//               )}
//             </div>

//             {/* Specifications — standard spec-sheet tables */}
//             {(mainRows.length > 0 || groups.size > 0) && (
//               <section className="mt-10 space-y-6" aria-labelledby="specs-heading">
//                 <h2 id="specs-heading" className="font-display text-lg text-text-primary">Specifications</h2>
//                 {mainRows.length > 0 && <SpecTable rows={mainRows} caption={`Specifications for ${listing.title}`} />}
//                 {Array.from(groups).map(([title, rows]) => (
//                   <div key={title}>
//                     <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">{title}</h3>
//                     <SpecTable rows={rows} caption={`${title} — ${listing.title}`} />
//                   </div>
//                 ))}
//               </section>
//             )}

//             {listing.description && (
//               <div className="mt-8">
//                 <h2 className="mb-3 font-display text-lg text-text-primary">Description</h2>
//                 <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">{listing.description}</p>
//               </div>
//             )}
//           </div>

//           {/* Inquiry sidebar (desktop) */}
//           <div className="hidden lg:block">
//             <div className="sticky top-24">
//               <InquiryForm
//                 serviceId={listing.serviceId}
//                 subServiceId={listing.subServiceId}
//                 listingId={listing.id}
//                 contextLabel={contextLabel}
//                 sourcePage={`/services/${listing.service.slug}/${listing.subService.slug}/${listing.slug}`}
//               />
//             </div>
//           </div>
//         </div>

//         {related.length > 0 && (
//           <div className="mt-16">
//             <h2 className="mb-6 font-display text-xl text-text-primary">Related listings</h2>
//             <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//               {related.map((l) => (
//                 <ListingCard
//                   key={l.id}
//                   title={l.title}
//                   slug={l.slug}
//                   serviceSlug={listing.service.slug}
//                   subServiceSlug={listing.subService.slug}
//                   shortDesc={l.shortDesc}
//                   priceLabel={l.priceLabel}
//                   location={l.location}
//                   coverImage={l.images[0]?.url}
//                 />
//               ))}
//             </div>
//           </div>
//         )}
//       </main>

//       {/* Sticky mobile CTA */}
//       <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden">
//         <a href="#mobile-inquiry" className="btn-accent w-full">I'm Interested</a>
//       </div>
//       <div id="mobile-inquiry" className="container-page py-10 lg:hidden">
//         <InquiryForm
//           serviceId={listing.serviceId}
//           subServiceId={listing.subServiceId}
//           listingId={listing.id}
//           contextLabel={contextLabel}
//           sourcePage={`/services/${listing.service.slug}/${listing.subService.slug}/${listing.slug}`}
//         />
//       </div>
//       <SiteFooter />
//     </>
//   );
// }


import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ListingCard } from "@/components/ListingCard";
import { InquiryForm } from "@/components/InquiryForm";
import { formatSpecText } from "@/lib/spec-values";
import { SpecTable, SpecValue, type SpecRowView } from "@/components/public/SpecSheet";
import { LABELS } from "@/lib/labels";
import { ListingGallery } from "@/components/public/ListingGallery";

export const revalidate = 60;

async function getListing(serviceSlug: string, subSlug: string, listingSlug: string) {
  const listing = await prisma.listing.findFirst({
    where: {
      slug: listingSlug,
      status: "PUBLISHED",
      service: { slug: serviceSlug },
      subService: { slug: subSlug },
    },
    include: {
      service: true,
      subService: true,
      images: { orderBy: { sortOrder: "asc" } },
      specs: { include: { specification: true }, orderBy: { specification: { displayOrder: "asc" } } },
      customSpecs: { orderBy: { sortOrder: "asc" } },
    },
  });
  return listing;
}

export async function generateMetadata({
  params,
}: {
  params: { serviceSlug: string; subSlug: string; listingSlug: string };
}): Promise<Metadata> {
  const listing = await getListing(params.serviceSlug, params.subSlug, params.listingSlug);
  if (!listing) return {};
  return {
    title: listing.seoTitle || listing.title,
    description: listing.seoDescription || listing.shortDesc || undefined,
    openGraph: { images: listing.images[0] ? [listing.images[0].url] : undefined },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: { serviceSlug: string; subSlug: string; listingSlug: string };
}) {
  const listing = await getListing(params.serviceSlug, params.subSlug, params.listingSlug);
  if (!listing) return notFound();

  const related = await prisma.listing.findMany({
    where: {
      status: "PUBLISHED",
      subServiceId: listing.subServiceId,
      id: { not: listing.id },
    },
    take: 3,
    include: { images: { where: { isCover: true }, take: 1 } },
  });

  const definedRows: SpecRowView[] = listing.specs.map((sp) => ({
    key: sp.id,
    label: sp.specification.name,
    content: <SpecValue type={sp.specification.type} value={sp.value} unit={sp.specification.unit} />,
  }));
  const mainRows: SpecRowView[] = [
    ...definedRows,
    ...listing.customSpecs.filter((c) => !c.group).map((c) => ({ key: c.id, label: c.label, content: c.value })),
  ];
  const groups = new Map<string, SpecRowView[]>();
  for (const c of listing.customSpecs) {
    if (!c.group) continue;
    if (!groups.has(c.group)) groups.set(c.group, []);
    groups.get(c.group)!.push({ key: c.id, label: c.label, content: c.value });
  }

  const contextLabel = `${listing.service.name} → ${listing.subService.name} → ${listing.title}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.shortDesc ?? undefined,
    image: listing.images.map((i) => i.url),
    additionalProperty: [
      ...listing.specs.map((sp) => ({
        "@type": "PropertyValue",
        name: sp.specification.name,
        value: formatSpecText(sp.specification.type, sp.value, sp.specification.unit),
      })),
      ...listing.customSpecs.map((c) => ({ "@type": "PropertyValue", name: c.label, value: c.value })),
    ],
    offers: listing.priceLabel ? { "@type": "Offer", priceCurrency: "BDT", price: undefined, availability: "https://schema.org/InStock", description: listing.priceLabel } : undefined,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: listing.service.name, item: `/services/${listing.service.slug}` },
      { "@type": "ListItem", position: 2, name: listing.subService.name, item: `/services/${listing.service.slug}/${listing.subService.slug}` },
      { "@type": "ListItem", position: 3, name: listing.title },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteHeader />
      <main className="container-page py-10 pb-28 md:pb-16">
        <nav className="mb-4 text-xs text-text-secondary">
          <Link href="/services" className="hover:text-text-primary">{LABELS.services}</Link>
          <span className="mx-2">/</span>
          <Link href={`/services/${listing.service.slug}`} className="hover:text-text-primary">{listing.service.name}</Link>
          <span className="mx-2">/</span>
          <Link href={`/services/${listing.service.slug}/${listing.subService.slug}`} className="hover:text-text-primary">{listing.subService.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">{listing.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Gallery — click main image for full-screen view */}
            <ListingGallery images={listing.images} title={listing.title} />

            <h1 className="mt-6 font-display text-2xl text-text-primary sm:text-3xl">{listing.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              {listing.location && <span>{listing.location}</span>}
              {listing.priceLabel && (
                <span className="rounded-md bg-accent/10 px-2.5 py-1 text-sm font-medium text-accent">{listing.priceLabel}</span>
              )}
            </div>

            {listing.description && (
              <div className="mt-8">
                <h2 className="mb-3 font-display text-lg text-text-primary">Description</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">{listing.description}</p>
              </div>
            )}

            {/* Specifications — standard spec-sheet tables */}
            {(mainRows.length > 0 || groups.size > 0) && (
              <section className="mt-10 space-y-6" aria-labelledby="specs-heading">
                <h2 id="specs-heading" className="font-display text-lg text-text-primary">Specifications</h2>
                {mainRows.length > 0 && <SpecTable rows={mainRows} caption={`Specifications for ${listing.title}`} />}
                {Array.from(groups).map(([title, rows]) => (
                  <div key={title}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">{title}</h3>
                    <SpecTable rows={rows} caption={`${title} — ${listing.title}`} />
                  </div>
                ))}
              </section>
            )}
          </div>

          {/* Inquiry sidebar (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <InquiryForm
                serviceId={listing.serviceId}
                subServiceId={listing.subServiceId}
                listingId={listing.id}
                contextLabel={contextLabel}
                sourcePage={`/services/${listing.service.slug}/${listing.subService.slug}/${listing.slug}`}
              />
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 font-display text-xl text-text-primary">Related listings</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((l) => (
                <ListingCard
                  key={l.id}
                  title={l.title}
                  slug={l.slug}
                  serviceSlug={listing.service.slug}
                  subServiceSlug={listing.subService.slug}
                  shortDesc={l.shortDesc}
                  priceLabel={l.priceLabel}
                  location={l.location}
                  coverImage={l.images[0]?.url}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden">
        <a href="#mobile-inquiry" className="btn-accent w-full">I'm Interested</a>
      </div>
      <div id="mobile-inquiry" className="container-page py-10 lg:hidden">
        <InquiryForm
          serviceId={listing.serviceId}
          subServiceId={listing.subServiceId}
          listingId={listing.id}
          contextLabel={contextLabel}
          sourcePage={`/services/${listing.service.slug}/${listing.subService.slug}/${listing.slug}`}
        />
      </div>
      <SiteFooter />
    </>
  );
}