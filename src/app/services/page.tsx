import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceCard } from "@/components/ServiceCard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "All Services",
  description: "Browse every service and category available on the platform.",
};

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { listings: { where: { status: "PUBLISHED" } } } } },
  });

  return (
    <>
      <SiteHeader />
      <main className="container-page py-16">
        <h1 className="font-display text-3xl text-text-primary">All services</h1>
        <p className="mt-2 max-w-xl text-sm text-text-secondary">
          Pick a category to see its sub-services and listings.
        </p>

        {services.length === 0 ? (
          <div className="card mt-10 p-12 text-center">
            <p className="text-text-secondary">No services published yet.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <ServiceCard
                key={s.id}
                name={s.name}
                slug={s.slug}
                shortDesc={s.shortDesc}
                coverImage={s.coverImage}
                listingCount={s._count.listings}
              />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
