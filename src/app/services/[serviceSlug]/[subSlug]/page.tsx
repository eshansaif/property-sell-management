import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ListingCard } from "@/components/ListingCard";
import { InquiryForm } from "@/components/InquiryForm";

export const revalidate = 60;

async function getSubService(serviceSlug: string, subSlug: string) {
  const service = await prisma.service.findFirst({ where: { slug: serviceSlug, status: "PUBLISHED" } });
  if (!service) return null;
  const sub = await prisma.subService.findFirst({
    where: { slug: subSlug, serviceId: service.id, status: "PUBLISHED" },
    include: {
      listings: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        include: { images: { where: { isCover: true }, take: 1 } },
      },
    },
  });
  if (!sub) return null;
  return { service, sub };
}

export async function generateMetadata({ params }: { params: { serviceSlug: string; subSlug: string } }): Promise<Metadata> {
  const data = await getSubService(params.serviceSlug, params.subSlug);
  if (!data) return {};
  return {
    title: data.sub.seoTitle || data.sub.name,
    description: data.sub.seoDescription || data.sub.shortDesc || undefined,
  };
}

export default async function SubServicePage({ params }: { params: { serviceSlug: string; subSlug: string } }) {
  const data = await getSubService(params.serviceSlug, params.subSlug);
  if (!data) return notFound();
  const { service, sub } = data;

  return (
    <>
      <SiteHeader />
      <main className="container-page py-16">
        <nav className="mb-4 text-xs text-text-secondary">
          <Link href="/services" className="hover:text-text-primary">Services</Link>
          <span className="mx-2">/</span>
          <Link href={`/services/${service.slug}`} className="hover:text-text-primary">{service.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">{sub.name}</span>
        </nav>

        <h1 className="font-display text-3xl text-text-primary">{sub.name}</h1>
        {sub.description && <p className="mt-3 max-w-2xl text-text-secondary">{sub.description}</p>}

        {sub.listings.length === 0 ? (
          <div className="card mt-10 p-12 text-center">
            <p className="text-text-secondary">No listings published in this category yet.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sub.listings.map((l) => (
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
