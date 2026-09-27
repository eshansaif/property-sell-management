import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { InquiryForm } from "@/components/InquiryForm";

export const revalidate = 60;

async function getService(slug: string) {
  return prisma.service.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      subServices: {
        where: { status: "PUBLISHED" },
        orderBy: { displayOrder: "asc" },
        include: { _count: { select: { listings: { where: { status: "PUBLISHED" } } } } },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: { serviceSlug: string } }): Promise<Metadata> {
  const service = await getService(params.serviceSlug);
  if (!service) return {};
  return {
    title: service.seoTitle || service.name,
    description: service.seoDescription || service.shortDesc || undefined,
    alternates: service.canonicalUrl ? { canonical: service.canonicalUrl } : undefined,
  };
}

export default async function ServiceDetailPage({ params }: { params: { serviceSlug: string } }) {
  const service = await getService(params.serviceSlug);
  if (!service) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.shortDesc ?? undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="container-page py-16">
        <nav className="mb-4 text-xs text-text-secondary">
          <Link href="/services" className="hover:text-text-primary">Services</Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">{service.name}</span>
        </nav>

        <h1 className="font-display text-3xl text-text-primary">{service.name}</h1>
        {service.description && <p className="mt-3 max-w-2xl text-text-secondary">{service.description}</p>}

        {service.subServices.length === 0 ? (
          <div className="card mt-10 p-12 text-center">
            <p className="text-text-secondary">No categories published under this service yet.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {service.subServices.map((sub) => (
              <Link key={sub.id} href={`/services/${service.slug}/${sub.slug}`} className="card p-6 hover:shadow-md">
                <h3 className="font-display text-lg text-text-primary">{sub.name}</h3>
                {sub.shortDesc && <p className="mt-1.5 line-clamp-2 text-sm text-text-secondary">{sub.shortDesc}</p>}
                <p className="mt-4 text-xs text-text-secondary">{sub._count.listings} listing{sub._count.listings === 1 ? "" : "s"}</p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16 max-w-xl">
          <h2 className="mb-4 font-display text-xl text-text-primary">Interested in {service.name}?</h2>
          <InquiryForm serviceId={service.id} contextLabel={service.name} sourcePage={`/services/${service.slug}`} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
